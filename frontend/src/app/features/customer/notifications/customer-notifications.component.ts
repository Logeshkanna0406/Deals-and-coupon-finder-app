import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../core/services/auth.service';
import { NotificationService } from '../../../core/services/notification.service';
import { NotificationResponse } from '../../../core/models/notification.models';
import { LoadingSkeletonComponent } from '../../../shared/components/loading-skeleton/loading-skeleton.component';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';
import { PaginationComponent } from '../../../shared/components/pagination/pagination.component';

@Component({
  selector: 'app-customer-notifications',
  standalone: true,
  imports: [CommonModule, LoadingSkeletonComponent, EmptyStateComponent, PaginationComponent],
  templateUrl: './customer-notifications.component.html',
  styleUrl: './customer-notifications.component.css'
})
export class CustomerNotificationsComponent implements OnInit {
  private readonly authService = inject(AuthService);
  readonly notificationService = inject(NotificationService);
  private readonly cdr = inject(ChangeDetectorRef);

  notifications: NotificationResponse[] = [];
  isLoading = true;

  // Pagination
  currentPage = 1;
  pageSize = 5;

  get pagedNotifications(): NotificationResponse[] {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.notifications.slice(start, start + this.pageSize);
  }

  onPageChange(page: number): void {
    this.currentPage = page;
    this.cdr.markForCheck();
  }

  onPageSizeChange(size: number): void {
    this.pageSize = size;
    this.currentPage = 1;
    this.cdr.markForCheck();
  }

  ngOnInit(): void {
    this.loadNotifications();
  }

  loadNotifications(): void {
    this.isLoading = true;
    this.cdr.markForCheck();

    const userId = this.authService.currentUserId();
    const userEmail = (this.authService.currentUser()?.email || '').toLowerCase().trim();

    const validRecipientSet = new Set<string>();
    if (userId) {
      validRecipientSet.add(`customer_${userId}@dealsplatform.com`.toLowerCase());
      validRecipientSet.add(`user_${userId}@dealsplatform.com`.toLowerCase());
      validRecipientSet.add(`customer_${userId}`.toLowerCase());
    }
    if (userEmail) {
      validRecipientSet.add(userEmail);
    }

    this.notificationService.getAllNotifications().subscribe({
      next: allNotifs => {
        const list = allNotifs || [];
        // Strictly filter to notifications that belong ONLY to this customer
        const userNotifs = list
          .filter(n => {
            if (n.subject?.toLowerCase().includes('cashback credited')) return false;
            const rec = (n.recipient || '').toLowerCase().trim();
            if (validRecipientSet.has(rec)) return true;
            if (userEmail && rec === userEmail) return true;
            // Disallow any merchant or other customer notifications
            return false;
          })
          .sort((a, b) => {
            const dateA = a.sentAt ? new Date(a.sentAt).getTime() : 0;
            const dateB = b.sentAt ? new Date(b.sentAt).getTime() : 0;
            if (dateB !== dateA) return dateB - dateA;
            return (b.id || 0) - (a.id || 0);
          });

        // Deduplicate duplicate broadcasts and normalize strictly to IN_APP
        const seen = new Set<string>();
        const inAppOnlyList: NotificationResponse[] = [];
        for (const notif of userNotifs) {
          const key = `${notif.subject?.trim()}:::${notif.message?.trim()}`;
          if (!seen.has(key)) {
            seen.add(key);
            inAppOnlyList.push({
              ...notif,
              channel: 'IN_APP'
            });
          }
        }

        this.notifications = inAppOnlyList;
        this.isLoading = false;

        // Auto-mark all notifications as read when the customer views this Alerts & Notifications page!
        if (userId && this.notifications.length > 0) {
          this.notificationService.markAllAsRead(userId, this.notifications);
        }

        this.cdr.markForCheck();
      },
      error: () => {
        this.notifications = [];
        this.isLoading = false;
        this.cdr.markForCheck();
      }
    });
  }

  isUnread(notif: NotificationResponse | number): boolean {
    const id = typeof notif === 'number' ? notif : notif.id;
    const item = typeof notif === 'number' ? this.notifications.find(n => n.id === notif) : notif;
    return this.notificationService.isUnread(id, this.authService.currentUserId(), item);
  }

  markAllAsRead(): void {
    const userId = this.authService.currentUserId();
    this.notificationService.markAllAsRead(userId, this.notifications);
    this.cdr.markForCheck();
  }

  markSingleAsRead(notif: NotificationResponse | number): void {
    const userId = this.authService.currentUserId();
    const id = typeof notif === 'number' ? notif : notif.id;
    const item = typeof notif === 'number' ? this.notifications.find(n => n.id === notif) : notif;
    this.notificationService.markAsRead(id, userId, item);
    this.cdr.markForCheck();
  }

  formatDate(dateStr?: string): string {
    if (!dateStr) return '';
    try {
      return new Date(dateStr).toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateStr;
    }
  }
}
