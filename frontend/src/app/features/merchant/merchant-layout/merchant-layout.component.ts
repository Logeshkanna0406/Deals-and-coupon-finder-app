import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { MerchantService } from '../../../core/services/merchant.service';
import { MerchantResponse } from '../../../core/models/merchant.models';
import { StatusBadgeComponent } from '../../../shared/components/status-badge/status-badge.component';

@Component({
  selector: 'app-merchant-layout',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, RouterOutlet, StatusBadgeComponent],
  template: `
    <div class="portal-wrapper container">
      <!-- Merchant Sidebar -->
      <aside class="portal-sidebar card">
        <div class="merchant-brief">
          <div class="merchant-icon">🏪</div>
          <div class="merchant-meta">
            <h4 class="merchant-name">{{ merchantProfile?.businessName || authService.currentUser()?.name }}</h4>
            <span class="merchant-email">{{ merchantProfile?.email || authService.currentUser()?.email }}</span>
            <div style="margin-top: 0.375rem;">
              <app-status-badge [status]="merchantProfile?.status || 'PENDING'"></app-status-badge>
            </div>
          </div>
        </div>

        @if (merchantProfile?.status === 'PENDING') {
          <div class="status-warning-box">
            <span>⏳ Account Pending Approval</span>
            <p>Admin verification is in progress. Some features will unlock once approved.</p>
          </div>
        }

        <nav class="sidebar-nav">
          <a routerLink="/merchant/dashboard" routerLinkActive="active" class="side-link">
            <span class="link-icon">📊</span>
            <span>Dashboard</span>
          </a>
          <a routerLink="/merchant/coupons" routerLinkActive="active" [routerLinkActiveOptions]="{ exact: true }" class="side-link">
            <span class="link-icon">🏷️</span>
            <span>My Deals & Coupons</span>
          </a>
          <a routerLink="/merchant/coupons/create" routerLinkActive="active" class="side-link">
            <span class="link-icon">➕</span>
            <span>Create New Deal</span>
          </a>
          <a routerLink="/merchant/subscription" routerLinkActive="active" class="side-link">
            <span class="link-icon">💎</span>
            <span>Subscription & Plans</span>
          </a>
          <a routerLink="/merchant/payments" routerLinkActive="active" class="side-link">
            <span class="link-icon">💳</span>
            <span>Payments & Billing</span>
          </a>
          <a routerLink="/merchant/profile" routerLinkActive="active" class="side-link">
            <span class="link-icon">⚙️</span>
            <span>Store Profile</span>
          </a>
        </nav>

        <div class="sidebar-footer">
          <button type="button" class="btn btn-secondary btn-sm" style="width: 100%;" (click)="authService.logout()">
            Sign Out
          </button>
        </div>
      </aside>

      <!-- Main Portal Outlet -->
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

    .merchant-brief {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding-bottom: 1.25rem;
      border-bottom: 1px solid var(--border);
      margin-bottom: 1.25rem;
    }

    .merchant-icon {
      font-size: 2rem;
      background: var(--surface-alt);
      padding: 0.5rem;
      border-radius: var(--radius-md);
      line-height: 1;
    }

    .merchant-name {
      font-size: 0.9375rem;
      font-weight: 700;
      color: var(--text-main);
    }

    .merchant-email {
      font-size: 0.75rem;
      color: var(--text-muted);
      display: block;
      word-break: break-all;
    }

    .status-warning-box {
      background: var(--warning-light);
      border: 1px solid #fde68a;
      border-radius: var(--radius-md);
      padding: 0.75rem;
      font-size: 0.75rem;
      color: #92400e;
      margin-bottom: 1.25rem;
      line-height: 1.4;
    }

    .status-warning-box span {
      font-weight: 700;
      display: block;
      margin-bottom: 0.25rem;
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
export class MerchantLayoutComponent implements OnInit {
  readonly authService = inject(AuthService);
  private readonly merchantService = inject(MerchantService);
  private readonly cdr = inject(ChangeDetectorRef);

  merchantProfile: MerchantResponse | null = null;

  ngOnInit(): void {
    const merchantId = this.authService.currentUserId();
    if (merchantId) {
      this.merchantService.getMerchantById(merchantId).subscribe({
        next: profile => {
          this.merchantProfile = profile;
          this.cdr.markForCheck();
        },
        error: () => {
          this.cdr.markForCheck();
        }
      });
    }
  }
}
