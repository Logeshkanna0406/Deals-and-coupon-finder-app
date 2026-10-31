import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';
import { MerchantAlertService } from '../../../core/services/merchant-alert.service';
import { ToastService } from '../../../core/services/toast.service';
import { MerchantInterestResponse, AlertPreferenceResponse } from '../../../core/models/alert.models';
import { LoadingSkeletonComponent } from '../../../shared/components/loading-skeleton/loading-skeleton.component';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';
import { PaginationComponent } from '../../../shared/components/pagination/pagination.component';

@Component({
  selector: 'app-customer-following',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, LoadingSkeletonComponent, EmptyStateComponent, PaginationComponent],
  template: `
    <div class="following-page fade-in">
      <div class="page-header">
        <h1 class="page-title">Following & Deal Alerts</h1>
        <p class="page-subtitle">
          Manage the stores you follow and configure your notification channels for newly published coupons.
        </p>
      </div>

      <!-- NOTIFICATION CHANNELS SETTINGS -->
      <div class="card channel-card">
        <div class="channel-header">
          <div class="header-icon">🔔</div>
          <div>
            <h3 class="channel-title">Deal Alert Preferences</h3>
            <p class="channel-subtitle">Choose how you want to be notified when followed merchants publish new coupons</p>
          </div>
        </div>

        <div class="channel-options">
          <label class="channel-toggle">
            <input type="checkbox" [(ngModel)]="inAppEnabled" (change)="onToggleInApp()" />
            <div class="toggle-text">
              <strong>🔔 In-App Notifications</strong>
              <span>Receive banner and bell alerts inside your customer dashboard</span>
            </div>
          </label>
        </div>

        <div class="channel-footer">
          <button
            type="button"
            class="btn btn-primary btn-sm"
            [disabled]="isSavingPreferences"
            (click)="savePreferences()"
          >
            {{ isSavingPreferences ? 'Saving...' : 'Save Alert' }}
          </button>
        </div>
      </div>

      <!-- FOLLOWED MERCHANTS LIST -->
      <div class="card followed-merchants-card">
        <div class="section-title-bar">
          <div>
            <h3 class="card-title">Stores You Follow ({{ interests.length }})</h3>
            <p class="card-subtitle">Stores automatically tracked via coupon redemptions or manual follows</p>
          </div>
          <a routerLink="/merchants" class="btn btn-outline btn-sm">
            + Discover More Stores
          </a>
        </div>

        @if (isLoading) {
          <app-loading-skeleton type="card"></app-loading-skeleton>
        } @else if (interests.length === 0) {
          <app-empty-state
            title="Not Following Any Stores"
            description="When you follow merchants or redeem their coupons, they will appear here so you never miss another discount."
            actionLabel="Browse Stores"
            (action)="browseStores()"
          ></app-empty-state>
        } @else {
          <div class="merchants-grid">
            @for (item of pagedInterests; track item.id) {
              <div class="merchant-mini-card">
                <div class="merchant-icon">🏪</div>
                <div class="merchant-info">
                  <h4 class="merchant-name">{{ item.merchantName }}</h4>
                  <span class="followed-via">
                    {{ item.source === 'REDEMPTION' ? 'Tracked via Coupon Redemption' : 'Manually Followed' }}
                  </span>
                  <span class="followed-date">Since {{ formatDate(item.followedAt) }}</span>
                </div>
                <div class="merchant-actions">
                  <a
                    [routerLink]="['/deals']"
                    [queryParams]="{ q: item.merchantName, merchantId: item.merchantId }"
                    class="btn btn-secondary btn-sm"
                  >
                    View Deals
                  </a>
                  <button
                    type="button"
                    class="btn btn-outline btn-sm btn-unfollow"
                    (click)="unfollow(item.merchantId)"
                  >
                    Unfollow
                  </button>
                </div>
              </div>
            }
          </div>
          <app-pagination
            [totalItems]="interests.length"
            [pageSize]="pageSize"
            [currentPage]="currentPage"
            [pageSizeOptions]="[4, 6, 10, 20]"
            (pageChange)="onPageChange($event)"
            (pageSizeChange)="onPageSizeChange($event)"
          ></app-pagination>
        }
      </div>
    </div>
  `,
  styles: [`
    .following-page {
      display: flex;
      flex-direction: column;
      gap: 2rem;
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

    .channel-card {
      padding: 1.75rem;
      border-radius: var(--radius-xl);
    }

    .channel-header {
      display: flex;
      align-items: center;
      gap: 1rem;
      margin-bottom: 1.5rem;
    }

    .header-icon {
      font-size: 2rem;
      background: var(--surface-alt);
      padding: 0.5rem;
      border-radius: var(--radius-md);
    }

    .channel-title {
      font-size: 1.25rem;
      font-weight: 800;
      margin-bottom: 0.125rem;
    }

    .channel-subtitle {
      font-size: 0.875rem;
      color: var(--text-muted);
    }

    .channel-options {
      display: flex;
      flex-direction: column;
      gap: 1rem;
      max-width: 580px;
      margin-bottom: 1.5rem;
    }

    .channel-toggle {
      display: flex;
      align-items: flex-start;
      gap: 0.75rem;
      cursor: pointer;
      padding: 0.75rem 1rem;
      border: 1px solid var(--border);
      border-radius: var(--radius-md);
      transition: background-color var(--transition-fast);
    }

    .channel-toggle:hover {
      background-color: var(--surface-alt);
    }

    .channel-toggle input {
      margin-top: 0.25rem;
      width: 18px;
      height: 18px;
    }

    .toggle-text {
      display: flex;
      flex-direction: column;
    }

    .toggle-text strong {
      font-size: 0.9375rem;
      color: var(--text-main);
    }

    .toggle-text span {
      font-size: 0.8125rem;
      color: var(--text-muted);
    }

    .channel-footer {
      padding-top: 1rem;
      border-top: 1px solid var(--border);
    }

    .followed-merchants-card {
      padding: 1.75rem;
      border-radius: var(--radius-xl);
    }

    .section-title-bar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 1.5rem;
      gap: 1rem;
      flex-wrap: wrap;
    }

    .card-title {
      font-size: 1.25rem;
      font-weight: 800;
      margin-bottom: 0.25rem;
    }

    .card-subtitle {
      font-size: 0.875rem;
      color: var(--text-muted);
    }

    .merchants-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 1.25rem;
    }

    .merchant-mini-card {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 1.25rem;
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: var(--radius-lg);
      transition: all var(--transition-fast);
    }

    .merchant-mini-card:hover {
      box-shadow: var(--shadow-sm);
    }

    .merchant-icon {
      font-size: 1.75rem;
      background: var(--surface-alt);
      padding: 0.5rem;
      border-radius: var(--radius-md);
      line-height: 1;
    }

    .merchant-info {
      flex: 1;
      display: flex;
      flex-direction: column;
    }

    .merchant-name {
      font-size: 1rem;
      font-weight: 700;
      color: var(--text-main);
    }

    .followed-via {
      font-size: 0.75rem;
      color: var(--secondary);
      font-weight: 600;
    }

    .followed-date {
      font-size: 0.75rem;
      color: var(--text-muted);
    }

    .merchant-actions {
      display: flex;
      flex-direction: column;
      gap: 0.375rem;
    }

    .btn-unfollow:hover {
      color: var(--danger-dark);
      border-color: #fca5a5;
      background: var(--danger-light);
    }

    @media (max-width: 800px) {
      .merchants-grid { grid-template-columns: 1fr; }
    }
  `]
})
export class CustomerFollowingComponent implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly alertService = inject(MerchantAlertService);
  private readonly toast = inject(ToastService);
  private readonly cdr = inject(ChangeDetectorRef);

  interests: MerchantInterestResponse[] = [];
  isLoading = true;

  // Pagination
  currentPage = 1;
  pageSize = 6;

  get pagedInterests(): MerchantInterestResponse[] {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.interests.slice(start, start + this.pageSize);
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

  emailEnabled = false;
  smsEnabled = false;
  inAppEnabled = false;
  isSavingPreferences = false;

  ngOnInit(): void {
    this.loadInterests();
    this.loadPreferences();
  }

  loadInterests(): void {
    const customerId = this.authService.currentUserId();
    if (!customerId) {
      this.isLoading = false;
      this.cdr.markForCheck();
      return;
    }

    this.isLoading = true;
    this.cdr.markForCheck();
    this.alertService.getCustomerInterests(customerId).subscribe({
      next: res => {
        this.interests = res || [];
        this.isLoading = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.isLoading = false;
        this.cdr.markForCheck();
      }
    });
  }

  loadPreferences(): void {
    const customerId = this.authService.currentUserId();
    if (!customerId) return;

    this.alertService.getAlertPreferences(customerId).subscribe({
      next: prefs => {
        if (prefs) {
          this.emailEnabled = prefs.emailEnabled;
          this.smsEnabled = prefs.smsEnabled;
          this.inAppEnabled = prefs.inAppEnabled;
          this.cdr.markForCheck();
        }
      },
      error: () => { /* fallback */ }
    });
  }

  onToggleInApp(): void {
    this.savePreferences();
  }

  savePreferences(): void {
    const customerId = this.authService.currentUserId();
    if (!customerId) return;

    this.isSavingPreferences = true;
    this.cdr.markForCheck();
    this.alertService.updateAlertPreferences({
      customerId,
      emailEnabled: false,
      smsEnabled: false,
      inAppEnabled: this.inAppEnabled
    }).subscribe({
      next: () => {
        this.isSavingPreferences = false;
        if (this.inAppEnabled) {
          this.toast.success('In-app deal alerts enabled for followed merchants!', 'Deal Alerts ON');
        } else {
          this.toast.info('In-app deal alerts turned off.', 'Deal Alerts OFF');
        }
        this.cdr.markForCheck();
      },
      error: err => {
        this.isSavingPreferences = false;
        const msg = err.error?.message || 'Failed to update alert preferences.';
        this.toast.error(msg, 'Error');
        this.cdr.markForCheck();
      }
    });
  }

  unfollow(merchantId: number): void {
    const customerId = this.authService.currentUserId();
    if (!customerId) return;

    this.alertService.unfollowMerchant(merchantId, customerId).subscribe({
      next: () => {
        this.toast.info('Unfollowed merchant.');
        this.loadInterests();
      },
      error: () => {
        this.toast.error('Failed to unfollow merchant.');
      }
    });
  }

  browseStores(): void {
    window.location.href = '/merchants';
  }

  formatDate(dateStr?: string): string {
    if (!dateStr) return '';
    try {
      return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    } catch {
      return dateStr;
    }
  }
}
