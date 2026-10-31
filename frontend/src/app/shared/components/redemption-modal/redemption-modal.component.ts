import { Component, EventEmitter, Input, Output, OnChanges, SimpleChanges, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { CouponResponse } from '../../../core/models/coupon.models';
import { RedemptionService } from '../../../core/services/redemption.service';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../core/services/toast.service';
import { RedemptionResponse } from '../../../core/models/redemption.models';

@Component({
  selector: 'app-redemption-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    @if (isOpen && coupon) {
      <div class="modal-backdrop fade-in" (click)="onCancel()">
        <div class="modal-dialog" (click)="$event.stopPropagation()">
          @if (!redeemedResult) {
            <!-- Redemption Input Form -->
            <div class="modal-header">
              <div class="header-title-group">
                <span class="header-icon">🏷️</span>
                <h3 class="modal-title">Confirm Deal Redemption</h3>
              </div>
              <button class="modal-close" (click)="onCancel()">&times;</button>
            </div>

            <div class="modal-body">
              <!-- Coupon Summary Card -->
              <div class="coupon-summary">
                <div class="coupon-badge">{{ coupon.discount }}% OFF</div>
                <div class="coupon-details">
                  <h4 class="coupon-title">{{ coupon.title }}</h4>
                  <div class="code-pill">Code: <strong>{{ coupon.couponCode }}</strong></div>
                  <div class="min-spend">Minimum Purchase: ₹{{ coupon.minimumPurchase }}</div>
                </div>
              </div>

              <!-- ALREADY REDEEMED / ERROR BANNER -->
              @if (isAlreadyRedeemed && !errorMessage) {
                <div class="already-redeemed-alert already-redeemed-info fade-in">
                  <span class="alert-icon">✓</span>
                  <div class="alert-text">
                    <strong>Deal Already Claimed</strong>
                    <p>You have already successfully claimed this coupon with your account. You can view your saved voucher in My Redemptions.</p>
                  </div>
                </div>
              } @else if (errorMessage) {
                <div class="already-redeemed-alert fade-in">
                  <span class="alert-icon">⚠️</span>
                  <div class="alert-text">
                    <strong>{{ errorMessage }}</strong>
                    <p>Under platform policy, each deal can only be redeemed once per customer account.</p>
                  </div>
                </div>
              }

              <!-- Purchase Amount Input -->
              @if (!isAlreadyRedeemed && !errorMessage) {
                <div class="form-group" style="margin-top: 1.25rem;">
                  <label class="form-label" for="purchaseAmount">
                    Total Order / Purchase Amount (₹)
                  </label>
                  <div class="currency-input-wrapper">
                    <span class="currency-symbol">₹</span>
                    <input
                      id="purchaseAmount"
                      type="number"
                      min="1"
                      step="1"
                      class="form-control currency-input"
                      [(ngModel)]="purchaseAmount"
                      (input)="calculateSavings()"
                      placeholder="Enter order amount"
                    />
                  </div>
                  @if (purchaseAmount && purchaseAmount < coupon.minimumPurchase) {
                    <span class="form-text-error">
                      Order amount must be at least ₹{{ coupon.minimumPurchase }} to apply this coupon.
                    </span>
                  }
                </div>

                <!-- Live Savings Breakdown Calculation -->
                @if (purchaseAmount && purchaseAmount >= coupon.minimumPurchase) {
                  <div class="savings-breakdown fade-in">
                    <div class="calc-row">
                      <span>Order Total:</span>
                      <span>₹{{ purchaseAmount | number:'1.2-2' }}</span>
                    </div>
                    <div class="calc-row discount-row">
                      <span>Estimated Discount ({{ coupon.discount }}%):</span>
                      <span>- ₹{{ estimatedDiscount | number:'1.2-2' }}</span>
                    </div>
                    <div class="calc-row final-row">
                      <span>Final Amount to Pay:</span>
                      <span class="final-amount">₹{{ finalAmount | number:'1.2-2' }}</span>
                    </div>
                    <div class="points-reward-callout">
                      <span>✨ Loyalty Bonus:</span>
                      <strong>+10 Points</strong> will be credited to your account!
                    </div>
                  </div>
                }
              }
            </div>

            <div class="modal-footer">
              @if (isAlreadyRedeemed || errorMessage) {
                <button type="button" class="btn btn-secondary" (click)="onCancel()">
                  Close
                </button>
                <button type="button" class="btn btn-primary" (click)="viewRedemptions()">
                  View In My Redemptions →
                </button>
              } @else {
                <button type="button" class="btn btn-secondary" [disabled]="isLoading" (click)="onCancel()">
                  Cancel
                </button>
                <button
                  type="button"
                  class="btn btn-accent"
                  [disabled]="isLoading || !isValid"
                  (click)="confirmRedeem()"
                >
                  @if (isLoading) {
                    <span>Processing...</span>
                  } @else {
                    <span>Redeem Deal (Save ₹{{ estimatedDiscount | number:'1.0-0' }})</span>
                  }
                </button>
              }
            </div>
          } @else {
            <!-- Celebration Success State -->
            <div class="modal-body celebration-body text-center fade-in">
              <div class="celebration-icon">🎉</div>
              <h3 class="celebration-title">Coupon Redeemed Successfully!</h3>
              <p class="celebration-subtitle">
                You saved <strong class="saved-highlight">₹{{ redeemedResult.discountAmount | number:'1.2-2' }}</strong> on your order.
              </p>

              <div class="points-earned-card">
                <div class="points-icon">⭐</div>
                <div class="points-text">
                  <span class="points-value">+10 POINTS</span>
                  <span class="points-desc">Added to your Persistent Loyalty Balance</span>
                </div>
              </div>

              <div class="celebration-actions">
                <button class="btn btn-primary" (click)="viewRedemptions()">
                  View In Redemptions
                </button>
                <button class="btn btn-secondary" (click)="onDone()">
                  Continue Shopping
                </button>
              </div>
            </div>
          }
        </div>
      </div>
    }
  `,
  styles: [`
    .modal-backdrop {
      position: fixed;
      inset: 0;
      background-color: rgba(15, 23, 42, 0.65);
      backdrop-filter: blur(4px);
      z-index: 9999;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 1rem;
    }

    .modal-dialog {
      background: var(--surface);
      border-radius: var(--radius-xl);
      box-shadow: var(--shadow-xl);
      width: 100%;
      max-width: 480px;
      overflow: hidden;
      border: 1px solid var(--border);
    }

    .modal-header {
      padding: 1.25rem 1.5rem;
      border-bottom: 1px solid var(--border);
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .header-title-group {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .header-icon {
      font-size: 1.25rem;
    }

    .modal-title {
      font-size: 1.125rem;
      font-weight: 700;
      color: var(--text-main);
    }

    .modal-close {
      font-size: 1.5rem;
      line-height: 1;
      color: var(--text-muted);
      cursor: pointer;
    }

    .modal-body {
      padding: 1.5rem;
    }

    .coupon-summary {
      display: flex;
      gap: 1rem;
      align-items: center;
      padding: 1rem;
      background: var(--bg-main);
      border: 1px dashed var(--border);
      border-radius: var(--radius-lg);
    }

    .coupon-badge {
      background: linear-gradient(135deg, #ef4444, #ea580c);
      color: white;
      font-weight: 800;
      font-size: 1rem;
      padding: 0.75rem 1rem;
      border-radius: var(--radius-md);
      text-align: center;
      line-height: 1.1;
      white-space: nowrap;
    }

    .coupon-title {
      font-size: 0.9375rem;
      font-weight: 700;
      color: var(--text-main);
      margin-bottom: 0.25rem;
    }

    .code-pill {
      font-size: 0.8125rem;
      font-family: monospace;
      color: var(--primary);
    }

    .min-spend {
      font-size: 0.75rem;
      color: var(--text-muted);
    }

    .already-redeemed-alert {
      display: flex;
      gap: 0.75rem;
      align-items: flex-start;
      background: #fef2f2;
      border: 1px solid #fecaca;
      border-radius: var(--radius-md);
      padding: 1rem;
      margin-top: 1.25rem;
    }

    .already-redeemed-alert .alert-icon {
      font-size: 1.25rem;
      line-height: 1;
    }

    .already-redeemed-alert .alert-text strong {
      display: block;
      color: #991b1b;
      font-size: 0.9375rem;
      margin-bottom: 0.25rem;
    }

    .already-redeemed-alert .alert-text p {
      color: #b91c1c;
      font-size: 0.8125rem;
      margin: 0;
    }

    .already-redeemed-alert.already-redeemed-info {
      background: #eff6ff;
      border-color: #bfdbfe;
    }

    .already-redeemed-alert.already-redeemed-info .alert-text strong {
      color: #1e40af;
    }

    .already-redeemed-alert.already-redeemed-info .alert-text p {
      color: #3b82f6;
    }

    .currency-input-wrapper {
      position: relative;
      display: flex;
      align-items: center;
    }

    .currency-symbol {
      position: absolute;
      left: 1rem;
      font-weight: 700;
      color: var(--text-muted);
      font-size: 1.125rem;
    }

    .currency-input {
      padding-left: 2.25rem;
      font-size: 1.125rem;
      font-weight: 700;
    }

    .savings-breakdown {
      margin-top: 1.25rem;
      padding: 1rem;
      background: #f8fafc;
      border: 1px solid var(--border);
      border-radius: var(--radius-md);
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      font-size: 0.875rem;
    }

    .calc-row {
      display: flex;
      justify-content: space-between;
      color: var(--text-muted);
    }

    .discount-row {
      color: var(--accent);
      font-weight: 600;
    }

    .final-row {
      border-top: 1px solid var(--border);
      padding-top: 0.5rem;
      font-weight: 700;
      color: var(--text-main);
    }

    .final-amount {
      font-size: 1.125rem;
      color: var(--success-dark);
    }

    .points-reward-callout {
      margin-top: 0.5rem;
      padding: 0.5rem 0.75rem;
      background: var(--warning-light);
      border-radius: var(--radius-sm);
      color: #92400e;
      font-size: 0.8125rem;
      display: flex;
      align-items: center;
      gap: 0.375rem;
    }

    .modal-footer {
      padding: 1rem 1.5rem;
      background: var(--bg-main);
      border-top: 1px solid var(--border);
      display: flex;
      justify-content: flex-end;
      gap: 0.75rem;
    }

    .celebration-body {
      padding: 2.5rem 2rem;
      text-align: center;
    }

    .celebration-icon {
      font-size: 3.5rem;
      margin-bottom: 0.75rem;
    }

    .celebration-title {
      font-size: 1.375rem;
      font-weight: 800;
      color: var(--text-main);
      margin-bottom: 0.5rem;
    }

    .celebration-subtitle {
      font-size: 1rem;
      color: var(--text-muted);
      margin-bottom: 1.5rem;
    }

    .saved-highlight {
      color: var(--success);
      font-size: 1.125rem;
    }

    .points-earned-card {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.75rem;
      background: #fef3c7;
      border: 1px solid #fde68a;
      border-radius: var(--radius-lg);
      padding: 1rem;
      margin-bottom: 2rem;
    }

    .points-icon {
      font-size: 1.75rem;
    }

    .points-value {
      font-weight: 800;
      color: #b45309;
      font-size: 1.125rem;
      display: block;
    }

    .points-desc {
      font-size: 0.8125rem;
      color: #92400e;
    }

    .celebration-actions {
      display: flex;
      gap: 0.75rem;
      justify-content: center;
    }
  `]
})
export class RedemptionModalComponent implements OnChanges {
  private readonly redemptionService = inject(RedemptionService);
  private readonly authService = inject(AuthService);
  private readonly toast = inject(ToastService);
  private readonly router = inject(Router);
  private readonly cdr = inject(ChangeDetectorRef);

  @Input() isOpen = false;
  @Input() coupon: CouponResponse | null = null;
  @Input() isAlreadyRedeemed = false;
  @Output() close = new EventEmitter<void>();
  @Output() redeemed = new EventEmitter<RedemptionResponse>();

  purchaseAmount: number | null = null;
  estimatedDiscount = 0;
  finalAmount = 0;
  isLoading = false;
  errorMessage: string | null = null;
  redeemedResult: RedemptionResponse | null = null;

  ngOnChanges(changes: SimpleChanges): void {
    // Only reset form state when newly opening the modal or when a different coupon is selected
    if (changes['isOpen'] && this.isOpen) {
      this.redeemedResult = null;
      this.errorMessage = null;
      this.isLoading = false;
      if (this.coupon) {
        this.purchaseAmount = this.coupon.minimumPurchase || 500;
        this.calculateSavings();
      }
      this.cdr.markForCheck();
    } else if (changes['coupon'] && !this.redeemedResult) {
      if (this.coupon) {
        this.purchaseAmount = this.coupon.minimumPurchase || 500;
        this.calculateSavings();
      }
      this.cdr.markForCheck();
    }
  }

  get isValid(): boolean {
    if (!this.coupon || !this.purchaseAmount || this.isAlreadyRedeemed) return false;
    return this.purchaseAmount >= (this.coupon.minimumPurchase || 0);
  }

  calculateSavings(): void {
    if (!this.coupon || !this.purchaseAmount) {
      this.estimatedDiscount = 0;
      this.finalAmount = 0;
      return;
    }
    const discountPercent = Number(this.coupon.discount || 0);
    this.estimatedDiscount = (this.purchaseAmount * discountPercent) / 100;
    this.finalAmount = Math.max(0, this.purchaseAmount - this.estimatedDiscount);
  }

  confirmRedeem(): void {
    if (this.isLoading || !this.isValid || !this.coupon || this.isAlreadyRedeemed) return;

    if (!this.authService.isAuthenticated()) {
      this.toast.info('Please log in as a customer to redeem deals.', 'Login Required');
      this.onCancel();
      this.router.navigate(['/login']);
      return;
    }

    const customerId = this.authService.currentUserId();
    if (!customerId) {
      this.toast.error('Unable to verify customer identity. Please re-login.');
      return;
    }

    this.isLoading = true;
    this.errorMessage = null;
    this.cdr.markForCheck();

    this.redemptionService.redeemCoupon({
      couponId: this.coupon.couponId,
      customerId: customerId,
      purchaseAmount: this.purchaseAmount!
    }).subscribe({
      next: res => {
        this.isLoading = false;
        this.redeemedResult = res;
        this.toast.success(
          `Coupon redeemed! You saved ₹${res.discountAmount}. +10 Points added!`,
          '🎉 Deal Redeemed'
        );
        this.redeemed.emit(res);
        this.cdr.markForCheck();
      },
      error: err => {
        this.isLoading = false;
        const msg = err.error?.message || 'Failed to redeem coupon.';
        if (msg.toLowerCase().includes('already used') || msg.toLowerCase().includes('already redeemed')) {
          this.errorMessage = 'You have already redeemed this coupon!';
        } else {
          this.errorMessage = msg;
        }
        this.toast.error(msg, 'Redemption Error');
        this.cdr.markForCheck();
      }
    });
  }

  onCancel(): void {
    this.isOpen = false;
    this.redeemedResult = null;
    this.errorMessage = null;
    this.isLoading = false;
    this.close.emit();
  }

  onDone(): void {
    this.onCancel();
  }

  viewRedemptions(): void {
    this.onCancel();
    this.router.navigate(['/customer/redemptions']);
  }
}
