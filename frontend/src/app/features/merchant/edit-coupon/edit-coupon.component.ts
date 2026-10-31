import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { CouponService } from '../../../core/services/coupon.service';
import { ToastService } from '../../../core/services/toast.service';
import { CouponResponse, CouponUpdateRequest } from '../../../core/models/coupon.models';
import { LoadingSkeletonComponent } from '../../../shared/components/loading-skeleton/loading-skeleton.component';
import { StatusBadgeComponent } from '../../../shared/components/status-badge/status-badge.component';

@Component({
  selector: 'app-edit-coupon',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, LoadingSkeletonComponent, StatusBadgeComponent],
  template: `
    <div class="edit-coupon-container">
      <div class="page-header">
        <a routerLink="/merchant/coupons" class="back-link">
          ← Back to Coupons
        </a>
        <div class="header-content">
          <div>
            <h1 class="page-title">Edit Deal Details</h1>
            <p class="page-subtitle">Update discount parameters, quota, terms, and descriptions</p>
          </div>
          @if (coupon) {
            <app-status-badge [status]="coupon.status"></app-status-badge>
          }
        </div>
      </div>

      @if (loading) {
        <app-loading-skeleton type="card"></app-loading-skeleton>
      } @else if (!coupon) {
        <div class="card error-box">
          <h3>Coupon Not Found</h3>
          <p>The requested coupon does not exist or you do not have permission to view it.</p>
          <a routerLink="/merchant/coupons" class="btn btn-secondary">Return to Coupons</a>
        </div>
      } @else {
        <div class="form-layout card">
          <form [formGroup]="editForm" (ngSubmit)="onSubmit()">
            <!-- Section 1: Immutable Properties (Read-Only) -->
            <div class="form-section">
              <h3 class="section-title">1. Locked Coupon Identity</h3>
              <div class="form-grid">
                <div class="form-group">
                  <label class="form-label">Coupon Code (Read-Only)</label>
                  <input
                    type="text"
                    class="form-control readonly-input"
                    [value]="coupon.couponCode"
                    disabled
                  />
                </div>

                <div class="form-group">
                  <label class="form-label">Current Redemptions</label>
                  <input
                    type="text"
                    class="form-control readonly-input"
                    [value]="(coupon.usageCount || 0) + ' times redeemed'"
                    disabled
                  />
                </div>

                <div class="form-group">
                  <label class="form-label">Valid From (Locked)</label>
                  <input
                    type="text"
                    class="form-control readonly-input"
                    [value]="coupon.validFrom | date:'mediumDate'"
                    disabled
                  />
                </div>

                <div class="form-group">
                  <label class="form-label">Valid Until (Locked)</label>
                  <input
                    type="text"
                    class="form-control readonly-input"
                    [value]="coupon.validUntil | date:'mediumDate'"
                    disabled
                  />
                </div>
              </div>
            </div>

            <!-- Section 2: Editable Information -->
            <div class="form-section">
              <h3 class="section-title">2. Editable Details & Limits</h3>
              <div class="form-grid">
                <div class="form-group full-width">
                  <label class="form-label" for="title">Deal Title *</label>
                  <input
                    id="title"
                    type="text"
                    class="form-control"
                    formControlName="title"
                    placeholder="Headline for this offer..."
                  />
                  @if (f['title'].touched && f['title'].errors) {
                    <div class="form-error">Title is required (min 5 chars).</div>
                  }
                </div>

                <div class="form-group">
                  <label class="form-label" for="category">Category *</label>
                  <select id="category" class="form-control" formControlName="category">
                    @for (cat of categories; track cat) {
                      <option [value]="cat">{{ cat }}</option>
                    }
                  </select>
                </div>

                <div class="form-group">
                  <label class="form-label" for="discount">Discount Percentage (%) *</label>
                  <div class="input-with-symbol">
                    <input
                      id="discount"
                      type="number"
                      class="form-control"
                      formControlName="discount"
                      min="1"
                      max="100"
                    />
                    <span class="symbol">%</span>
                  </div>
                  @if (f['discount'].touched && f['discount'].errors) {
                    <div class="form-error">Valid discount (1-100) is required.</div>
                  }
                </div>

                <div class="form-group">
                  <label class="form-label" for="cashbackPercentage">Cashback Percentage (%)</label>
                  <div class="input-with-symbol">
                    <input
                      id="cashbackPercentage"
                      type="number"
                      class="form-control"
                      formControlName="cashbackPercentage"
                      min="0"
                      max="50"
                    />
                    <span class="symbol">%</span>
                  </div>
                </div>

                <div class="form-group">
                  <label class="form-label" for="minimumPurchase">Minimum Order Spend (₹) *</label>
                  <div class="input-with-symbol">
                    <span class="symbol-left">₹</span>
                    <input
                      id="minimumPurchase"
                      type="number"
                      class="form-control pad-left"
                      formControlName="minimumPurchase"
                      min="0"
                    />
                  </div>
                </div>

                <div class="form-group">
                  <label class="form-label" for="usageLimit">Redemption Quota *</label>
                  <input
                    id="usageLimit"
                    type="number"
                    class="form-control"
                    formControlName="usageLimit"
                    [min]="coupon.usageCount || 1"
                  />
                  <small class="form-hint">Must be at least current usage count ({{ coupon.usageCount || 0 }})</small>
                  @if (f['usageLimit'].touched && f['usageLimit'].errors) {
                    <div class="form-error">Usage quota cannot be less than existing redemptions.</div>
                  }
                </div>

                <div class="form-group full-width">
                  <label class="form-label" for="description">Detailed Description *</label>
                  <textarea
                    id="description"
                    rows="3"
                    class="form-control"
                    formControlName="description"
                  ></textarea>
                </div>
              </div>
            </div>

            <!-- Action Buttons -->
            <div class="form-actions">
              <a routerLink="/merchant/coupons" class="btn btn-secondary">
                Cancel
              </a>
              <button
                type="submit"
                class="btn btn-primary"
                [disabled]="editForm.invalid || submitting"
              >
                @if (submitting) {
                  <span>Saving Changes...</span>
                } @else {
                  <span>Save Changes</span>
                }
              </button>
            </div>
          </form>
        </div>
      }
    </div>
  `,
  styles: [`
    .edit-coupon-container {
      max-width: 860px;
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }

    .back-link {
      font-size: 0.875rem;
      font-weight: 600;
      color: var(--primary);
      display: inline-block;
      margin-bottom: 0.5rem;
      text-decoration: none;
    }

    .header-content {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
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

    .form-layout {
      padding: 2rem;
      border-radius: var(--radius-xl);
    }

    .form-section {
      padding-bottom: 1.75rem;
      margin-bottom: 1.75rem;
      border-bottom: 1px solid var(--border);
    }

    .form-section:last-of-type {
      border-bottom: none;
      padding-bottom: 0;
      margin-bottom: 0;
    }

    .section-title {
      font-size: 1.0625rem;
      font-weight: 700;
      color: var(--text-main);
      margin-bottom: 1.25rem;
    }

    .form-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1.25rem;
    }

    .full-width {
      grid-column: 1 / -1;
    }

    .form-group {
      display: flex;
      flex-direction: column;
    }

    .readonly-input {
      background-color: var(--surface-alt);
      cursor: not-allowed;
      opacity: 0.85;
      font-weight: 600;
      color: var(--text-muted);
    }

    .input-with-symbol {
      position: relative;
      display: flex;
      align-items: center;
    }

    .symbol {
      position: absolute;
      right: 0.875rem;
      font-weight: 600;
      color: var(--text-muted);
    }

    .symbol-left {
      position: absolute;
      left: 0.875rem;
      font-weight: 600;
      color: var(--text-muted);
    }

    .pad-left {
      padding-left: 2rem;
    }

    .form-hint {
      font-size: 0.75rem;
      color: var(--text-muted);
      margin-top: 0.25rem;
    }

    .form-actions {
      display: flex;
      justify-content: flex-end;
      gap: 1rem;
      margin-top: 2rem;
      padding-top: 1.5rem;
      border-top: 1px solid var(--border);
    }

    .error-box {
      padding: 2rem;
      text-align: center;
    }

    @media (max-width: 640px) {
      .form-grid {
        grid-template-columns: 1fr;
      }
      .form-actions {
        flex-direction: column-reverse;
      }
      .form-actions .btn {
        width: 100%;
      }
    }
  `]
})
export class EditCouponComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly couponService = inject(CouponService);
  private readonly toast = inject(ToastService);
  private readonly cdr = inject(ChangeDetectorRef);

  coupon: CouponResponse | null = null;
  editForm!: FormGroup;
  loading = true;
  submitting = false;

  readonly categories = [
    'Electronics',
    'Fashion',
    'Food & Dining',
    'Travel',
    'Beauty',
    'Health',
    'Grocery',
    'Entertainment',
    'Home & Living'
  ];

  ngOnInit(): void {
    const couponId = Number(this.route.snapshot.paramMap.get('id'));
    if (!couponId) {
      this.loading = false;
      this.cdr.markForCheck();
      return;
    }

    this.initForm();
    this.loadCoupon(couponId);
  }

  get f() {
    return this.editForm.controls;
  }

  private initForm(): void {
    this.editForm = this.fb.group({
      title: ['', [Validators.required, Validators.minLength(5), Validators.maxLength(100)]],
      description: ['', [Validators.required, Validators.maxLength(500)]],
      category: ['', Validators.required],
      discount: [20, [Validators.required, Validators.min(1), Validators.max(100)]],
      cashbackPercentage: [0, [Validators.min(0), Validators.max(50)]],
      minimumPurchase: [0, [Validators.required, Validators.min(0)]],
      usageLimit: [100, [Validators.required, Validators.min(1)]]
    });
  }

  private loadCoupon(id: number): void {
    this.loading = true;
    this.cdr.markForCheck();
    this.couponService.getCouponById(id).subscribe({
      next: data => {
        this.coupon = data;
        this.editForm.patchValue({
          title: data.title,
          description: data.description,
          category: data.category,
          discount: data.discount,
          cashbackPercentage: data.cashbackPercentage || 0,
          minimumPurchase: data.minimumPurchase,
          usageLimit: data.usageLimit
        });
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.toast.error('Failed to load coupon details');
        this.loading = false;
        this.cdr.markForCheck();
      }
    });
  }

  onSubmit(): void {
    if (this.editForm.invalid || !this.coupon) {
      this.editForm.markAllAsTouched();
      return;
    }

    this.submitting = true;
    this.cdr.markForCheck();
    const formVal = this.editForm.value;

    // Rule 21: validFrom and validUntil are NOT sent in the CouponUpdateRequest payload
    const request: CouponUpdateRequest = {
      title: formVal.title,
      description: formVal.description,
      category: formVal.category,
      discount: Number(formVal.discount),
      cashbackPercentage: formVal.cashbackPercentage ? Number(formVal.cashbackPercentage) : 0,
      minimumPurchase: Number(formVal.minimumPurchase),
      usageLimit: Number(formVal.usageLimit)
    };

    this.couponService.updateCoupon(this.coupon.couponId, request).subscribe({
      next: updated => {
        this.toast.success(`Coupon "${updated.couponCode}" updated successfully!`);
        this.submitting = false;
        this.router.navigate(['/merchant/coupons']);
      },
      error: err => {
        this.toast.error(err.error?.message || 'Failed to update coupon');
        this.submitting = false;
        this.cdr.markForCheck();
      }
    });
  }
}
