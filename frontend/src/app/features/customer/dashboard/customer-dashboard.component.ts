import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { PointsService } from '../../../core/services/points.service';
import { CashbackService } from '../../../core/services/cashback.service';
import { RedemptionService } from '../../../core/services/redemption.service';
import { CouponService } from '../../../core/services/coupon.service';
import { MerchantService } from '../../../core/services/merchant.service';
import { MerchantAlertService } from '../../../core/services/merchant-alert.service';
import { CustomerTierResponse, WalletResponse, PointAccountResponse } from '../../../core/models/points-wallet.models';
import { CustomerRedemptionHistoryItem } from '../../../core/models/redemption.models';
import { CouponResponse } from '../../../core/models/coupon.models';
import { MerchantInterestResponse } from '../../../core/models/alert.models';
import { LoadingSkeletonComponent } from '../../../shared/components/loading-skeleton/loading-skeleton.component';
import { CouponCardComponent } from '../../../shared/components/coupon-card/coupon-card.component';
import { RedemptionModalComponent } from '../../../shared/components/redemption-modal/redemption-modal.component';

@Component({
  selector: 'app-customer-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    LoadingSkeletonComponent,
    CouponCardComponent,
    RedemptionModalComponent
  ],
  template: `
    <div class="dashboard-page fade-in">
      <!-- Header Greeting -->
      <div class="dashboard-header">
        <h1 class="greeting">Good day, {{ authService.currentUser()?.name }} 👋</h1>
        <p class="greeting-subtitle">Here is your rewards overview and today's trending deals.</p>
      </div>

      <!-- 4 KEY KPI CARDS -->
      <div class="kpi-grid">
        <!-- Points Card -->
        <div class="kpi-card card">
          <div class="kpi-top">
            <span class="kpi-label">Available Points</span>
            <span class="kpi-icon">⭐</span>
          </div>
          <div class="kpi-val">{{ currentPoints }}</div>
          <div class="kpi-footer">
            <a routerLink="/customer/points" class="kpi-link">Redeem for Wallet Money →</a>
          </div>
        </div>

        <!-- Wallet Card -->
        <div class="kpi-card card">
          <div class="kpi-top">
            <span class="kpi-label">Cashback Wallet</span>
            <span class="kpi-icon">💰</span>
          </div>
          <div class="kpi-val">₹{{ wallet?.balance ?? 0 | number:'1.2-2' }}</div>
          <div class="kpi-footer">
            <a routerLink="/customer/wallet" class="kpi-link">Withdraw to Bank →</a>
          </div>
        </div>

        <!-- Tier Card -->
        <div class="kpi-card card">
          <div class="kpi-top">
            <span class="kpi-label">Loyalty Tier</span>
            <span class="kpi-icon">🏆</span>
          </div>
          <div class="kpi-val">
            <span [class]="'badge badge-tier-' + (tierInfo?.tier?.toLowerCase() || 'bronze')">
              {{ tierInfo?.tier || 'BRONZE' }}
            </span>
          </div>
          <div class="kpi-footer">
            <span class="tier-hint">
              {{ tierInfo?.pointsRequiredForNextTier ? tierInfo?.pointsRequiredForNextTier + ' pts to next tier' : 'Top Tier Active' }}
            </span>
          </div>
        </div>

        <!-- Redemptions Count Card -->
        <div class="kpi-card card">
          <div class="kpi-top">
            <span class="kpi-label">Coupons Redeemed</span>
            <span class="kpi-icon">🎟️</span>
          </div>
          <div class="kpi-val">{{ totalRedemptionsCount }}</div>
          <div class="kpi-footer">
            <a routerLink="/customer/redemptions" class="kpi-link">View Full History →</a>
          </div>
        </div>
      </div>

      <!-- RECOMMENDED DEALS SECTION -->
      <section class="dash-section">
        <div class="dash-section-header">
          <h2 class="dash-section-title">Recommended Deals for You</h2>
          <a routerLink="/deals" class="kpi-link">Explore All Deals →</a>
        </div>

        @if (isLoadingDeals) {
          <app-loading-skeleton type="card"></app-loading-skeleton>
        } @else {
          <div class="dash-deals-grid">
            @for (coupon of recommendedDeals; track coupon.couponId) {
              <app-coupon-card
                [coupon]="coupon"
                [merchantName]="getMerchantName(coupon.merchantId)"
                [isClaimed]="isCouponClaimed(coupon.couponId)"
                (redeem)="openRedeemModal($event)"
              ></app-coupon-card>
            }
          </div>
        }
      </section>

      <!-- RECENT REDEMPTIONS & FOLLOWED MERCHANTS -->
      <div class="dash-split-grid">
        <!-- Recent Redemptions Table -->
        <div class="card recent-card">
          <div class="card-inner-header">
            <h3 class="card-inner-title">Recent Redemptions</h3>
            <a routerLink="/customer/redemptions" class="kpi-link">View All</a>
          </div>

          @if (recentRedemptions.length === 0) {
            <p class="empty-text">No redemptions yet. Start saving by claiming your first deal!</p>
          } @else {
            <div class="table-responsive">
              <table class="table">
                <thead>
                  <tr>
                    <th>Coupon</th>
                    <th>Saved</th>
                    <th>Points</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  @for (item of recentRedemptions; track item.redemptionId) {
                    <tr>
                      <td>
                        <strong>{{ item.couponTitle || item.couponCode }}</strong>
                        <div style="font-size: 0.75rem; color: var(--text-muted);">{{ item.merchantName }}</div>
                      </td>
                      <td style="color: var(--success-dark); font-weight: 700;">
                        ₹{{ item.discountAmount | number:'1.2-2' }}
                      </td>
                      <td>
                        <span class="points-tag">+{{ item.pointsEarned }}</span>
                      </td>
                      <td>
                        <span class="badge badge-success">{{ item.status }}</span>
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          }
        </div>

        <!-- Followed Stores Quick View -->
        <div class="card following-card">
          <div class="card-inner-header">
            <h3 class="card-inner-title">Followed Stores</h3>
            <a routerLink="/customer/following" class="kpi-link">Manage ({{ followedMerchants.length }})</a>
          </div>

          @if (followedMerchants.length === 0) {
            <p class="empty-text">
              You are not following any stores yet. Follow merchants to get instant deal drop notifications!
            </p>
            <a routerLink="/merchants" class="btn btn-outline btn-sm" style="margin-top: 1rem;">
              Browse Stores
            </a>
          } @else {
            <div class="followed-list">
              @for (item of followedMerchants.slice(0, 5); track item.id) {
                <div class="followed-row">
                  <div class="store-avatar">🏪</div>
                  <div class="store-info">
                    <span class="store-name">{{ item.merchantName }}</span>
                    <span class="store-date">Followed {{ formatDate(item.followedAt) }}</span>
                  </div>
                  <span class="badge badge-secondary">Tracked</span>
                </div>
              }
            </div>
          }
        </div>
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
    .dashboard-page {
      display: flex;
      flex-direction: column;
      gap: 2rem;
    }

    .dashboard-header {
      margin-bottom: 0.5rem;
    }

    .greeting {
      font-size: 1.875rem;
      font-weight: 800;
      color: var(--text-main);
      margin-bottom: 0.25rem;
    }

    .greeting-subtitle {
      font-size: 0.9375rem;
      color: var(--text-muted);
    }

    .kpi-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 1.25rem;
    }

    .kpi-card {
      padding: 1.25rem;
      border-radius: var(--radius-lg);
      display: flex;
      flex-direction: column;
      justify-content: space-between;
    }

    .kpi-top {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 0.5rem;
    }

    .kpi-label {
      font-size: 0.8125rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      color: var(--text-muted);
    }

    .kpi-icon {
      font-size: 1.25rem;
    }

    .kpi-val {
      font-size: 1.75rem;
      font-weight: 800;
      color: var(--text-main);
      margin-bottom: 0.75rem;
    }

    .kpi-link {
      font-size: 0.8125rem;
      font-weight: 700;
      color: var(--primary);
    }

    .tier-hint {
      font-size: 0.75rem;
      color: var(--text-muted);
    }

    .dash-section {
      display: flex;
      flex-direction: column;
      gap: 1.25rem;
    }

    .dash-section-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .dash-section-title {
      font-size: 1.25rem;
      font-weight: 800;
    }

    .dash-deals-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 1.25rem;
    }

    .dash-split-grid {
      display: grid;
      grid-template-columns: 1.3fr 0.9fr;
      gap: 1.5rem;
    }

    .recent-card, .following-card {
      padding: 1.5rem;
      border-radius: var(--radius-lg);
    }

    .card-inner-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 1rem;
      padding-bottom: 0.75rem;
      border-bottom: 1px solid var(--border);
    }

    .card-inner-title {
      font-size: 1.0625rem;
      font-weight: 800;
    }

    .empty-text {
      font-size: 0.875rem;
      color: var(--text-muted);
      padding: 1rem 0;
    }

    .points-tag {
      font-size: 0.75rem;
      font-weight: 800;
      color: #92400e;
      background: var(--warning-light);
      padding: 0.25rem 0.5rem;
      border-radius: var(--radius-full);
    }

    .followed-list {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    .followed-row {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.5rem 0;
      border-bottom: 1px solid var(--surface-alt);
    }

    .store-avatar {
      font-size: 1.5rem;
      background: var(--surface-alt);
      padding: 0.375rem;
      border-radius: var(--radius-sm);
    }

    .store-info {
      flex: 1;
      display: flex;
      flex-direction: column;
    }

    .store-name {
      font-size: 0.875rem;
      font-weight: 700;
    }

    .store-date {
      font-size: 0.75rem;
      color: var(--text-muted);
    }

    @media (max-width: 1024px) {
      .kpi-grid { grid-template-columns: repeat(2, 1fr); }
      .dash-deals-grid { grid-template-columns: repeat(2, 1fr); }
      .dash-split-grid { grid-template-columns: 1fr; }
    }

    @media (max-width: 640px) {
      .kpi-grid { grid-template-columns: 1fr; }
      .dash-deals-grid { grid-template-columns: 1fr; }
    }
  `]
})
export class CustomerDashboardComponent implements OnInit {
  readonly authService = inject(AuthService);
  private readonly pointsService = inject(PointsService);
  private readonly cashbackService = inject(CashbackService);
  private readonly redemptionService = inject(RedemptionService);
  private readonly couponService = inject(CouponService);
  private readonly merchantService = inject(MerchantService);
  private readonly alertService = inject(MerchantAlertService);
  private readonly cdr = inject(ChangeDetectorRef);

