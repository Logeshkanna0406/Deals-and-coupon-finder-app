import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { PaymentService } from '../../../core/services/payment.service';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../core/services/toast.service';
import { PaymentResponse } from '../../../core/models/payment.models';
import { StatusBadgeComponent } from '../../../shared/components/status-badge/status-badge.component';
import { LoadingSkeletonComponent } from '../../../shared/components/loading-skeleton/loading-skeleton.component';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';
import { PaginationComponent } from '../../../shared/components/pagination/pagination.component';

@Component({
  selector: 'app-merchant-payments',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, StatusBadgeComponent, LoadingSkeletonComponent, EmptyStateComponent, PaginationComponent],
  template: `
    <div class="payments-container">
      <div class="page-header">
        <div>
          <h1 class="page-title">Billing & Payment History</h1>
          <p class="page-subtitle">Track invoices, subscription payments, and official tax receipts</p>
        </div>
        <a routerLink="/merchant/subscription" class="btn btn-primary">
          <span>💎</span> View Plans & Subscribe
        </a>
      </div>

      <!-- Quick Metrics -->
      <div class="metrics-grid">
        <div class="metric-card card">
          <span class="metric-label">Total Amount Invoiced</span>
          <span class="metric-val">₹{{ totalInvoiced.toLocaleString() }}</span>
          <span class="metric-sub text-muted">All subscription transactions</span>
        </div>
        <div class="metric-card card">
          <span class="metric-label">Verified & Active</span>
          <span class="metric-val text-success">₹{{ totalVerified.toLocaleString() }}</span>
          <span class="metric-sub text-muted">{{ verifiedCount }} successful orders</span>
        </div>
        <div class="metric-card card">
          <span class="metric-label">Pending Verification</span>
          <span class="metric-val text-warning">{{ pendingCount }}</span>
          <span class="metric-sub text-muted">Awaiting admin review</span>
        </div>
      </div>

      <!-- Payments Table -->
      @if (loading) {
        <app-loading-skeleton type="table"></app-loading-skeleton>
      } @else if (payments.length === 0) {
        <app-empty-state
          icon="💳"
          title="No Billing History"
          message="You haven't initiated any subscription payments yet. Browse our plans to start publishing coupons."
          actionText="Explore Subscription Plans"
          actionLink="/merchant/subscription"
        ></app-empty-state>
      } @else {
        <div class="table-container card">
          <div class="table-header">
            <h3 class="table-title">Recent Transactions</h3>
            <span class="text-muted" style="font-size: 0.8125rem;">{{ payments.length }} transactions found</span>
          </div>

          <table class="data-table">
            <thead>
              <tr>
                <th>Reference ID</th>
                <th>Subscription ID</th>
                <th>Date & Time</th>
                <th>Method</th>
                <th>Amount</th>
                <th>Status</th>
                <th style="text-align: center;">Tax Invoice</th>
              </tr>
            </thead>
            <tbody>
              @for (p of pagedPayments; track p.paymentId) {
                <tr>
                  <td>
                    <span class="ref-badge">{{ p.transactionReference }}</span>
                  </td>
                  <td>
                    <span class="sub-id">#SUB-{{ p.subscriptionId }}</span>
                  </td>
                  <td>
                    <div class="date-cell">
                      <span>{{ p.paymentDate | date:'mediumDate' }}</span>
                      <small class="text-muted">{{ p.paymentDate | date:'shortTime' }}</small>
                    </div>
                  </td>
                  <td>
                    <span class="method-chip">{{ p.paymentMethod }}</span>
                  </td>
                  <td>
                    <span class="amount-val">₹{{ p.amount.toLocaleString() }}</span>
                  </td>
                  <td>
                    <app-status-badge [status]="p.status"></app-status-badge>
                  </td>
                  <td style="text-align: center;">
                    <button
                      type="button"
                      class="btn btn-sm btn-outline-primary btn-invoice-action"
                      (click)="openInvoice(p)"
                    >
                      📄 View Invoice
                    </button>
                  </td>
                </tr>
              }
            </tbody>
          </table>
          <app-pagination
            [totalItems]="payments.length"
            [pageSize]="pageSize"
            [currentPage]="currentPage"
            [pageSizeOptions]="[5, 10, 20, 50]"
            (pageChange)="onPageChange($event)"
            (pageSizeChange)="onPageSizeChange($event)"
          ></app-pagination>
        </div>
      }

      <!-- INVOICE DETAILED RECEIPT MODAL -->
      @if (selectedInvoice) {
        <div class="invoice-modal-backdrop fade-in" (click)="closeInvoice()">
          <div class="invoice-modal-dialog" (click)="$event.stopPropagation()">
            <!-- Modal Actions Bar -->
            <div class="modal-actions-bar no-print">
              <span class="modal-dialog-title">🧾 Payment Receipt Preview</span>
              <div class="action-btn-group">
                <button type="button" class="btn btn-sm btn-primary" (click)="printInvoice()">
                  🖨️ Print / Download Receipt
                </button>
                <button type="button" class="btn-close-modal" (click)="closeInvoice()" aria-label="Close modal">
                  ✕
                </button>
              </div>
            </div>

            <!-- Printable Invoice Paper -->
            <div id="printable-invoice-paper" class="invoice-paper">
              <!-- Invoice Header -->
              <div class="invoice-header">
                <div class="company-brand">
                  <div class="brand-logo">🏷️ Deals & Coupons Finder</div>
                  <div class="brand-subtitle">Merchant Subscription Payment Receipt</div>
                </div>

                <div class="invoice-meta-badge">
                  <div class="invoice-title-pill">RECEIPT</div>
                  <div class="meta-row">
                    <span class="meta-label">Receipt No:</span>
                    <strong class="meta-value">{{ getInvoiceNumber(selectedInvoice) }}</strong>
                  </div>
                  <div class="meta-row">
                    <span class="meta-label">Payment Date:</span>
                    <span class="meta-value">{{ selectedInvoice.paymentDate | date:'mediumDate' }}</span>
                  </div>
                  <div class="meta-row status-meta">
                    <span class="meta-label">Status:</span>
                    <span class="status-stamp" [class.verified]="selectedInvoice.status === 'VERIFIED'" [class.pending]="selectedInvoice.status !== 'VERIFIED'">
                      {{ selectedInvoice.status === 'VERIFIED' ? '✓ PAID' : '⏳ PENDING' }}
                    </span>
                  </div>
                </div>
              </div>

              <hr class="invoice-divider" />

              <!-- Billed To & Payment Details -->
              <div class="invoice-parties-grid">
                <div class="party-col">
                  <h4 class="party-heading">BILLED TO</h4>
                  <div class="party-name">{{ merchantName }}</div>
                  <div class="party-detail"><strong>Email:</strong> {{ merchantEmail }}</div>
                  <div class="party-detail"><strong>Merchant ID:</strong> #MER-{{ selectedInvoice.merchantId }}</div>
                </div>

                <div class="party-col">
                  <h4 class="party-heading">PAYMENT DETAILS</h4>
                  <div class="party-detail"><strong>Method:</strong> {{ selectedInvoice.paymentMethod }}</div>
                  <div class="party-detail"><strong>Transaction Ref:</strong> <span class="mono-text">{{ selectedInvoice.transactionReference }}</span></div>
                  <div class="party-detail"><strong>Subscription ID:</strong> #SUB-{{ selectedInvoice.subscriptionId }}</div>
                </div>
              </div>

              <!-- Line Items Table -->
              <table class="invoice-items-table">
                <thead>
                  <tr>
                    <th style="width: 50%;">Service Description</th>
                    <th style="width: 30%;">Billing Period</th>
                    <th style="width: 20%; text-align: right;">Amount (INR)</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>
                      <div class="item-name">{{ getPlanName(selectedInvoice) }}</div>
                      <div class="item-desc">Merchant Store Subscription Quota</div>
                    </td>
                    <td>
                      <div class="period-text">
                        <span>{{ selectedInvoice.paymentDate | date:'dd MMM yyyy' }} – {{ getExpiryDate(selectedInvoice.paymentDate) | date:'dd MMM yyyy' }}</span>
                        <small class="text-muted">(30 Days)</small>
                      </div>
                    </td>
                    <td style="text-align: right; font-weight: 700; font-size: 1rem;">
                      ₹{{ selectedInvoice.amount | number:'1.2-2' }}
                    </td>
                  </tr>
                </tbody>
              </table>

              <!-- Financial Breakdown -->
              <div class="invoice-totals-wrapper">
                <div class="totals-table">
                  <div class="total-row highlight-row">
                    <strong>Total Paid Amount:</strong>
                    <strong class="grand-total-val">₹{{ selectedInvoice.amount | number:'1.2-2' }}</strong>
                  </div>
                </div>
              </div>

              <!-- Note -->
              <div class="invoice-footer-section">
                <p class="receipt-note">Thank you for partnering with Deals & Coupons Finder! This is an electronically generated payment receipt.</p>
              </div>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .payments-container {
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

    .metrics-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 1rem;
    }

    .metric-card {
      display: flex;
      flex-direction: column;
      gap: 0.35rem;
      padding: 1.25rem;
      border-radius: var(--radius-lg);
    }

    .metric-label {
      font-size: 0.8125rem;
      font-weight: 600;
      color: var(--text-muted);
      margin: 0;
    }

    .metric-val {
      font-size: 1.75rem;
      font-weight: 800;
      line-height: 1.2;
      margin: 0;
    }

    .metric-sub {
      font-size: 0.75rem;
      margin: 0;
    }

    .table-container {
      overflow-x: auto;
      border-radius: var(--radius-lg);
    }

    .table-header {
      padding: 1.25rem;
      border-bottom: 1px solid var(--border);
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .table-title {
      font-size: 1.0625rem;
      font-weight: 700;
      margin: 0;
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

    .ref-badge {
      font-family: monospace;
      font-weight: 700;
      background: var(--surface-alt);
      padding: 0.25rem 0.5rem;
      border-radius: var(--radius-sm);
      border: 1px solid var(--border);
      font-size: 0.8125rem;
    }

    .sub-id {
      font-weight: 600;
      color: var(--text-muted);
    }

    .date-cell {
      display: flex;
      flex-direction: column;
      font-size: 0.8125rem;
    }

    .method-chip {
      background: var(--surface-alt);
      border: 1px solid var(--border);
      padding: 0.25rem 0.5rem;
      border-radius: 9999px;
      font-size: 0.75rem;
      font-weight: 600;
      text-transform: uppercase;
    }

    .amount-val {
      font-weight: 700;
      font-size: 0.9375rem;
      color: var(--text-main);
    }

    .btn-invoice-action {
      font-weight: 600;
      font-size: 0.8125rem;
      padding: 0.35rem 0.75rem;
      border-radius: var(--radius-md, 6px);
      cursor: pointer;
      white-space: nowrap;
    }

    /* INVOICE MODAL STYLES */
    .invoice-modal-backdrop {
      position: fixed;
      inset: 0;
      background: rgba(15, 23, 42, 0.75);
      backdrop-filter: blur(4px);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1050;
      padding: 1.5rem;
      overflow-y: auto;
    }

    .invoice-modal-dialog {
      background: #ffffff;
      border-radius: 16px;
      width: 100%;
      max-width: 820px;
      max-height: 90vh;
      overflow-y: auto;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.35);
      border: 1px solid #e2e8f0;
      display: flex;
      flex-direction: column;
    }

    .modal-actions-bar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1rem 1.5rem;
      background: #f8fafc;
      border-bottom: 1px solid #e2e8f0;
      border-radius: 16px 16px 0 0;
    }

    .modal-dialog-title {
      font-weight: 700;
      font-size: 1rem;
      color: #1e293b;
    }

    .action-btn-group {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .btn-close-modal {
      background: #e2e8f0;
      border: none;
      width: 32px;
      height: 32px;
      border-radius: 50%;
      cursor: pointer;
      font-weight: bold;
      color: #475569;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s;
    }

    .btn-close-modal:hover {
      background: #cbd5e1;
      color: #0f172a;
    }

    .invoice-paper {
      padding: 2.5rem;
      color: #1e293b;
      font-family: inherit;
      background: #ffffff;
    }

    .invoice-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 1.5rem;
    }

    .company-brand {
      max-width: 440px;
    }

    .brand-logo {
      font-size: 1.25rem;
      font-weight: 800;
      color: #1e3a8a;
    }

    .brand-subtitle {
      font-size: 0.8125rem;
      color: #64748b;
      margin-top: 0.2rem;
    }

    .invoice-meta-badge {
      text-align: right;
      min-width: 200px;
    }

    .invoice-title-pill {
      display: inline-block;
      background: #1e3a8a;
      color: #ffffff;
      font-size: 0.75rem;
      font-weight: 800;
      padding: 0.25rem 0.65rem;
      border-radius: 4px;
      letter-spacing: 0.06em;
      margin-bottom: 0.5rem;
    }

    .meta-row {
      display: flex;
      justify-content: flex-end;
      gap: 0.75rem;
      font-size: 0.8125rem;
      margin-bottom: 0.25rem;
    }

    .meta-label {
      color: #64748b;
    }

    .status-stamp {
      font-weight: 800;
      font-size: 0.75rem;
      padding: 0.15rem 0.5rem;
      border-radius: 4px;
    }

    .status-stamp.verified {
      background: #dcfce7;
      color: #166534;
      border: 1px solid #bbf7d0;
    }

    .status-stamp.pending {
      background: #fef9c3;
      color: #854d0e;
      border: 1px solid #fef08a;
    }

    .invoice-divider {
      border: none;
      border-top: 1.5px solid #e2e8f0;
      margin: 1.25rem 0;
    }

    .invoice-parties-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 2rem;
      margin-bottom: 1.5rem;
    }

    .party-heading {
      font-size: 0.6875rem;
      font-weight: 800;
      color: #64748b;
      letter-spacing: 0.06em;
      margin-bottom: 0.4rem;
      text-transform: uppercase;
    }

    .party-name {
      font-size: 1.05rem;
      font-weight: 700;
      color: #0f172a;
      margin-bottom: 0.35rem;
    }

    .party-detail {
      font-size: 0.8125rem;
      color: #334155;
      margin-bottom: 0.25rem;
    }

    .mono-text {
      font-family: monospace;
      font-weight: 600;
    }

    .invoice-items-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 1.25rem;
      font-size: 0.8125rem;
    }

    .invoice-items-table th {
      background: #f1f5f9;
      color: #334155;
      font-weight: 700;
      padding: 0.65rem 0.85rem;
      border-top: 1px solid #cbd5e1;
      border-bottom: 1px solid #cbd5e1;
      text-transform: uppercase;
      font-size: 0.6875rem;
      letter-spacing: 0.05em;
      text-align: left;
    }

    .invoice-items-table td {
      padding: 0.75rem 0.85rem;
      border-bottom: 1px solid #e2e8f0;
      vertical-align: top;
    }

    .item-name {
      font-weight: 700;
      color: #0f172a;
      font-size: 0.875rem;
    }

    .item-desc {
      font-size: 0.75rem;
      color: #64748b;
      margin-top: 0.2rem;
    }

    .period-text {
      display: flex;
      flex-direction: column;
      gap: 0.15rem;
    }

    .invoice-totals-wrapper {
      display: flex;
      justify-content: flex-end;
      margin-bottom: 1.5rem;
    }

    .totals-table {
      min-width: 280px;
    }

    .highlight-row {
      display: flex;
      justify-content: space-between;
      padding-top: 0.65rem;
      border-top: 2px solid #0f172a;
      font-size: 1rem;
      color: #0f172a;
    }

    .grand-total-val {
      color: #1e3a8a;
      font-size: 1.2rem;
      font-weight: 800;
    }

    .invoice-footer-section {
      border-top: 1px solid #e2e8f0;
      padding-top: 1rem;
      text-align: center;
    }

    .receipt-note {
      font-size: 0.75rem;
      color: #64748b;
      margin: 0;
    }

    /* Print rules for clean 1-page PDF export */
    @media print {
      @page {
        size: A4 portrait;
        margin: 15mm;
      }
      html, body {
        margin: 0 !important;
        padding: 0 !important;
        background: #ffffff !important;
        height: auto !important;
        min-height: 0 !important;
      }
      app-navbar,
      aside,
      .portal-sidebar,
      .page-header,
      .metrics-grid,
      .payments-card,
      .pagination-container,
      .no-print {
        display: none !important;
      }
      .portal-wrapper {
        display: block !important;
        padding: 0 !important;
        margin: 0 !important;
      }
      .invoice-modal-backdrop {
        position: static !important;
        background: none !important;
        padding: 0 !important;
        margin: 0 !important;
        display: block !important;
        width: 100% !important;
        height: auto !important;
      }
      .invoice-modal-dialog {
        box-shadow: none !important;
        border: none !important;
        margin: 0 !important;
        padding: 0 !important;
        max-width: 100% !important;
        width: 100% !important;
        background: none !important;
      }
      .invoice-paper {
        box-shadow: none !important;
        border: 1px solid #cbd5e1 !important;
        border-radius: 8px !important;
        padding: 24px !important;
        margin: 0 auto !important;
        max-width: 680px !important;
        page-break-inside: avoid !important;
        break-inside: avoid !important;
        page-break-after: avoid !important;
        break-after: avoid !important;
      }
    }
  `]
})
export class MerchantPaymentsComponent implements OnInit {
  private readonly paymentService = inject(PaymentService);
  private readonly authService = inject(AuthService);
  private readonly toast = inject(ToastService);
  private readonly cdr = inject(ChangeDetectorRef);

