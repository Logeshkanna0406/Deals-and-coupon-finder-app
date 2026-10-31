import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { NotificationResponse } from '../models/notification.models';

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/api/notifications`;

  readonly unreadCount = signal<number>(0);
  private cachedNotifications: NotificationResponse[] = [];

  private getStoredSession(): { userId: number; email: string } | null {
    try {
      const stored = localStorage.getItem('deals_session');
      if (stored) {
        const session = JSON.parse(stored);
        if (session && session.userId) {
          return {
            userId: Number(session.userId),
            email: session.email || ''
          };
        }
      }
    } catch {
      // ignore
    }
    return null;
  }

  constructor() {
    const session = this.getStoredSession();
    if (session) {
      this.refreshUnreadCount(session.userId, session.email);
    }
  }

  getAllNotifications(): Observable<NotificationResponse[]> {
    return this.http.get<NotificationResponse[]>(this.apiUrl).pipe(
      tap(notifs => {
        const sorted = (notifs || []).slice().sort((a, b) => {
          const dateA = a.sentAt ? new Date(a.sentAt).getTime() : 0;
          const dateB = b.sentAt ? new Date(b.sentAt).getTime() : 0;
          if (dateB !== dateA) return dateB - dateA;
          return (b.id || 0) - (a.id || 0);
        });
        this.cachedNotifications = sorted;
      })
    );
  }

  getNotificationsByRecipient(recipient: string): Observable<NotificationResponse[]> {
    return this.http.get<NotificationResponse[]>(`${this.apiUrl}/recipient/${encodeURIComponent(recipient)}`);
  }

  getReadIds(userId?: number | null): Set<number> {
    const effectiveUserId = userId ?? this.getStoredSession()?.userId;
    if (!effectiveUserId) return new Set<number>();
    try {
      const stored = localStorage.getItem(`deals_read_notifs_${effectiveUserId}`);
      if (stored) {
        return new Set<number>(JSON.parse(stored));
      }
    } catch (e) {
      console.warn('Error reading read notification IDs:', e);
    }
    return new Set<number>();
  }

  private saveReadIds(userId: number, ids: Set<number>): void {
    const effectiveUserId = userId ?? this.getStoredSession()?.userId;
    if (!effectiveUserId) return;
    try {
      localStorage.setItem(`deals_read_notifs_${effectiveUserId}`, JSON.stringify(Array.from(ids)));
    } catch (e) {
      console.warn('Error saving read notification IDs:', e);
    }
  }

  getReadKeys(userId?: number | null): Set<string> {
    const effectiveUserId = userId ?? this.getStoredSession()?.userId;
    if (!effectiveUserId) return new Set<string>();
    try {
      const stored = localStorage.getItem(`deals_read_keys_${effectiveUserId}`);
      if (stored) {
        return new Set<string>(JSON.parse(stored));
      }
    } catch (e) {
      console.warn('Error reading read notification keys:', e);
    }
    return new Set<string>();
  }

  private saveReadKeys(userId: number, keys: Set<string>): void {
    const effectiveUserId = userId ?? this.getStoredSession()?.userId;
    if (!effectiveUserId) return;
    try {
      localStorage.setItem(`deals_read_keys_${effectiveUserId}`, JSON.stringify(Array.from(keys)));
    } catch (e) {
      console.warn('Error saving read notification keys:', e);
    }
  }

  isUnread(id: number, userId?: number | null, notif?: NotificationResponse): boolean {
    const effectiveUserId = userId ?? this.getStoredSession()?.userId;
    if (!effectiveUserId) return false;
    if (this.getReadIds(effectiveUserId).has(id)) return false;

    const key = notif
      ? `${notif.subject?.trim()}:::${notif.message?.trim()}`
      : (() => {
          const found = this.cachedNotifications.find(n => n.id === id);
          return found ? `${found.subject?.trim()}:::${found.message?.trim()}` : null;
        })();

    if (key) {
      if (this.getReadKeys(effectiveUserId).has(key)) return false;
      const readIds = this.getReadIds(effectiveUserId);
      const anySiblingRead = this.cachedNotifications
        .filter(n => `${n.subject?.trim()}:::${n.message?.trim()}` === key)
        .some(n => readIds.has(n.id));
      if (anySiblingRead) return false;
    }
    return true;
  }

  markAsRead(id: number, userId?: number | null, notif?: NotificationResponse): void {
    const effectiveUserId = userId ?? this.getStoredSession()?.userId;
    if (!effectiveUserId) return;
    const readIds = this.getReadIds(effectiveUserId);
    const readKeys = this.getReadKeys(effectiveUserId);
    readIds.add(id);

    const key = notif
      ? `${notif.subject?.trim()}:::${notif.message?.trim()}`
      : (() => {
          const found = this.cachedNotifications.find(n => n.id === id);
          return found ? `${found.subject?.trim()}:::${found.message?.trim()}` : null;
        })();

    if (key) {
      readKeys.add(key);
      this.cachedNotifications
        .filter(n => `${n.subject?.trim()}:::${n.message?.trim()}` === key)
        .forEach(n => readIds.add(n.id));
    }

    this.saveReadIds(effectiveUserId, readIds);
    this.saveReadKeys(effectiveUserId, readKeys);
    this.unreadCount.update(count => Math.max(0, count - 1));
  }

  markAllAsRead(userId?: number | null, notifs?: NotificationResponse[]): void {
    const effectiveUserId = userId ?? this.getStoredSession()?.userId;
    if (!effectiveUserId) return;
    const readIds = this.getReadIds(effectiveUserId);
    const readKeys = this.getReadKeys(effectiveUserId);

    const list = notifs && notifs.length > 0 ? notifs : this.cachedNotifications;
    list.forEach(n => {
      readIds.add(n.id);
      if (n.subject || n.message) {
        readKeys.add(`${n.subject?.trim()}:::${n.message?.trim()}`);
      }
    });

    this.cachedNotifications.forEach(n => {
      const key = `${n.subject?.trim()}:::${n.message?.trim()}`;
      if (readKeys.has(key)) {
        readIds.add(n.id);
      }
    });

    this.saveReadIds(effectiveUserId, readIds);
    this.saveReadKeys(effectiveUserId, readKeys);
    this.unreadCount.set(0);
  }

  createNotification(notif: {
    recipient: string;
    recipientType?: string;
    subject: string;
    message: string;
    channel?: 'IN_APP' | 'EMAIL' | 'SMS';
  }): Observable<NotificationResponse> {
    const payload = {
      recipient: notif.recipient,
      recipientType: notif.recipientType || 'CUSTOMER',
      subject: notif.subject,
      message: notif.message,
      channel: notif.channel || 'IN_APP'
    };
    return this.http.post<NotificationResponse>(this.apiUrl, payload).pipe(
      tap(() => {
        this.refreshUnreadCount();
      })
    );
  }

  refreshUnreadCount(userId?: number | null, userEmail?: string | null): void {
    const session = this.getStoredSession();
    const effectiveUserId = userId ?? session?.userId ?? null;
    const effectiveEmail = userEmail ?? session?.email ?? null;

    if (!effectiveUserId && !effectiveEmail) {
      this.unreadCount.set(0);
      return;
    }

    const emailNorm = (effectiveEmail || '').toLowerCase().trim();
    const validRecipientSet = new Set<string>();
    if (effectiveUserId) {
      validRecipientSet.add(`customer_${effectiveUserId}@dealsplatform.com`.toLowerCase());
      validRecipientSet.add(`user_${effectiveUserId}@dealsplatform.com`.toLowerCase());
      validRecipientSet.add(`customer_${effectiveUserId}`.toLowerCase());
    }
    if (emailNorm) {
      validRecipientSet.add(emailNorm);
    }

    this.getAllNotifications().subscribe({
      next: allNotifs => {
        const list = allNotifs || [];
        const userNotifs = list.filter(n => {
          if (n.subject?.toLowerCase().includes('cashback credited')) return false;
          const rec = (n.recipient || '').toLowerCase().trim();
          return validRecipientSet.has(rec) || (emailNorm && rec === emailNorm);
        });

        const readIds = this.getReadIds(effectiveUserId);
        const readKeys = this.getReadKeys(effectiveUserId);
        let storageUpdated = false;

        // Group user notifications by unique content key
        const groups = new Map<string, NotificationResponse[]>();
        for (const n of userNotifs) {
          const key = `${n.subject?.trim()}:::${n.message?.trim()}`;
          if (!groups.has(key)) {
            groups.set(key, []);
          }
          groups.get(key)!.push(n);
        }

        let unreadCount = 0;
        for (const [key, group] of groups.entries()) {
          // A notification group is read if its key was saved OR ANY sibling ID was marked read
          const isRead = readKeys.has(key) || group.some(n => readIds.has(n.id));
          if (!isRead) {
            unreadCount++;
          } else {
            // Automatically backfill key and all sibling IDs
            if (!readKeys.has(key)) {
              readKeys.add(key);
              storageUpdated = true;
            }
            for (const n of group) {
              if (!readIds.has(n.id)) {
                readIds.add(n.id);
                storageUpdated = true;
              }
            }
          }
        }

        if (storageUpdated && effectiveUserId) {
          this.saveReadIds(effectiveUserId, readIds);
          this.saveReadKeys(effectiveUserId, readKeys);
        }

        this.unreadCount.set(unreadCount);
      },
      error: () => {
        // Keep current count on temporary network failure
      }
    });
  }
}
