import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminService } from '../../../core/services/admin.service';
import { ToastService } from '../../../core/services/toast.service';
import { CouponResponse } from '../../../core/models/coupon.models';
import { StatusBadgeComponent } from '../../../shared/components/status-badge/status-badge.component';
import { LoadingSkeletonComponent } from '../../../shared/components/loading-skeleton/loading-skeleton.component';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';
import { ConfirmationModalComponent } from '../../../shared/components/confirmation-modal/confirmation-modal.component';
import { PaginationComponent } from '../../../shared/components/pagination/pagination.component';

@Component({
  selector: 'app-admin-coupons',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    StatusBadgeComponent,
    LoadingSkeletonComponent,
    EmptyStateComponent,
    ConfirmationModalComponent,
    PaginationComponent
  ],
  template: `
    <div class="admin-coupons">
      <div class="page-header">
        <div>
          <h1 class="page-title">Coupon Moderation & Review Queue</h1>
          <p class="page-subtitle">Review deals submitted by merchants, verify discount criteria, and approve or reject campaigns</p>
        </div>
        <div class="header-stats">
          <span class="stat-chip chip-pending">
            ⏳ {{ pendingCount }} Awaiting Review
          </span>
          <span class="stat-chip chip-active">
            ✓ {{ activeCount }} Active Deals
          </span>
        </div>
      </div>

      <!-- Filters & Search -->
      <div class="filter-bar card">
        <div class="search-box">
          <span class="search-icon">🔍</span>
          <input
            type="text"
            class="form-control"
            placeholder="Search coupons by code, title, or category..."
            [(ngModel)]="searchQuery"
            (ngModelChange)="currentPage = 1"
          />
        </div>

        <div class="filter-pills">
          <button
            type="button"
            class="pill"
            [class.active]="selectedStatus === 'ALL'"
            (click)="selectedStatus = 'ALL'; currentPage = 1"
          >
            All ({{ coupons.length }})
          </button>
          <button
            type="button"
            class="pill"
            [class.active]="selectedStatus === 'PENDING_APPROVAL'"
            (click)="selectedStatus = 'PENDING_APPROVAL'; currentPage = 1"
          >
            Pending Review ({{ pendingCount }})
          </button>
          <button
            type="button"
            class="pill"
            [class.active]="selectedStatus === 'ACTIVE'"
            (click)="selectedStatus = 'ACTIVE'; currentPage = 1"
          >
            Active ({{ activeCount }})
          </button>
          <button
            type="button"
            class="pill"
            [class.active]="selectedStatus === 'REJECTED'"
            (click)="selectedStatus = 'REJECTED'; currentPage = 1"
          >
            Rejected
          </button>
        </div>
      </div>

      <!-- Coupons Table -->
      @if (loading) {
        <app-loading-skeleton type="table"></app-loading-skeleton>
      } @else if (filteredCoupons.length === 0) {
        <app-empty-state
          icon="🏷️"
          title="No Coupons in Queue"
          message="No coupon records match the selected filter criteria."
        ></app-empty-state>
      } @else {
        <div class="table-container card">
          <table class="data-table">
            <thead>
              <tr>
                <th>Coupon Code & Title</th>
                <th>Discount & Spend</th>
                <th>Category</th>
                <th>Merchant</th>
                <th>Validity Window</th>
                <th>Status</th>
                <th style="text-align: right;">Moderation</th>
              </tr>
            </thead>
            <tbody>
              @for (c of pagedCoupons; track c.couponId) {
                <tr>
                  <td>
                    <div class="coupon-cell">
                      <div class="code-line">
                        <span class="code-badge">{{ c.couponCode }}</span>
                        <span class="quota-tag">{{ c.usageCount || 0 }} / {{ c.usageLimit }} used</span>
                      </div>
                      <strong class="title-text">{{ c.title }}</strong>
                      <small class="desc-text text-muted">{{ c.description }}</small>
                    </div>
                  </td>
                  <td>
                    <div class="discount-cell">
                      <strong class="discount-val">{{ c.discount }}% OFF</strong>
                      <small class="text-muted">Min ₹{{ c.minimumPurchase !== undefined && c.minimumPurchase !== null ? c.minimumPurchase : 0 }}</small>
                      @if (c.cashbackPercentage) {
                        <span class="cashback-tag">+{{ c.cashbackPercentage }}% Cashback</span>
                      }
                    </div>
                  </td>
                  <td>
                    <span class="cat-chip">{{ c.category }}</span>
                  </td>
                  <td>
                    <span class="merchant-tag">Merchant #{{ c.merchantId }}</span>
                  </td>
                  <td>
                    <div class="date-cell">
                      <span>{{ c.validFrom | date:'dd MMM yyyy' }}</span>
                      <small class="text-muted">to {{ c.validUntil | date:'dd MMM yyyy' }}</small>
                    </div>
                  </td>
                  <td>
                    <app-status-badge [status]="c.status"></app-status-badge>
                  </td>
                  <td style="text-align: right;">
                    <div class="action-btn-group">
                      @if (c.status === 'PENDING_APPROVAL') {
                        <button
                          type="button"
                          class="btn btn-success btn-xs"
                          (click)="approveCoupon(c)"
                        >
                          Approve
                        </button>
                        <button
                          type="button"
                          class="btn btn-danger btn-xs"
                          (click)="openRejectModal(c)"
                        >
                          Reject
                        </button>
                      } @else if (c.status === 'ACTIVE') {
                        <button
                          type="button"
                          class="btn btn-outline-danger btn-xs"
                          (click)="openRejectModal(c)"
                        >
                          Revoke
                        </button>
                      } @else if (c.status === 'REJECTED') {
                        <button
                          type="button"
                          class="btn btn-primary btn-xs"
                          (click)="approveCoupon(c)"
                        >
                          Re-approve
                        </button>
                      }
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

      <!-- Rejection Confirmation Modal -->
      <app-confirmation-modal
        [isOpen]="isRejectModalOpen"
        title="Reject / Revoke Coupon"
        [message]="'Are you sure you want to reject coupon ' + (selectedCoupon?.couponCode || '') + '? It will no longer be visible to shoppers.'"
        confirmText="Confirm Rejection"
        confirmButtonClass="btn-danger"
        (confirmed)="executeReject()"
        (cancelled)="isRejectModalOpen = false"
      ></app-confirmation-modal>
    </div>
  `,
  styles: [`
    .admin-coupons {
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

    .header-stats {
      display: flex;
      gap: 0.5rem;
      flex-wrap: wrap;
    }

    .stat-chip {
      font-size: 0.8125rem;
      font-weight: 700;
      padding: 0.375rem 0.75rem;
      border-radius: 9999px;
    }

    .chip-pending {
      background: var(--warning-light);
      color: #92400e;
      border: 1px solid #fde68a;
    }

    .chip-active {
      background: var(--success-light);
      color: var(--success-dark);
      border: 1px solid #a7f3d0;
    }

    .filter-bar {
      padding: 1rem;
      border-radius: var(--radius-lg);
      display: flex;
      flex-wrap: wrap;
      gap: 1rem;
      justify-content: space-between;
      align-items: center;
    }

    .search-box {
      position: relative;
      flex: 1;
      min-width: 260px;
    }

    .search-icon {
      position: absolute;
      left: 0.875rem;
      top: 50%;
      transform: translateY(-50%);
      font-size: 0.875rem;
      opacity: 0.6;
    }

    .search-box .form-control {
      padding-left: 2.25rem;
      height: 40px;
    }

    .filter-pills {
      display: flex;
      gap: 0.375rem;
      flex-wrap: wrap;
    }

    .pill {
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

    .pill:hover {
      background: var(--surface-alt);
      color: var(--text-main);
    }

    .pill.active {
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
    }

    .data-table td {
      padding: 1rem;
      border-bottom: 1px solid var(--border);
      vertical-align: middle;
    }

    .coupon-cell {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
      max-width: 280px;
    }

    .code-line {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .code-badge {
      font-family: monospace;
      font-weight: 800;
      background: var(--primary-light);
      color: var(--primary);
      padding: 0.125rem 0.375rem;
      border-radius: var(--radius-sm);
      font-size: 0.8125rem;
    }

    .quota-tag {
      font-size: 0.6875rem;
      color: var(--text-muted);
    }

    .title-text {
      font-size: 0.875rem;
      color: var(--text-main);
      display: -webkit-box;
      -webkit-line-clamp: 1;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }

    .desc-text {
      font-size: 0.75rem;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
      line-height: 1.3;
    }

    .discount-cell {
      display: flex;
      flex-direction: column;
      gap: 0.125rem;
    }

    .discount-val {
      font-size: 0.9375rem;
      color: #dc2626;
    }

    .cashback-tag {
      font-size: 0.6875rem;
      background: #f0fdf4;
      color: #166534;
      padding: 0.125rem 0.375rem;
      border-radius: 9999px;
      width: fit-content;
      font-weight: 600;
    }

    .cat-chip {
      background: var(--surface-alt);
      padding: 0.25rem 0.5rem;
      border-radius: var(--radius-sm);
      font-size: 0.75rem;
      font-weight: 600;
    }

    .merchant-tag {
      font-size: 0.8125rem;
      font-weight: 600;
      color: var(--text-muted);
    }

    .date-cell {
      display: flex;
      flex-direction: column;
      font-size: 0.8125rem;
    }

    .action-btn-group {
      display: flex;
      gap: 0.375rem;
      justify-content: flex-end;
    }

    .btn-xs {
      padding: 0.25rem 0.5rem;
      font-size: 0.75rem;
      font-weight: 700;
    }

    .btn-success {
      background: var(--success);
      color: white;
      border: 1px solid var(--success);
    }

    .btn-success:hover {
      background: #059669;
    }

    .btn-outline-danger {
      background: transparent;
      border: 1px solid var(--danger);
      color: var(--danger);
    }

    .btn-outline-danger:hover {
      background: var(--danger);
      color: white;
    }
  `]
})
export class AdminCouponsComponent implements OnInit {
  private readonly adminService = inject(AdminService);
  private readonly toast = inject(ToastService);
  private readonly cdr = inject(ChangeDetectorRef);