  payments: PaymentResponse[] = [];
  loading = true;

  // Invoice Modal
  selectedInvoice: PaymentResponse | null = null;

  // Pagination
  currentPage = 1;
  pageSize = 10;

  get merchantName(): string {
    const user = this.authService.currentUser();
    return user?.name || 'Verified Merchant Store';
  }

  get merchantEmail(): string {
    const user = this.authService.currentUser();
    return user?.email || 'merchant@dealsplatform.com';
  }

  get pagedPayments(): PaymentResponse[] {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.payments.slice(start, start + this.pageSize);
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
    this.loadPayments();
  }

  loadPayments(): void {
    const merchantId = this.authService.currentUserId();
    if (!merchantId) {
      this.loading = false;
      this.cdr.markForCheck();
      return;
    }

    this.loading = true;
    this.cdr.markForCheck();
    this.paymentService.getPaymentsByMerchant(merchantId).subscribe({
      next: data => {
        this.payments = [...(data || [])].sort((a, b) => {
          const dateA = a.paymentDate ? new Date(a.paymentDate).getTime() : 0;
          const dateB = b.paymentDate ? new Date(b.paymentDate).getTime() : 0;
          if (dateB !== dateA) return dateB - dateA;
          return (b.paymentId || 0) - (a.paymentId || 0);
        });
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.toast.error('Failed to load payment history');
        this.loading = false;
        this.cdr.markForCheck();
      }
    });
  }

