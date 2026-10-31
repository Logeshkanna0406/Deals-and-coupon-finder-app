import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MerchantService } from '../../../core/services/merchant.service';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../core/services/toast.service';
import { MerchantResponse, UpdateMerchantRequest } from '../../../core/models/merchant.models';
import { StatusBadgeComponent } from '../../../shared/components/status-badge/status-badge.component';
import { LoadingSkeletonComponent } from '../../../shared/components/loading-skeleton/loading-skeleton.component';

@Component({
  selector: 'app-merchant-profile',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, StatusBadgeComponent, LoadingSkeletonComponent],
  template: `
    <div class="profile-container">
      <div class="page-header">
        <div>
          <h1 class="page-title">Store & Business Profile</h1>
          <p class="page-subtitle">Manage store information, brand details, contact channels, and category</p>
        </div>
        @if (merchant) {
          <app-status-badge [status]="merchant.status"></app-status-badge>
        }
      </div>

      @if (loading) {
        <app-loading-skeleton type="card"></app-loading-skeleton>
      } @else if (merchant) {
        <div class="card form-card">
          <div class="store-badge-header">
            <div class="avatar-box">🏪</div>
            <div>
              <h3 class="store-headline">{{ merchant.businessName }}</h3>
              <p class="store-sub text-muted">Merchant ID #{{ merchant.merchantId }} · Member since {{ merchant.createdAt | date:'mediumDate' }}</p>
            </div>
          </div>

          <form [formGroup]="profileForm" (ngSubmit)="onSubmit()">
            <div class="form-grid">
              <div class="form-group">
                <label class="form-label" for="businessName">Business / Brand Name *</label>
                <input
                  id="businessName"
                  type="text"
                  class="form-control"
                  formControlName="businessName"
                  placeholder="e.g. Pizza Planet Express"
                />
                @if (f['businessName'].touched && f['businessName'].errors) {
                  <div class="form-error">Business name is required.</div>
                }
              </div>

              <div class="form-group">
                <label class="form-label" for="ownerName">Authorized Representative / Owner *</label>
                <input
                  id="ownerName"
                  type="text"
                  class="form-control"
                  formControlName="ownerName"
                  placeholder="e.g. John Doe"
                />
                @if (f['ownerName'].touched && f['ownerName'].errors) {
                  <div class="form-error">Owner name is required.</div>
                }
              </div>

              <div class="form-group">
                <label class="form-label">Registered Business Email</label>
                <input
                  type="email"
                  class="form-control readonly-input"
                  [value]="merchant.email"
                  disabled
                />
                <small class="form-hint">Email cannot be altered directly for security</small>
              </div>

              <div class="form-group">
                <label class="form-label" for="phone">Customer Support Phone *</label>
                <input
                  id="phone"
                  type="tel"
                  class="form-control"
                  formControlName="phone"
                  placeholder="e.g. 9876543210"
                />
                @if (f['phone'].touched && f['phone'].errors) {
                  <div class="form-error">Valid 10-digit phone number is required.</div>
                }
              </div>

              <div class="form-group">
                <label class="form-label" for="category">Primary Industry Category *</label>
                <select id="category" class="form-control" formControlName="category">
                  @for (cat of categories; track cat) {
                    <option [value]="cat">{{ cat }}</option>
                  }
                </select>
              </div>

              <div class="form-group">
                <label class="form-label" for="address">Store Location / Headquarters Address</label>
                <input
                  id="address"
                  type="text"
                  class="form-control"
                  formControlName="address"
                  placeholder="e.g. 124 Market Street, Bangalore"
                />
              </div>

              <div class="form-group full-width">
                <label class="form-label" for="description">Store Brand Bio & About</label>
                <textarea
                  id="description"
                  rows="3"
                  class="form-control"
                  formControlName="description"
                  placeholder="Describe what your brand offers, specialties, delivery coverage..."
                ></textarea>
              </div>
            </div>

            <div class="form-actions">
              <button
                type="submit"
                class="btn btn-primary"
                [disabled]="profileForm.invalid || submitting"
              >
                @if (submitting) {
                  <span>Saving Profile...</span>
                } @else {
                  <span>Save Profile Changes</span>
                }
              </button>
            </div>
          </form>
        </div>
      }
    </div>
  `,
  styles: [`
    .profile-container {
      max-width: 860px;
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

    .form-card {
      padding: 2rem;
      border-radius: var(--radius-xl);
    }

    .store-badge-header {
      display: flex;
      align-items: center;
      gap: 1.25rem;
      padding-bottom: 1.5rem;
      margin-bottom: 1.75rem;
      border-bottom: 1px solid var(--border);
    }

    .avatar-box {
      font-size: 2.5rem;
      background: var(--surface-alt);
      width: 68px;
      height: 68px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: var(--radius-lg);
      border: 1px solid var(--border);
    }

    .store-headline {
      font-size: 1.25rem;
      font-weight: 800;
      margin: 0 0 0.25rem 0;
    }

    .store-sub {
      font-size: 0.8125rem;
      margin: 0;
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
      color: var(--text-muted);
    }

    .form-hint {
      font-size: 0.75rem;
      color: var(--text-muted);
      margin-top: 0.25rem;
    }

    .form-actions {
      display: flex;
      justify-content: flex-end;
      margin-top: 2rem;
      padding-top: 1.5rem;
      border-top: 1px solid var(--border);
    }

    @media (max-width: 640px) {
      .form-grid {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class MerchantProfileComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly merchantService = inject(MerchantService);
  private readonly authService = inject(AuthService);
  private readonly toast = inject(ToastService);
  private readonly cdr = inject(ChangeDetectorRef);

  merchant: MerchantResponse | null = null;
  profileForm!: FormGroup;
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
    this.initForm();
    this.loadProfile();
  }

  get f() {
    return this.profileForm.controls;
  }

  private initForm(): void {
    this.profileForm = this.fb.group({
      businessName: ['', [Validators.required, Validators.minLength(2)]],
      ownerName: ['', [Validators.required, Validators.minLength(2)]],
      phone: ['', [Validators.required, Validators.pattern(/^[0-9]{10}$/)]],
      category: ['', Validators.required],
      address: [''],
      description: ['']
    });
  }

  private loadProfile(): void {
    const merchantId = this.authService.currentUserId();
    if (!merchantId) {
      this.loading = false;
      this.cdr.markForCheck();
      return;
    }

    this.loading = true;
    this.cdr.markForCheck();
    this.merchantService.getMerchantById(merchantId).subscribe({
      next: data => {
        this.merchant = data;
        this.profileForm.patchValue({
          businessName: data.businessName,
          ownerName: data.ownerName,
          phone: data.phone,
          category: data.category,
          address: data.address || '',
          description: data.description || ''
        });
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.toast.error('Failed to load merchant profile');
        this.loading = false;
        this.cdr.markForCheck();
      }
    });
  }

  onSubmit(): void {
    if (this.profileForm.invalid || !this.merchant) {
      this.profileForm.markAllAsTouched();
      return;
    }

    this.submitting = true;
    this.cdr.markForCheck();
    const formVal = this.profileForm.value;

    const request: UpdateMerchantRequest = {
      businessName: formVal.businessName,
      ownerName: formVal.ownerName,
      phone: formVal.phone,
      category: formVal.category,
      address: formVal.address || undefined,
      description: formVal.description || undefined
    };

    this.merchantService.updateMerchant(this.merchant.merchantId, request).subscribe({
      next: updated => {
        this.merchant = updated;
        this.toast.success('Store profile updated successfully!');
        this.submitting = false;
        this.cdr.markForCheck();
      },
      error: err => {
        this.toast.error(err.error?.message || 'Failed to update merchant profile');
        this.submitting = false;
        this.cdr.markForCheck();
      }
    });
  }
}
