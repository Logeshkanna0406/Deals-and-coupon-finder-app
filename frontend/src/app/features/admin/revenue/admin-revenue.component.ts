import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminService } from '../../../core/services/admin.service';
import { ToastService } from '../../../core/services/toast.service';
import {
  RevenueResponse,
  PlatformMerchantRevenueResponse,
  MerchantRevenueItemDto,
  SpecificMerchantRevenueResponse,
  PaymentResponse
} from '../../../core/models/payment.models';
import { LoadingSkeletonComponent } from '../../../shared/components/loading-skeleton/loading-skeleton.component';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';

@Component({
  selector: 'app-admin-revenue',
  standalone: true,
  imports: [CommonModule, FormsModule, LoadingSkeletonComponent, EmptyStateComponent],
  template: `
    <div class="admin-revenue">
      <div class="page-header">
        <div>
          <h1 class="page-title">Platform Revenue & Financial Intelligence</h1>
          <p class="page-subtitle">Track subscription income, revenue share by merchant, and financial transaction velocity</p>
        </div>
      </div>

      <!-- Date Range Filter Bar (Rule 23 & 24) -->
      <div class="filter-card card">
        <div class="filter-headline">
          <span class="filter-icon">📅</span>
          <strong>Date Range Filter (Rule 23 & 24 Compliant)</strong>
        </div>

        <div class="filter-controls">
          <div class="quick-presets">
            <button
              type="button"
              class="preset-btn"
              [class.active]="selectedPreset === 'ALL'"
              (click)="applyPreset('ALL')"
            >
              All Time
            </button>
            <button
              type="button"
              class="preset-btn"
              [class.active]="selectedPreset === '30D'"
              (click)="applyPreset('30D')"
            >
              Last 30 Days
            </button>
            <button
              type="button"
              class="preset-btn"
              [class.active]="selectedPreset === '90D'"
              (click)="applyPreset('90D')"
            >
              Last 90 Days
            </button>
            <button
              type="button"
              class="preset-btn"
              [class.active]="selectedPreset === 'YTD'"
              (click)="applyPreset('YTD')"
            >
              Year to Date
            </button>
          </div>

          <div class="custom-dates">
            <div class="date-input-group">
              <label for="fromDate" class="date-label">From Date:</label>
              <input
                id="fromDate"
                type="date"
                class="form-control"
                [(ngModel)]="fromDate"
                (change)="selectedPreset = 'CUSTOM'"
              />
            </div>
            <div class="date-input-group">
              <label for="toDate" class="date-label">To Date:</label>
              <input
                id="toDate"
                type="date"
                class="form-control"
                [(ngModel)]="toDate"
                (change)="selectedPreset = 'CUSTOM'"
              />
            </div>
            <button
              type="button"
              class="btn btn-primary btn-sm"
              style="align-self: flex-end;"
              (click)="fetchRevenueData()"
            >
              Filter Revenue
            </button>
          </div>
        </div>
      </div>

      <!-- KPI Summary Cards -->
      @if (loading) {
        <app-loading-skeleton type="card"></app-loading-skeleton>
      } @else {
        <div class="metrics-grid">
          <div class="metric-card card">
            <span class="metric-label">Total Platform Revenue</span>
            <span class="metric-val text-primary">₹{{ (revenue?.totalRevenue || 0).toLocaleString() }}</span>
            <span class="metric-sub text-muted">Verified subscription settlements</span>
          </div>

          <div class="metric-card card">
            <span class="metric-label">Verified Transactions</span>
            <span class="metric-val text-success">{{ revenue?.totalVerifiedTransactions || 0 }}</span>
            <span class="metric-sub text-muted">Successful orders</span>
          </div>

          <div class="metric-card card">
            <span class="metric-label">Active Paying Merchants</span>
            <span class="metric-val">{{ merchantSummary?.merchants?.length || 0 }}</span>
            <span class="metric-sub text-muted">With at least 1 payment</span>
          </div>

          <div class="metric-card card">
            <span class="metric-label">Avg Revenue Per Merchant</span>
            <span class="metric-val">₹{{ averageRevenuePerMerchant.toLocaleString() }}</span>
            <span class="metric-sub text-muted">Platform ARPU</span>
          </div>
        </div>

        <!-- Merchant Revenue Breakdown Table -->
        <div class="breakdown-section card">
          <div class="table-header">
            <div>
              <h3 class="table-title">Merchant Revenue Contribution Leaderboard</h3>
              <p class="table-desc text-muted">Individual business billing totals and transaction volumes</p>
            </div>
          </div>

          @if (!merchantSummary?.merchants || merchantSummary!.merchants.length === 0) {
            <app-empty-state
              icon="📊"
              title="No Merchant Billing in this Period"
              message="No verified transactions recorded within the chosen date boundaries."
            ></app-empty-state>
          } @else {
            <div class="table-responsive">
              <table class="data-table">
                <thead>
                  <tr>
                    <th>Merchant Partner</th>
                    <th>Successful Invoices</th>
                    <th>Gross Volume</th>
                    <th>Share of Platform Revenue</th>
                    <th style="text-align: right;">Detail Drilldown</th>
                  </tr>
                </thead>
                <tbody>
                  @for (m of merchantSummary!.merchants; track m.merchantId) {
                    <tr>
                      <td>
                        <div class="merchant-cell">
                          <strong>{{ m.merchantName }}</strong>
                          <span class="id-tag text-muted">ID: #{{ m.merchantId }}</span>
                        </div>
                      </td>
                      <td>
                        <span class="count-badge">{{ m.successfulPayments }} paid orders</span>
                      </td>
                      <td>
                        <strong class="revenue-val">₹{{ m.totalRevenue.toLocaleString() }}</strong>
                      </td>
                      <td>
                        <div class="share-cell">
                          <div class="share-bar-bg">
                            <div
                              class="share-bar-fill"
                              [style.width.%]="calculateShare(m.totalRevenue)"
                            ></div>
                          </div>
                          <span class="share-text">{{ calculateShare(m.totalRevenue).toFixed(1) }}%</span>
                        </div>
                      </td>
                      <td style="text-align: right;">
                        <button
                          type="button"
                          class="btn btn-secondary btn-sm"
                          (click)="openDrilldown(m)"
                        >
                          View Invoices →
                        </button>
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          }
        </div>
      }

      <!-- Specific Merchant Drilldown Modal -->
      @if (drilldownMerchant) {
        <div class="modal-backdrop fade-in" (click)="closeDrilldown()">
          <div class="modal-box modal-box-lg card scale-up" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <div>
                <h3 class="modal-title">🧾 Invoices: {{ drilldownMerchant.merchantName }}</h3>
                <span class="text-muted">Merchant ID #{{ drilldownMerchant.merchantId }} — Settled Subscription Invoices & Billing Records</span>
              </div>
              <button type="button" class="btn-close" (click)="closeDrilldown()">✕</button>
            </div>

            @if (loadingDrilldown) {
              <app-loading-skeleton type="table"></app-loading-skeleton>
            } @else {
              <div class="drilldown-kpis">
                <div class="drill-kpi">
                  <span class="kpi-label">Total Platform Revenue</span>
                  <span class="kpi-val text-primary">₹{{ (drilldownDetails?.totalRevenue || 0).toLocaleString() }}</span>
                </div>
                <div class="drill-kpi">
                  <span class="kpi-label">Paid Invoices</span>
                  <span class="kpi-val text-success">{{ drilldownDetails?.successfulPayments || 0 }} paid orders</span>
                </div>
                <div class="drill-kpi">
                  <span class="kpi-label">Avg Transaction Value</span>
                  <span class="kpi-val">₹{{ getMerchantAov().toLocaleString() }}</span>
                </div>
              </div>

              @if (drilldownDetails?.payments && drilldownDetails!.payments!.length > 0) {
                <div class="table-responsive" style="margin-top: 1.25rem; max-height: 380px; overflow-y: auto;">
                  <table class="data-table simple-table">
                    <thead>
                      <tr>
                        <th>Invoice No</th>
                        <th>Plan & Quota</th>
                        <th>Gateway Ref</th>
                        <th>Billing Window</th>
                        <th>Amount</th>
                        <th>Status</th>
                        <th style="text-align: right;">Receipt</th>
                      </tr>
                    </thead>
                    <tbody>
                      @for (p of drilldownDetails!.payments; track p.paymentId) {
                        <tr>
                          <td>
                            <span class="invoice-num-tag">{{ getInvoiceNumber(p) }}</span>
                          </td>
                          <td>
                            <strong class="plan-name-text">{{ getPlanName(p) }}</strong>
                            <small class="text-muted" style="display: block;">Sub ID #{{ p.subscriptionId }}</small>
                          </td>
                          <td>
                            <code class="ref-code">{{ p.transactionReference }}</code>
                            <small class="text-muted" style="display: block;">{{ p.paymentMethod }}</small>
                          </td>
                          <td>
                            <div class="period-text">
                              <span>{{ p.paymentDate | date:'dd MMM yyyy' }}</span>
                              <small class="text-muted">to {{ getExpiryDate(p.paymentDate) | date:'dd MMM yyyy' }}</small>
                            </div>
                          </td>
                          <td><strong class="text-primary font-weight-bold">₹{{ p.amount }}</strong></td>
                          <td><span class="status-badge-verified">✓ Paid</span></td>
                          <td style="text-align: right;">
                            <button
                              type="button"
                              class="btn btn-xs btn-outline-primary"
                              (click)="openReceipt(p)"
                              title="View & Download Invoice Receipt"
                            >
                              🧾 Receipt
                            </button>
                          </td>
                        </tr>
                      }
                    </tbody>
                  </table>
                </div>
              } @else {
                <p class="text-muted" style="text-align: center; padding: 2rem 0;">No individual transactions available for this merchant.</p>
              }
            }

            <div class="modal-footer" style="margin-top: 1.5rem; text-align: right;">
              <button type="button" class="btn btn-secondary" (click)="closeDrilldown()">Close</button>
            </div>
          </div>
        </div>
      }

      <!-- Detailed Printable Receipt Modal -->
      @if (selectedReceipt) {
        <div class="invoice-modal-backdrop fade-in" (click)="closeReceipt()">
          <div class="invoice-modal-dialog" (click)="$event.stopPropagation()">
            <div class="modal-actions-bar no-print">
              <span class="modal-dialog-title">🧾 Payment Receipt Preview</span>
              <div class="action-btn-group">
                <button type="button" class="btn btn-sm btn-primary" (click)="printReceipt()">
                  🖨️ Print / Download Receipt
                </button>
                <button type="button" class="btn-close-modal" (click)="closeReceipt()" aria-label="Close modal">
                  ✕
                </button>
              </div>
            </div>

            <div id="printable-revenue-invoice-paper" class="invoice-paper">
              <div class="invoice-header">
                <div class="company-brand">
                  <div class="brand-logo">🏷️ Deals & Coupons Finder</div>
                  <div class="brand-subtitle">Platform Subscription Payment Receipt</div>
                </div>

                <div class="invoice-meta-badge">
                  <div class="invoice-title-pill">RECEIPT</div>
                  <div class="meta-row">
                    <span class="meta-label">Receipt No:</span>
                    <strong class="meta-value">{{ getInvoiceNumber(selectedReceipt) }}</strong>
                  </div>
                  <div class="meta-row">
                    <span class="meta-label">Payment Date:</span>
                    <span class="meta-value">{{ selectedReceipt.paymentDate | date:'mediumDate' }}</span>
                  </div>
                  <div class="meta-row status-meta">
                    <span class="meta-label">Status:</span>
                    <span class="status-stamp verified">✓ PAID & VERIFIED</span>
                  </div>
                </div>
              </div>

              <hr class="invoice-divider" />

              <div class="invoice-parties-grid">
                <div class="party-col">
                  <h4 class="party-heading">BILLED TO</h4>
                  <div class="party-name">{{ drilldownMerchant?.merchantName || ('Merchant #' + selectedReceipt.merchantId) }}</div>
                  <div class="party-detail"><strong>Merchant ID:</strong> #MER-{{ selectedReceipt.merchantId }}</div>
                  <div class="party-detail"><strong>Account Type:</strong> Verified Merchant Store</div>
                </div>

                <div class="party-col">
                  <h4 class="party-heading">PAYMENT DETAILS</h4>
                  <div class="party-detail"><strong>Payment Method:</strong> {{ selectedReceipt.paymentMethod }}</div>
                  <div class="party-detail"><strong>Transaction Ref:</strong> <span class="mono-text">{{ selectedReceipt.transactionReference }}</span></div>
                  <div class="party-detail"><strong>Subscription ID:</strong> #SUB-{{ selectedReceipt.subscriptionId }}</div>
                </div>
              </div>

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
                      <div class="item-name">{{ getPlanName(selectedReceipt) }}</div>
                      <div class="item-desc">Merchant Store Subscription Quota</div>
                    </td>
                    <td>
                      <div class="period-text">
                        <span>{{ selectedReceipt.paymentDate | date:'dd MMM yyyy' }} – {{ getExpiryDate(selectedReceipt.paymentDate) | date:'dd MMM yyyy' }}</span>
                        <small class="text-muted">(30 Days)</small>
                      </div>
                    </td>
                    <td style="text-align: right; font-weight: 700; font-size: 1rem;">
                      ₹{{ selectedReceipt.amount | number:'1.2-2' }}
                    </td>
                  </tr>
                </tbody>
              </table>

              <div class="invoice-totals-wrapper">
                <div class="totals-table">
                  <div class="total-row highlight-row">
                    <strong>Total Paid Amount:</strong>
                    <strong class="grand-total-val">₹{{ selectedReceipt.amount | number:'1.2-2' }}</strong>
                  </div>
                </div>
              </div>

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
    .admin-revenue {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
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

    .filter-card {
      padding: 1.25rem 1.5rem;
      border-radius: var(--radius-xl);
    }

    .filter-headline {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.875rem;
      color: var(--text-main);
      margin-bottom: 1rem;
    }

    .filter-controls {
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 1rem;
    }

    .quick-presets {
      display: flex;
      gap: 0.5rem;
      flex-wrap: wrap;
    }

    .preset-btn {
      border: 1px solid var(--border);
      background: var(--surface);
      color: var(--text-muted);
      padding: 0.375rem 0.75rem;
      border-radius: var(--radius-md);
      font-size: 0.8125rem;
      font-weight: 600;
      cursor: pointer;
      transition: all var(--transition-fast);
    }

    .preset-btn:hover {
      background: var(--surface-alt);
      color: var(--text-main);
    }

    .preset-btn.active {
      background: var(--primary);
      color: white;
      border-color: var(--primary);
    }

    .custom-dates {
      display: flex;
      gap: 0.75rem;
      align-items: center;
      flex-wrap: wrap;
    }

    .date-input-group {
      display: flex;
      align-items: center;
      gap: 0.375rem;
    }

    .date-label {
      font-size: 0.75rem;
      font-weight: 600;
      color: var(--text-muted);
    }

    .metrics-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 1.25rem;
    }

    .metric-card {
      padding: 1.5rem;
      border-radius: var(--radius-xl);
      display: flex;
      flex-direction: column;
    }

    .metric-label {
      font-size: 0.8125rem;
      font-weight: 600;
      color: var(--text-muted);
      margin-bottom: 0.375rem;
    }

    .metric-val {
      font-size: 1.875rem;
      font-weight: 800;
      line-height: 1.2;
    }

    .metric-sub {
      font-size: 0.75rem;
      margin-top: 0.375rem;
    }

    .breakdown-section {
      padding: 1.5rem;
      border-radius: var(--radius-xl);
    }

    .table-header {
      margin-bottom: 1.25rem;
    }

    .table-title {
      font-size: 1.125rem;
      font-weight: 800;
      margin: 0 0 0.25rem 0;
    }

    .table-desc {
      font-size: 0.8125rem;
      margin: 0;
    }

    .table-responsive {
      overflow-x: auto;
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

    .merchant-cell {
      display: flex;
      flex-direction: column;
    }

    .id-tag {
      font-size: 0.75rem;
    }

    .count-badge {
      background: var(--surface-alt);
      padding: 0.25rem 0.5rem;
      border-radius: var(--radius-sm);
      font-size: 0.8125rem;
      font-weight: 600;
    }

    .revenue-val {
      font-size: 1rem;
      color: var(--text-main);
    }

    .share-cell {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      width: 160px;
    }

    .share-bar-bg {
      flex: 1;
      height: 6px;
      background: var(--border);
      border-radius: 9999px;
      overflow: hidden;
    }

    .share-bar-fill {
      height: 100%;
      background: var(--primary);
      border-radius: 9999px;
    }

    .share-text {
      font-size: 0.75rem;
      font-weight: 700;
      color: var(--text-muted);
      width: 40px;
    }

    /* Modal Styles */
    .modal-backdrop {
      position: fixed;
      inset: 0;
      background: rgba(15, 23, 42, 0.6);
      backdrop-filter: blur(4px);
      z-index: 1050;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 1rem;
    }

    .modal-box {
      width: 100%;
      max-width: 600px;
      padding: 2rem;
      border-radius: var(--radius-xl);
    }

    .modal-box-lg {
      max-width: 960px;
      width: 95%;
    }

    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 1.5rem;
    }

    .modal-title {
      font-size: 1.25rem;
      font-weight: 800;
      margin: 0;
    }

    .btn-close {
      background: none;
      border: none;
      font-size: 1.25rem;
      cursor: pointer;
      color: var(--text-muted);
    }

    .drilldown-kpis {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
      gap: 1rem;
      margin-bottom: 1rem;
    }

    .drill-kpi {
      background: var(--surface-alt);
      padding: 1rem;
      border-radius: var(--radius-lg);
      display: flex;
      flex-direction: column;
    }

    .kpi-label {
      font-size: 0.75rem;
      color: var(--text-muted);
      font-weight: 600;
      margin-bottom: 0.25rem;
    }

    .kpi-val {
      font-size: 1.375rem;
      font-weight: 800;
    }

    .invoice-num-tag {
      font-family: monospace;
      font-weight: 700;
      font-size: 0.8125rem;
      color: var(--primary);
      background: var(--primary-light);
      padding: 0.2rem 0.5rem;
      border-radius: var(--radius-sm);
      white-space: nowrap;
    }

    .plan-name-text {
      color: var(--text-main);
      font-size: 0.875rem;
    }

    .ref-code {
      font-size: 0.75rem;
      background: var(--surface-alt);
      padding: 0.15rem 0.35rem;
      border-radius: 4px;
    }

    .period-text {
      display: flex;
      flex-direction: column;
      gap: 0.15rem;
      font-size: 0.8125rem;
      white-space: nowrap;
    }

    .status-badge-verified {
      background: #dcfce7;
      color: #166534;
      font-weight: 700;
      font-size: 0.75rem;
      padding: 0.2rem 0.55rem;
      border-radius: 9999px;
      white-space: nowrap;
    }

    .btn-xs {
      padding: 0.25rem 0.5rem;
      font-size: 0.75rem;
      font-weight: 700;
      border-radius: var(--radius-sm);
    }

    .btn-outline-primary {
      border: 1px solid var(--primary);
      color: var(--primary);
      background: transparent;
      transition: all var(--transition-fast);
    }

    .btn-outline-primary:hover {
      background: var(--primary);
      color: #ffffff;
    }

    /* Full Receipt Modal Styles */
    .invoice-modal-backdrop {
      position: fixed;
      inset: 0;
      background: rgba(15, 23, 42, 0.7);
      backdrop-filter: blur(6px);
      z-index: 1100;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 1.5rem;
      overflow-y: auto;
    }

    .invoice-modal-dialog {
      background: #ffffff;
      border-radius: 16px;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
      max-width: 680px;
      width: 100%;
      overflow: hidden;
    }

    .modal-actions-bar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1rem 1.5rem;
      background: #f8fafc;
      border-bottom: 1px solid #e2e8f0;
    }

    .modal-dialog-title {
      font-weight: 700;
      font-size: 0.9375rem;
      color: #1e293b;
    }

    .action-btn-group {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .btn-close-modal {
      width: 32px;
      height: 32px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 50%;
      background: #e2e8f0;
      color: #64748b;
      font-size: 0.875rem;
      cursor: pointer;
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
      text-align: left;
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
      .admin-sidebar,
      .page-header,
      .filter-card,
      .metrics-grid,
      .breakdown-section,
      .no-print {
        display: none !important;
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
      }
    }
  `]
})
export class AdminRevenueComponent implements OnInit {
  private readonly adminService = inject(AdminService);
  private readonly toast = inject(ToastService);
  private readonly cdr = inject(ChangeDetectorRef);

