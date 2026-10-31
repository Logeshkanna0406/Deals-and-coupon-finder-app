import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { SubscriptionService } from '../../../core/services/subscription.service';
import { AdminService } from '../../../core/services/admin.service';
import { ToastService } from '../../../core/services/toast.service';
import {
  SubscriptionPlanResponse,
  CreateSubscriptionPlanRequest
} from '../../../core/models/subscription.models';
import { LoadingSkeletonComponent } from '../../../shared/components/loading-skeleton/loading-skeleton.component';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';

@Component({
  selector: 'app-admin-plans',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, LoadingSkeletonComponent, EmptyStateComponent],
  template: `
    <div class="admin-plans">
      <div class="page-header">
        <div>
          <h1 class="page-title">Merchant Subscription Tier Catalog</h1>
          <p class="page-subtitle">Configure monetization tiers, coupon creation quotas, and duration packages</p>
        </div>
        <button type="button" class="btn btn-primary" (click)="openCreateModal()">
          <span style="font-size: 1.1rem; line-height: 1;">+</span> Create New Plan
        </button>
      </div>

      @if (loading) {
        <app-loading-skeleton type="card"></app-loading-skeleton>
      } @else if (plans.length === 0) {
        <app-empty-state
          icon="💎"
          title="No Plans Configured"
          message="There are currently no active subscription plans available for merchants."
          actionText="Create Initial Plan"
          (actionClicked)="openCreateModal()"
        ></app-empty-state>
      } @else {
        <div class="plans-grid">
          @for (plan of plans; track plan.planId) {
            <div class="plan-card card">
              <div class="plan-header">
                <div>
                  <h3 class="plan-title">{{ plan.name }}</h3>
                  <span class="plan-id text-muted">Plan #{{ plan.planId }}</span>
                </div>
                <div class="plan-header-controls">
                  <span class="active-chip">Active</span>
                  <div class="plan-action-btns">
                    <button
                      type="button"
                      class="btn-plan-action btn-plan-edit"
                      (click)="openEditModal(plan)"
                      title="Edit Plan"
                      aria-label="Edit Plan"
                    >
                      ✏️
                    </button>
                    <button
                      type="button"
                      class="btn-plan-action btn-plan-delete"
                      (click)="openDeleteConfirm(plan)"
                      title="Delete Plan"
                      aria-label="Delete Plan"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              </div>

              <div class="price-container">
                <span class="currency">₹</span>
                <span class="price-amount">{{ plan.price.toLocaleString() }}</span>
                <span class="duration-text text-muted">/ {{ plan.durationInMonths }} {{ plan.durationInMonths === 1 ? 'Month' : 'Months' }}</span>
              </div>

              <div class="plan-features">
                <div class="feature-item">
                  <span class="check-icon">✓</span>
                  <span><strong>{{ plan.couponLimit }}</strong> Deals & Coupons Limit</span>
                </div>
                <div class="feature-item">
                  <span class="check-icon">✓</span>
                  <span><strong>{{ plan.durationInMonths * 30 }} Days</strong> Merchant Access</span>
                </div>
               
                <div class="feature-item">
                  <span class="check-icon">✓</span>
                  <span>Smart Ranking & Discovery Feed Inclusion</span>
                </div>
              </div>

              <div class="plan-card-footer">
                <span class="monthly-breakdown text-muted">
                  ≈ ₹{{ Math.round(plan.price / plan.durationInMonths) }}/month effective
                </span>
              </div>
            </div>
          }
        </div>
      }

      <!-- Create / Edit Plan Modal -->
      @if (isModalOpen) {
        <div class="modal-backdrop fade-in" (click)="closeModal()">
          <div class="modal-box card scale-up" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <h3 class="modal-title">
                {{ editingPlan ? '✏️ Edit Subscription Plan' : '+ Create Subscription Plan' }}
              </h3>
              <button type="button" class="btn-close" (click)="closeModal()">✕</button>
            </div>

            <form [formGroup]="planForm" (ngSubmit)="onSavePlan()">
              <div class="form-group">
                <label class="form-label" for="planName">Plan Tier Name *</label>
                <input
                  id="planName"
                  type="text"
                  class="form-control"
                  formControlName="name"
                  placeholder="e.g. Growth Pro Tier"
                />
                @if (f['name'].touched && f['name'].errors) {
                  <div class="form-error">Plan name is required (min 3 chars).</div>
                }
              </div>

              <div class="modal-grid">
                <div class="form-group">
                  <label class="form-label" for="durationInMonths">Duration (Months) *</label>
                  <select id="durationInMonths" class="form-control" formControlName="durationInMonths">
                    <option [value]="1">1 Month (Monthly)</option>
                    <option [value]="3">3 Months (Quarterly)</option>
                    <option [value]="6">6 Months (Half-Yearly)</option>
                    <option [value]="12">12 Months (Annual)</option>
                  </select>
                </div>

                <div class="form-group">
                  <label class="form-label" for="price">Price (₹) *</label>
                  <input
                    id="price"
                    type="number"
                    class="form-control"
                    formControlName="price"
                    min="0"
                    placeholder="999"
                  />
                  @if (f['price'].touched && f['price'].errors) {
                    <div class="form-error">Price is required.</div>
                  }
                </div>
              </div>

              <div class="form-group">
                <label class="form-label" for="couponLimit">Maximum Coupons Allowed *</label>
                <input
                  id="couponLimit"
                  type="number"
                  class="form-control"
                  formControlName="couponLimit"
                  min="1"
                  placeholder="25"
                />
                <small class="form-hint">Rule 16 coupon limit quota enforced for merchants on this plan</small>
                @if (f['couponLimit'].touched && f['couponLimit'].errors) {
                  <div class="form-error">Coupon limit must be at least 1.</div>
                }
              </div>

              <div class="modal-actions">
                <button type="button" class="btn btn-secondary" (click)="closeModal()">
                  Cancel
                </button>
                <button
                  type="submit"
                  class="btn btn-primary"
                  [disabled]="planForm.invalid || saving"
                >
                  @if (saving) {
                    <span>Saving Plan...</span>
                  } @else if (editingPlan) {
                    <span>Update Plan</span>
                  } @else {
                    <span>Save & Publish Plan</span>
                  }
                </button>
              </div>
            </form>
          </div>
        </div>
      }

      <!-- Delete Confirmation Modal -->
      @if (planToDelete) {
        <div class="modal-backdrop fade-in" (click)="closeDeleteConfirm()">
          <div class="modal-box card scale-up delete-modal-box" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <h3 class="modal-title" style="color: var(--danger, #ef4444); display: flex; align-items: center; gap: 0.5rem;">
                <span>🗑️</span> Delete Subscription Plan
              </h3>
              <button type="button" class="btn-close" (click)="closeDeleteConfirm()">✕</button>
            </div>

            <div class="delete-modal-body">
              <p style="margin-bottom: 0.75rem; font-size: 0.95rem; color: var(--text-main);">
                Are you sure you want to delete the plan <strong>{{ planToDelete.name }}</strong> (Plan #{{ planToDelete.planId }})?
              </p>
              <div style="background: var(--danger-light, #fef2f2); border: 1px solid #fecaca; border-radius: var(--radius-md, 10px); padding: 0.75rem 1rem; color: var(--danger-dark, #b91c1c); font-size: 0.8125rem;">
                ⚠️ <strong>Warning:</strong> This will permanently remove this tier from the merchant catalog. Merchants will no longer be able to purchase or renew this plan.
              </div>
            </div>

            <div class="modal-actions" style="margin-top: 1.5rem;">
              <button type="button" class="btn btn-secondary" (click)="closeDeleteConfirm()" [disabled]="deleting">
                Cancel
              </button>
              <button
                type="button"
                class="btn btn-danger"
                (click)="onConfirmDeletePlan()"
                [disabled]="deleting"
              >
                @if (deleting) {
                  <span>Deleting Plan...</span>
                } @else {
                  <span>Delete Plan</span>
                }
              </button>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .admin-plans {
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

    .plans-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: 1.5rem;
    }

    .plan-card {
      padding: 1.75rem;
      border-radius: var(--radius-xl);
      display: flex;
      flex-direction: column;
      position: relative;
    }

    .plan-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 1rem;
      gap: 0.5rem;
    }

    .plan-header-controls {
      display: flex;
      align-items: center;
      gap: 0.625rem;
    }

    .plan-action-btns {
      display: inline-flex;
      align-items: center;
      gap: 0.25rem;
      background: var(--surface-alt, #f1f5f9);
      padding: 0.2rem 0.35rem;
      border-radius: var(--radius-md, 8px);
      border: 1px solid var(--border, #e2e8f0);
    }

    .btn-plan-action {
      background: transparent;
      border: none;
      cursor: pointer;
      font-size: 0.95rem;
      line-height: 1;
      width: 30px;
      height: 30px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      border-radius: var(--radius-sm, 6px);
      transition: all var(--transition-fast, 150ms ease);
    }

    .btn-plan-edit:hover {
      background: rgba(37, 99, 235, 0.15);
      transform: scale(1.15);
    }

    .btn-plan-delete:hover {
      background: rgba(239, 68, 68, 0.18);
      transform: scale(1.15);
    }

    .plan-title {
      font-size: 1.25rem;
      font-weight: 800;
      margin: 0;
    }

    .plan-id {
      font-size: 0.75rem;
    }

    .active-chip {
      background: var(--success-light);
      color: var(--success-dark);
      padding: 0.25rem 0.5rem;
      border-radius: 9999px;
      font-size: 0.6875rem;
      font-weight: 700;
      text-transform: uppercase;
    }

    .price-container {
      display: flex;
      align-items: baseline;
      gap: 0.25rem;
      margin-bottom: 1.5rem;
    }

    .currency {
      font-size: 1.5rem;
      font-weight: 800;
      color: var(--text-main);
    }

    .price-amount {
      font-size: 2.5rem;
      font-weight: 800;
      color: var(--text-main);
      line-height: 1;
    }

    .duration-text {
      font-size: 0.875rem;
      font-weight: 600;
    }

    .plan-features {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
      padding: 1.25rem 0;
      border-top: 1px solid var(--border);
      border-bottom: 1px solid var(--border);
      margin-bottom: 1.25rem;
      flex: 1;
    }

    .feature-item {
      display: flex;
      align-items: center;
      gap: 0.625rem;
      font-size: 0.875rem;
    }

    .check-icon {
      color: var(--success);
      font-weight: 800;
      font-size: 1rem;
    }

    .plan-card-footer {
      font-size: 0.75rem;
      text-align: center;
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
      max-width: 520px;
      padding: 2rem;
      border-radius: var(--radius-xl);
    }

    .delete-modal-box {
      max-width: 460px;
    }

    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
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

    .modal-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1rem;
    }

    .form-group {
      display: flex;
      flex-direction: column;
      margin-bottom: 1rem;
    }

    .form-hint {
      font-size: 0.75rem;
      color: var(--text-muted);
      margin-top: 0.25rem;
    }

    .modal-actions {
      display: flex;
      justify-content: flex-end;
      gap: 0.75rem;
      margin-top: 1.5rem;
      padding-top: 1rem;
      border-top: 1px solid var(--border);
    }
  `]
})
export class AdminPlansComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly subscriptionService = inject(SubscriptionService);
  private readonly adminService = inject(AdminService);
  private readonly toast = inject(ToastService);
  private readonly cdr = inject(ChangeDetectorRef);

  readonly Math = Math;

  plans: SubscriptionPlanResponse[] = [];
  loading = true;
  isModalOpen = false;
  saving = false;
  editingPlan: SubscriptionPlanResponse | null = null;
  planToDelete: SubscriptionPlanResponse | null = null;
  deleting = false;

  planForm!: FormGroup;

  ngOnInit(): void {
    this.initForm();
    this.loadPlans();
  }

  get f() {
    return this.planForm.controls;
  }

  private initForm(): void {
    this.planForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3)]],
      durationInMonths: [1, [Validators.required, Validators.min(1)]],
      price: [999, [Validators.required, Validators.min(0)]],
      couponLimit: [25, [Validators.required, Validators.min(1)]]
    });
  }

  loadPlans(): void {
    this.loading = true;
    this.subscriptionService.getAllPlans().subscribe({
      next: data => {
        this.plans = data || [];
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.toast.error('Failed to load subscription plans');
        this.loading = false;
        this.cdr.markForCheck();
      }
    });
  }

  openCreateModal(): void {
    this.editingPlan = null;
    this.planForm.reset({
      name: '',
      durationInMonths: 1,
      price: 999,
      couponLimit: 25
    });
    this.isModalOpen = true;
    this.cdr.markForCheck();
  }

  openEditModal(plan: SubscriptionPlanResponse): void {
    this.editingPlan = plan;
    this.planForm.patchValue({
      name: plan.name,
      durationInMonths: plan.durationInMonths,
      price: plan.price,
      couponLimit: plan.couponLimit
    });
    this.isModalOpen = true;
    this.cdr.markForCheck();
  }

  closeModal(): void {
    this.isModalOpen = false;
    this.saving = false;
    this.editingPlan = null;
    this.cdr.markForCheck();
  }

  onSavePlan(): void {
    if (this.planForm.invalid) {
      this.planForm.markAllAsTouched();
      return;
    }

    this.saving = true;
    const formVal = this.planForm.value;

    const request: CreateSubscriptionPlanRequest = {
      name: formVal.name,
      durationInMonths: Number(formVal.durationInMonths),
      price: Number(formVal.price),
      couponLimit: Number(formVal.couponLimit)
    };

    if (this.editingPlan) {
      const planId = this.editingPlan.planId;
      this.adminService.updateSubscriptionPlan(planId, request).subscribe({
        next: updated => {
          this.toast.success(`Plan "${updated.name}" updated successfully!`);
          this.plans = this.plans.map(p => (p.planId === updated.planId ? updated : p));
          this.closeModal();
          this.cdr.markForCheck();
        },
        error: err => {
          this.toast.error(err.error?.message || 'Failed to update plan');
          this.saving = false;
          this.cdr.markForCheck();
        }
      });
    } else {
      this.adminService.createSubscriptionPlan(request).subscribe({
        next: created => {
          this.toast.success(`Plan "${created.name}" created and added to catalog!`);
          this.plans = [...this.plans, created];
          this.closeModal();
          this.cdr.markForCheck();
        },
        error: err => {
          this.toast.error(err.error?.message || 'Failed to create plan');
          this.saving = false;
          this.cdr.markForCheck();
        }
      });
    }
  }

  openDeleteConfirm(plan: SubscriptionPlanResponse): void {
    this.planToDelete = plan;
    this.cdr.markForCheck();
  }

  closeDeleteConfirm(): void {
    this.planToDelete = null;
    this.deleting = false;
    this.cdr.markForCheck();
  }

  onConfirmDeletePlan(): void {
    if (!this.planToDelete) return;
    this.deleting = true;
    const planId = this.planToDelete.planId;
    const planName = this.planToDelete.name;

    this.adminService.deleteSubscriptionPlan(planId).subscribe({
      next: () => {
        this.toast.success(`Plan "${planName}" deleted successfully!`);
        this.plans = this.plans.filter(p => p.planId !== planId);
        this.closeDeleteConfirm();
        this.cdr.markForCheck();
      },
      error: err => {
        this.toast.error(err.error?.message || 'Failed to delete plan');
        this.deleting = false;
        this.cdr.markForCheck();
      }
    });
  }
}