  openInvoice(p: PaymentResponse): void {
    this.selectedInvoice = p;
    this.cdr.markForCheck();
  }

  closeInvoice(): void {
    this.selectedInvoice = null;
    this.cdr.markForCheck();
  }

  printInvoice(): void {
    const paper = document.getElementById('printable-invoice-paper');
    if (!paper) {
      window.print();
      return;
    }

    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow?.document;
    if (!doc) {
      window.print();
      return;
    }

    doc.open();
    doc.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Receipt - ${this.getInvoiceNumber(this.selectedInvoice!)}</title>
          <style>
            @page {
              size: A4 portrait;
              margin: 15mm;
            }
            * {
              box-sizing: border-box;
            }
            body {
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
              color: #1e293b;
              margin: 0;
              padding: 0;
              background: #ffffff;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
            .invoice-paper {
              width: 100%;
              max-width: 700px;
              margin: 0 auto;
              padding: 24px;
              border: 1px solid #cbd5e1;
              border-radius: 8px;
            }
            .invoice-header {
              display: flex;
              justify-content: space-between;
              align-items: flex-start;
              margin-bottom: 1rem;
            }
            .brand-logo {
              font-size: 1.25rem;
              font-weight: 800;
              color: #1e3a8a;
            }
            .brand-subtitle {
              font-size: 0.8125rem;
              color: #64748b;
              margin-top: 0.2rem;
            }
            .invoice-meta-badge {
              text-align: right;
            }
            .invoice-title-pill {
              display: inline-block;
              background: #1e3a8a;
              color: #ffffff;
              font-size: 0.75rem;
              font-weight: 800;
              padding: 0.25rem 0.65rem;
              border-radius: 4px;
              letter-spacing: 0.05em;
              margin-bottom: 0.4rem;
            }
            .meta-row {
              display: flex;
              justify-content: flex-end;
              gap: 0.75rem;
              font-size: 0.8125rem;
              margin-bottom: 0.25rem;
            }
            .meta-label {
              color: #64748b;
            }
            .status-stamp {
              font-weight: 800;
              font-size: 0.75rem;
              padding: 0.15rem 0.5rem;
              border-radius: 4px;
            }
            .status-stamp.verified {
              background: #dcfce7;
              color: #166534;
            }
            .status-stamp.pending {
              background: #fef9c3;
              color: #854d0e;
            }
            .invoice-divider {
              border: none;
              border-top: 1px solid #e2e8f0;
              margin: 1.25rem 0;
            }
            .invoice-parties-grid {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 2rem;
              margin-bottom: 1.5rem;
            }
            .party-heading {
              font-size: 0.6875rem;
              font-weight: 800;
              color: #64748b;
              letter-spacing: 0.06em;
              margin-bottom: 0.4rem;
              text-transform: uppercase;
            }
            .party-name {
              font-size: 1rem;
              font-weight: 700;
              color: #0f172a;
              margin-bottom: 0.3rem;
            }
            .party-detail {
              font-size: 0.8125rem;
              color: #334155;
              margin-bottom: 0.25rem;
            }
            .mono-text {
              font-family: monospace;
              font-weight: 600;
            }
            .invoice-items-table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 1.25rem;
              font-size: 0.8125rem;
            }
            .invoice-items-table th {
              background: #f8fafc;
              color: #334155;
              font-weight: 700;
              padding: 0.65rem 0.85rem;
              border-top: 1px solid #cbd5e1;
              border-bottom: 1px solid #cbd5e1;
              text-transform: uppercase;
              font-size: 0.6875rem;
              letter-spacing: 0.05em;
              text-align: left;
            }
            .invoice-items-table td {
              padding: 0.85rem;
              border-bottom: 1px solid #e2e8f0;
              vertical-align: top;
            }
            .item-name {
              font-weight: 700;
              color: #0f172a;
              font-size: 0.875rem;
            }
            .item-desc {
              font-size: 0.75rem;
              color: #64748b;
              margin-top: 0.2rem;
            }
            .invoice-totals-wrapper {
              display: flex;
              justify-content: flex-end;
              margin-bottom: 1.5rem;
            }
            .totals-table {
              min-width: 260px;
            }
            .highlight-row {
              display: flex;
              justify-content: space-between;
              padding-top: 0.65rem;
              border-top: 2px solid #0f172a;
              font-size: 1.05rem;
              color: #0f172a;
            }
            .grand-total-val {
              color: #1e3a8a;
              font-size: 1.15rem;
              font-weight: 800;
            }
            .invoice-footer-section {
              border-top: 1px solid #e2e8f0;
              padding-top: 1rem;
              text-align: center;
            }
            .receipt-note {
              font-size: 0.75rem;
              color: #64748b;
              margin: 0;
            }
          </style>
        </head>
        <body>
          ${paper.outerHTML}
        </body>
      </html>
    `);
    doc.close();

    iframe.contentWindow?.focus();
    setTimeout(() => {
      iframe.contentWindow?.print();
      setTimeout(() => {
        if (document.body.contains(iframe)) {
          document.body.removeChild(iframe);
        }
      }, 1500);
    }, 250);
  }

  getInvoiceNumber(p: PaymentResponse): string {
    const date = p.paymentDate ? new Date(p.paymentDate) : new Date();
    const year = isNaN(date.getFullYear()) ? 2026 : date.getFullYear();
    const idStr = String(p.paymentId || 1).padStart(6, '0');
    return `INV-${year}-${idStr}`;
  }

  getSubtotal(amount: number): number {
    return Math.round((amount / 1.18) * 100) / 100;
  }

  getCgst(amount: number): number {
    const subtotal = this.getSubtotal(amount);
    return Math.round((subtotal * 0.09) * 100) / 100;
  }

  getSgst(amount: number): number {
    const subtotal = this.getSubtotal(amount);
    return Math.round((subtotal * 0.09) * 100) / 100;
  }

  getExpiryDate(paymentDateStr?: string): Date {
    const date = paymentDateStr ? new Date(paymentDateStr) : new Date();
    const base = isNaN(date.getTime()) ? new Date() : date;
    return new Date(base.getTime() + 30 * 24 * 60 * 60 * 1000);
  }

  getPlanName(p: PaymentResponse): string {
    const amt = p.amount;
    if (amt <= 500) {
      return 'Starter Merchant Tier (10 Coupons Quota)';
    } else if (amt <= 1500) {
      return 'Growth Merchant Tier (50 Coupons Quota)';
    } else if (amt <= 3000) {
      return 'Enterprise Merchant Tier (Unlimited Deals & Priority Showcase)';
    }
    return `Merchant Subscription Tier (${p.subscriptionId})`;
  }

  getAmountInWords(num: number): string {
    const a = [
      '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten',
      'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'
    ];
    const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

    const inWords = (n: number): string => {
      if (n === 0) return '';
      if (n < 20) return a[n] + ' ';
      if (n < 100) return b[Math.floor(n / 10)] + ' ' + (n % 10 !== 0 ? a[n % 10] + ' ' : '');
      if (n < 1000) return a[Math.floor(n / 100)] + ' Hundred ' + inWords(n % 100);
      if (n < 100000) return inWords(Math.floor(n / 1000)) + 'Thousand ' + inWords(n % 1000);
      if (n < 10000000) return inWords(Math.floor(n / 100000)) + 'Lakh ' + inWords(n % 100000);
      return inWords(Math.floor(n / 10000000)) + 'Crore ' + inWords(n % 10000000);
    };

    const words = inWords(Math.floor(num)).trim();
    return words ? words + ' Rupees Only' : 'Zero Rupees Only';
  }

  get totalInvoiced(): number {
    return this.payments.reduce((sum, p) => sum + (p.amount || 0), 0);
  }

  get totalVerified(): number {
    return this.payments
      .filter(p => p.status === 'VERIFIED')
      .reduce((sum, p) => sum + (p.amount || 0), 0);
  }

  get verifiedCount(): number {
    return this.payments.filter(p => p.status === 'VERIFIED').length;
  }

  get pendingCount(): number {
    return this.payments.filter(p => p.status === 'PENDING').length;
  }
}
