import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MerchantService } from '../../../core/services/merchant.service';
import { MerchantAlertService } from '../../../core/services/merchant-alert.service';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../core/services/toast.service';
import { MerchantResponse } from '../../../core/models/merchant.models';
import { StatusBadgeComponent } from '../../../shared/components/status-badge/status-badge.component';
import { LoadingSkeletonComponent } from '../../../shared/components/loading-skeleton/loading-skeleton.component';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';
import { PaginationComponent } from '../../../shared/components/pagination/pagination.component';

@Component({
  selector: 'app-merchants-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    FormsModule,
    StatusBadgeComponent,
    LoadingSkeletonComponent,
    EmptyStateComponent,
    PaginationComponent
  ],
  template: `
    <div class="merchants-page container">
      <div class="page-header">
        <h1 class="page-title">Featured Merchants & Stores</h1>
        <p class="page-subtitle">
          Follow your favorite local and online stores to receive immediate alerts when exclusive deals and coupons drop.
        </p>

        <!-- Search Bar -->
        <div class="search-box">
          <input
            type="text"
            class="form-control"
            [(ngModel)]="searchQuery"
            (ngModelChange)="applySearch()"
            placeholder="Search stores by name, food, electronics, address..."
          />
        </div>
      </div>

      @if (isLoading) {
        <app-loading-skeleton type="card"></app-loading-skeleton>
      } @else if (filteredMerchants.length === 0) {
        <app-empty-state
          title="No Stores Found"
          description="We couldn't find any merchants matching your search criteria."
          actionLabel="Clear Search"
          (action)="searchQuery = ''; applySearch()"
        ></app-empty-state>
      } @else {
        <div class="merchants-grid">
          @for (merchant of pagedMerchants; track merchant.merchantId) {
            <div class="merchant-card card card-interactive fade-in">
              <div class="merchant-card-top">
                <div class="merchant-icon">🏪</div>
                <div class="merchant-header-info">
                  <h3 class="merchant-name">{{ merchant.businessName }}</h3>
                  <span class="merchant-category">{{ merchant.category }}</span>
                </div>
                <app-status-badge [status]="merchant.status"></app-status-badge>
              </div>

              <p class="merchant-desc">
                {{ merchant.description || 'Verified merchant partner offering deals and coupons on our platform.' }}
              </p>

              <div class="merchant-meta">
                <div class="meta-row">
                  <span>👤</span>
                  <span>Owner: {{ merchant.ownerName }}</span>
                </div>
                @if (merchant.address) {
                  <div class="meta-row">
                    <span>📍</span>
                    <span>{{ merchant.address }}</span>
                  </div>
                }
              </div>

              <div class="merchant-card-footer">
                <a
                  [routerLink]="['/deals']"
                  [queryParams]="{ q: merchant.businessName, merchantId: merchant.merchantId }"
                  class="btn btn-outline btn-sm"
                >
                  View Deals
                </a>
                <button
                  type="button"
                  [class]="isFollowing(merchant.merchantId) ? 'btn btn-secondary btn-sm' : 'btn btn-primary btn-sm'"
                  (click)="toggleFollow(merchant.merchantId)"
                >
                  {{ isFollowing(merchant.merchantId) ? '✓ Following' : '+ Follow' }}
                </button>
              </div>
            </div>
          }
        </div>
        <app-pagination
          [totalItems]="filteredMerchants.length"
          [pageSize]="pageSize"
          [currentPage]="currentPage"
          [pageSizeOptions]="[6, 9, 12, 24]"
          (pageChange)="onPageChange($event)"
          (pageSizeChange)="onPageSizeChange($event)"
        ></app-pagination>
      }
    </div>
  `,
  styles: [`
    .merchants-page {
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
      max-width: 680px;
      margin-bottom: 1.5rem;
    }

    .search-box {
      max-width: 480px;
    }

    .merchants-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 1.5rem;
    }

    .merchant-card {
      padding: 1.5rem;
      border-radius: var(--radius-xl);
      display: flex;
      flex-direction: column;
    }

    .merchant-card-top {
      display: flex;
      align-items: flex-start;
      gap: 0.875rem;
      margin-bottom: 1rem;
    }

    .merchant-icon {
      font-size: 2rem;
      background: var(--surface-alt);
      padding: 0.5rem;
      border-radius: var(--radius-md);
      line-height: 1;
    }

    .merchant-header-info {
      flex: 1;
    }

    .merchant-name {
      font-size: 1.125rem;
      font-weight: 800;
      color: var(--text-main);
      margin-bottom: 0.125rem;
    }

    .merchant-category {
      font-size: 0.75rem;
      font-weight: 600;
      color: var(--primary);
    }

    .merchant-desc {
      font-size: 0.875rem;
      color: var(--text-muted);
      line-height: 1.5;
      margin-bottom: 1.25rem;
      flex: 1;
      display: -webkit-box;
      -webkit-line-clamp: 3;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }

    .merchant-meta {
      display: flex;
      flex-direction: column;
      gap: 0.375rem;
      font-size: 0.8125rem;
      color: var(--text-muted);
      padding-top: 0.75rem;
      border-top: 1px solid var(--border);
      margin-bottom: 1.25rem;
    }

    .meta-row {
      display: flex;
      align-items: center;
      gap: 0.375rem;
    }

    .merchant-card-footer {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 0.5rem;
    }

    @media (max-width: 1024px) {
      .merchants-grid { grid-template-columns: repeat(2, 1fr); }
    }

    @media (max-width: 640px) {
      .merchants-grid { grid-template-columns: 1fr; }
    }
  `]
})
export class MerchantsListComponent implements OnInit {
  private readonly merchantService = inject(MerchantService);
  private readonly alertService = inject(MerchantAlertService);
  private readonly authService = inject(AuthService);
  private readonly toast = inject(ToastService);
  private readonly cdr = inject(ChangeDetectorRef);

