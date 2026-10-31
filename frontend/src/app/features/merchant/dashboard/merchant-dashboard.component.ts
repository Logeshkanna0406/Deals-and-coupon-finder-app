import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { MerchantService } from '../../../core/services/merchant.service';
import { SubscriptionService } from '../../../core/services/subscription.service';
import { CouponService } from '../../../core/services/coupon.service';
import { MerchantDashboardResponse } from '../../../core/models/merchant.models';
import { CouponResponse } from '../../../core/models/coupon.models';
import { StatusBadgeComponent } from '../../../shared/components/status-badge/status-badge.component';
import { LoadingSkeletonComponent } from '../../../shared/components/loading-skeleton/loading-skeleton.component';
import { PaginationComponent } from '../../../shared/components/pagination/pagination.component';

@Component({
  selector: 'app-merchant-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, StatusBadgeComponent, LoadingSkeletonComponent, PaginationComponent],
  template: `
    <div class="merchant-dash fade-in">
      <!-- Header with Action -->
      <div class="dash-top-bar">
        <div>
          <h1 class="dash-title">Merchant Dashboard</h1>
          <p class="dash-subtitle">
            Welcome back, <strong>{{ dashboard?.merchantProfile?.businessName || authService.currentUser()?.name }}</strong>
          </p>
        </div>
        <div class="top-actions">
          <a routerLink="/merchant/coupons/create" class="btn btn-accent">
            <span>➕</span> Create New Coupon
          </a>
        </div>
      </div>

      <!-- 4 KEY KPI CARDS -->
      <div class="kpi-grid">
        <div class="kpi-card card">
          <div class="kpi-icon-row">
            <span class="kpi-title">Total Deals</span>
            <span class="icon">🏷️</span>
          </div>
          <div class="kpi-num">{{ dashboard?.totalCoupons ?? 0 }}</div>
          <span class="kpi-sub">Lifetime published deals</span>
        </div>

        <div class="kpi-card card">
          <div class="kpi-icon-row">
            <span class="kpi-title">Active Deals</span>
            <span class="icon">⚡</span>
          </div>
          <div class="kpi-num" style="color: var(--success-dark);">{{ dashboard?.activeCoupons ?? 0 }}</div>
          <span class="kpi-sub">Currently discoverable by shoppers</span>
        </div>

        <div class="kpi-card card">
          <div class="kpi-icon-row">
            <span class="kpi-title">Total Redemptions</span>
            <span class="icon">👥</span>
          </div>
          <div class="kpi-num" style="color: var(--primary);">{{ dashboard?.totalRedemptions ?? 0 }}</div>
          <span class="kpi-sub">Customers claimed your deals</span>
        </div>

        <div class="kpi-card card">
          <div class="kpi-icon-row">
            <span class="kpi-title">Subscription</span>
            <span class="icon">💎</span>
          </div>
          <div class="kpi-num" style="font-size: 1.35rem;">
            <app-status-badge [status]="dashboard?.activeSubscription?.status || 'INACTIVE'"></app-status-badge>
          </div>
          <span class="kpi-sub">{{ dashboard?.activeSubscription?.planName || 'No Active Plan' }}</span>
        </div>
      </div>

      <!-- SUBSCRIPTION STATUS HERO CARD -->
      <div class="card sub-status-card">
        <div class="sub-header">
          <div class="sub-plan-badge">
            <span class="diamond-icon">💎</span>
            <div>
              <span class="sub-plan-label">ACTIVE SUBSCRIPTION PLAN</span>
              <h3 class="sub-plan-title">{{ dashboard?.activeSubscription?.planName || 'Inactive Subscription' }}</h3>
            </div>
          </div>
          <a routerLink="/merchant/subscription" class="btn btn-outline btn-sm">
            Manage Subscription →
          </a>
        </div>

        @if (dashboard?.activeSubscription && dashboard?.activeSubscription?.status === 'ACTIVE') {
          <div class="sub-details-grid">
            <div class="sub-detail-item">
              <span class="label">Plan Validity:</span>
              <strong class="val">{{ dashboard?.activeSubscription?.startDate }} → {{ dashboard?.activeSubscription?.endDate }}</strong>
            </div>
            <div class="sub-detail-item">
              <span class="label">Coupon Publishing Limit:</span>
              <strong class="val">{{ couponsUsed }} / {{ couponLimit }} deals used ({{ remainingCoupons }} available)</strong>
            </div>
            <div class="sub-detail-item">
              <span class="label">Subscription Fee:</span>
              <strong class="val">₹{{ dashboard?.activeSubscription?.amount | number:'1.2-2' }}</strong>
            </div>
          </div>

          <!-- Coupon Limit Progress Meter -->
          <div class="limit-progress-bar-wrapper">
            <div class="limit-labels">
              <span>Quota Used ({{ couponsUsed }} / {{ couponLimit }} deals)</span>
              <span><strong>{{ getUsageRatio() }}%</strong> ({{ remainingCoupons }} available)</span>
            </div>
            <div class="bar-bg">
              <div class="bar-fill" [style.width.%]="getUsageRatio()"></div>
            </div>
          </div>
        } @else {
          <div class="no-sub-notice">
            <p>You do not have an active subscription. Purchase a plan to start authoring deals and coupons.</p>
            <a routerLink="/merchant/subscription" class="btn btn-primary btn-sm" style="margin-top: 0.75rem;">
              Choose a Subscription Plan
            </a>
          </div>
        }
      </div>

      <!-- RECENT COUPONS TABLE -->
      <div class="card recent-coupons-card">
        <div class="table-header">
          <div>
            <h3 class="table-title">Your Recent Deals</h3>
            <p class="table-subtitle">Moderation status and live redemption metrics</p>
          </div>
          <a routerLink="/merchant/coupons" class="btn btn-secondary btn-sm">
            View All ({{ coupons.length }})
          </a>
        </div>

        @if (isLoadingCoupons) {
          <app-loading-skeleton type="table"></app-loading-skeleton>
        } @else if (coupons.length === 0) {
          <div class="empty-box text-center">
            <p>You haven't created any deals yet.</p>
            <a routerLink="/merchant/coupons/create" class="btn btn-accent btn-sm" style="margin-top: 0.5rem;">
              + Create Your First Coupon
            </a>
          </div>
        } @else {
          <div class="table-responsive">
            <table class="table">
              <thead>
                <tr>
                  <th>Title & Code</th>
                  <th>Discount</th>
                  <th>Category</th>
                  <th>Validity Dates</th>
                  <th>Usage</th>
                  <th>Status</th>
                 <!-- <th>Action</th>-->
                </tr>
              </thead>
              <tbody>
                @for (c of pagedCoupons; track c.couponId) {
                  <tr>
                    <td>
                      <strong>{{ c.title }}</strong>
                      <div class="code-text">Code: {{ c.couponCode }}</div>
                    </td>
                    <td style="font-weight: 700; color: var(--accent);">
                      {{ c.discount }}% OFF
                    </td>
                    <td>{{ c.category }}</td>
                    <td style="font-size: 0.8125rem;">
                      {{ c.validFrom | slice:0:10 }} → 
                       {{ c.validUntil | slice:0:10 }}
                    </td>
                    <td>
                      <strong>{{ c.usageCount }}</strong> / {{ c.usageLimit }}
                    </td>
                    <td>
                      <app-status-badge [status]="c.status"></app-status-badge>
                    </td>
                   <!-- <td>
                      <a [routerLink]="['/merchant/coupons', c.couponId, 'edit']" class="btn btn-outline btn-sm">
                        Edit
                      </a>
                    </td> -->
                  </tr>
                }
              </tbody>
            </table>
            <app-pagination
              [totalItems]="coupons.length"
              [pageSize]="pageSize"
              [currentPage]="currentPage"
              (pageChange)="onPageChange($event)"
              (pageSizeChange)="onPageSizeChange($event)"
            ></app-pagination>
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    .merchant-dash {
      display: flex;
      flex-direction: column;
      gap: 2rem;
    }

    .dash-top-bar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 1rem;
      flex-wrap: wrap;
    }

    .dash-title {
      font-size: 2rem;
      font-weight: 800;
      margin-bottom: 0.25rem;
    }

    .dash-subtitle {
      font-size: 0.9375rem;
      color: var(--text-muted);
    }

    .kpi-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 1.25rem;
    }

    .kpi-card {
      padding: 1.5rem;
      border-radius: var(--radius-lg);
    }

    .kpi-icon-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 0.5rem;
    }

    .kpi-title {
      font-size: 0.8125rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      color: var(--text-muted);
    }

    .kpi-num {
      font-size: 2rem;
      font-weight: 800;
      color: var(--text-main);
      margin-bottom: 0.375rem;
    }

    .kpi-sub {
      font-size: 0.75rem;
      color: var(--text-light);
    }

    /* Subscription Hero */
    .sub-status-card {
      padding: 2rem;
      border-radius: var(--radius-xl);
      background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
      color: white;
      border: none;
    }

    .sub-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 1.5rem;
      gap: 1rem;
      flex-wrap: wrap;
    }

    .sub-plan-badge {
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .diamond-icon {
      font-size: 2.25rem;
      line-height: 1;
    }

    .sub-plan-label {
      font-size: 0.6875rem;
      font-weight: 800;
      letter-spacing: 0.1em;
      color: #93c5fd;
    }

    .sub-plan-title {
      font-size: 1.5rem;
      font-weight: 800;
      color: white;
    }

    .sub-details-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 1.5rem;
      padding: 1.25rem;
      background: rgba(255, 255, 255, 0.06);
      border-radius: var(--radius-lg);
      margin-bottom: 1.25rem;
    }

    .sub-detail-item {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }

    .sub-detail-item .label {
      font-size: 0.75rem;
      color: #94a3b8;
    }

    .sub-detail-item .val {
      font-size: 0.9375rem;
      color: white;
    }

    .limit-progress-bar-wrapper {
      margin-top: 0.5rem;
    }

    .limit-labels {
      display: flex;
      justify-content: space-between;
      font-size: 0.75rem;
      color: #cbd5e1;
      margin-bottom: 0.375rem;
    }

    .bar-bg {
      height: 8px;
      background: rgba(255, 255, 255, 0.15);
      border-radius: var(--radius-full);
      overflow: hidden;
    }

    .bar-fill {
      height: 100%;
      background: linear-gradient(90deg, #38bdf8, #2563eb);
      border-radius: var(--radius-full);
      transition: width 0.5s ease;
    }

    .no-sub-notice {
      padding: 1rem 0;
      color: #cbd5e1;
    }

    /* Recent Coupons */
    .recent-coupons-card {
      padding: 2rem;
      border-radius: var(--radius-xl);
    }

    .table-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 1.5rem;
      gap: 1rem;
      flex-wrap: wrap;
    }

    .table-title {
      font-size: 1.25rem;
      font-weight: 800;
      margin-bottom: 0.25rem;
    }

    .table-subtitle {
      font-size: 0.875rem;
      color: var(--text-muted);
    }

    .code-text {
      font-family: monospace;
      font-size: 0.75rem;
      color: var(--primary);
    }

    .empty-box {
      padding: 2.5rem;
      color: var(--text-muted);
    }

    @media (max-width: 1024px) {
      .kpi-grid { grid-template-columns: repeat(2, 1fr); }
      .sub-details-grid { grid-template-columns: 1fr; gap: 0.75rem; }
    }

    @media (max-width: 640px) {
      .kpi-grid { grid-template-columns: 1fr; }
    }
  `]
})
export class MerchantDashboardComponent implements OnInit {
  readonly authService = inject(AuthService);
  private readonly merchantService = inject(MerchantService);
  private readonly subscriptionService = inject(SubscriptionService);
  private readonly couponService = inject(CouponService);
  private readonly cdr = inject(ChangeDetectorRef);

