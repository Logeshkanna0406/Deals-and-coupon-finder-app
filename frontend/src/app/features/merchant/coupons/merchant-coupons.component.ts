import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CouponService } from '../../../core/services/coupon.service';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../core/services/toast.service';
import { CouponResponse, CouponStatus } from '../../../core/models/coupon.models';
import { StatusBadgeComponent } from '../../../shared/components/status-badge/status-badge.component';
import { LoadingSkeletonComponent } from '../../../shared/components/loading-skeleton/loading-skeleton.component';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';
import { ConfirmationModalComponent } from '../../../shared/components/confirmation-modal/confirmation-modal.component';
import { PaginationComponent } from '../../../shared/components/pagination/pagination.component';

@Component({
  selector: 'app-merchant-coupons',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    FormsModule,
    StatusBadgeComponent,
    LoadingSkeletonComponent,
    EmptyStateComponent,
    ConfirmationModalComponent,
    PaginationComponent
  ],
  template: `
    <div class="coupons-management">
      <!-- Header banner -->
      <div class="page-header">
        <div>
          <h1 class="page-title">Manage Deals & Coupons</h1>
          <p class="page-subtitle">Track performance, monitor redemption quotas, and publish promotional offers</p>
        </div>
        <a routerLink="/merchant/coupons/create" class="btn btn-primary">
          <span style="font-size: 1.1rem; line-height: 1;">+</span> Create New Coupon
        </a>
      </div>

      <!-- Quick Metrics Summary -->
      <div class="metrics-grid">
        <div class="metric-card card">
          <span class="metric-label">Total Coupons</span>
          <span class="metric-val">{{ coupons.length }}</span>
          <span class="metric-sub text-muted">All-time campaigns</span>
        </div>
        <div class="metric-card card">
          <span class="metric-label">Active & Live</span>
          <span class="metric-val text-success">{{ activeCouponsCount }}</span>
          <span class="metric-sub text-muted">Discoverable by shoppers</span>
        </div>
        <div class="metric-card card">
          <span class="metric-label">Pending Approval</span>
          <span class="metric-val text-warning">{{ pendingCouponsCount }}</span>
          <span class="metric-sub text-muted">Awaiting admin review</span>
        </div>
        <div class="metric-card card">
          <span class="metric-label">Total Redemptions</span>
          <span class="metric-val text-primary">{{ totalRedemptionsCount }}</span>
          <span class="metric-sub text-muted">Used in customer orders</span>
        </div>
      </div>

      <!-- Filter and Search Bar -->
      <div class="filter-bar card">
        <div class="search-input-group">
          <span class="search-icon">🔍</span>
          <input
            type="text"
            class="form-control"
            placeholder="Search by code or title..."
            [(ngModel)]="searchQuery"
            (ngModelChange)="currentPage = 1"
          />
        </div>

        <div class="status-filters">
          <button
            type="button"
            class="filter-pill"
            [class.active]="selectedStatus === 'ALL'"
            (click)="selectedStatus = 'ALL'; currentPage = 1"
          >
            All ({{ coupons.length }})
          </button>
          <button
            type="button"
            class="filter-pill"
            [class.active]="selectedStatus === 'ACTIVE'"
            (click)="selectedStatus = 'ACTIVE'; currentPage = 1"
          >
            Active ({{ activeCouponsCount }})
          </button>
          <button
            type="button"
            class="filter-pill"
            [class.active]="selectedStatus === 'PENDING_APPROVAL'"
            (click)="selectedStatus = 'PENDING_APPROVAL'; currentPage = 1"
          >
            Pending ({{ pendingCouponsCount }})
          </button>
          <button
            type="button"
            class="filter-pill"
            [class.active]="selectedStatus === 'EXPIRED'"
            (click)="selectedStatus = 'EXPIRED'; currentPage = 1"
          >
            Expired
          </button>
        </div>
      </div>

      <!-- Content Table / State -->
      @if (loading) {
        <app-loading-skeleton type="table"></app-loading-skeleton>
      } @else if (filteredCoupons.length === 0) {
        <app-empty-state
          icon="🏷️"
          title="No Coupons Found"
          message="You haven't created any deals matching your filter criteria yet."
          actionText="Create Your First Coupon"
          actionLink="/merchant/coupons/create"
        ></app-empty-state>
      } @else {
        <div class="table-container card">
          <table class="data-table">
            <thead>
              <tr>
                <th>Deal Code & Category</th>
                <th>Discount</th>
                <th>Validity Period</th>
                <th>Quota Used</th>
                <th>Reliability</th>
                <th>Status</th>
                <th style="text-align: right;">Actions</th>
              </tr>
            </thead>
            <tbody>
              @for (c of pagedCoupons; track c.couponId) {
                <tr>
                  <td>
                    <div class="code-cell">
                      <span class="coupon-code-badge">{{ c.couponCode }}</span>
                      <span class="coupon-title">{{ c.title }}</span>
                      <span class="coupon-category text-muted">{{ c.category }}</span>
                    </div>
                  </td>
                  <td>
                    <span class="discount-val">
                      {{ c.discount }}% OFF
                    </span>
                    <span class="min-spend text-muted">Min ₹{{ c.minimumPurchase }}</span>
                  </td>
                  <td>
                    <div class="validity-dates">
                      <span>{{ c.validFrom | date:'dd MMM yyyy' }}</span>
                      <span class="date-arrow">→ {{ c.validUntil | date:'dd MMM yyyy' }}</span>
                    </div>
                  </td>
                  <td>
                    <div class="quota-container">
                      <div class="quota-text">
                        <span>{{ c.usageCount }} / {{ c.usageLimit }}</span>
                        <span class="quota-percent text-muted">
                          {{ calculateUsagePercent(c) }}%
                        </span>
                      </div>
                      <div class="progress-bar-bg">
                        <div
                          class="progress-bar-fill"
                          [style.width.%]="calculateUsagePercent(c)"
                          [class.warn]="calculateUsagePercent(c) > 80"
                        ></div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <div class="score-badge">
                      @if ((c.totalVotes || 0) > 0) {
                        <span>⭐ {{ getCouponRatingPercent(c) }}%</span>
                        <small class="text-muted">({{ c.totalVotes }} votes)</small>
                      } @else {
                        <span class="badge badge-info" style="font-size: 0.75rem;">✨ New (0 votes)</span>
                      }
                    </div>
                  </td>
                  <td>
                    <app-status-badge [status]="c.status"></app-status-badge>
                  </td>
                  <td style="text-align: right;">
                    <div class="action-buttons">
                      <a
                        [routerLink]="['/merchant/coupons/edit', c.couponId]"
                        class="btn btn-secondary btn-sm"
                        title="Edit description, min spend, quota"
                      >
                        Edit
                      </a>
                      <button
                        type="button"
                        class="btn btn-outline-danger btn-sm"
                        (click)="confirmDelete(c)"
                        title="Delete coupon"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              }
            </tbody>
          </table>
          <app-pagination
            [totalItems]="filteredCoupons.length"
            [pageSize]="pageSize"
            [currentPage]="currentPage"
            [pageSizeOptions]="[5, 10, 20, 50]"
            (pageChange)="onPageChange($event)"
            (pageSizeChange)="onPageSizeChange($event)"
          ></app-pagination>
        </div>
      }

      <!-- Delete Confirmation Modal -->
      <app-confirmation-modal
        [isOpen]="isDeleteModalOpen"
        title="Delete Coupon"
        [message]="'Are you sure you want to permanently delete coupon ' + (selectedCoupon?.couponCode || '') + '? This action cannot be undone.'"
        confirmText="Yes, Delete Coupon"
        confirmButtonClass="btn-danger"
        (confirmed)="executeDelete()"
        (cancelled)="isDeleteModalOpen = false"
      ></app-confirmation-modal>
    </div>
  `,
  styles: [`
    .coupons-management {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }

    .page-header {
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

    .metrics-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
      gap: 1rem;
    }

    .metric-card {
      padding: 1.25rem;
      border-radius: var(--radius-lg);
      display: flex;
      flex-direction: column;
    }

    .metric-label {
      font-size: 0.8125rem;
      font-weight: 600;
      color: var(--text-muted);
      margin-bottom: 0.375rem;
    }

    .metric-val {
      font-size: 1.75rem;
      font-weight: 800;
      line-height: 1.2;
    }

    .metric-sub {
      font-size: 0.75rem;
      margin-top: 0.375rem;
    }

    .filter-bar {
      padding: 1rem;
      border-radius: var(--radius-lg);
      display: flex;
      flex-wrap: wrap;
      gap: 1rem;
      align-items: center;
      justify-content: space-between;
    }

    .search-input-group {
      position: relative;
      flex: 1;
      min-width: 240px;
    }

    .search-icon {
      position: absolute;
      left: 0.875rem;
      top: 50%;
      transform: translateY(-50%);
      font-size: 0.875rem;
      opacity: 0.6;
    }

    .search-input-group .form-control {
      padding-left: 2.25rem;
      height: 40px;
    }

    .status-filters {
      display: flex;
      gap: 0.5rem;
      flex-wrap: wrap;
    }

    .filter-pill {
      border: 1px solid var(--border);
      background: var(--surface);
      color: var(--text-muted);
      border-radius: 9999px;
      padding: 0.375rem 0.875rem;
      font-size: 0.8125rem;
      font-weight: 600;
      cursor: pointer;
      transition: all var(--transition-fast);
    }

    .filter-pill:hover {
      background: var(--surface-alt);
      color: var(--text-main);
    }

    .filter-pill.active {
      background: var(--primary);
      color: white;
      border-color: var(--primary);
    }

    .table-container {
      overflow-x: auto;
      border-radius: var(--radius-lg);
    }

    .data-table {
      width: 100%;
      border-collapse: collapse;
      text-align: left;
      font-size: 0.875rem;
    }

    .data-table th {
      padding: 0.875rem 1rem;
      background: var(--surface-alt);
      font-weight: 700;
      color: var(--text-muted);
      border-bottom: 1px solid var(--border);
      font-size: 0.75rem;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      white-space: nowrap;
    }

    .data-table td {
      padding: 1rem;
      border-bottom: 1px solid var(--border);
      vertical-align: middle;
    }

    .data-table tr:hover {
      background-color: var(--surface-alt);
    }

    .code-cell {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
      min-width: 150px;
    }

    .coupon-code-badge {
      font-family: monospace;
      font-weight: 700;
      font-size: 0.9375rem;
      color: var(--primary);
      background: var(--primary-light);
      padding: 0.25rem 0.5rem;
      border-radius: var(--radius-sm);
      display: inline-block;
      width: fit-content;
    }

    .coupon-category {
      font-size: 0.75rem;
    }

    .discount-val {
      font-weight: 700;
      color: var(--text-main);
      display: block;
      white-space: nowrap;
    }

    .min-spend {
      font-size: 0.75rem;
      white-space: nowrap;
    }

    .validity-dates {
      display: flex;
      flex-direction: column;
      font-size: 0.8125rem;
      white-space: nowrap;
      min-width: 125px;
      gap: 0.2rem;
    }

    .date-arrow {
      font-size: 0.75rem;
      color: var(--text-muted);
      white-space: nowrap;
    }

    .quota-container {
      width: 140px;
      min-width: 140px;
    }

    .quota-text {
      display: flex;
      justify-content: space-between;
      font-size: 0.75rem;
      font-weight: 600;
      margin-bottom: 0.25rem;
    }

    .progress-bar-bg {
      height: 6px;
      background: var(--border);
      border-radius: 9999px;
      overflow: hidden;
    }

    .progress-bar-fill {
      height: 100%;
      background: var(--primary);
      border-radius: 9999px;
      transition: width 0.3s ease;
    }

    .progress-bar-fill.warn {
      background: var(--warning);
    }

    .score-badge {
      display: flex;
      flex-direction: column;
      font-weight: 700;
      font-size: 0.8125rem;
      white-space: nowrap;
      min-width: 120px;
      gap: 0.2rem;
    }

    .score-badge .badge-info {
      display: inline-flex;
      align-items: center;
      width: fit-content;
      white-space: nowrap;
      font-size: 0.75rem;
      padding: 0.2rem 0.5rem;
    }

    .action-buttons {
      display: flex;
      gap: 0.5rem;
      justify-content: flex-end;
    }

    .btn-outline-danger {
      background: transparent;
      border: 1px solid var(--danger);
      color: var(--danger);
      border-radius: var(--radius-md);
      padding: 0.25rem 0.625rem;
      font-size: 0.75rem;
      font-weight: 600;
      cursor: pointer;
      transition: all var(--transition-fast);
    }

    .btn-outline-danger:hover {
      background: var(--danger);
      color: white;
    }
  `]
})
export class MerchantCouponsComponent implements OnInit {
  private readonly couponService = inject(CouponService);
  private readonly authService = inject(AuthService);
  private readonly toast = inject(ToastService);
  private readonly cdr = inject(ChangeDetectorRef);

