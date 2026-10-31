import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';
import { PointsService } from '../../../core/services/points.service';
import { NotificationService } from '../../../core/services/notification.service';
import { ToastService } from '../../../core/services/toast.service';
import {
  CustomerTierResponse,
  PointAccountResponse,
  PointTransactionResponse
} from '../../../core/models/points-wallet.models';
import { LoadingSkeletonComponent } from '../../../shared/components/loading-skeleton/loading-skeleton.component';
import { PaginationComponent } from '../../../shared/components/pagination/pagination.component';

@Component({
  selector: 'app-customer-points',
  standalone: true,
  imports: [CommonModule, FormsModule, LoadingSkeletonComponent, PaginationComponent],
  template: `
    <div class="points-page fade-in">
      <div class="page-header">
        <h1 class="page-title">Points & Loyalty Tier</h1>
        <p class="page-subtitle">
          Earn +10 Points on every deal redeemed. Convert points to real cashback wallet money anytime.
        </p>
      </div>

      <!-- TIER PROGRESS CARD -->
      <div class="card tier-hero-card">
        <div class="tier-top">
          <div class="tier-badge-group">
            <span class="tier-star">⭐</span>
            <div>
              <span class="tier-label">CURRENT STATUS</span>
              <h2 class="tier-name">{{ tierInfo?.tier || 'NO_TIER' }}</h2>
            </div>
          </div>
          <div class="points-stat">
            <span class="points-number">{{ lifetimePoints }}</span>
            <span class="points-label">LIFETIME POINTS</span>
          </div>
        </div>

        <!-- Tier Progress Bar -->
        <div class="tier-progress-section">
          <div class="progress-labels">
            <span>Progress to <strong>{{ tierInfo?.nextTier || 'MAX TIER' }}</strong></span>
            <span>
              {{ tierInfo?.pointsRequiredForNextTier ? tierInfo?.pointsRequiredForNextTier + ' pts needed' : 'Achieved Highest Tier!' }}
            </span>
          </div>
          <div class="tier-bar-bg">
            <div class="tier-bar-fill" [style.width.%]="getProgressPercent()"></div>
          </div>
          <div class="tier-milestones">
            <span [class.active-milestone]="lifetimePoints >= 100">🥉 Bronze (100)</span>
            <span [class.active-milestone]="lifetimePoints >= 200">🥈 Silver (200)</span>
            <span [class.active-milestone]="lifetimePoints >= 500">🥇 Gold (500)</span>
            <span [class.active-milestone]="lifetimePoints >= 1000">💎 Platinum (1000)</span>
          </div>
        </div>
      </div>

      <!-- REDEEM POINTS TO WALLET WIDGET -->
      <div class="card conversion-card">
        <div class="conversion-header">
          <div class="header-icon">🔄</div>
          <div>
            <h3 class="conversion-title">Convert Points to Cashback Money</h3>
            <p class="conversion-subtitle">
              Standard Platform Rate: <strong>100 Points = ₹10.00 Wallet Money</strong> • Available to Convert: <strong style="color: var(--primary);">{{ spendablePoints }} pts</strong>
            </p>
          </div>
        </div>

        <div class="conversion-body">
          <div class="form-group" style="max-width: 320px;">
            <label class="form-label" for="convertPoints">Points to Convert (Multiples of 100)</label>
            <div class="input-with-action">
              <input
                id="convertPoints"
                type="number"
                step="100"
                min="100"
                [max]="spendablePoints"
                class="form-control"
                [(ngModel)]="pointsToConvert"
                (input)="calculateWalletCredit()"
                placeholder="100, 200, 300..."
              />
              <button
                type="button"
                class="btn-max"
                [disabled]="spendablePoints < 100"
                (click)="setMaxPoints()"
              >
                Max
              </button>
            </div>
          </div>

          <div class="calc-box">
            <span class="calc-label">Wallet Balance Credited:</span>
            <span class="calc-result">+ ₹{{ estimatedWalletCredit | number:'1.2-2' }}</span>
          </div>

          <button
            type="button"
            class="btn btn-primary"
            [disabled]="!isConversionValid || isConverting"
            (click)="convertPoints()"
          >
            @if (isConverting) {
              <span>Converting...</span>
            } @else {
              <span>Convert {{ pointsToConvert || 0 }} Points → ₹{{ estimatedWalletCredit | number:'1.2-2' }}</span>
            }
          </button>
        </div>
      </div>

      <!-- POINTS TRANSACTION HISTORY -->
      <div class="card ledger-card">
        <div class="ledger-header">
          <h3 class="ledger-title">Points History Ledger</h3>
          <span class="ledger-subtitle">Audited records of points earned and converted</span>
        </div>

        @if (isLoadingTransactions) {
          <app-loading-skeleton type="table"></app-loading-skeleton>
        } @else if (transactions.length === 0) {
          <div class="empty-table text-center">
            <p>No points transactions recorded yet. Redeem your first coupon to receive +10 points!</p>
          </div>
        } @else {
          <div class="table-responsive">
            <table class="table">
              <thead>
                <tr>
                  <th>Date & Time</th>
                  <th>Transaction Type</th>
                  <th>Points</th>
                  <th>Description</th>
                  <th>Reference ID</th>
                </tr>
              </thead>
              <tbody>
                @for (tx of pagedTransactions; track (tx.id ?? tx.transactionId ?? $index)) {
                  <tr>
                    <td>{{ formatDate(tx.createdAt) }}</td>
                    <td>
                      <span [class]="tx.points > 0 ? 'badge badge-success' : 'badge badge-warning'">
                        {{ tx.type || (tx.points > 0 ? 'EARNED' : 'CONVERTED') }}
                      </span>
                    </td>
                    <td [style.color]="tx.points > 0 ? 'var(--success-dark)' : 'var(--accent)'" style="font-weight: 800;">
                      {{ tx.points > 0 ? '+' : '' }}{{ tx.points }}
                    </td>
                    <td>{{ tx.description || 'Coupon Redemption Reward' }}</td>
                    <td style="font-family: monospace; font-size: 0.8125rem;">
                      {{ tx.referenceId || '-' }}
                    </td>
                  </tr>
                }
              </tbody>
            </table>
            <app-pagination
              [totalItems]="transactions.length"
              [pageSize]="pageSize"
              [currentPage]="currentPage"
              [pageSizeOptions]="[5, 10, 20, 50]"
              (pageChange)="onPageChange($event)"
              (pageSizeChange)="onPageSizeChange($event)"
            ></app-pagination>
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    .points-page {
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

    /* Tier Hero */
    .tier-hero-card {
      padding: 2rem;
      border-radius: var(--radius-xl);
      background: linear-gradient(135deg, #1e3a8a 0%, #1e293b 100%);
      color: white;
      border: none;
    }

    .tier-top {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 2rem;
    }

    .tier-badge-group {
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .tier-star {
      font-size: 3rem;
      line-height: 1;
    }

    .tier-label {
      font-size: 0.75rem;
      font-weight: 700;
      letter-spacing: 0.08em;
      color: #93c5fd;
    }

    .tier-name {
      font-size: 2.25rem;
      font-weight: 900;
      color: white;
      letter-spacing: 0.02em;
    }

    .points-stat {
      text-align: right;
    }

    .points-number {
      font-size: 2.75rem;
      font-weight: 900;
      color: #fde047;
      display: block;
      line-height: 1;
    }

    .points-label {
      font-size: 0.75rem;
      font-weight: 700;
      letter-spacing: 0.08em;
      color: #cbd5e1;
    }

    .tier-progress-section {
      background: rgba(255, 255, 255, 0.08);
      border-radius: var(--radius-lg);
      padding: 1.25rem;
    }

    .progress-labels {
      display: flex;
      justify-content: space-between;
      font-size: 0.875rem;
      margin-bottom: 0.625rem;
      color: #e2e8f0;
    }

    .tier-bar-bg {
      height: 10px;
      background: rgba(255, 255, 255, 0.2);
      border-radius: var(--radius-full);
      overflow: hidden;
      margin-bottom: 0.875rem;
    }

    .tier-bar-fill {
      height: 100%;
      background: linear-gradient(90deg, #f59e0b, #fde047);
      border-radius: var(--radius-full);
      transition: width 0.5s ease;
    }

    .tier-milestones {
      display: flex;
      justify-content: space-between;
      font-size: 0.75rem;
      color: #94a3b8;
    }

    .active-milestone {
      color: #fde047;
      font-weight: 700;
    }

    /* Conversion Card */
    .conversion-card {
      padding: 2rem;
      border-radius: var(--radius-xl);
    }

    .conversion-header {
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

    .conversion-title {
      font-size: 1.25rem;
      font-weight: 800;
      margin-bottom: 0.125rem;
    }

    .conversion-subtitle {
      font-size: 0.875rem;
      color: var(--text-muted);
    }

    .conversion-body {
      display: flex;
      align-items: flex-end;
      gap: 1.5rem;
      flex-wrap: wrap;
    }

    .input-with-action {
      display: flex;
      position: relative;
    }

    .btn-max {
      position: absolute;
      right: 0.5rem;
      top: 50%;
      transform: translateY(-50%);
      font-size: 0.75rem;
      font-weight: 700;
      background: var(--surface-alt);
      border: 1px solid var(--border);
      padding: 0.25rem 0.5rem;
      border-radius: var(--radius-sm);
      cursor: pointer;
    }

    .calc-box {
      background: var(--bg-main);
      border: 1px solid var(--border);
      border-radius: var(--radius-md);
      padding: 0.625rem 1.25rem;
      display: flex;
      flex-direction: column;
    }

    .calc-label {
      font-size: 0.75rem;
      font-weight: 600;
      color: var(--text-muted);
    }

    .calc-result {
      font-size: 1.25rem;
      font-weight: 800;
      color: var(--success-dark);
    }

    /* Ledger */
    .ledger-card {
      padding: 2rem;
      border-radius: var(--radius-xl);
    }

    .ledger-header {
      margin-bottom: 1.25rem;
    }

    .ledger-title {
      font-size: 1.25rem;
      font-weight: 800;
      margin-bottom: 0.25rem;
    }

    .ledger-subtitle {
      font-size: 0.875rem;
      color: var(--text-muted);
    }

    .empty-table {
      padding: 2.5rem;
      color: var(--text-muted);
      font-size: 0.9375rem;
    }

    @media (max-width: 640px) {
      .tier-top { flex-direction: column; align-items: flex-start; gap: 1rem; }
      .points-stat { text-align: left; }
      .conversion-body { flex-direction: column; align-items: stretch; }
    }
  `]
})
export class CustomerPointsComponent implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly pointsService = inject(PointsService);
  private readonly notificationService = inject(NotificationService);
  private readonly toast = inject(ToastService);
  private readonly cdr = inject(ChangeDetectorRef);

  pointAccount: PointAccountResponse | null = null;
  tierInfo: CustomerTierResponse | null = null;
  transactions: PointTransactionResponse[] = [];

  pointsToConvert = 100;
  estimatedWalletCredit = 10;
  isConverting = false;
  isLoadingTransactions = true;

  // Pagination
  currentPage = 1;
  pageSize = 10;

  get pagedTransactions(): PointTransactionResponse[] {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.transactions.slice(start, start + this.pageSize);
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
    this.loadData();
  }

  get lifetimePoints(): number {
    return this.tierInfo?.totalPoints ?? 0;
  }

  get spendablePoints(): number {
    return this.pointAccount?.points ?? 0;
  }

  loadData(): void {
    const customerId = this.authService.currentUserId();
    if (!customerId) {
      this.isLoadingTransactions = false;
      this.cdr.markForCheck();
      return;
    }

    this.pointsService.getPointAccount(customerId).subscribe({
      next: res => {
        this.pointAccount = res;
        this.cdr.markForCheck();
      },
      error: () => {
        this.cdr.markForCheck();
      }
    });

    this.pointsService.getCustomerTier(customerId).subscribe({
      next: res => {
        this.tierInfo = res;
        this.cdr.markForCheck();
      },
      error: () => {
        this.cdr.markForCheck();
      }
    });

    this.isLoadingTransactions = true;
    this.cdr.markForCheck();
    this.pointsService.getPointTransactions(customerId).subscribe({
      next: res => {
        this.transactions = res || [];
        this.isLoadingTransactions = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.isLoadingTransactions = false;
        this.cdr.markForCheck();
      }
    });
  }

  get isConversionValid(): boolean {
    const available = this.spendablePoints;
    return this.pointsToConvert >= 100 && this.pointsToConvert <= available && this.pointsToConvert % 100 === 0;
  }

  calculateWalletCredit(): void {
    if (!this.pointsToConvert || this.pointsToConvert < 100) {
      this.estimatedWalletCredit = 0;
      return;
    }
    // Rate: 100 Points = ₹10
    this.estimatedWalletCredit = (this.pointsToConvert / 100) * 10;
  }

  setMaxPoints(): void {
    const available = this.spendablePoints;
    // Round down to multiple of 100
    this.pointsToConvert = Math.floor(available / 100) * 100;
    this.calculateWalletCredit();
  }

  convertPoints(): void {
    if (!this.isConversionValid) return;
    const customerId = this.authService.currentUserId();
    if (!customerId) return;

    this.isConverting = true;
    this.cdr.markForCheck();
    this.pointsService.redeemPoints({
      customerId,
      points: this.pointsToConvert
    }).subscribe({
      next: res => {
        this.isConverting = false;
        this.toast.success(
          `Converted ${res.pointsDeducted} points into ₹${res.walletCredited} wallet money!`,
          'Points Converted'
        );

        this.notificationService.createNotification({
          recipient: `customer_${customerId}@dealsplatform.com`,
          recipientType: 'CUSTOMER',
          subject: 'Points Converted to Wallet Money',
          message: `Successfully converted ${res.pointsDeducted} points into ₹${res.walletCredited} wallet balance! New wallet balance: ₹${res.newWalletBalance}.`,
          channel: 'IN_APP'
        }).subscribe({
          next: () => this.notificationService.refreshUnreadCount(),
          error: () => this.notificationService.refreshUnreadCount()
        });

        this.loadData();
        this.cdr.markForCheck();
      },
      error: err => {
        this.isConverting = false;
        const msg = err.error?.message || 'Failed to convert points.';
        this.toast.error(msg, 'Conversion Error');
        this.cdr.markForCheck();
      }
    });
  }

  getProgressPercent(): number {
    const points = this.lifetimePoints;
    if (points >= 1000) return 100;
    if (points >= 500) return 50 + ((points - 500) / 500) * 50;
    if (points >= 200) return 25 + ((points - 200) / 300) * 25;
    if (points >= 100) return 10 + ((points - 100) / 100) * 15;
    return Math.min(10, points / 10);
  }

  formatDate(dateStr?: string): string {
    if (!dateStr) return '-';
    try {
      return new Date(dateStr).toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateStr;
    }
  }
}
