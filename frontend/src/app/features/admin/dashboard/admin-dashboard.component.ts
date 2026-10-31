import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AdminService } from '../../../core/services/admin.service';
import { ToastService } from '../../../core/services/toast.service';
import { MerchantResponse } from '../../../core/models/merchant.models';
import { CouponResponse } from '../../../core/models/coupon.models';
import { PaymentResponse, RevenueResponse } from '../../../core/models/payment.models';
import { LoadingSkeletonComponent } from '../../../shared/components/loading-skeleton/loading-skeleton.component';
import { StatusBadgeComponent } from '../../../shared/components/status-badge/status-badge.component';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, LoadingSkeletonComponent],
  template: `
    <div class="admin-dashboard">
      <div class="dashboard-header">
        <div>
          <h1 class="page-title">Platform Administration</h1>
          <p class="page-subtitle">Real-time control center for merchants, deals, subscription payments, and revenue</p>
        </div>
        <div class="header-badge">
          <span class="pulse-dot"></span> System Live & Operational
        </div>
      </div>

      <!-- Moderation Urgent Action Required Alerts -->
      @if (pendingMerchantsCount > 0 || pendingCouponsCount > 0 || pendingPaymentsCount > 0) {
        <div class="attention-banner card">
          <div class="attention-icon">🚨</div>
          <div class="attention-content">
            <h4 class="attention-title">Items Requiring Review</h4>
            <div class="attention-tags">
              @if (pendingMerchantsCount > 0) {
                <a routerLink="/admin/merchants" class="attention-pill pill-merchants">
                  🏪 {{ pendingMerchantsCount }} Merchant{{ pendingMerchantsCount > 1 ? 's' : '' }} Pending Approval →
                </a>
              }
              @if (pendingCouponsCount > 0) {
                <a routerLink="/admin/coupons" class="attention-pill pill-coupons">
                  🏷️ {{ pendingCouponsCount }} Coupon{{ pendingCouponsCount > 1 ? 's' : '' }} Pending Review →
                </a>
              }
              @if (pendingPaymentsCount > 0) {
                <a routerLink="/admin/payments" class="attention-pill pill-payments">
                  💳 {{ pendingPaymentsCount }} Payment{{ pendingPaymentsCount > 1 ? 's' : '' }} Pending Verification →
                </a>
              }
            </div>
          </div>
        </div>
      }

      @if (loading) {
        <app-loading-skeleton type="card"></app-loading-skeleton>
      } @else {
        <!-- Key Metrics Cards -->
        <div class="metrics-grid">
          <div class="metric-card card">
            <div class="metric-header">
              <span class="metric-label">Platform Revenue</span>
              <span class="metric-icon">💰</span>
            </div>
            <span class="metric-value text-primary">₹{{ (revenue?.totalRevenue || 0).toLocaleString() }}</span>
            <div class="metric-footer">
              <span class="text-success font-bold">{{ revenue?.totalVerifiedTransactions || 0 }}</span> verified payments
            </div>
          </div>

          <div class="metric-card card">
            <div class="metric-header">
              <span class="metric-label">Total Merchants</span>
              <span class="metric-icon">🏪</span>
            </div>
            <span class="metric-value">{{ merchants.length }}</span>
            <div class="metric-footer">
              <span class="text-success">{{ approvedMerchantsCount }} approved</span> ·
              <span class="text-warning">{{ pendingMerchantsCount }} pending</span>
            </div>
          </div>

          <div class="metric-card card">
            <div class="metric-header">
              <span class="metric-label">Total Coupons</span>
              <span class="metric-icon">🏷️</span>
            </div>
            <span class="metric-value">{{ coupons.length }}</span>
            <div class="metric-footer">
              <span class="text-success">{{ activeCouponsCount }} active</span> ·
              <span class="text-warning">{{ pendingCouponsCount }} pending</span>
            </div>
          </div>

          <div class="metric-card card">
            <div class="metric-header">
              <span class="metric-label">Total Payments</span>
              <span class="metric-icon">💳</span>
            </div>
            <span class="metric-value">{{ payments.length }}</span>
            <div class="metric-footer">
              <span class="text-success">{{ verifiedPaymentsCount }} verified</span> ·
              <span class="text-warning">{{ pendingPaymentsCount }} awaiting saga</span>
            </div>
          </div>
        </div>

        <!-- Two Column Content Sections -->
        <div class="dashboard-columns">
          <!-- Column 1: Pending Merchants Review -->
          <div class="dashboard-section card">
            <div class="section-top">
              <h3 class="section-title">Pending Merchant Approvals</h3>
              <a routerLink="/admin/merchants" class="view-all-link">Manage All ({{ merchants.length }}) →</a>
            </div>

            @if (pendingMerchants.length === 0) {
              <div class="empty-inline">
                <span>✓ All merchant registrations have been processed</span>
              </div>
            } @else {
              <div class="table-responsive">
                <table class="simple-table">
                  <thead>
                    <tr>
                      <th>Business Name</th>
                      <th>Owner / Category</th>
                      <th>Registered</th>
                      <th style="text-align: right;">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    @for (m of pendingMerchants.slice(0, 5); track m.merchantId) {
                      <tr>
                        <td>
                          <strong>{{ m.businessName }}</strong>
                        </td>
                        <td>
                          <span>{{ m.ownerName }}</span>
                          <small class="text-muted block">{{ m.category }}</small>
                        </td>
                        <td>{{ m.createdAt | date:'mediumDate' }}</td>
                        <td style="text-align: right;">
                          <button
                            type="button"
                            class="btn btn-primary btn-xs"
                            (click)="quickApproveMerchant(m.merchantId)"
                          >
                            Approve
                          </button>
                        </td>
                      </tr>
                    }
                  </tbody>
                </table>
              </div>
            }
          </div>

          <!-- Column 2: Pending Coupons Queue -->
          <div class="dashboard-section card">
            <div class="section-top">
              <h3 class="section-title">Pending Coupon Submissions</h3>
              <a routerLink="/admin/coupons" class="view-all-link">Queue ({{ coupons.length }}) →</a>
            </div>

            @if (pendingCoupons.length === 0) {
              <div class="empty-inline">
                <span>✓ All coupon campaigns have been reviewed</span>
              </div>
            } @else {
              <div class="table-responsive">
                <table class="simple-table">
                  <thead>
                    <tr>
                      <th>Code & Title</th>
                      <th>Discount</th>
                      <th>Merchant</th>
                      <th style="text-align: right;">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    @for (c of pendingCoupons.slice(0, 5); track c.couponId) {
                      <tr>
                        <td>
                          <span class="code-tag">{{ c.couponCode }}</span>
                          <span class="title-sub">{{ c.title }}</span>
                        </td>
                        <td>
                          <strong>{{ c.discount }}% OFF</strong>
                        </td>
                        <td>#{{ c.merchantId }}</td>
                        <td style="text-align: right;">
                          <button
                            type="button"
                            class="btn btn-primary btn-xs"
                            (click)="quickApproveCoupon(c.couponId)"
                          >
                            Approve
                          </button>
                        </td>
                      </tr>
                    }
                  </tbody>
                </table>
              </div>
            }
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .admin-dashboard {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }

    .dashboard-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 1rem;
    }

    .page-title {
      font-size: 1.5rem;
      font-weight: 800;
      color: var(--text-main);
      margin-bottom: 0.25rem;
    }

    .page-subtitle {
      color: var(--text-muted);
      font-size: 0.875rem;
      margin: 0;
    }

    .header-badge {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      background: var(--surface);
      border: 1px solid var(--border);
      padding: 0.375rem 0.875rem;
      border-radius: 9999px;
      font-size: 0.75rem;
      font-weight: 700;
      color: var(--success);
    }

    .pulse-dot {
      width: 8px;
      height: 8px;
      background: var(--success);
      border-radius: 50%;
      box-shadow: 0 0 0 2px rgba(16, 185, 129, 0.2);
    }

    .attention-banner {
      background: #fffbeb;
      border: 1px solid #fef3c7;
      padding: 1.25rem;
      border-radius: var(--radius-lg);
      display: flex;
      align-items: center;
      gap: 1.25rem;
    }

    .attention-icon {
      font-size: 2rem;
    }

    .attention-content {
      flex: 1;
    }

    .attention-title {
      font-size: 0.9375rem;
      font-weight: 800;
      color: #92400e;
      margin-bottom: 0.5rem;
    }

    .attention-tags {
      display: flex;
      flex-wrap: wrap;
      gap: 0.625rem;
    }

    .attention-pill {
      font-size: 0.8125rem;
      font-weight: 700;
      padding: 0.375rem 0.75rem;
      border-radius: var(--radius-md);
      text-decoration: none;
      transition: all var(--transition-fast);
    }

    .pill-merchants {
      background: #fef3c7;
      color: #b45309;
      border: 1px solid #fde68a;
    }

    .pill-merchants:hover {
      background: #fde68a;
    }

    .pill-coupons {
      background: #eff6ff;
      color: #1d4ed8;
      border: 1px solid #bfdbfe;
    }

    .pill-coupons:hover {
      background: #dbeafe;
    }

    .pill-payments {
      background: #f0fdf4;
      color: #15803d;
      border: 1px solid #bbf7d0;
    }

    .pill-payments:hover {
      background: #dcfce7;
    }

    .metrics-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 1.25rem;
    }

    .metric-card {
      padding: 1.5rem;
      border-radius: var(--radius-xl);
      display: flex;
      flex-direction: column;
    }

    .metric-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 0.5rem;
    }

    .metric-label {
      font-size: 0.8125rem;
      font-weight: 600;
      color: var(--text-muted);
    }

    .metric-icon {
      font-size: 1.25rem;
    }

    .metric-value {
      font-size: 1.875rem;
      font-weight: 800;
      line-height: 1.2;
      margin-bottom: 0.5rem;
    }

    .metric-footer {
      font-size: 0.75rem;
      color: var(--text-muted);
    }

    .dashboard-columns {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1.5rem;
    }

    .dashboard-section {
      padding: 1.5rem;
      border-radius: var(--radius-xl);
    }

    .section-top {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1.25rem;
    }

    .section-title {
      font-size: 1.0625rem;
      font-weight: 700;
      margin: 0;
    }

    .view-all-link {
      font-size: 0.8125rem;
      font-weight: 700;
      color: var(--primary);
      text-decoration: none;
    }

    .view-all-link:hover {
      text-decoration: underline;
    }

    .empty-inline {
      padding: 2rem;
      text-align: center;
      color: var(--success);
      font-weight: 600;
      font-size: 0.875rem;
      background: var(--surface-alt);
      border-radius: var(--radius-md);
    }

    .table-responsive {
      overflow-x: auto;
    }

    .simple-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 0.8125rem;
    }

    .simple-table th {
      padding: 0.625rem 0.75rem;
      background: var(--surface-alt);
      text-align: left;
      font-weight: 700;
      color: var(--text-muted);
      border-bottom: 1px solid var(--border);
      font-size: 0.6875rem;
      text-transform: uppercase;
    }

    .simple-table td {
      padding: 0.75rem;
      border-bottom: 1px solid var(--border);
      vertical-align: middle;
    }

    .code-tag {
      font-family: monospace;
      font-weight: 700;
      background: var(--primary-light);
      color: var(--primary);
      padding: 0.125rem 0.375rem;
      border-radius: var(--radius-sm);
      display: inline-block;
    }

    .title-sub {
      display: block;
      font-size: 0.75rem;
      color: var(--text-muted);
      margin-top: 0.125rem;
    }

    .btn-xs {
      padding: 0.25rem 0.5rem;
      font-size: 0.75rem;
      font-weight: 700;
    }

    .block {
      display: block;
    }

    @media (max-width: 860px) {
      .dashboard-columns {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class AdminDashboardComponent implements OnInit {
  private readonly adminService = inject(AdminService);
  private readonly toast = inject(ToastService);
  private readonly cdr = inject(ChangeDetectorRef);

  merchants: MerchantResponse[] = [];
  coupons: CouponResponse[] = [];
  payments: PaymentResponse[] = [];
  revenue: RevenueResponse | null = null;
  loading = true;

  ngOnInit(): void {
    this.loadAllData();
  }

  loadAllData(): void {
    this.loading = true;

    // Load revenue
    this.adminService.getRevenue().subscribe({
      next: r => {
        this.revenue = r;
        this.cdr.markForCheck();
      },
      error: () => {
        this.cdr.markForCheck();
      }
    });

    // Load merchants
    this.adminService.getAllMerchants().subscribe({
      next: m => {
        this.merchants = m || [];
        this.cdr.markForCheck();
      },
      error: () => {
        this.cdr.markForCheck();
      }
    });

    // Load coupons
    this.adminService.getAllCoupons().subscribe({
      next: c => {
        this.coupons = c || [];
        this.cdr.markForCheck();
      },
      error: () => {
        this.cdr.markForCheck();
      }
    });

    // Load payments
    this.adminService.getAllPayments().subscribe({
      next: p => {
        this.payments = p || [];
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.loading = false;
        this.cdr.markForCheck();
      }
    });
  }

  get pendingMerchants(): MerchantResponse[] {
    return this.merchants.filter(m => m.status === 'PENDING');
  }

  get pendingMerchantsCount(): number {
    return this.pendingMerchants.length;
  }

  get approvedMerchantsCount(): number {
    return this.merchants.filter(m => m.status === 'APPROVED').length;
  }

  get pendingCoupons(): CouponResponse[] {
    return this.coupons.filter(c => c.status === 'PENDING_APPROVAL');
  }

  get pendingCouponsCount(): number {
    return this.pendingCoupons.length;
  }

  get activeCouponsCount(): number {
    return this.coupons.filter(c => c.status === 'ACTIVE').length;
  }

  get pendingPayments(): PaymentResponse[] {
    return this.payments.filter(p => p.status === 'PENDING');
  }

  get pendingPaymentsCount(): number {
    return this.pendingPayments.length;
  }

  get verifiedPaymentsCount(): number {
    return this.payments.filter(p => p.status === 'VERIFIED').length;
  }

  quickApproveMerchant(id: number): void {
    this.adminService.approveMerchant(id).subscribe({
      next: updated => {
        this.toast.success(`Merchant "${updated.businessName}" approved!`);
        this.merchants = this.merchants.map(m => m.merchantId === id ? updated : m);
        this.cdr.markForCheck();
      },
      error: err => {
        this.toast.error(err.error?.message || 'Failed to approve merchant');
        this.cdr.markForCheck();
      }
    });
  }

  quickApproveCoupon(id: number): void {
    this.adminService.approveCoupon(id).subscribe({
      next: updated => {
        this.toast.success(`Coupon "${updated.couponCode}" approved and live!`);
        this.coupons = this.coupons.map(c => c.couponId === id ? updated : c);
        this.cdr.markForCheck();
      },
      error: err => {
        this.toast.error(err.error?.message || 'Failed to approve coupon');
        this.cdr.markForCheck();
      }
    });
  }
}