  pointsAccount: PointAccountResponse | null = null;
  wallet: WalletResponse | null = null;
  tierInfo: CustomerTierResponse | null = null;
  totalRedemptionsCount = 0;

  recommendedDeals: CouponResponse[] = [];
  recentRedemptions: CustomerRedemptionHistoryItem[] = [];
  followedMerchants: MerchantInterestResponse[] = [];
  merchantNames = new Map<number, string>();

  isLoadingDeals = true;
  isRedeemModalOpen = false;
  selectedCouponForRedemption: CouponResponse | null = null;

  ngOnInit(): void {
    this.loadMerchants();
    const customerId = this.authService.currentUserId();
    if (customerId) {
      this.loadMetrics(customerId);
    }
    this.loadDeals();
  }

  loadMerchants(): void {
    this.merchantService.getAllMerchants().subscribe({
      next: list => {
        (list || []).forEach(m => {
          this.merchantNames.set(m.merchantId, m.businessName);
        });
        this.cdr.markForCheck();
      },
      error: () => {}
    });
  }

  getMerchantName(merchantId?: number): string | undefined {
    return merchantId ? this.merchantNames.get(merchantId) : undefined;
  }

  loadMetrics(customerId: number): void {
    // 1. Points
    this.pointsService.getPointAccount(customerId).subscribe({
      next: res => {
        this.pointsAccount = res;
        this.cdr.markForCheck();
      },
      error: () => {
        this.cdr.markForCheck();
      }
    });

    // 2. Wallet
    this.cashbackService.getWallet(customerId).subscribe({
      next: res => {
        this.wallet = res;
        this.cdr.markForCheck();
      },
      error: () => {
        this.cdr.markForCheck();
      }
    });

    // 3. Tier
    this.pointsService.getCustomerTier(customerId).subscribe({
      next: res => {
        this.tierInfo = res;
        this.cdr.markForCheck();
      },
      error: () => {
        this.cdr.markForCheck();
      }
    });

    // 4. Redemptions
    this.redemptionService.getMyRedemptionHistory(0, 5, customerId).subscribe({
      next: res => {
        this.totalRedemptionsCount = res.totalElements || 0;
        this.recentRedemptions = res.content || [];
        this.cdr.markForCheck();
      },
      error: () => {
        this.cdr.markForCheck();
      }
    });

    // 5. Followed Stores
    this.alertService.getCustomerInterests(customerId).subscribe({
      next: res => {
        this.followedMerchants = res || [];
        this.cdr.markForCheck();
      },
      error: () => {
        this.cdr.markForCheck();
      }
    });
  }