  coupons: CouponResponse[] = [];
  loading = true;
  searchQuery = '';
  selectedStatus: string = 'ALL';
  isRejectModalOpen = false;
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
    this.loading = true;
    this.adminService.getAllCoupons().subscribe({
      next: data => {
        this.coupons = data || [];
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.toast.error('Failed to load coupons review queue');
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
          c.category.toLowerCase().includes(this.searchQuery.toLowerCase());

        const matchStatus =
          this.selectedStatus === 'ALL' || c.status === this.selectedStatus;

        return matchSearch && matchStatus;
      })
      .sort((a, b) => {
        // Pending approval always on top if viewing ALL
        if (this.selectedStatus === 'ALL') {
          if (a.status === 'PENDING_APPROVAL' && b.status !== 'PENDING_APPROVAL') return -1;
          if (b.status === 'PENDING_APPROVAL' && a.status !== 'PENDING_APPROVAL') return 1;
        }

        const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        if (dateB !== dateA) return dateB - dateA;
        return (b.couponId || 0) - (a.couponId || 0);
      });
  }

  get pendingCount(): number {
    return this.coupons.filter(c => c.status === 'PENDING_APPROVAL').length;
  }

  get activeCount(): number {
    return this.coupons.filter(c => c.status === 'ACTIVE').length;
  }

