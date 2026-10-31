import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { CashbackService } from '../../../core/services/cashback.service';
import { NotificationService } from '../../../core/services/notification.service';
import { ToastService } from '../../../core/services/toast.service';
import { WalletResponse, CashbackTransactionResponse } from '../../../core/models/points-wallet.models';
import { LoadingSkeletonComponent } from '../../../shared/components/loading-skeleton/loading-skeleton.component';
import { PaginationComponent } from '../../../shared/components/pagination/pagination.component';

@Component({
  selector: 'app-customer-wallet',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, LoadingSkeletonComponent, PaginationComponent],
  template: `
    <div class="wallet-page fade-in">
      <div class="page-header">
        <h1 class="page-title">Cashback Wallet</h1>
        <p class="page-subtitle">
          Manage your cash rewards earned from converted points and coupon cashbacks.
        </p>
      </div>

      <!-- WALLET BALANCE & WITHDRAW BANNER -->
      <div class="card wallet-hero-card">
        <div class="wallet-left">
          <span class="wallet-label">AVAILABLE CASHBACK BALANCE</span>
          <div class="wallet-amount">₹{{ wallet?.balance ?? 0 | number:'1.2-2' }}</div>
          <span class="wallet-status">✓ Ready for instant withdrawal or checkout</span>
        </div>

        <div class="wallet-right">
          <button type="button" class="btn btn-accent btn-lg" (click)="openWithdrawModal()">
            Withdraw Money 💳
          </button>
        </div>
      </div>

      <!-- WITHDRAWAL FORM MODAL / EXPANDABLE -->
      @if (isWithdrawOpen) {
        <div class="card withdraw-card fade-in">
          <div class="withdraw-header">
            <h3 class="withdraw-title">Withdraw Wallet Balance</h3>
            <button type="button" class="close-btn" (click)="isWithdrawOpen = false">&times;</button>
          </div>
          <p class="withdraw-desc">
            Transfer funds to your linked bank account or UPI ID. Balance available:
            <strong>₹{{ wallet?.balance ?? 0 | number:'1.2-2' }}</strong>.
          </p>

          <div class="withdraw-form">
            <div class="form-group">
              <label class="form-label" for="withdrawAmount">Amount to Withdraw (₹)</label>
              <div class="input-prefix-wrapper">
                <span class="prefix">₹</span>
                <input
                  id="withdrawAmount"
                  type="number"
                  min="1"
                  [max]="wallet?.balance || 0"
                  class="form-control"
                  [(ngModel)]="withdrawAmount"
                  placeholder="Enter amount"
                />
              </div>
              @if (withdrawAmount && withdrawAmount > (wallet?.balance || 0)) {
                <span class="form-text-error">
                  Amount exceeds available wallet balance (Rule 14).
                </span>
              }
            </div>

            <div class="form-group">
              <label class="form-label" for="payoutMethod">Payout Destination</label>
              <select id="payoutMethod" class="form-control" [(ngModel)]="payoutMethod">
                <option value="UPI">UPI (Google Pay / PhonePe / Paytm)</option>
                <option value="Bank">Direct Bank Transfer (NEFT / IMPS)</option>
              </select>
            </div>

            <div class="withdraw-actions">
              <button type="button" class="btn btn-secondary" (click)="isWithdrawOpen = false">
                Cancel
              </button>
              <button
                type="button"
                class="btn btn-success"
                [disabled]="!isWithdrawValid || isSubmittingWithdraw"
                (click)="submitWithdraw()"
              >
                @if (isSubmittingWithdraw) {
                  <span>Processing Transfer...</span>
                } @else {
                  <span>Confirm Withdrawal of ₹{{ withdrawAmount | number:'1.2-2' }}</span>
                }
              </button>
            </div>
          </div>
        </div>
      }

      <!-- TRANSACTIONS LEDGER -->
      <div class="card ledger-card">
        <div class="ledger-header">
          <div>
            <h3 class="ledger-title">Wallet Transactions</h3>
            <p class="ledger-subtitle">Credits from point conversions and debits from withdrawals</p>
          </div>
          <a routerLink="/customer/points" class="btn btn-outline btn-sm">
            + Convert Points
          </a>
        </div>

        @if (isLoadingTransactions) {
          <app-loading-skeleton type="table"></app-loading-skeleton>
        } @else if (transactions.length === 0) {
          <div class="empty-table text-center">
            <p>No wallet transactions yet. Convert points or redeem deals with cashback to see records here.</p>
          </div>
        } @else {
          <div class="table-responsive">
            <table class="table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Type</th>
                  <th>Amount</th>
                  <th>Reference ID</th>
                </tr>
              </thead>
              <tbody>
                @for (tx of pagedTransactions; track tx.transactionId) {
                  <tr>
                    <td>{{ formatDate(tx.createdAt) }}</td>
                    <td>
                      <span [class]="tx.type === 'CREDIT' ? 'badge badge-success' : 'badge badge-warning'">
                        {{ tx.type }}
                      </span>
                    </td>
                    <td
                      [style.color]="tx.type === 'CREDIT' ? 'var(--success-dark)' : 'var(--danger-dark)'"
                      style="font-weight: 800;"
                    >
                      {{ tx.type === 'CREDIT' ? '+' : '-' }} ₹{{ tx.amount | number:'1.2-2' }}
                    </td>
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
    .wallet-page {
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

    .wallet-hero-card {
      padding: 2.25rem;
      border-radius: var(--radius-xl);
      background: linear-gradient(135deg, #0f766e 0%, #042f2e 100%);
      color: white;
      border: none;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 1.5rem;
      flex-wrap: wrap;
    }

    .wallet-label {
      font-size: 0.75rem;
      font-weight: 700;
      letter-spacing: 0.08em;
      color: #99f6e4;
      display: block;
      margin-bottom: 0.375rem;
    }

    .wallet-amount {
      font-size: 3rem;
      font-weight: 900;
      color: white;
      line-height: 1.1;
      margin-bottom: 0.5rem;
    }

    .wallet-status {
      font-size: 0.875rem;
      color: #ccfbf1;
    }

    /* Withdraw Box */
    .withdraw-card {
      padding: 1.75rem;
      border-radius: var(--radius-xl);
      border: 1.5px solid var(--border);
    }

    .withdraw-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 0.5rem;
    }

    .withdraw-title {
      font-size: 1.25rem;
      font-weight: 800;
    }

    .close-btn {
      font-size: 1.5rem;
      cursor: pointer;
      color: var(--text-muted);
    }

    .withdraw-desc {
      font-size: 0.875rem;
      color: var(--text-muted);
      margin-bottom: 1.5rem;
    }

    .withdraw-form {
      max-width: 500px;
    }

    .input-prefix-wrapper {
      position: relative;
      display: flex;
      align-items: center;
    }

    .prefix {
      position: absolute;
      left: 1rem;
      font-weight: 700;
      color: var(--text-muted);
    }

    .input-prefix-wrapper input {
      padding-left: 2rem;
      font-size: 1.125rem;
      font-weight: 700;
    }

    .withdraw-actions {
      display: flex;
      gap: 0.75rem;
      margin-top: 1.5rem;
    }

    /* Ledger */
    .ledger-card {
      padding: 2rem;
      border-radius: var(--radius-xl);
    }

    .ledger-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 1.5rem;
      gap: 1rem;
      flex-wrap: wrap;
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
    }
  `]
})
export class CustomerWalletComponent implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly cashbackService = inject(CashbackService);
  private readonly notificationService = inject(NotificationService);
  private readonly toast = inject(ToastService);
  private readonly cdr = inject(ChangeDetectorRef);

  wallet: WalletResponse | null = null;
  transactions: CashbackTransactionResponse[] = [];
  isLoadingTransactions = true;

  // Pagination
  currentPage = 1;
  pageSize = 10;

  get pagedTransactions(): CashbackTransactionResponse[] {
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

  isWithdrawOpen = false;
  withdrawAmount: number | null = null;
  payoutMethod = 'UPI';
  isSubmittingWithdraw = false;

  ngOnInit(): void {
    this.loadWalletData();
  }

  loadWalletData(): void {
    const customerId = this.authService.currentUserId();
    if (!customerId) {
      this.isLoadingTransactions = false;
      this.cdr.markForCheck();
      return;
    }

    this.cashbackService.getWallet(customerId).subscribe({
      next: res => {
        this.wallet = res;
        this.cdr.markForCheck();
      },
      error: () => {
        this.cdr.markForCheck();
      }
    });

    this.isLoadingTransactions = true;
    this.cdr.markForCheck();
    this.cashbackService.getTransactions(customerId).subscribe({
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

  openWithdrawModal(): void {
    this.withdrawAmount = this.wallet?.balance || 0;
    this.isWithdrawOpen = true;
    this.cdr.markForCheck();
  }

  get isWithdrawValid(): boolean {
    if (!this.withdrawAmount || this.withdrawAmount <= 0) return false;
    const balance = this.wallet?.balance || 0;
    return this.withdrawAmount <= balance;
  }

  submitWithdraw(): void {
    if (!this.isWithdrawValid) return;
    const customerId = this.authService.currentUserId();
    if (!customerId) return;

    this.isSubmittingWithdraw = true;
    this.cdr.markForCheck();
    this.cashbackService.redeemCashback({
      customerId,
      amount: this.withdrawAmount!
    }).subscribe({
      next: res => {
        const withdrawnAmt = this.withdrawAmount;
        this.isSubmittingWithdraw = false;
        this.isWithdrawOpen = false;
        this.toast.success(
          `Withdrawal of ₹${withdrawnAmt} processed successfully to your ${this.payoutMethod}!`,
          'Transfer Complete'
        );

        this.notificationService.createNotification({
          recipient: `customer_${customerId}@dealsplatform.com`,
          recipientType: 'CUSTOMER',
          subject: 'Wallet Withdrawal Successful',
          message: `Successfully withdrew ₹${withdrawnAmt} from your wallet to your ${this.payoutMethod || 'Bank Account'}. Remaining wallet balance: ₹${res.balance}.`,
          channel: 'IN_APP'
        }).subscribe({
          next: () => this.notificationService.refreshUnreadCount(),
          error: () => this.notificationService.refreshUnreadCount()
        });

        this.loadWalletData();
        this.cdr.markForCheck();
      },
      error: err => {
        this.isSubmittingWithdraw = false;
        const msg = err.error?.message || 'Withdrawal failed. Please check available balance.';
        this.toast.error(msg, 'Withdrawal Error');
        this.cdr.markForCheck();
      }
    });
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
