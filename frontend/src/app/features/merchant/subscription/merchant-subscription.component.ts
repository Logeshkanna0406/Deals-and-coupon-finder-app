import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';
import { SubscriptionService } from '../../../core/services/subscription.service';
import { PaymentService } from '../../../core/services/payment.service';
import { CouponService } from '../../../core/services/coupon.service';
import { MerchantService } from '../../../core/services/merchant.service';
import { ToastService } from '../../../core/services/toast.service';
import {
  SubscriptionPlanResponse,
  SubscriptionResponse
} from '../../../core/models/subscription.models';
import { CouponResponse } from '../../../core/models/coupon.models';
import { MerchantResponse } from '../../../core/models/merchant.models';
import { StatusBadgeComponent } from '../../../shared/components/status-badge/status-badge.component';
import { LoadingSkeletonComponent } from '../../../shared/components/loading-skeleton/loading-skeleton.component';

@Component({
  selector: 'app-merchant-subscription',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, StatusBadgeComponent, LoadingSkeletonComponent],
  templateUrl: './merchant-subscription.component.html',
  styleUrl: './merchant-subscription.component.css'
})
export class MerchantSubscriptionComponent implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly subService = inject(SubscriptionService);
  private readonly paymentService = inject(PaymentService);
  private readonly couponService = inject(CouponService);
  private readonly merchantService = inject(MerchantService);
  private readonly toast = inject(ToastService);
  private readonly router = inject(Router);
  private readonly cdr = inject(ChangeDetectorRef);

  // Merchant Profile & Approval status
  merchantProfile: MerchantResponse | null = null;
  isLoadingProfile = true;

  get isApproved(): boolean {
    return this.merchantProfile?.status === 'APPROVED';
  }

  // Plans catalog
  plans: SubscriptionPlanResponse[] = [];
  isLoadingPlans = true;

  // Active recharge pack
  activeSubscription: SubscriptionResponse | null = null;
  publishedDealsCount = 0;

  // All applied subscriptions (Recharge queue & history)
  allSubscriptions: SubscriptionResponse[] = [];
  upcomingSubscriptions: SubscriptionResponse[] = [];
  pastSubscriptions: SubscriptionResponse[] = [];
  isLoadingSubscriptions = true;

  // Tab filtering for subscription packs
  activeTab: 'all' | 'active_queued' | 'expired' = 'all';

  // Selected Plan for Bottom Checkout Section
  selectedPlan: SubscriptionPlanResponse | null = null;
  paymentMethod = 'UPI';
  upiId = 'merchant@okhdfcbank';
  isPurchasing = false;

  // Manual Plan Activation state
  activatingSubId: number | null = null;

  // Expandable Coupons Drawers (Isolated states for active hero pack vs queue cards)
  isActivePackExpanded = false;
  expandedQueueSubId: number | null = null;
  couponsBySubId: { [subId: number]: CouponResponse[] } = {};
  loadingCouponsForSub: { [subId: number]: boolean } = {};

  get remainingDealsCount(): number {
    if (this.activeSubscription?.remainingCoupons !== undefined && this.activeSubscription?.remainingCoupons !== null) {
      return this.activeSubscription.remainingCoupons;
    }
    const limit = this.activeSubscription?.couponLimit || 0;
    return Math.max(0, limit - this.publishedDealsCount);
  }

  get quotaUsagePercentage(): number {
    const limit = this.activeSubscription?.couponLimit || 0;
    if (limit <= 0) return 0;
    return Math.min(100, Math.round((this.publishedDealsCount / limit) * 100));
  }

  get filteredSubscriptions(): SubscriptionResponse[] {
    if (this.activeTab === 'active_queued') {
      return this.allSubscriptions.filter(s => s.status === 'ACTIVE' || s.status === 'SCHEDULED' || s.status === 'PENDING_VERIFICATION');
    } else if (this.activeTab === 'expired') {
      return this.allSubscriptions.filter(s => s.status === 'EXPIRED' || s.status === 'CANCELLED');
    }
    return this.allSubscriptions;
  }

  ngOnInit(): void {
    this.loadMerchantProfile();
    this.loadPlans();
    this.loadActiveSubscription();
    this.loadAllSubscriptions();
  }

  loadMerchantProfile(): void {
    const merchantId = this.authService.currentUserId();
    if (!merchantId) {
      this.isLoadingProfile = false;
      return;
    }
    this.isLoadingProfile = true;
    this.merchantService.getMerchantById(merchantId).subscribe({
      next: profile => {
        this.merchantProfile = profile;
        this.isLoadingProfile = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.isLoadingProfile = false;
        this.cdr.markForCheck();
      }
    });
  }

  loadPlans(): void {
    this.isLoadingPlans = true;
    this.cdr.markForCheck();
    this.subService.getAllPlans().subscribe({
      next: data => {
        this.plans = [...(data || [])];
        this.isLoadingPlans = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.isLoadingPlans = false;
        this.toast.error('Failed to load subscription plans');
        this.cdr.markForCheck();
      }
    });
  }

  loadActiveSubscription(): void {
    const merchantId = this.authService.currentUserId();
    if (!merchantId) return;

    this.subService.getActiveSubscription(merchantId).subscribe({
      next: res => {
        this.activeSubscription = res;
        this.publishedDealsCount = res.couponsGenerated ?? 0;
        this.cdr.markForCheck();
      },
      error: () => {
        this.activeSubscription = null;
        this.publishedDealsCount = 0;
        this.cdr.markForCheck();
      }
    });
  }

  loadAllSubscriptions(): void {
    const merchantId = this.authService.currentUserId();
    if (!merchantId) return;

    this.isLoadingSubscriptions = true;
    this.cdr.markForCheck();

    this.subService.getSubscriptionsByMerchant(merchantId).subscribe({
      next: subs => {
        const list = subs || [];
        // Sort priority: ACTIVE first, then SCHEDULED, then newest
        this.allSubscriptions = [...list].sort((a, b) => {
          if (a.status === 'ACTIVE') return -1;
          if (b.status === 'ACTIVE') return 1;
          if (a.status === 'SCHEDULED' && b.status !== 'SCHEDULED') return -1;
          if (b.status === 'SCHEDULED' && a.status !== 'SCHEDULED') return 1;
          return (b.subscriptionId || 0) - (a.subscriptionId || 0);
        });
        this.upcomingSubscriptions = this.allSubscriptions.filter(s => s.status === 'SCHEDULED');
        this.pastSubscriptions = this.allSubscriptions.filter(s => s.status === 'EXPIRED' || s.status === 'CANCELLED');
        this.isLoadingSubscriptions = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.allSubscriptions = [];
        this.upcomingSubscriptions = [];
        this.pastSubscriptions = [];
        this.isLoadingSubscriptions = false;
        this.cdr.markForCheck();
      }
    });
  }

  // --- Real-Time Recharge Metaphor Quota Helpers ---

  getPlanDealsUsed(sub: SubscriptionResponse): number {
    return sub.couponsGenerated ?? 0;
  }

  getPlanDealsLimit(sub: SubscriptionResponse): number {
    return sub.couponLimit ?? 0;
  }

  getPlanDealsRemaining(sub: SubscriptionResponse): number {
    if (sub.remainingCoupons !== undefined && sub.remainingCoupons !== null) {
      return sub.remainingCoupons;
    }
    const limit = sub.couponLimit || 0;
    const used = sub.couponsGenerated || 0;
    return Math.max(0, limit - used);
  }

  getPlanUsagePercentage(sub: SubscriptionResponse): number {
    const limit = sub.couponLimit || 0;
    if (limit <= 0) return 0;
    const used = sub.couponsGenerated || 0;
    return Math.min(100, Math.round((used / limit) * 100));
  }

  getDaysRemaining(endDateStr?: string): number {
    if (!endDateStr) return 0;
    const end = new Date(endDateStr);
    const now = new Date();
    // Zero out hours for date-only comparison
    end.setHours(23, 59, 59, 999);
    const diffTime = end.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(0, diffDays);
  }

  isExpiringSoon(endDateStr?: string): boolean {
    const days = this.getDaysRemaining(endDateStr);
    return days > 0 && days <= 5;
  }

  // --- Manual Plan Activation ("Activate What Plan to Use") ---

  activatePlan(sub: SubscriptionResponse): void {
    const merchantId = this.authService.currentUserId();
    if (!merchantId) {
      this.toast.error('Merchant session expired. Please log in again.');
      return;
    }

    if (!this.isApproved) {
      const status = this.merchantProfile?.status || 'PENDING';
      this.toast.error(
        `Only approved merchants can activate subscription plans. (Current status: ${status})`,
        'Approval Required'
      );
      return;
    }

    if (this.activatingSubId) return;

    const confirmMsg = this.activeSubscription
      ? `Activate ${sub.planName} Tier now? Your current active ${this.activeSubscription.planName} plan will be superseded, and this pack will become ACTIVE immediately with fresh validity.`
      : `Activate ${sub.planName} Tier immediately as your active recharge pack?`;

    if (!confirm(confirmMsg)) {
      return;
    }

    this.activatingSubId = sub.subscriptionId;
    this.cdr.markForCheck();

    this.subService.activateSubscription(sub.subscriptionId, merchantId).subscribe({
      next: updated => {
        this.activatingSubId = null;
        this.toast.success(
          `⚡ ${sub.planName} Tier is now ACTIVE! Validity reset from today with full deal quota.`,
          'Recharge Pack Activated'
        );
        this.loadActiveSubscription();
        this.loadAllSubscriptions();
        this.cdr.markForCheck();
      },
      error: err => {
        this.activatingSubId = null;
        const msg = err.error?.message || 'Failed to activate the requested subscription pack.';
        this.toast.error(msg, 'Activation Failed');
        this.cdr.markForCheck();
      }
    });
  }

  // --- Coupons Under Subscription Plan Drawer/Accordion ---

  toggleActivePackCoupons(): void {
    this.isActivePackExpanded = !this.isActivePackExpanded;
    if (this.isActivePackExpanded && this.activeSubscription?.subscriptionId) {
      this.fetchCouponsForSub(this.activeSubscription.subscriptionId);
    }
    this.cdr.markForCheck();
  }

  isQueueSubExpanded(subId: number): boolean {
    return this.expandedQueueSubId === subId;
  }

  toggleQueueSubscriptionCoupons(subId: number): void {
    if (this.expandedQueueSubId === subId) {
      this.expandedQueueSubId = null;
      this.cdr.markForCheck();
      return;
    }

    this.expandedQueueSubId = subId;
    this.fetchCouponsForSub(subId);
    this.cdr.markForCheck();
  }

  private fetchCouponsForSub(subId: number): void {
    if (this.couponsBySubId[subId]) {
      return;
    }

    this.loadingCouponsForSub[subId] = true;
    this.cdr.markForCheck();

    this.couponService.getCouponsBySubscription(subId).subscribe({
      next: coupons => {
        this.couponsBySubId[subId] = coupons || [];
        this.loadingCouponsForSub[subId] = false;
        this.cdr.markForCheck();
      },
      error: () => {
        // Fallback: If subscription endpoint returns 404 or fails, query merchant coupons
        const merchantId = this.authService.currentUserId();
        if (merchantId) {
          this.couponService.getCouponsByMerchant(merchantId).subscribe({
            next: allCoupons => {
              this.couponsBySubId[subId] = (allCoupons || []).filter(c => c.subscriptionId === subId);
              this.loadingCouponsForSub[subId] = false;
              this.cdr.markForCheck();
            },
            error: () => {
              this.couponsBySubId[subId] = [];
              this.loadingCouponsForSub[subId] = false;
              this.cdr.markForCheck();
            }
          });
        } else {
          this.couponsBySubId[subId] = [];
          this.loadingCouponsForSub[subId] = false;
          this.cdr.markForCheck();
        }
      }
    });
  }

  // --- Plan Catalog & Checkout ---

  selectPlan(plan: SubscriptionPlanResponse): void {
    if (!this.isApproved) {
      const status = this.merchantProfile?.status || 'PENDING';
      this.toast.warning(
        `Your merchant account is currently ${status}. You can purchase and recharge plans once approved by admin.`,
        'Admin Approval Required'
      );
      return;
    }
    this.selectedPlan = plan;
    this.cdr.detectChanges();
    this.scrollToPayment();
  }

  onSelectButtonClick(event: Event, plan: SubscriptionPlanResponse): void {
    event.stopPropagation();
    if (!this.isApproved) {
      const status = this.merchantProfile?.status || 'PENDING';
      this.toast.warning(
        `Your merchant account is currently ${status}. You can purchase and recharge plans once approved by admin.`,
        'Admin Approval Required'
      );
      return;
    }
    this.selectPlan(plan);
  }

  scrollToPayment(): void {
    setTimeout(() => {
      const el = document.getElementById('paymentSection');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 60);
  }

  scrollToPlans(): void {
    setTimeout(() => {
      const el = document.getElementById('plansCatalogSection');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 60);
  }

  processCheckout(): void {
    if (!this.selectedPlan) return;
    if (!this.isApproved) {
      this.toast.error(
        'Subscription checkout locked: Your merchant account must be approved by admin before subscribing.',
        'Account Pending'
      );
      return;
    }
    const merchantId = this.authService.currentUserId();
    if (!merchantId) return;

    this.isPurchasing = true;
    this.cdr.markForCheck();

    // Step 1: Create Subscription
    this.subService.createSubscription({
      merchantId,
      planId: this.selectedPlan.planId
    }).subscribe({
      next: sub => {
        // Step 2: Create Payment (triggers RabbitMQ Saga for instant activation / scheduling)
        this.paymentService.createPayment({
          merchantId,
          subscriptionId: sub.subscriptionId,
          amount: this.selectedPlan!.price,
          paymentMethod: this.paymentMethod
        }).subscribe({
          next: pay => {
            this.isPurchasing = false;
            const chosenPlanName = this.selectedPlan!.name;
            const hadActive = !!this.activeSubscription;
            this.selectedPlan = null;
            if (hadActive) {
              this.toast.success(
                `Payment verified! Your ${chosenPlanName} plan is SCHEDULED in your recharge queue. You can activate it anytime!`,
                'Recharge Pack Scheduled'
              );
            } else {
              this.toast.success(
                `Payment verified! Subscription to ${chosenPlanName} Tier is now ACTIVE.`,
                'Recharge Pack Activated'
              );
            }
            this.loadActiveSubscription();
            this.loadAllSubscriptions();
            this.cdr.markForCheck();
            window.scrollTo({ top: 0, behavior: 'smooth' });
          },
          error: () => {
            this.isPurchasing = false;
            this.toast.error('Payment verification failed.');
            this.cdr.markForCheck();
          }
        });
      },
      error: err => {
        this.isPurchasing = false;
        const msg = err.error?.message || 'Failed to initialize subscription purchase. Ensure merchant status is APPROVED.';
        this.toast.error(msg, 'Subscription Error');
        this.cdr.markForCheck();
      }
    });
  }
}