  loadDeals(): void {
    this.isLoadingDeals = true;
    this.cdr.markForCheck();
    this.couponService.getActiveCoupons().subscribe({
      next: deals => {
        this.recommendedDeals = (deals || []).slice(0, 3);
        this.isLoadingDeals = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.isLoadingDeals = false;
        this.cdr.markForCheck();
      }
    });
  }

  get currentPoints(): number {
    return this.pointsAccount?.points ?? this.pointsAccount?.totalPoints ?? this.tierInfo?.totalPoints ?? 0;
  }

  openRedeemModal(coupon: CouponResponse): void {
    this.selectedCouponForRedemption = coupon;
    this.isRedeemModalOpen = true;
    this.cdr.markForCheck();
  }

  onRedeemedSuccess(res: any): void {
    const customerId = this.authService.currentUserId();
    if (customerId) {
      this.loadMetrics(customerId);
      // Wait for RabbitMQ event consumption in cashback-service, then reload metrics again
      setTimeout(() => this.loadMetrics(customerId), 800);
      setTimeout(() => this.loadMetrics(customerId), 2500);
    }
  }

  isCouponClaimed(couponId?: number): boolean {
    return couponId ? this.recentRedemptions.some(r => r.couponId === couponId) : false;
  }

  formatDate(dateStr?: string): string {
    if (!dateStr) return '';
    try {
      return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    } catch {
      return dateStr;
    }
  }
}
