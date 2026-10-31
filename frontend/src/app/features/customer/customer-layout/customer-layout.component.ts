import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { NotificationService } from '../../../core/services/notification.service';

@Component({
  selector: 'app-customer-layout',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, RouterOutlet],
  template: `
    <div class="portal-wrapper container">
      <!-- Sidebar -->
      <aside class="portal-sidebar card">
        <div class="user-brief">
          <div class="user-avatar">👤</div>
          <div class="user-meta">
            <h4 class="user-name">{{ authService.currentUser()?.name }}</h4>
            <span class="user-email">{{ authService.currentUser()?.email }}</span>
            <span class="badge badge-secondary" style="margin-top: 0.25rem;">CUSTOMER</span>
          </div>
        </div>

        <nav class="sidebar-nav">
          <a routerLink="/customer/dashboard" routerLinkActive="active" class="side-link">
            <span class="link-icon">📊</span>
            <span>Dashboard</span>
          </a>
          <a routerLink="/deals" class="side-link">
            <span class="link-icon">🔍</span>
            <span>Discover Deals</span>
          </a>
          <a routerLink="/customer/redemptions" routerLinkActive="active" class="side-link">
            <span class="link-icon">🎟️</span>
            <span>My Redemptions</span>
          </a>
          <a routerLink="/customer/wallet" routerLinkActive="active" class="side-link">
            <span class="link-icon">💰</span>
            <span>Cashback Wallet</span>
          </a>
          <a routerLink="/customer/points" routerLinkActive="active" class="side-link">
            <span class="link-icon">⭐</span>
            <span>Points & Rewards</span>
          </a>
          <a routerLink="/customer/following" routerLinkActive="active" class="side-link">
            <span class="link-icon">🏪</span>
            <span>Following Merchants</span>
          </a>
          <a routerLink="/customer/notifications" routerLinkActive="active" class="side-link">
            <span class="link-icon">🔔</span>
            <span style="flex: 1;">Alerts & Notifications</span>
            @if (notificationService.unreadCount() > 0) {
              <span class="sidebar-badge">{{ notificationService.unreadCount() > 99 ? '99+' : notificationService.unreadCount() }}</span>
            }
          </a>
          <a routerLink="/customer/profile" routerLinkActive="active" class="side-link">
            <span class="link-icon">⚙️</span>
            <span>My Profile</span>
          </a>
        </nav>

        <div class="sidebar-footer">
          <button type="button" class="btn btn-secondary btn-sm" style="width: 100%;" (click)="authService.logout()">
            Sign Out
          </button>
        </div>
      </aside>

      <!-- Main Portal Content -->
      <main class="portal-main">
        <router-outlet></router-outlet>
      </main>
    </div>
  `,
  styles: [`
    .portal-wrapper {
      display: grid;
      grid-template-columns: 260px 1fr;
      gap: 2rem;
      padding: 2rem 1rem 4rem;
      align-items: flex-start;
    }

    .portal-sidebar {
      padding: 1.5rem;
      border-radius: var(--radius-xl);
      position: sticky;
      top: 90px;
    }

    .user-brief {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding-bottom: 1.25rem;
      border-bottom: 1px solid var(--border);
      margin-bottom: 1.25rem;
    }

    .user-avatar {
      font-size: 2rem;
      background: var(--surface-alt);
      padding: 0.5rem;
      border-radius: 50%;
      line-height: 1;
    }

    .user-name {
      font-size: 0.9375rem;
      font-weight: 700;
      color: var(--text-main);
    }

    .user-email {
      font-size: 0.75rem;
      color: var(--text-muted);
      display: block;
      word-break: break-all;
    }

    .sidebar-nav {
      display: flex;
      flex-direction: column;
      gap: 0.375rem;
    }

    .side-link {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.625rem 0.875rem;
      border-radius: var(--radius-md);
      font-size: 0.875rem;
      font-weight: 600;
      color: var(--text-muted);
      transition: all var(--transition-fast);
    }

    .side-link:hover {
      color: var(--primary);
      background-color: var(--surface-alt);
    }

    .side-link.active {
      color: var(--primary);
      background-color: var(--primary-light);
      font-weight: 700;
    }

    .link-icon {
      font-size: 1.125rem;
    }

    .sidebar-badge {
      background: #ef4444;
      color: #ffffff;
      font-size: 0.6875rem;
      font-weight: 800;
      padding: 0.15rem 0.5rem;
      border-radius: 9999px;
      line-height: 1.2;
      box-shadow: 0 1px 3px rgba(239, 68, 68, 0.3);
    }

    .sidebar-footer {
      margin-top: 1.5rem;
      padding-top: 1rem;
      border-top: 1px solid var(--border);
    }

    .portal-main {
      min-width: 0;
    }

    @media (max-width: 860px) {
      .portal-wrapper {
        grid-template-columns: 1fr;
      }
      .portal-sidebar {
        position: static;
      }
    }
  `]
})
export class CustomerLayoutComponent implements OnInit {
  readonly authService = inject(AuthService);
  readonly notificationService = inject(NotificationService);

  ngOnInit(): void {
    const user = this.authService.currentUser();
    if (user && this.authService.isCustomer()) {
      this.notificationService.refreshUnreadCount(user.userId, user.email);
    }
  }
}