  dashboard: MerchantDashboardResponse | null = null;
  coupons: CouponResponse[] = [];
  isLoadingCoupons = true;

  // Pagination for Recent Deals
  currentPage = 1;
  pageSize = 5;

  get pagedCoupons(): CouponResponse[] {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.coupons.slice(start, start + this.pageSize);
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
    const merchantId = this.authService.currentUserId();
    if (merchantId) {
      this.loadDashboard(merchantId);
      this.loadCoupons(merchantId);
    } else {
      this.isLoadingCoupons = false;
      this.cdr.markForCheck();
    }
  }

  loadDashboard(merchantId: number): void {
    this.merchantService.getDashboard(merchantId).subscribe({
      next: res => {
        this.dashboard = res;
        // If activeSubscription is missing couponLimit, fetch fresh directly from subscriptionService
        if (!this.dashboard?.activeSubscription?.couponLimit) {
          this.subscriptionService.getActiveSubscription(merchantId).subscribe({
            next: sub => {
              if (this.dashboard) {
                this.dashboard.activeSubscription = sub;
                this.cdr.markForCheck();
              }
            },
            error: () => {}
          });
        }
        this.cdr.markForCheck();
      },
      error: () => {
        this.cdr.markForCheck();
      }
    });
  }

  loadCoupons(merchantId: number): void {
    this.isLoadingCoupons = true;
    this.cdr.markForCheck();
    this.couponService.getCouponsByMerchant(merchantId).subscribe({
      next: list => {
        this.coupons = list || [];
        this.isLoadingCoupons = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.isLoadingCoupons = false;
        this.cdr.markForCheck();
      }
    });
  }

  get couponLimit(): number {
    return this.dashboard?.activeSubscription?.couponLimit || 0;
  }

  get couponsUsed(): number {
    return this.dashboard?.activeSubscription?.couponsGenerated ?? 0;
  }

  get remainingCoupons(): number {
    if (this.dashboard?.activeSubscription?.remainingCoupons !== undefined && this.dashboard?.activeSubscription?.remainingCoupons !== null) {
      return this.dashboard.activeSubscription.remainingCoupons;
    }
    const limit = this.couponLimit;
    return Math.max(0, limit - this.couponsUsed);
  }

  getUsageRatio(): number {
    const limit = this.couponLimit;
    if (limit <= 0) return 0;
    return Math.min(100, Math.round((this.couponsUsed / limit) * 100));
  }
}
