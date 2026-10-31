import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AbstractControl, FormBuilder, FormGroup, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { CouponService } from '../../../core/services/coupon.service';
import { SubscriptionService } from '../../../core/services/subscription.service';
import { MerchantService } from '../../../core/services/merchant.service';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../core/services/toast.service';
import { CreateCouponRequest } from '../../../core/models/coupon.models';
import { SubscriptionResponse } from '../../../core/models/subscription.models';
import { LoadingSkeletonComponent } from '../../../shared/components/loading-skeleton/loading-skeleton.component';

@Component({
  selector: 'app-create-coupon',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, LoadingSkeletonComponent],
  templateUrl: './create-coupon.component.html',
  styleUrl: './create-coupon.component.css'
})
export class CreateCouponComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly couponService = inject(CouponService);
  private readonly subscriptionService = inject(SubscriptionService);
  private readonly merchantService = inject(MerchantService);
  private readonly authService = inject(AuthService);
  private readonly toast = inject(ToastService);
  private readonly router = inject(Router);
  private readonly cdr = inject(ChangeDetectorRef);

  couponForm!: FormGroup;
  submitting = false;
  loadingSubscription = true;

  merchantStatus: string = 'APPROVED';
  activeSubscription: SubscriptionResponse | null = null;
  currentCouponsCount = 0;
  isLimitReached = false;

  subStartMin = '';
  subEndMax = '';

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
    this.checkEligibility();
  }

  get f() {
    return this.couponForm.controls;
  }

  private initForm(): void {
    this.couponForm = this.fb.group(
      {
        couponCode: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(20)]],
        title: ['', [Validators.required, Validators.minLength(5), Validators.maxLength(100)]],
        description: ['', [Validators.required, Validators.maxLength(500)]],
        category: ['', Validators.required],
        discount: [20, [Validators.required, Validators.min(1), Validators.max(100)]],
        cashbackPercentage: [0, [Validators.min(0), Validators.max(50)]],
        minimumPurchase: [0, [Validators.required, Validators.min(0)]],
        usageLimit: [100, [Validators.required, Validators.min(1)]],
        startDate: ['', Validators.required],
        startTime: ['00:00:00', [Validators.required, this.timeFormatValidator]],
        endDate: ['', Validators.required],
        endTime: ['23:59:59', [Validators.required, this.timeFormatValidator]]
      },
      { validators: [this.validityPeriodValidator.bind(this)] }
    );
  }

  /**
   * Validates time strings in HH:mm or HH:mm:ss format
   */
  private timeFormatValidator(control: AbstractControl): ValidationErrors | null {
    if (!control.value) return null;
    const timeRegex = /^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/;
    return timeRegex.test(control.value.trim()) ? null : { invalidTime: true };
  }

  /**
   * Cross-field validator ensuring:
   * 1. Start date/time is strictly before End date/time
   * 2. Validity falls within active merchant subscription bounds
   */
  private validityPeriodValidator(group: AbstractControl): ValidationErrors | null {
    const startDate = group.get('startDate')?.value;
    const startTime = group.get('startTime')?.value;
    const endDate = group.get('endDate')?.value;
    const endTime = group.get('endTime')?.value;

    if (!startDate || !endDate) return null;

    const startIso = this.combineDateTime(startDate, startTime, '00:00:00');
    const endIso = this.combineDateTime(endDate, endTime, '23:59:59');

    const startMs = new Date(startIso).getTime();
    const endMs = new Date(endIso).getTime();

    if (isNaN(startMs) || isNaN(endMs)) {
      return { invalidDateFormat: true };
    }

    if (startMs >= endMs) {
      return { periodOrder: 'End date and time must be strictly after Start date and time.' };
    }

    if (this.subEndMax && endDate > this.subEndMax) {
      return { periodSubExceeded: `Coupon end date (${endDate}) cannot exceed your active subscription end date (${this.subEndMax}).` };
    }

    return null;
  }

  get validityPeriodError(): string | null {
    if (this.couponForm.errors?.['periodSubExceeded']) {
      return this.couponForm.errors['periodSubExceeded'];
    }
    if (this.couponForm.errors?.['periodOrder']) {
      return this.couponForm.errors['periodOrder'];
    }
    return null;
  }

  /**
   * Normalizes time to HH:mm:ss ensuring 00:00:00 and seconds are supported properly
   */
  private normalizeTime(timeStr: string | null | undefined, defaultVal: '00:00:00' | '23:59:59'): string {
    if (!timeStr || !timeStr.trim()) {
      return defaultVal;
    }
    const trimmed = timeStr.trim();
    const parts = trimmed.split(':');
    if (parts.length === 2) {
      const sec = defaultVal.endsWith(':59') ? '59' : '00';
      return `${parts[0].padStart(2, '0')}:${parts[1].padStart(2, '0')}:${sec}`;
    }
    if (parts.length === 3) {
      return `${parts[0].padStart(2, '0')}:${parts[1].padStart(2, '0')}:${parts[2].padStart(2, '0')}`;
    }
    return defaultVal;
  }

  private combineDateTime(dateStr: string, timeStr: string, defaultVal: '00:00:00' | '23:59:59'): string {
    const normTime = this.normalizeTime(timeStr, defaultVal);
    return `${dateStr}T${normTime}`;
  }

  get remainingCouponsCount(): number {
    if (this.activeSubscription?.remainingCoupons !== undefined && this.activeSubscription?.remainingCoupons !== null) {
      return this.activeSubscription.remainingCoupons;
    }
    const limit = this.activeSubscription?.couponLimit || 0;
    return Math.max(0, limit - this.currentCouponsCount);
  }

  private checkEligibility(): void {
    const merchantId = this.authService.currentUserId();
    if (!merchantId) {
      this.loadingSubscription = false;
      this.cdr.markForCheck();
      return;
    }

    // 1. Check merchant status
    this.merchantService.getMerchantById(merchantId).subscribe({
      next: m => {
        this.merchantStatus = m.status;
        this.cdr.markForCheck();
      },
      error: () => {
        this.merchantStatus = 'PENDING';
        this.cdr.markForCheck();
      }
    });

    // 2. Check active subscription & dates (RULE 2, 3, 4)
    this.subscriptionService.getActiveSubscription(merchantId).subscribe({
      next: sub => {
        this.activeSubscription = sub;
        this.loadingSubscription = false;

        const today = new Date().toISOString().split('T')[0];
        const thirtyDaysLater = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

        this.subStartMin = today;
        this.subEndMax = sub.endDate ? this.formatDateForInput(sub.endDate) : '';

        // Default end date should be thirty days later or subscription end date, whichever is earlier
        let defaultEnd = thirtyDaysLater;
        if (this.subEndMax && this.subEndMax < defaultEnd) {
          defaultEnd = this.subEndMax;
        }

        this.couponForm.patchValue({
          startDate: today,
          startTime: '00:00:00',
          endDate: defaultEnd,
          endTime: '23:59:59'
        });

        // 3. Check coupon count vs plan limit (Per-subscription tracking)
        this.currentCouponsCount = sub.couponsGenerated ?? 0;
        const limit = sub.couponLimit || 10;
        this.isLimitReached = this.currentCouponsCount >= limit;
        this.cdr.markForCheck();
      },
      error: () => {
        this.activeSubscription = null;
        this.loadingSubscription = false;
        this.cdr.markForCheck();
      }
    });
  }

  private formatDateForInput(dateStr: string): string {
    const d = new Date(dateStr);
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${d.getFullYear()}-${month}-${day}`;
  }

  onCodeInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input) {
      const cleanVal = input.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
      this.couponForm.patchValue({ couponCode: cleanVal }, { emitEvent: false });
    }
  }

  onSubmit(): void {
    if (this.couponForm.invalid) {
      this.couponForm.markAllAsTouched();
      if (this.validityPeriodError) {
        this.toast.error(this.validityPeriodError, 'Invalid Validity Period');
      }
      return;
    }

    const merchantId = this.authService.currentUserId();
    if (!merchantId) {
      this.toast.error('Merchant authentication session expired');
      return;
    }

    const formVal = this.couponForm.value;

    const validFromIso = this.combineDateTime(formVal.startDate, formVal.startTime, '00:00:00');
    const validUntilIso = this.combineDateTime(formVal.endDate, formVal.endTime, '23:59:59');

    // Rule 4 Safety check: validFrom < validUntil
    const startMs = new Date(validFromIso).getTime();
    const endMs = new Date(validUntilIso).getTime();

    if (startMs >= endMs) {
      this.toast.error('End date and time must be strictly after Start date and time.', 'Invalid Period');
      return;
    }

    if (!this.activeSubscription || this.activeSubscription.status !== 'ACTIVE') {
      this.toast.error('No active subscription. Please purchase a subscription plan to create coupons.', 'Subscription Required');
      return;
    }

    if (this.isLimitReached) {
      this.toast.error('Coupon creation limit reached for your current subscription plan.', 'Limit Reached');
      return;
    }

    this.submitting = true;

    const request: CreateCouponRequest = {
      merchantId: merchantId,
      couponCode: formVal.couponCode,
      title: formVal.title,
      description: formVal.description,
      category: formVal.category,
      discount: Number(formVal.discount),
      cashbackPercentage: formVal.cashbackPercentage ? Number(formVal.cashbackPercentage) : 0,
      minimumPurchase: Number(formVal.minimumPurchase),
      validFrom: validFromIso,
      validUntil: validUntilIso,
      usageLimit: Number(formVal.usageLimit)
    };

    this.couponService.createCoupon(request).subscribe({
      next: created => {
        this.toast.success(
          `Coupon "${created.couponCode}" submitted successfully! It is now pending admin review.`
        );
        this.submitting = false;
        this.router.navigate(['/merchant/coupons']);
      },
      error: err => {
        this.toast.error(err.error?.message || 'Failed to create coupon');
        this.submitting = false;
        this.cdr.markForCheck();
      }
    });
  }
}
