import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminService } from '../../../core/services/admin.service';
import { ToastService } from '../../../core/services/toast.service';
import { MerchantResponse, MerchantStatus } from '../../../core/models/merchant.models';
import { StatusBadgeComponent } from '../../../shared/components/status-badge/status-badge.component';
import { LoadingSkeletonComponent } from '../../../shared/components/loading-skeleton/loading-skeleton.component';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';
import { ConfirmationModalComponent } from '../../../shared/components/confirmation-modal/confirmation-modal.component';
import { PaginationComponent } from '../../../shared/components/pagination/pagination.component';

@Component({
  selector: 'app-admin-merchants',
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
    <div class="admin-merchants">
      <div class="page-header">
        <div>
          <h1 class="page-title">Merchant Moderation & Directory</h1>
          <p class="page-subtitle">Review merchant onboarding applications, manage store accounts, and enforce platform standards</p>
        </div>
        <div class="header-stats">
          <span class="stat-chip chip-pending">
            ⏳ {{ pendingCount }} Pending Approval
          </span>
          <span class="stat-chip chip-approved">
            ✓ {{ approvedCount }} Approved
          </span>
        </div>
      </div>

      <!-- Filters Bar -->
      <div class="filter-bar card">
        <div class="search-box">
          <span class="search-icon">🔍</span>
          <input
            type="text"
            class="form-control"
            placeholder="Search merchants by business name, owner, or email..."
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
            All ({{ merchants.length }})
          </button>
          <button
            type="button"
            class="pill"
            [class.active]="selectedStatus === 'PENDING'"
            (click)="selectedStatus = 'PENDING'; currentPage = 1"
          >
            Pending Review ({{ pendingCount }})
          </button>
          <button
            type="button"
            class="pill"
            [class.active]="selectedStatus === 'APPROVED'"
            (click)="selectedStatus = 'APPROVED'; currentPage = 1"
          >
            Approved ({{ approvedCount }})
          </button>
          <button
            type="button"
            class="pill"
            [class.active]="selectedStatus === 'SUSPENDED'"
            (click)="selectedStatus = 'SUSPENDED'; currentPage = 1"
          >
            Suspended
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

      <!-- Merchants Table -->
      @if (loading) {
        <app-loading-skeleton type="table"></app-loading-skeleton>
      } @else if (filteredMerchants.length === 0) {
        <app-empty-state
          icon="🏪"
          title="No Merchants Found"
          message="No merchant records match your current filter and search query."
        ></app-empty-state>
      } @else {
        <div class="table-container card">
          <table class="data-table">
            <thead>
              <tr>
                <th>Merchant & Business</th>
                <th>Category</th>
                <th>Contact Channels</th>
                <th>Registered</th>
                <th>Status</th>
                <th style="text-align: right;">Moderation Actions</th>
              </tr>
            </thead>
            <tbody>
              @for (m of pagedMerchants; track m.merchantId) {
                <tr>
                  <td>
                    <div class="merchant-cell">
                      <div class="merchant-avatar">🏪</div>
                      <div>
                        <strong class="business-name">{{ m.businessName }}</strong>
                        <span class="owner-name text-muted">Owner: {{ m.ownerName }}</span>
                        <span class="id-tag">ID: #{{ m.merchantId }}</span>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span class="category-chip">{{ m.category }}</span>
                  </td>
                  <td>
                    <div class="contact-cell">
                      <span class="email-text">✉️ {{ m.email }}</span>
                      <span class="phone-text text-muted">📞 {{ m.phone }}</span>
                      @if (m.address) {
                        <small class="address-text text-muted">📍 {{ m.address }}</small>
                      }
                    </div>
                  </td>
                  <td>
                    <span class="date-text">{{ m.createdAt | date:'mediumDate' }}</span>
                  </td>
                  <td>
                    <app-status-badge [status]="m.status"></app-status-badge>
                  </td>
                  <td style="text-align: right;">
                    <div class="action-btn-group">
                      @if (m.status === 'PENDING') {
                        <button
                          type="button"
                          class="btn btn-success btn-xs"
                          (click)="approveMerchant(m)"
                        >
                          Approve
                        </button>
                        <button
                          type="button"
                          class="btn btn-danger btn-xs"
                          (click)="openConfirmModal(m, 'REJECT')"
                        >
                          Reject
                        </button>
                      } @else if (m.status === 'APPROVED') {
                        <button
                          type="button"
                          class="btn btn-outline-warning btn-xs"
                          (click)="openConfirmModal(m, 'SUSPEND')"
                        >
                          Suspend
                        </button>
                      } @else if (m.status === 'SUSPENDED' || m.status === 'REJECTED') {
                        <button
                          type="button"
                          class="btn btn-primary btn-xs"
                          (click)="approveMerchant(m)"
                        >
                          Reactivate
                        </button>
                      }
                    </div>
                  </td>
                </tr>
              }
            </tbody>
          </table>
          <app-pagination
            [totalItems]="filteredMerchants.length"
            [pageSize]="pageSize"
            [currentPage]="currentPage"
            [pageSizeOptions]="[5, 10, 20, 50]"
            (pageChange)="onPageChange($event)"
            (pageSizeChange)="onPageSizeChange($event)"
          ></app-pagination>
        </div>
      }

      <!-- Confirmation Modal -->
      <app-confirmation-modal
        [isOpen]="isModalOpen"
        [title]="modalTitle"
        [message]="modalMessage"
        [confirmText]="modalConfirmText"
        [confirmButtonClass]="modalButtonClass"
        (confirmed)="executeModalAction()"
        (cancelled)="isModalOpen = false"
      ></app-confirmation-modal>
    </div>
  `,
  styles: [`
    .admin-merchants {
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

    .chip-approved {
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

    .merchant-cell {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .merchant-avatar {
      font-size: 1.5rem;
      background: var(--surface-alt);
      padding: 0.375rem;
      border-radius: var(--radius-sm);
      line-height: 1;
    }

    .business-name {
      display: block;
      font-size: 0.9375rem;
      color: var(--text-main);
    }

    .owner-name {
      font-size: 0.75rem;
      display: block;
    }

    .id-tag {
      font-size: 0.6875rem;
      color: var(--text-muted);
    }

    .category-chip {
      background: var(--surface-alt);
      padding: 0.25rem 0.5rem;
      border-radius: var(--radius-sm);
      font-size: 0.75rem;
      font-weight: 600;
    }

    .contact-cell {
      display: flex;
      flex-direction: column;
      gap: 0.125rem;
      font-size: 0.8125rem;
    }

    .address-text {
      font-size: 0.75rem;
    }

    .date-text {
      font-size: 0.8125rem;
      color: var(--text-muted);
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

    .btn-outline-warning {
      background: transparent;
      border: 1px solid #d97706;
      color: #d97706;
    }

    .btn-outline-warning:hover {
      background: #d97706;
      color: white;
    }
  `]
})
export class AdminMerchantsComponent implements OnInit {
  private readonly adminService = inject(AdminService);
  private readonly toast = inject(ToastService);
  private readonly cdr = inject(ChangeDetectorRef);

  merchants: MerchantResponse[] = [];
  loading = true;
  searchQuery = '';
  selectedStatus: string = 'ALL';

  isModalOpen = false;
  selectedMerchant: MerchantResponse | null = null;
  pendingAction: 'REJECT' | 'SUSPEND' | null = null;

  // Pagination
  currentPage = 1;
  pageSize = 10;

  get pagedMerchants(): MerchantResponse[] {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.filteredMerchants.slice(start, start + this.pageSize);
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
    this.loadMerchants();
  }

  loadMerchants(): void {
    this.loading = true;
    this.adminService.getAllMerchants().subscribe({
      next: data => {
        this.merchants = data || [];
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.toast.error('Failed to load merchant records');
        this.loading = false;
        this.cdr.markForCheck();
      }
    });
  }

  get filteredMerchants(): MerchantResponse[] {
    return this.merchants
      .filter(m => {
        const matchSearch =
          !this.searchQuery ||
          m.businessName.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
          m.ownerName.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
          m.email.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
          m.category.toLowerCase().includes(this.searchQuery.toLowerCase());

        const matchStatus =
          this.selectedStatus === 'ALL' || m.status === this.selectedStatus;

        return matchSearch && matchStatus;
      })
      .sort((a, b) => {
        // Pending approval always on top if viewing ALL
        if (this.selectedStatus === 'ALL') {
          if (a.status === 'PENDING' && b.status !== 'PENDING') return -1;
          if (b.status === 'PENDING' && a.status !== 'PENDING') return 1;
        }

        const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        if (dateB !== dateA) return dateB - dateA;
        return (b.merchantId || 0) - (a.merchantId || 0);
      });
  }

  get pendingCount(): number {
    return this.merchants.filter(m => m.status === 'PENDING').length;
  }

  get approvedCount(): number {
    return this.merchants.filter(m => m.status === 'APPROVED').length;
  }

  approveMerchant(merchant: MerchantResponse): void {
    this.adminService.approveMerchant(merchant.merchantId).subscribe({
      next: updated => {
        this.toast.success(`Merchant "${updated.businessName}" is now APPROVED`);
        this.merchants = this.merchants.map(m =>
          m.merchantId === merchant.merchantId ? updated : m
        );
        this.cdr.markForCheck();
      },
      error: err => {
        this.toast.error(err.error?.message || 'Failed to approve merchant');
        this.cdr.markForCheck();
      }
    });
  }

  openConfirmModal(merchant: MerchantResponse, action: 'REJECT' | 'SUSPEND'): void {
    this.selectedMerchant = merchant;
    this.pendingAction = action;
    this.isModalOpen = true;
    this.cdr.markForCheck();
  }

  get modalTitle(): string {
    return this.pendingAction === 'REJECT' ? 'Reject Merchant Application' : 'Suspend Merchant Account';
  }

  get modalMessage(): string {
    if (!this.selectedMerchant) return '';
    return this.pendingAction === 'REJECT'
      ? `Are you sure you want to reject the application for "${this.selectedMerchant.businessName}"? The merchant will not be permitted to purchase plans or create deals.`
      : `Are you sure you want to suspend "${this.selectedMerchant.businessName}"? All their coupons will be deactivated.`;
  }

  get modalConfirmText(): string {
    return this.pendingAction === 'REJECT' ? 'Reject Application' : 'Suspend Merchant';
  }

  get modalButtonClass(): string {
    return this.pendingAction === 'REJECT' ? 'btn-danger' : 'btn-warning';
  }

  executeModalAction(): void {
    if (!this.selectedMerchant || !this.pendingAction) return;

    const id = this.selectedMerchant.merchantId;
    const action$ =
      this.pendingAction === 'REJECT'
        ? this.adminService.rejectMerchant(id)
        : this.adminService.suspendMerchant(id);

    action$.subscribe({
      next: updated => {
        this.toast.success(`Merchant status updated to ${updated.status}`);
        this.merchants = this.merchants.map(m => m.merchantId === id ? updated : m);
        this.isModalOpen = false;
        this.selectedMerchant = null;
        this.pendingAction = null;
        this.cdr.markForCheck();
      },
      error: err => {
        this.toast.error(err.error?.message || 'Failed to update merchant status');
        this.isModalOpen = false;
        this.cdr.markForCheck();
      }
    });
  }
}