  approveCoupon(coupon: CouponResponse): void {
    this.adminService.approveCoupon(coupon.couponId).subscribe({
      next: updated => {
        this.toast.success(`Coupon "${updated.couponCode}" approved and live!`);
        this.coupons = this.coupons.map(c =>
          c.couponId === coupon.couponId ? updated : c
        );
        this.cdr.markForCheck();
      },
      error: err => {
        this.toast.error(err.error?.message || 'Failed to approve coupon');
        this.cdr.markForCheck();
      }
    });
  }

  openRejectModal(coupon: CouponResponse): void {
    this.selectedCoupon = coupon;
    this.isRejectModalOpen = true;
    this.cdr.markForCheck();
  }

  executeReject(): void {
    if (!this.selectedCoupon) return;
    const id = this.selectedCoupon.couponId;
    this.adminService.rejectCoupon(id).subscribe({
      next: updated => {
        this.toast.success(`Coupon "${updated.couponCode}" rejected`);
        this.coupons = this.coupons.map(c => c.couponId === id ? updated : c);
        this.isRejectModalOpen = false;
        this.selectedCoupon = null;
        this.cdr.markForCheck();
      },
      error: err => {
        this.toast.error(err.error?.message || 'Failed to reject coupon');
        this.isRejectModalOpen = false;
        this.cdr.markForCheck();
      }
    });
  }
}