  revenue: RevenueResponse | null = null;
  merchantSummary: PlatformMerchantRevenueResponse | null = null;
  loading = true;

  selectedPreset: 'ALL' | '30D' | '90D' | 'YTD' | 'CUSTOM' = 'ALL';
  fromDate = '';
  toDate = '';

  drilldownMerchant: MerchantRevenueItemDto | null = null;
  drilldownDetails: SpecificMerchantRevenueResponse | null = null;
  loadingDrilldown = false;

  ngOnInit(): void {
    this.fetchRevenueData();
  }

  applyPreset(preset: 'ALL' | '30D' | '90D' | 'YTD'): void {
    this.selectedPreset = preset;
    const now = new Date();

    if (preset === 'ALL') {
      this.fromDate = '';
      this.toDate = '';
    } else if (preset === '30D') {
      const past = new Date();
      past.setDate(now.getDate() - 30);
      this.fromDate = this.formatDate(past);
      this.toDate = this.formatDate(now);
    } else if (preset === '90D') {
      const past = new Date();
      past.setDate(now.getDate() - 90);
      this.fromDate = this.formatDate(past);
      this.toDate = this.formatDate(now);
    } else if (preset === 'YTD') {
      const past = new Date(now.getFullYear(), 0, 1);
      this.fromDate = this.formatDate(past);
      this.toDate = this.formatDate(now);
    }

    this.fetchRevenueData();
  }

