import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CouponService } from '../../../core/services/coupon.service';
import { MerchantService } from '../../../core/services/merchant.service';
import { CouponResponse } from '../../../core/models/coupon.models';
import { AuthService } from '../../../core/services/auth.service';
import { RedemptionService } from '../../../core/services/redemption.service';
import { CouponCardComponent } from '../../../shared/components/coupon-card/coupon-card.component';
import { LoadingSkeletonComponent } from '../../../shared/components/loading-skeleton/loading-skeleton.component';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';
import { RedemptionModalComponent } from '../../../shared/components/redemption-modal/redemption-modal.component';
import { PaginationComponent } from '../../../shared/components/pagination/pagination.component';

@Component({
  selector: 'app-deals-discovery',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    CouponCardComponent,
    LoadingSkeletonComponent,
    EmptyStateComponent,
    RedemptionModalComponent,
    PaginationComponent
  ],
  template: `
    <div class="deals-page container">
      <!-- Page Header -->
      <div class="page-header">
        <h1 class="page-title">Discover Deals & Coupons</h1>
        <p class="page-subtitle">Find verified promo codes, cashback, and exclusive savings</p>
      </div>

      <!-- Main Layout -->
      <div class="deals-layout">
        <!-- LEFT FILTER SIDEBAR (Desktop) -->
        <aside class="filter-sidebar card" [class.mobile-open]="isMobileFilterOpen">
          <div class="filter-header">
            <h3 class="filter-title">Filters</h3>
            <button type="button" class="btn-clear-filters" (click)="resetFilters()">
              Clear All
            </button>
            <button type="button" class="mobile-filter-close" (click)="isMobileFilterOpen = false">
              &times;
            </button>
          </div>

          <!-- Search Query Filter -->
          <div class="filter-group">
            <label class="filter-label">Search Keywords</label>
            <input
              type="text"
              class="form-control"
              [(ngModel)]="searchQuery"
              (ngModelChange)="applyFilters()"
              placeholder="e.g. Pizza, Shoes, 20%..."
            />
          </div>

          <!-- Categories Filter -->
          <div class="filter-group">
            <label class="filter-label">Category</label>
            <div class="radio-options">
              @for (cat of categories; track cat) {
                <label class="radio-label">
                  <input
                    type="radio"
                    name="category"
                    [value]="cat"
                    [(ngModel)]="selectedCategory"
                    (change)="applyFilters()"
                  />
                  <span>{{ cat }}</span>
                </label>
              }
            </div>
          </div>

          <!-- Minimum Discount Filter -->
          <div class="filter-group">
            <label class="filter-label">Minimum Discount</label>
            <div class="radio-options">
              <label class="radio-label">
                <input type="radio" name="minDiscount" [value]="0" [(ngModel)]="minDiscount" (change)="applyFilters()" />
                <span>Any Discount</span>
              </label>
              <label class="radio-label">
                <input type="radio" name="minDiscount" [value]="10" [(ngModel)]="minDiscount" (change)="applyFilters()" />
                <span>10% or more</span>
              </label>
              <label class="radio-label">
                <input type="radio" name="minDiscount" [value]="20" [(ngModel)]="minDiscount" (change)="applyFilters()" />
                <span>20% or more</span>
              </label>
              <!-- <label class="radio-label">
                <input type="radio" name="minDiscount" [value]="30" [(ngModel)]="minDiscount" (change)="applyFilters()" />
                <span>30% or more</span>
              </label>  -->
              <label class="radio-label">
                <input type="radio" name="minDiscount" [value]="50" [(ngModel)]="minDiscount" (change)="applyFilters()" />
                <span>50% or more</span>
              </label>
            </div>
          </div>

          <!-- Reliability Filter -->
          <div class="filter-group">
            <label class="filter-label">Reliability Score</label>
            <div class="radio-options">
              <label class="radio-label">
                <input type="radio" name="minReliability" [value]="0" [(ngModel)]="minReliability" (change)="applyFilters()" />
                <span>All Verified</span>
              </label>
              <label class="radio-label">
                <input type="radio" name="minReliability" [value]="0.7" [(ngModel)]="minReliability" (change)="applyFilters()" />
                <span>70%+ Reliable</span>
              </label>
              <label class="radio-label">
                <input type="radio" name="minReliability" [value]="0.85" [(ngModel)]="minReliability" (change)="applyFilters()" />
                <span>85%+ Highly Reliable</span>
              </label>
            </div>
          </div>

          <!-- Cashback Only Toggle -->
          <div class="filter-group">
            <label class="checkbox-label">
              <input
                type="checkbox"
                [(ngModel)]="cashbackOnly"
                (change)="applyFilters()"
              />
              <span>Includes Extra Cashback</span>
            </label>
          </div>
        </aside>

        <!-- RIGHT CONTENT: Top Bar + Coupons Grid -->
        <main class="deals-content">
          <div class="toolbar card">
            <div class="toolbar-left">
              <button
                type="button"
                class="btn btn-secondary btn-sm mobile-filter-btn"
                (click)="isMobileFilterOpen = true"
              >
                <span>⚙️</span> Filters
              </button>
              <span class="results-count">
                <strong>{{ filteredCoupons.length }}</strong> deals found
              </span>
              @if (selectedCategory !== 'All') {
                <span class="active-filter-pill">
                  {{ selectedCategory }}
                  <button type="button" (click)="selectedCategory = 'All'; applyFilters()">&times;</button>
                </span>
              }
              @if (minDiscount > 0) {
                <span class="active-filter-pill">
                  {{ minDiscount }}%+ Off
                  <button type="button" (click)="minDiscount = 0; applyFilters()">&times;</button>
                </span>
              }
            </div>

            <!-- Sort Select Dropdown -->
            <div class="toolbar-right">
              <label for="sortOrder" class="sort-label">Sort By:</label>
              <select
                id="sortOrder"
                class="form-control sort-select"
                [(ngModel)]="sortBy"
                (change)="applySort()"
              >
                <option value="smart">Smart Ranking (Wilson Score)</option>
                <option value="discount-desc">Highest Discount (%)</option>
                <option value="newest">Newest Added</option>
                <option value="expiring">Expiring Soon</option>
              </select>
            </div>
          </div>

          <!-- Coupons Grid -->
          @if (isLoading) {
            <app-loading-skeleton type="card"></app-loading-skeleton>
          } @else if (filteredCoupons.length === 0) {
            <app-empty-state
              title="No Deals Match Your Filters"
              description="Try adjusting your discount threshold, search keywords, or category filter to discover more verified deals."
              actionLabel="Clear All Filters"
              (action)="resetFilters()"
            ></app-empty-state>
          } @else {
            <div class="deals-grid">
              @for (coupon of pagedCoupons; track coupon.couponId) {
                <app-coupon-card
                  [coupon]="coupon"
                  [merchantName]="getMerchantName(coupon.merchantId)"
                  [isClaimed]="isCouponClaimed(coupon.couponId)"
                  (redeem)="openRedeemModal($event)"
                ></app-coupon-card>
              }
            </div>
            <app-pagination
              [totalItems]="filteredCoupons.length"
              [pageSize]="pageSize"
              [currentPage]="currentPage"
              [pageSizeOptions]="[6, 9, 12, 24]"
              (pageChange)="onPageChange($event)"
              (pageSizeChange)="onPageSizeChange($event)"
            ></app-pagination>
          }
        </main>
      </div>
    </div>

    <!-- Redemption Modal -->
    <app-redemption-modal
      [isOpen]="isRedeemModalOpen"
      [coupon]="selectedCouponForRedemption"
      [isAlreadyRedeemed]="isCouponClaimed(selectedCouponForRedemption?.couponId)"
      (close)="isRedeemModalOpen = false"
      (redeemed)="onRedeemedSuccess($event)"
    ></app-redemption-modal>
  `,
  styles: [`
    .deals-page {
      padding: 2.5rem 1rem 4rem;
    }

    .page-header {
      margin-bottom: 2rem;
    }

    .page-title {
      font-size: 2.25rem;
      font-weight: 800;
      color: var(--text-main);
      margin-bottom: 0.25rem;
    }

    .page-subtitle {
      font-size: 1rem;
      color: var(--text-muted);
    }

    .deals-layout {
      display: grid;
      grid-template-columns: 280px 1fr;
      gap: 2rem;
      align-items: flex-start;
    }

    .filter-sidebar {
      padding: 1.5rem;
      border-radius: var(--radius-xl);
      position: sticky;
      top: 90px;
    }

    .filter-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 1.5rem;
      padding-bottom: 0.75rem;
      border-bottom: 1px solid var(--border);
    }

    .filter-title {
      font-size: 1.125rem;
      font-weight: 800;
      color: var(--text-main);
    }

    .btn-clear-filters {
      font-size: 0.8125rem;
      font-weight: 600;
      color: var(--primary);
      background: none;
      cursor: pointer;
    }

    .mobile-filter-close {
      display: none;
      font-size: 1.5rem;
      color: var(--text-muted);
    }

    .filter-group {
      margin-bottom: 1.5rem;
    }

    .filter-label {
      display: block;
      font-size: 0.8125rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: var(--text-main);
      margin-bottom: 0.625rem;
    }

    .radio-options {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .radio-label, .checkbox-label {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.875rem;
      color: var(--text-main);
      cursor: pointer;
    }

    .toolbar {
      padding: 1rem 1.25rem;
      border-radius: var(--radius-lg);
      margin-bottom: 1.5rem;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 1rem;
      flex-wrap: wrap;
    }

    .toolbar-left {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      flex-wrap: wrap;
    }

    .mobile-filter-btn {
      display: none;
    }

    .results-count {
      font-size: 0.9375rem;
      color: var(--text-muted);
    }

    .active-filter-pill {
      display: inline-flex;
      align-items: center;
      gap: 0.375rem;
      background: var(--primary-light);
      color: var(--primary);
      font-size: 0.75rem;
      font-weight: 700;
      padding: 0.25rem 0.625rem;
      border-radius: var(--radius-full);
      border: 1px solid #bfdbfe;
    }

    .active-filter-pill button {
      font-size: 0.875rem;
      color: var(--primary);
      cursor: pointer;
      line-height: 1;
    }

    .toolbar-right {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .sort-label {
      font-size: 0.875rem;
      font-weight: 600;
      color: var(--text-muted);
      white-space: nowrap;
    }

    .sort-select {
      width: auto;
      padding: 0.375rem 0.75rem;
      font-size: 0.875rem;
    }

    .deals-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 1.5rem;
    }

    @media (max-width: 1100px) {
      .deals-grid { grid-template-columns: repeat(2, 1fr); }
    }

    @media (max-width: 860px) {
      .deals-layout { grid-template-columns: 1fr; }
      .mobile-filter-btn { display: inline-flex; }

      .filter-sidebar {
        display: none;
        position: fixed;
        inset: 0;
        z-index: 2000;
        overflow-y: auto;
        border-radius: 0;
        background: white;
      }

      .filter-sidebar.mobile-open {
        display: block;
      }

      .mobile-filter-close {
        display: block;
      }
    }

    @media (max-width: 580px) {
      .deals-grid { grid-template-columns: 1fr; }
      .page-title { font-size: 1.75rem; }
    }
  `]
})
export class DealsDiscoveryComponent implements OnInit {
  private readonly couponService = inject(CouponService);
  private readonly merchantService = inject(MerchantService);
  private readonly authService = inject(AuthService);
  private readonly redemptionService = inject(RedemptionService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly cdr = inject(ChangeDetectorRef);

  allCoupons: CouponResponse[] = [];
  filteredCoupons: CouponResponse[] = [];
  redeemedCouponIds = new Set<number>();
  merchantNames = new Map<number, string>();
  isLoading = true;

  searchQuery = '';
  merchantFilterId?: number;
  selectedCategory = 'All';
  minDiscount = 0;
  minReliability = 0;
  cashbackOnly = false;
  sortBy = 'smart';

  isMobileFilterOpen = false;

  isRedeemModalOpen = false;
  selectedCouponForRedemption: CouponResponse | null = null;

  // Pagination
  currentPage = 1;
  pageSize = 9;

  get pagedCoupons(): CouponResponse[] {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.filteredCoupons.slice(start, start + this.pageSize);
  }

  onPageChange(page: number): void {
    this.currentPage = page;
    window.scrollTo({ top: 0, behavior: 'smooth' });
    this.cdr.markForCheck();
  }

  onPageSizeChange(size: number): void {
    this.pageSize = size;
    this.currentPage = 1;
    this.cdr.markForCheck();
  }

  categories = [
    'All',
    'Food & Dining',
    'Electronics',
    'Fashion',
    'Travel',
    'Beauty & Health',
    'Grocery',
    'Entertainment'
  ];

  ngOnInit(): void {
    this.loadMerchants();
    this.loadClaimedDeals();
    this.route.queryParams.subscribe(params => {
      if (params['q']) {
        this.searchQuery = params['q'];
      }
      if (params['merchantId']) {
        this.merchantFilterId = Number(params['merchantId']);
      }
      if (params['category']) {
        this.selectedCategory = params['category'];
      }
      if (params['minDiscount']) {
        this.minDiscount = Number(params['minDiscount']);
      }
      if (params['sort']) {
        this.sortBy = params['sort'];
      }
      this.loadDeals();
    });
  }

  loadMerchants(): void {
    this.merchantService.getAllMerchants().subscribe({
      next: list => {
        this.merchantNames.clear();
        (list || []).forEach(m => {
          this.merchantNames.set(m.merchantId, m.businessName);
        });
        this.applyFilters();
        this.cdr.markForCheck();
      },
      error: () => {}
    });
  }

  getMerchantName(merchantId?: number): string | undefined {
    return merchantId ? this.merchantNames.get(merchantId) : undefined;
  }

  loadClaimedDeals(): void {
    const customerId = this.authService.currentUserId();
    if (!customerId) {
      this.redeemedCouponIds = new Set();
      this.cdr.markForCheck();
      return;
    }
    this.redemptionService.getMyRedemptionHistory(0, 100, customerId).subscribe({
      next: res => {
        if (res && res.content) {
          this.redeemedCouponIds = new Set(
            res.content.map(r => r.couponId).filter((id): id is number => id != null)
          );
          this.cdr.markForCheck();
        }
      },
      error: () => {
        this.redeemedCouponIds = new Set();
        this.cdr.markForCheck();
      }
    });
  }

  isCouponClaimed(couponId?: number): boolean {
    return couponId ? this.redeemedCouponIds.has(couponId) : false;
  }

  loadDeals(): void {
    this.isLoading = true;
    this.cdr.markForCheck();
    this.couponService.getActiveCoupons().subscribe({
      next: coupons => {
        this.allCoupons = [...(coupons || [])];
        this.applyFilters();
        this.isLoading = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.isLoading = false;
        this.cdr.markForCheck();
      }
    });
  }

  applyFilters(): void {
    let result = [...this.allCoupons];

    // Merchant ID filter (if directed from merchant profile or query param)
    if (this.merchantFilterId) {
      result = result.filter(c => c.merchantId === this.merchantFilterId);
    }

    // Search query filter (matches title, description, code, category, or merchant store name)
    if (this.searchQuery.trim()) {
      const q = this.searchQuery.toLowerCase().trim();
      result = result.filter(c => {
        const merchantName = this.merchantNames.get(c.merchantId)?.toLowerCase() || '';
        return (
          (c.title && c.title.toLowerCase().includes(q)) ||
          (c.description && c.description.toLowerCase().includes(q)) ||
          (c.couponCode && c.couponCode.toLowerCase().includes(q)) ||
          (c.category && c.category.toLowerCase().includes(q)) ||
          merchantName.includes(q)
        );
      });
    }

    // Category filter
    if (this.selectedCategory && this.selectedCategory !== 'All') {
      result = result.filter(c => c.category?.toLowerCase() === this.selectedCategory.toLowerCase());
    }

    // Minimum Discount filter
    if (this.minDiscount > 0) {
      result = result.filter(c => Number(c.discount || 0) >= this.minDiscount);
    }

    // Reliability Score filter
    if (this.minReliability > 0) {
      result = result.filter(c => {
        const total = (c.upvoteCount || 0) + (c.downvoteCount || 0);
        if (total === 0) return true;
        return ((c.upvoteCount || 0) / total) >= this.minReliability;
      });
    }

    // Cashback only
    if (this.cashbackOnly) {
      result = result.filter(c => Number(c.cashbackPercentage || 0) > 0);
    }

    this.filteredCoupons = result;
    this.currentPage = 1;
    this.applySort();
    this.cdr.markForCheck();
  }

  applySort(): void {
    if (this.sortBy === 'smart') {
      this.filteredCoupons.sort((a, b) => (b.reliabilityScore ?? 0) - (a.reliabilityScore ?? 0));
    } else if (this.sortBy === 'discount-desc') {
      this.filteredCoupons.sort((a, b) => Number(b.discount || 0) - Number(a.discount || 0));
    } else if (this.sortBy === 'newest') {
      this.filteredCoupons.sort((a, b) => (b.couponId || 0) - (a.couponId || 0));
    } else if (this.sortBy === 'expiring') {
      this.filteredCoupons.sort((a, b) => new Date(a.validUntil).getTime() - new Date(b.validUntil).getTime());
    }
  }

  resetFilters(): void {
    this.searchQuery = '';
    this.merchantFilterId = undefined;
    this.selectedCategory = 'All';
    this.minDiscount = 0;
    this.minReliability = 0;
    this.cashbackOnly = false;
    this.sortBy = 'smart';
    this.router.navigate([], { queryParams: {} });
    this.applyFilters();
    this.cdr.markForCheck();
  }

  openRedeemModal(coupon: CouponResponse): void {
    this.selectedCouponForRedemption = coupon;
    this.isRedeemModalOpen = true;
    this.cdr.markForCheck();
  }

  onRedeemedSuccess(res: any): void {
    if (res?.couponId) {
      this.redeemedCouponIds.add(res.couponId);
    }
    this.loadClaimedDeals();
    this.loadDeals();
    this.cdr.markForCheck();
  }
}