  allMerchants: MerchantResponse[] = [];
  filteredMerchants: MerchantResponse[] = [];
  followingIds = new Set<number>();
  isLoading = true;
  searchQuery = '';

  // Pagination
  currentPage = 1;
  pageSize = 9;

  get pagedMerchants(): MerchantResponse[] {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.filteredMerchants.slice(start, start + this.pageSize);
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

  ngOnInit(): void {
    this.loadMerchants();
    this.loadFollows();
  }

  loadMerchants(): void {
    this.isLoading = true;
    this.cdr.markForCheck();
    this.merchantService.getAllMerchants().subscribe({
      next: data => {
        this.allMerchants = [...(data || [])];
        this.applySearch();
        this.isLoading = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.isLoading = false;
        this.cdr.markForCheck();
      }
    });
  }

  loadFollows(): void {
    if (!this.authService.isAuthenticated()) return;
    this.alertService.getCustomerInterests().subscribe({
      next: interests => {
        if (interests) {
          interests.forEach(i => this.followingIds.add(i.merchantId));
          this.cdr.markForCheck();
        }
      },
      error: () => { /* ignore */ }
    });
  }

  isFollowing(merchantId: number): boolean {
    return this.followingIds.has(merchantId);
  }

  toggleFollow(merchantId: number): void {
    if (!this.authService.isAuthenticated()) {
      this.toast.info('Please log in to follow stores and receive deals.');
      return;
    }

    if (this.isFollowing(merchantId)) {
      this.alertService.unfollowMerchant(merchantId).subscribe({
        next: () => {
          this.followingIds.delete(merchantId);
          this.toast.info('Unfollowed merchant.');
          this.cdr.markForCheck();
        }
      });
    } else {
      this.alertService.followMerchant(merchantId).subscribe({
        next: () => {
          this.followingIds.add(merchantId);
          this.toast.success('Following merchant! You will get alerts for new deals.');
          this.cdr.markForCheck();
        }
      });
    }
  }

  applySearch(): void {
    this.currentPage = 1;
    if (!this.searchQuery.trim()) {
      this.filteredMerchants = [...this.allMerchants];
      return;
    }
    const q = this.searchQuery.toLowerCase().trim();
    this.filteredMerchants = this.allMerchants.filter(m =>
      (m.businessName && m.businessName.toLowerCase().includes(q)) ||
      (m.category && m.category.toLowerCase().includes(q)) ||
      (m.description && m.description.toLowerCase().includes(q)) ||
      (m.address && m.address.toLowerCase().includes(q))
    );
  }
}