  coupons: CouponResponse[] = [];
  loading = true;
  searchQuery = '';
  selectedStatus: string = 'ALL';

  isDeleteModalOpen = false;
  selectedCoupon: CouponResponse | null = null;

  // Pagination
  currentPage = 1;
  pageSize = 10;

  get pagedCoupons(): CouponResponse[] {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.filteredCoupons.slice(start, start + this.pageSize);
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
    this.loadCoupons();
  }

  loadCoupons(): void {
    const merchantId = this.authService.currentUserId();
    if (!merchantId) {
      this.loading = false;
      this.cdr.markForCheck();
      return;
    }

    this.loading = true;
    this.cdr.markForCheck();
    this.couponService.getCouponsByMerchant(merchantId).subscribe({
      next: data => {
        this.coupons = [...(data || [])];
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: err => {
        this.toast.error('Failed to load merchant coupons');
        this.loading = false;
        this.cdr.markForCheck();
      }
    });
  }

  get filteredCoupons(): CouponResponse[] {
    return this.coupons
      .filter(c => {
        const matchSearch =
          !this.searchQuery ||
          c.couponCode.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
          c.title?.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
          c.category.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
          c.description?.toLowerCase().includes(this.searchQuery.toLowerCase());

        const matchStatus =
          this.selectedStatus === 'ALL' || c.status === this.selectedStatus;

        return matchSearch && matchStatus;
      })
      .sort((a, b) => {
        const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        if (dateB !== dateA) return dateB - dateA;
        return (b.couponId || 0) - (a.couponId || 0);
      });
  }

  get activeCouponsCount(): number {
    return this.coupons.filter(c => c.status === 'ACTIVE').length;
  }

  get pendingCouponsCount(): number {
    return this.coupons.filter(c => c.status === 'PENDING_APPROVAL').length;
  }

  get totalRedemptionsCount(): number {
    return this.coupons.reduce((sum, c) => sum + (c.usageCount || 0), 0);
  }

  getCouponRatingPercent(c: CouponResponse): number {
    const total = (c.upvoteCount || 0) + (c.downvoteCount || 0);
    if (total === 0) return 100;
    return Math.round(((c.upvoteCount || 0) / total) * 100);
  }

  calculateUsagePercent(c: CouponResponse): number {
    if (!c.usageLimit || c.usageLimit <= 0) return 0;
    const pct = Math.round(((c.usageCount || 0) / c.usageLimit) * 100);
    return Math.min(pct, 100);
  }

  confirmDelete(coupon: CouponResponse): void {
    this.selectedCoupon = coupon;
    this.isDeleteModalOpen = true;
    this.cdr.markForCheck();
  }

  executeDelete(): void {
    if (!this.selectedCoupon) return;
    this.couponService.deleteCoupon(this.selectedCoupon.couponId).subscribe({
      next: () => {
        this.toast.success(`Coupon ${this.selectedCoupon?.couponCode} deleted successfully`);
        this.coupons = this.coupons.filter(c => c.couponId !== this.selectedCoupon?.couponId);
        this.isDeleteModalOpen = false;
        this.selectedCoupon = null;
        this.cdr.markForCheck();
      },
      error: err => {
        this.toast.error(err.error?.message || 'Failed to delete coupon');
        this.isDeleteModalOpen = false;
        this.cdr.markForCheck();
      }
    });
  }
}
