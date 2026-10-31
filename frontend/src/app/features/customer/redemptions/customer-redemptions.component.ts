import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';
import { RedemptionService } from '../../../core/services/redemption.service';
import { CustomerRedemptionHistoryItem } from '../../../core/models/redemption.models';
import { LoadingSkeletonComponent } from '../../../shared/components/loading-skeleton/loading-skeleton.component';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';
import { PaginationComponent } from '../../../shared/components/pagination/pagination.component';

@Component({
  selector: 'app-customer-redemptions',
  standalone: true,
  imports: [CommonModule, FormsModule, LoadingSkeletonComponent, EmptyStateComponent, PaginationComponent],
  template: `
    <div class="redemptions-page fade-in">
      <div class="page-header">
        <h1 class="page-title">My Redemption History</h1>
        <p class="page-subtitle">Track all coupons claimed, discounts saved, and points earned</p>
      </div>

      <!-- Controls Bar -->
      <div class="controls-bar card">
        <div class="search-wrapper">
          <span class="search-icon">🔍</span>
          <input
            type="text"
            class="form-control"
            [(ngModel)]="searchFilter"
            placeholder="Search by coupon title, code, or merchant..."
          />
        </div>
        <div class="total-saved-stat">
          <span class="saved-label">Total Redemptions:</span>
          <strong>{{ totalElements }} deals</strong>
        </div>
      </div>

      <!-- Redemptions Table -->
      @if (isLoading) {
        <app-loading-skeleton type="table"></app-loading-skeleton>
      } @else if (filteredItems.length === 0) {
        <app-empty-state
          title="No Redemptions Found"
          description="You haven't redeemed any coupons yet. Browse our active deals and save today!"
          actionLabel="Explore Deals"
          (action)="browseDeals()"
        ></app-empty-state>
      } @else {
        <div class="table-responsive card">
          <table class="table">
            <thead>
              <tr>
                <th>Deal Title & Code</th>
                <th>Merchant</th>
                <th>Redeemed Date</th>
                <th>Order Amount</th>
                <th>Discount Saved</th>
                <th>Reward Points</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              @for (item of filteredItems; track item.redemptionId) {
                <tr>
                  <td>
                    <div class="deal-cell">
                      <strong class="deal-title">{{ item.couponTitle || 'Special Offer' }}</strong>
                      <span class="deal-code">Code: {{ item.couponCode }}</span>
                    </div>
                  </td>
                  <td>
                    <span class="merchant-name">{{ item.merchantName || 'Merchant #' + item.merchantId }}</span>
                  </td>
                  <td>
                    <span class="date-text">{{ formatDate(item.redemptionDate) }}</span>
                  </td>
                  <td>
                    <span class="amount-text">₹{{ item.purchaseAmount | number:'1.2-2' }}</span>
                  </td>
                  <td>
                    <span class="saved-text">- ₹{{ item.discountAmount | number:'1.2-2' }}</span>
                  </td>
                  <td>
                    <span class="points-pill">+{{ item.pointsEarned }} pts</span>
                  </td>
                  <td>
                    <span class="badge badge-success">{{ item.status }}</span>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>

        <!-- Pagination Bar -->
        <app-pagination
          [totalItems]="totalElements"
          [pageSize]="pageSize"
          [currentPage]="currentPage"
          [pageSizeOptions]="[5, 10, 20, 50]"
          (pageChange)="onPageChange($event)"
          (pageSizeChange)="onPageSizeChange($event)"
        ></app-pagination>
      }
    </div>
  `,
  styles: [`
    .redemptions-page {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }

    .page-title {
      font-size: 2rem;
      font-weight: 800;
      margin-bottom: 0.25rem;
    }

    .page-subtitle {
      font-size: 0.9375rem;
      color: var(--text-muted);
    }

    .controls-bar {
      padding: 1rem 1.25rem;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 1rem;
      flex-wrap: wrap;
    }

    .search-wrapper {
      position: relative;
      flex: 1;
      max-width: 380px;
    }

    .search-icon {
      position: absolute;
      left: 0.75rem;
      top: 50%;
      transform: translateY(-50%);
      font-size: 0.875rem;
      color: var(--text-muted);
    }

    .search-wrapper input {
      padding-left: 2.25rem;
    }

    .total-saved-stat {
      font-size: 0.875rem;
      color: var(--text-muted);
      display: flex;
      align-items: center;
      gap: 0.375rem;
    }

    .total-saved-stat strong {
      color: var(--text-main);
    }

    .deal-cell {
      display: flex;
      flex-direction: column;
    }

    .deal-title {
      font-size: 0.875rem;
      color: var(--text-main);
    }

    .deal-code {
      font-family: monospace;
      font-size: 0.75rem;
      color: var(--primary);
    }

    .merchant-name {
      font-size: 0.875rem;
      font-weight: 600;
    }

    .date-text {
      font-size: 0.8125rem;
      color: var(--text-muted);
    }

    .amount-text {
      font-size: 0.875rem;
    }

    .saved-text {
      font-size: 0.9375rem;
      font-weight: 800;
      color: var(--success-dark);
    }

    .points-pill {
      font-size: 0.75rem;
      font-weight: 800;
      background: var(--warning-light);
      color: #92400e;
      padding: 0.25rem 0.5rem;
      border-radius: var(--radius-full);
    }

    .pagination-bar {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 1rem;
      margin-top: 1rem;
    }

    .page-info {
      font-size: 0.875rem;
      color: var(--text-muted);
    }
  `]
})
export class CustomerRedemptionsComponent implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly redemptionService = inject(RedemptionService);
  private readonly cdr = inject(ChangeDetectorRef);

  redemptions: CustomerRedemptionHistoryItem[] = [];
  isLoading = true;
  searchFilter = '';

  currentPage = 1;
  pageSize = 10;
  totalPages = 1;
  totalElements = 0;
  isLastPage = true;

  ngOnInit(): void {
    this.loadHistory();
  }

  loadHistory(): void {
    const customerId = this.authService.currentUserId();
    if (!customerId) {
      this.isLoading = false;
      this.cdr.markForCheck();
      return;
    }

    this.isLoading = true;
    this.cdr.markForCheck();
    this.redemptionService.getMyRedemptionHistory(this.currentPage - 1, this.pageSize, customerId).subscribe({
      next: res => {
        this.redemptions = res.content || [];
        this.totalPages = res.totalPages || 1;
        this.totalElements = res.totalElements || 0;
        this.isLastPage = res.last;
        this.isLoading = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.isLoading = false;
        this.cdr.markForCheck();
      }
    });
  }

  get filteredItems(): CustomerRedemptionHistoryItem[] {
    if (!this.searchFilter.trim()) return this.redemptions;
    const q = this.searchFilter.toLowerCase().trim();
    return this.redemptions.filter(item =>
      (item.couponTitle && item.couponTitle.toLowerCase().includes(q)) ||
      (item.couponCode && item.couponCode.toLowerCase().includes(q)) ||
      (item.merchantName && item.merchantName.toLowerCase().includes(q))
    );
  }

  onPageChange(page: number): void {
    this.currentPage = page;
    this.loadHistory();
  }

  onPageSizeChange(size: number): void {
    this.pageSize = size;
    this.currentPage = 1;
    this.loadHistory();
  }

  browseDeals(): void {
    window.location.href = '/deals';
  }

  formatDate(dateStr?: string): string {
    if (!dateStr) return '-';
    try {
      return new Date(dateStr).toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateStr;
    }
  }
}