  private formatDate(d: Date): string {
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${d.getFullYear()}-${month}-${day}`;
  }

  fetchRevenueData(): void {
    // Validate Rule 24: fromDate <= toDate if both provided
    if (this.fromDate && this.toDate && this.fromDate > this.toDate) {
      this.toast.error('From Date cannot be later than To Date');
      return;
    }

    this.loading = true;

    const from = this.fromDate || undefined;
    const to = this.toDate || undefined;

    this.adminService.getRevenue(from, to).subscribe({
      next: r => {
        this.revenue = r;
        this.cdr.markForCheck();
      },
      error: () => {
        this.toast.error('Failed to load revenue totals');
        this.cdr.markForCheck();
      }
    });

    this.adminService.getMerchantRevenueSummary(from, to).subscribe({
      next: m => {
        this.merchantSummary = m;
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.loading = false;
        this.cdr.markForCheck();
      }
    });
  }

  get averageRevenuePerMerchant(): number {
    const count = this.merchantSummary?.merchants?.length || 0;
    if (count === 0 || !this.revenue?.totalRevenue) return 0;
    return Math.round(this.revenue.totalRevenue / count);
  }

  calculateShare(merchantTotal: number): number {
    const total = this.revenue?.totalRevenue || 0;
    if (total === 0) return 0;
    return (merchantTotal / total) * 100;
  }

  openDrilldown(merchant: MerchantRevenueItemDto): void {
    this.drilldownMerchant = merchant;
    this.loadingDrilldown = true;

    const from = this.fromDate || undefined;
    const to = this.toDate || undefined;

    this.adminService.getSpecificMerchantRevenue(merchant.merchantId, from, to).subscribe({
      next: details => {
        if (details && details.payments) {
          details.payments.sort((a, b) => {
            const dateA = a.paymentDate ? new Date(a.paymentDate).getTime() : 0;
            const dateB = b.paymentDate ? new Date(b.paymentDate).getTime() : 0;
            if (dateB !== dateA) return dateB - dateA;
            return (b.paymentId || 0) - (a.paymentId || 0);
          });
        }
        this.drilldownDetails = details;
        this.loadingDrilldown = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.toast.error('Failed to load merchant revenue details');
        this.loadingDrilldown = false;
        this.cdr.markForCheck();
      }
    });
  }

  closeDrilldown(): void {
    this.drilldownMerchant = null;
    this.drilldownDetails = null;
  }

  selectedReceipt: PaymentResponse | null = null;

  openReceipt(p: PaymentResponse): void {
    this.selectedReceipt = p;
    this.cdr.markForCheck();
  }

  closeReceipt(): void {
    this.selectedReceipt = null;
    this.cdr.markForCheck();
  }

  getMerchantAov(): number {
    const rev = this.drilldownDetails?.totalRevenue || 0;
    const count = this.drilldownDetails?.successfulPayments || 0;
    if (count === 0) return 0;
    return Math.round(rev / count);
  }

  getInvoiceNumber(p: PaymentResponse): string {
    const date = p.paymentDate ? new Date(p.paymentDate) : new Date();
    const year = isNaN(date.getFullYear()) ? 2026 : date.getFullYear();
    const idStr = String(p.paymentId || 1).padStart(6, '0');
    return `INV-${year}-${idStr}`;
  }

  getExpiryDate(paymentDateStr?: string): Date {
    const date = paymentDateStr ? new Date(paymentDateStr) : new Date();
    const base = isNaN(date.getTime()) ? new Date() : date;
    return new Date(base.getTime() + 30 * 24 * 60 * 60 * 1000);
  }

  getPlanName(p: PaymentResponse): string {
    const amt = p.amount;
    if (amt <= 500) {
      return 'Starter Merchant Tier (10 Deals Quota)';
    } else if (amt <= 1500) {
      return 'Growth Merchant Tier (50 Deals Quota)';
    } else if (amt <= 3000) {
      return 'Enterprise Merchant Tier (Unlimited Deals)';
    }
    return `Merchant Subscription Plan (#SUB-${p.subscriptionId})`;
  }

  printReceipt(): void {
    const paper = document.getElementById('printable-revenue-invoice-paper');
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
          <title>Receipt - ${this.getInvoiceNumber(this.selectedReceipt!)}</title>
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
}
