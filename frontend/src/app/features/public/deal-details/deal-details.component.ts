import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { CouponService } from '../../../core/services/coupon.service';
import { MerchantService } from '../../../core/services/merchant.service';
import { MerchantAlertService } from '../../../core/services/merchant-alert.service';
import { AuthService } from '../../../core/services/auth.service';
import { RedemptionService } from '../../../core/services/redemption.service';
import { ToastService } from '../../../core/services/toast.service';
import { CouponResponse, CouponReliabilityResponse, VoteType } from '../../../core/models/coupon.models';
import { MerchantResponse } from '../../../core/models/merchant.models';
import { StatusBadgeComponent } from '../../../shared/components/status-badge/status-badge.component';
import { LoadingSkeletonComponent } from '../../../shared/components/loading-skeleton/loading-skeleton.component';
import { ErrorStateComponent } from '../../../shared/components/error-state/error-state.component';
import { RedemptionModalComponent } from '../../../shared/components/redemption-modal/redemption-modal.component';

@Component({
  selector: 'app-deal-details',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    StatusBadgeComponent,
    LoadingSkeletonComponent,
    ErrorStateComponent,
    RedemptionModalComponent
  ],
  template: `
    <div class="deal-detail-page container">
      <!-- Breadcrumb Nav -->
      <nav class="breadcrumb-nav">
        <a routerLink="/deals">← Back to All Deals</a>
      </nav>

      @if (isLoading) {
        <app-loading-skeleton type="card"></app-loading-skeleton>
      } @else if (hasError || !coupon) {
        <app-error-state
          title="Deal Not Found"
          message="We could not find the deal or it may have expired."
          (retry)="loadCoupon()"
        ></app-error-state>
      } @else {
        <div class="deal-detail-grid">
          <!-- Main Left Column -->
          <div class="detail-main card fade-in">
            <!-- Header Badges -->
            <div class="detail-badge-bar">
              <div class="badges-left">
                <span class="discount-pill">{{ coupon.discount }}% OFF</span>
                @if (coupon.cashbackPercentage && coupon.cashbackPercentage > 0) {
                  <span class="cashback-pill">+{{ coupon.cashbackPercentage }}% Extra Cashback</span>
                }
                <app-status-badge [status]="coupon.status"></app-status-badge>
              </div>
              <span class="category-tag">{{ coupon.category }}</span>
            </div>

            <!-- Title & Merchant -->
            <h1 class="deal-title">{{ coupon.title }}</h1>
            <p class="deal-description">{{ coupon.description }}</p>

            <!-- Promo Code Highlight Box -->
            <div class="code-highlight-card">
              <div class="code-info">
                <span class="code-label">PROMO CODE</span>
                <span class="code-display">{{ coupon.couponCode }}</span>
              </div>
              <button type="button" class="btn btn-primary" (click)="copyCode()">
                {{ isCopied ? '✓ Copied to Clipboard' : '📋 Copy Code' }}
              </button>
            </div>

            <!-- Key Deal Specifications Grid -->
            <div class="deal-specs-grid">
              <div class="spec-card">
                <span class="spec-label">Minimum Purchase</span>
                <span class="spec-val">₹{{ coupon.minimumPurchase }}</span>
              </div>
              <div class="spec-card">
                <span class="spec-label">Valid From</span>
                <span class="spec-val">{{ formatDate(coupon.validFrom) }}</span>
              </div>
              <div class="spec-card">
                <span class="spec-label">Valid Until</span>
                <span class="spec-val">{{ formatDate(coupon.validUntil) }}</span>
              </div>
              <div class="spec-card">
                <span class="spec-label">Usage Availability</span>
                <span class="spec-val">{{ coupon.usageCount }} / {{ coupon.usageLimit }} claimed</span>
              </div>
            </div>

            <!-- Claim Progress Bar -->
            <div class="usage-progress-container">
              <div class="progress-info">
                <span>Deal Claimed Progress</span>
                <strong>{{ getUsagePercentage() }}%</strong>
              </div>
              <div class="progress-bar-bg">
                <div class="progress-bar-fill" [style.width.%]="getUsagePercentage()"></div>
              </div>
            </div>

            <!-- CROWDSOURCED VOTING & RELIABILITY WIDGET (RULE 18) -->
            <div class="reliability-card">
              <div class="reliability-header">
                <div>
                  <h3 class="widget-title">Deal Reliability & Voting</h3>
                  @if (hasVotes()) {
                    <p class="widget-subtitle">
                      Community Confidence: <strong>{{ getReliabilityPercent() }}% verified</strong>
                    </p>
                  } @else {
                    <p class="widget-subtitle">
                      Community Confidence: <span class="badge badge-info" style="font-size: 0.75rem;">✨ New Deal (No community votes yet)</span>
                    </p>
                  }
                </div>
                <div class="stars-large">{{ getStarRating() }}</div>
              </div>

              <div class="vote-stats-bar">
                <span>👍 {{ reliability?.upvoteCount || coupon.upvoteCount || 0 }} worked</span>
                <span>•</span>
                <span>👎 {{ reliability?.downvoteCount || coupon.downvoteCount || 0 }} didn't work</span>
                <span>•</span>
                <span>Total Votes: {{ reliability?.totalVotes || coupon.totalVotes || 0 }}</span>
              </div>

              <!-- Community Voting Buttons -->
              <div class="voting-prompt">
                <p class="prompt-text">Have you used this coupon? Help the community:</p>
                <div class="voting-actions">
                  <button
                    type="button"
                    class="btn btn-outline btn-sm vote-btn"
                    [class.active-upvote]="userVote === 'UPVOTE'"
                    [disabled]="isVoting"
                    (click)="submitVote('UPVOTE')"
                  >
                    👍 Worked for me ({{ reliability?.upvoteCount ?? coupon.upvoteCount ?? 0 }})
                  </button>
                  <button
                    type="button"
                    class="btn btn-outline btn-sm vote-btn"
                    [class.active-downvote]="userVote === 'DOWNVOTE'"
                    [disabled]="isVoting"
                    (click)="submitVote('DOWNVOTE')"
                  >
                    👎 Didn't work ({{ reliability?.downvoteCount ?? coupon.downvoteCount ?? 0 }})
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- Right Sidebar Column: Merchant Info & Redemption CTA -->
          <div class="detail-sidebar">
            <!-- Redemption Action Box -->
            <div class="card action-box fade-in">
              <h3 class="action-heading">Claim this Deal</h3>
              <p class="action-desc">
                Redeem now against your order to immediately receive discount savings and earn <strong>+10 loyalty points</strong>.
              </p>

              @if (isAlreadyClaimed) {
                <a
                  routerLink="/customer/redemptions"
                  class="btn btn-secondary btn-lg"
                  style="width: 100%; margin-bottom: 0.75rem; display: block; text-align: center; text-decoration: none;"
                >
                  ✓ Claimed — View In My Redemptions →
                </a>
              } @else {
                <button
                  type="button"
                  class="btn btn-accent btn-lg"
                  style="width: 100%; margin-bottom: 0.75rem;"
                  (click)="openRedeemModal()"
                >
                  Redeem Coupon Now ⚡
                </button>
              }

              <div class="security-guarantee">
                <span>🛡️</span>
                <span>Verified by Merchant Subscription</span>
              </div>
            </div>

            <!-- Merchant Profile Card -->
            @if (merchant) {
              <div class="card merchant-card fade-in">
                <div class="merchant-card-header">
                  <div class="merchant-avatar">🏪</div>
                  <div>
                    <h4 class="merchant-name">{{ merchant.businessName }}</h4>
                    <span class="merchant-owner">Owner: {{ merchant.ownerName }}</span>
                  </div>
                </div>

                <p class="merchant-desc">{{ merchant.description || 'Verified merchant partner on Deals & Coupons Finder.' }}</p>

                <div class="merchant-details-list">
                  <div class="merchant-detail-row">
                    <span class="detail-icon">🏷️</span>
                    <span>Category: {{ merchant.category }}</span>
                  </div>
                  @if (merchant.address) {
                    <div class="merchant-detail-row">
                      <span class="detail-icon">📍</span>
                      <span>{{ merchant.address }}</span>
                    </div>
                  }
                </div>

                <!-- Follow / Unfollow Merchant Button -->
                <button
                  type="button"
                  [class]="isFollowing ? 'btn btn-secondary' : 'btn btn-outline'"
                  style="width: 100%; margin-top: 1.25rem;"
                  (click)="toggleFollow()"
                >
                  {{ isFollowing ? '✓ Following Merchant' : '+ Follow Merchant for Deal Alerts' }}
                </button>
              </div>
            }
          </div>
        </div>
      }
    </div>

    <!-- Redemption Modal -->
    <app-redemption-modal
      [isOpen]="isRedeemModalOpen"
      [coupon]="coupon"
      [isAlreadyRedeemed]="isAlreadyClaimed"
      (close)="isRedeemModalOpen = false"
      (redeemed)="onRedeemedSuccess($event)"
    ></app-redemption-modal>
  `,
  styles: [`
    .deal-detail-page {
      padding: 2rem 1rem 4rem;
    }

    .breadcrumb-nav {
      margin-bottom: 1.5rem;
    }

    .breadcrumb-nav a {
      font-size: 0.9375rem;
      font-weight: 600;
      color: var(--primary);
    }

    .deal-detail-grid {
      display: grid;
      grid-template-columns: 1fr 360px;
      gap: 2rem;
      align-items: flex-start;
    }

    .detail-main {
      padding: 2.25rem;
      border-radius: var(--radius-xl);
    }

    .detail-badge-bar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 1.25rem;
      flex-wrap: wrap;
      gap: 0.75rem;
    }

    .badges-left {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      flex-wrap: wrap;
    }

    .discount-pill {
      background: linear-gradient(135deg, #ef4444, #ea580c);
      color: white;
      font-weight: 800;
      font-size: 0.875rem;
      padding: 0.375rem 0.875rem;
      border-radius: var(--radius-full);
    }

    .cashback-pill {
      background: var(--success-light);
      color: var(--success-dark);
      font-weight: 700;
      font-size: 0.8125rem;
      padding: 0.375rem 0.75rem;
      border-radius: var(--radius-full);
      border: 1px solid #a7f3d0;
    }

    .category-tag {
      font-size: 0.8125rem;
      font-weight: 600;
      color: var(--text-muted);
      background: var(--surface-alt);
      padding: 0.375rem 0.75rem;
      border-radius: var(--radius-sm);
    }

    .deal-title {
      font-size: 2rem;
      font-weight: 800;
      color: var(--text-main);
      margin-bottom: 0.75rem;
      line-height: 1.25;
    }

    .deal-description {
      font-size: 1.0625rem;
      color: var(--text-muted);
      line-height: 1.6;
      margin-bottom: 2rem;
    }

    .code-highlight-card {
      display: flex;
      align-items: center;
      justify-content: space-between;
      background: #f8fafc;
      border: 2px dashed #cbd5e1;
      border-radius: var(--radius-lg);
      padding: 1.25rem 1.5rem;
      margin-bottom: 2rem;
      gap: 1rem;
      flex-wrap: wrap;
    }

    .code-info {
      display: flex;
      flex-direction: column;
    }

    .code-label {
      font-size: 0.75rem;
      font-weight: 800;
      color: var(--text-light);
      letter-spacing: 0.08em;
    }

    .code-display {
      font-family: monospace;
      font-size: 1.75rem;
      font-weight: 900;
      color: var(--primary-dark);
      letter-spacing: 0.05em;
    }

    .deal-specs-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 1rem;
      margin-bottom: 1.5rem;
    }

    .spec-card {
      background: var(--surface-alt);
      padding: 1rem 1.25rem;
      border-radius: var(--radius-md);
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }

    .spec-label {
      font-size: 0.75rem;
      font-weight: 700;
      text-transform: uppercase;
      color: var(--text-light);
    }

    .spec-val {
      font-size: 1rem;
      font-weight: 700;
      color: var(--text-main);
    }

    .usage-progress-container {
      margin-bottom: 2.5rem;
    }

    .progress-info {
      display: flex;
      justify-content: space-between;
      font-size: 0.8125rem;
      color: var(--text-muted);
      margin-bottom: 0.375rem;
    }

    .progress-bar-bg {
      height: 8px;
      background: #e2e8f0;
      border-radius: var(--radius-full);
      overflow: hidden;
    }

    .progress-bar-fill {
      height: 100%;
      background: linear-gradient(90deg, var(--secondary) 0%, var(--primary) 100%);
      border-radius: var(--radius-full);
      transition: width 0.5s ease;
    }

    /* Reliability Widget */
    .reliability-card {
      background: #f8fafc;
      border: 1px solid var(--border);
      border-radius: var(--radius-lg);
      padding: 1.5rem;
    }

    .reliability-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 0.75rem;
    }

    .widget-title {
      font-size: 1.125rem;
      font-weight: 800;
      color: var(--text-main);
    }

    .widget-subtitle {
      font-size: 0.875rem;
      color: var(--text-muted);
    }

    .stars-large {
      font-size: 1.5rem;
      color: #f59e0b;
    }

    .vote-stats-bar {
      display: flex;
      gap: 0.75rem;
      font-size: 0.8125rem;
      color: var(--text-muted);
      padding-bottom: 1rem;
      border-bottom: 1px solid var(--border);
      margin-bottom: 1rem;
    }

    .voting-prompt {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 1rem;
      flex-wrap: wrap;
    }

    .prompt-text {
      font-size: 0.875rem;
      color: var(--text-main);
      font-weight: 600;
    }

    .voting-actions {
      display: flex;
      gap: 0.5rem;
    }

    .vote-btn {
      padding: 0.375rem 0.75rem;
      transition: all var(--transition-fast);
    }

    .vote-btn.active-upvote {
      background: #d1fae5;
      border-color: #059669;
      color: #065f46;
      font-weight: 700;
    }

    .vote-btn.active-downvote {
      background: #fee2e2;
      border-color: #dc2626;
      color: #991b1b;
      font-weight: 700;
    }

    /* Sidebar */
    .detail-sidebar {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }

    .action-box {
      padding: 1.75rem;
      border-radius: var(--radius-xl);
      text-align: center;
    }

    .action-heading {
      font-size: 1.25rem;
      font-weight: 800;
      margin-bottom: 0.5rem;
    }

    .action-desc {
      font-size: 0.875rem;
      color: var(--text-muted);
      margin-bottom: 1.5rem;
      line-height: 1.5;
    }

    .security-guarantee {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.375rem;
      font-size: 0.75rem;
      color: var(--text-muted);
    }

    .merchant-card {
      padding: 1.75rem;
      border-radius: var(--radius-xl);
    }

    .merchant-card-header {
      display: flex;
      align-items: center;
      gap: 0.875rem;
      margin-bottom: 1rem;
    }

    .merchant-avatar {
      font-size: 2rem;
      background: var(--surface-alt);
      padding: 0.5rem;
      border-radius: var(--radius-md);
      line-height: 1;
    }

    .merchant-name {
      font-size: 1.125rem;
      font-weight: 800;
      color: var(--text-main);
    }

    .merchant-owner {
      font-size: 0.8125rem;
      color: var(--text-muted);
    }

    .merchant-desc {
      font-size: 0.875rem;
      color: var(--text-muted);
      line-height: 1.5;
      margin-bottom: 1rem;
    }

    .merchant-details-list {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      font-size: 0.8125rem;
      color: var(--text-muted);
    }

    .merchant-detail-row {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    @media (max-width: 900px) {
      .deal-detail-grid { grid-template-columns: 1fr; }
    }
  `]
})
export class DealDetailsComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly couponService = inject(CouponService);
  private readonly merchantService = inject(MerchantService);
  private readonly merchantAlertService = inject(MerchantAlertService);
  private readonly authService = inject(AuthService);
  private readonly redemptionService = inject(RedemptionService);
  private readonly toast = inject(ToastService);
  private readonly cdr = inject(ChangeDetectorRef);

  couponId!: number;
  coupon: CouponResponse | null = null;
  reliability: CouponReliabilityResponse | null = null;
  merchant: MerchantResponse | null = null;

  isLoading = true;
  hasError = false;
  isCopied = false;
  isVoting = false;
  isFollowing = false;
  isAlreadyClaimed = false;
  userVote: VoteType | null = null;

  isRedeemModalOpen = false;

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      this.couponId = Number(params['id']);
      if (this.couponId) {
        this.userVote = this.couponService.getUserVote(this.couponId);
        this.loadCoupon();
        this.checkIfClaimed();
      }
    });
  }

  checkIfClaimed(): void {
    const customerId = this.authService.currentUserId();
    if (!customerId || !this.couponId) return;
    this.redemptionService.getMyRedemptionHistory(0, 100, customerId).subscribe({
      next: res => {
        if (res && res.content) {
          this.isAlreadyClaimed = res.content.some(r => r.couponId === this.couponId);
          this.cdr.markForCheck();
        }
      },
      error: () => {}
    });
  }

  loadCoupon(): void {
    this.isLoading = true;
    this.hasError = false;
    this.cdr.markForCheck();

    this.couponService.getCouponById(this.couponId).subscribe({
      next: data => {
        this.coupon = data;
        this.isLoading = false;
        this.cdr.markForCheck();
        this.loadReliability();
        if (data.merchantId) {
          this.loadMerchant(data.merchantId);
        }
      },
      error: () => {
        this.hasError = true;
        this.isLoading = false;
        this.cdr.markForCheck();
      }
    });
  }

  loadReliability(): void {
    this.couponService.getCouponReliability(this.couponId).subscribe({
      next: rel => {
        this.reliability = rel;
        this.cdr.markForCheck();
      },
      error: () => { /* ignore */ }
    });
  }

  loadMerchant(merchantId: number): void {
    this.merchantService.getMerchantById(merchantId).subscribe({
      next: merch => {
        this.merchant = merch;
        this.cdr.markForCheck();
        this.checkIfFollowing();
      },
      error: () => { /* ignore */ }
    });
  }

  checkIfFollowing(): void {
    if (!this.authService.isAuthenticated()) return;
    this.merchantAlertService.getCustomerInterests().subscribe({
      next: interests => {
        if (interests && this.coupon?.merchantId) {
          this.isFollowing = interests.some(i => i.merchantId === this.coupon?.merchantId);
          this.cdr.markForCheck();
        }
      },
      error: () => { /* ignore */ }
    });
  }

  toggleFollow(): void {
    if (!this.authService.isAuthenticated()) {
      this.toast.info('Please log in to follow merchants and receive deal alerts.', 'Login Required');
      this.router.navigate(['/login']);
      return;
    }
    if (!this.coupon?.merchantId) return;

    if (this.isFollowing) {
      this.merchantAlertService.unfollowMerchant(this.coupon.merchantId).subscribe({
        next: () => {
          this.isFollowing = false;
          this.toast.info('Unfollowed merchant. You will no longer receive new deal alerts.');
        }
      });
    } else {
      this.merchantAlertService.followMerchant(this.coupon.merchantId).subscribe({
        next: () => {
          this.isFollowing = true;
          this.toast.success('Following merchant! You will receive alerts when new coupons are published.');
        }
      });
    }
  }

  submitVote(type: VoteType): void {
    if (!this.authService.isAuthenticated()) {
      this.toast.info('Please log in to vote on coupon reliability.', 'Login Required');
      this.router.navigate(['/login']);
      return;
    }

    this.isVoting = true;
    this.couponService.castVote(this.couponId, { voteType: type }).subscribe({
      next: res => {
        this.isVoting = false;
        this.userVote = type;
        if (res) {
          if (this.coupon) {
            if (res.upvoteCount != null) this.coupon.upvoteCount = res.upvoteCount;
            if (res.downvoteCount != null) this.coupon.downvoteCount = res.downvoteCount;
            if (res.totalVotes != null) this.coupon.totalVotes = res.totalVotes;
            if (res.reliabilityScore != null) this.coupon.reliabilityScore = res.reliabilityScore;
          }
          if (this.reliability) {
            if (res.upvoteCount != null) this.reliability.upvoteCount = res.upvoteCount;
            if (res.downvoteCount != null) this.reliability.downvoteCount = res.downvoteCount;
            if (res.totalVotes != null) this.reliability.totalVotes = res.totalVotes;
            if (res.reliabilityScore != null) this.reliability.reliabilityScore = res.reliabilityScore;
          }
        }
        this.toast.success(
          type === 'UPVOTE' ? 'Thanks! Your vote was recorded (+1 Worked).' : 'Vote recorded. Reliability score updated.',
          'Vote Submitted'
        );
        this.loadReliability();
        this.cdr.markForCheck();
      },
      error: err => {
        this.isVoting = false;
        const msg = err.error?.message || 'Only customers who have redeemed this coupon can vote (Rule 18).';
        this.toast.warning(msg, 'Voting Eligibility');
        this.cdr.markForCheck();
      }
    });
  }

  copyCode(): void {
    if (this.coupon?.couponCode) {
      navigator.clipboard.writeText(this.coupon.couponCode).then(() => {
        this.isCopied = true;
        this.toast.success(`Code ${this.coupon?.couponCode} copied!`);
        setTimeout(() => this.isCopied = false, 2500);
      });
    }
  }

  openRedeemModal(): void {
    this.isRedeemModalOpen = true;
  }

  onRedeemedSuccess(res: any): void {
    this.isAlreadyClaimed = true;
    this.loadCoupon();
    this.cdr.markForCheck();
  }

  getUsagePercentage(): number {
    if (!this.coupon?.usageLimit || this.coupon.usageLimit <= 0) return 0;
    return Math.min(100, Math.round((this.coupon.usageCount / this.coupon.usageLimit) * 100));
  }

  hasVotes(): boolean {
    const up = this.reliability?.upvoteCount ?? this.coupon?.upvoteCount ?? 0;
    const down = this.reliability?.downvoteCount ?? this.coupon?.downvoteCount ?? 0;
    return (up + down) > 0;
  }

  getReliabilityPercent(): number {
    const up = this.reliability?.upvoteCount ?? this.coupon?.upvoteCount ?? 0;
    const down = this.reliability?.downvoteCount ?? this.coupon?.downvoteCount ?? 0;
    const total = up + down;
    if (total === 0) return 100;
    return Math.round((up / total) * 100);
  }

  getStarRating(): string {
    const up = this.reliability?.upvoteCount ?? this.coupon?.upvoteCount ?? 0;
    const down = this.reliability?.downvoteCount ?? this.coupon?.downvoteCount ?? 0;
    const total = up + down;
    if (total === 0) return '☆☆☆☆☆';
    const pct = Math.round((up / total) * 100);
    if (pct >= 85) return '★★★★★';
    if (pct >= 65) return '★★★★☆';
    if (pct >= 45) return '★★★☆☆';
    if (pct >= 25) return '★★☆☆☆';
    return '★☆☆☆☆';
  }

  formatDate(dateStr?: string): string {
    if (!dateStr) return 'N/A';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    } catch {
      return dateStr;
    }
  }
}
