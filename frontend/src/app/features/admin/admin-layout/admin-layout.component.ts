import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, RouterOutlet],
  template: `
    <div class="admin-wrapper container">
      <!-- Admin Sidebar -->
      <aside class="admin-sidebar card">
        <div class="admin-brief">
          <div class="admin-icon">🛡️</div>
          <div class="admin-meta">
            <h4 class="admin-name">{{ authService.currentUser()?.name || 'Platform Administrator' }}</h4>
            <span class="admin-email">{{ authService.currentUser()?.email }}</span>
            <span class="admin-role-badge">Super Admin</span>
          </div>
        </div>

        <nav class="sidebar-nav">
          <a routerLink="/admin/dashboard" routerLinkActive="active" class="side-link">
            <span class="link-icon">📊</span>
            <span>Dashboard Overview</span>
          </a>
          <a routerLink="/admin/merchants" routerLinkActive="active" class="side-link">
            <span class="link-icon">🏪</span>
            <span>Merchant Moderation</span>
          </a>
          <a routerLink="/admin/coupons" routerLinkActive="active" class="side-link">
            <span class="link-icon">🏷️</span>
            <span>Coupons Review Queue</span>
          </a>
          <a routerLink="/admin/payments" routerLinkActive="active" class="side-link">
            <span class="link-icon">💳</span>
            <span>Payments Verification</span>
          </a>
          <a routerLink="/admin/plans" routerLinkActive="active" class="side-link">
            <span class="link-icon">💎</span>
            <span>Subscription Plans</span>
          </a>
          <a routerLink="/admin/revenue" routerLinkActive="active" class="side-link">
            <span class="link-icon">📈</span>
            <span>Revenue Analytics</span>
          </a>
        </nav>

        <div class="sidebar-footer">
          <button type="button" class="btn btn-secondary btn-sm" style="width: 100%;" (click)="authService.logout()">
            Sign Out
          </button>
        </div>
      </aside>

      <!-- Admin Main Outlet -->
      <main class="admin-main">
        <router-outlet></router-outlet>
      </main>
    </div>
  `,
  styles: [`
    .admin-wrapper {
      display: grid;
      grid-template-columns: 260px 1fr;
      gap: 2rem;
      padding: 2rem 1rem 4rem;
      align-items: flex-start;
    }

    .admin-sidebar {
      padding: 1.5rem;
      border-radius: var(--radius-xl);
      position: sticky;
      top: 90px;
    }

    .admin-brief {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding-bottom: 1.25rem;
      border-bottom: 1px solid var(--border);
      margin-bottom: 1.25rem;
    }

    .admin-icon {
      font-size: 2rem;
      background: var(--surface-alt);
      padding: 0.5rem;
      border-radius: var(--radius-md);
      line-height: 1;
    }

    .admin-name {
      font-size: 0.9375rem;
      font-weight: 700;
      color: var(--text-main);
      margin: 0;
    }

    .admin-email {
      font-size: 0.75rem;
      color: var(--text-muted);
      display: block;
      word-break: break-all;
    }

    .admin-role-badge {
      display: inline-block;
      margin-top: 0.375rem;
      font-size: 0.6875rem;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      background: #fdf2f8;
      color: #db2777;
      border: 1px solid #fbcfe8;
      padding: 0.125rem 0.5rem;
      border-radius: 9999px;
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

    .sidebar-footer {
      margin-top: 1.5rem;
      padding-top: 1rem;
      border-top: 1px solid var(--border);
    }

    .admin-main {
      min-width: 0;
    }

    @media (max-width: 860px) {
      .admin-wrapper {
        grid-template-columns: 1fr;
      }
      .admin-sidebar {
        position: static;
      }
    }
  `]
})
export class AdminLayoutComponent {
  readonly authService = inject(AuthService);
}
