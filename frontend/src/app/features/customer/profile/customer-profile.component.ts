import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { CustomerService } from '../../../core/services/customer.service';
import { PointsService } from '../../../core/services/points.service';
import { CashbackService } from '../../../core/services/cashback.service';
import { RedemptionService } from '../../../core/services/redemption.service';
import { ToastService } from '../../../core/services/toast.service';
import { CustomerResponse } from '../../../core/models/customer.models';
import { PointAccountResponse, CustomerTierResponse, WalletResponse } from '../../../core/models/points-wallet.models';

@Component({
  selector: 'app-customer-profile',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './customer-profile.component.html',
  styleUrl: './customer-profile.component.css'
})
export class CustomerProfileComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  readonly authService = inject(AuthService);
  private readonly customerService = inject(CustomerService);
  private readonly pointsService = inject(PointsService);
  private readonly cashbackService = inject(CashbackService);
  private readonly redemptionService = inject(RedemptionService);
  private readonly toast = inject(ToastService);
  private readonly cdr = inject(ChangeDetectorRef);

  customer: CustomerResponse | null = null;
  pointAccount: PointAccountResponse | null = null;
  tier: CustomerTierResponse | null = null;
  wallet: WalletResponse | null = null;
  totalRedemptionsCount = 0;
  isSaving = false;

  profileForm: FormGroup = this.fb.group({
    name: ['', [Validators.required]],
    phone: ['', [Validators.required]],
    preferences: ['']
  });

  get f() { return this.profileForm.controls; }

  get tierDisplayName(): string {
    if (!this.tier?.tier || this.tier.tier === 'NO_TIER') return 'Bronze';
    const t = this.tier.tier;
    return t.charAt(0).toUpperCase() + t.slice(1).toLowerCase();
  }

  get tierMultiplier(): string {
    const t = this.tier?.tier;
    if (t === 'PLATINUM') return '2.5x';
    if (t === 'GOLD') return '2.0x';
    if (t === 'SILVER') return '1.5x';
    return '1.0x';
  }

  ngOnInit(): void {
    const customerId = this.authService.currentUserId();
    if (customerId) {
      this.loadCustomerDetails(customerId);
      this.loadFinancialAndLoyalty(customerId);
    }
  }

  private loadCustomerDetails(customerId: number): void {
    this.customerService.getCustomer(customerId).subscribe({
      next: res => {
        this.customer = res;
        this.profileForm.patchValue({
          name: res.name,
          phone: res.phone,
          preferences: res.preferences || ''
        });
        this.cdr.markForCheck();
      },
      error: () => {
        const user = this.authService.currentUser();
        if (user) {
          this.profileForm.patchValue({
            name: user.name,
            phone: '9876543210',
            preferences: 'Food & Dining, Electronics'
          });
        }
        this.cdr.markForCheck();
      }
    });
  }

  private loadFinancialAndLoyalty(customerId: number): void {
    // 1. Point Account
    this.pointsService.getPointAccount(customerId).subscribe({
      next: pts => {
        this.pointAccount = pts;
        this.cdr.markForCheck();
      },
      error: () => {}
    });

    // 2. Loyalty Tier
    this.pointsService.getCustomerTier(customerId).subscribe({
      next: t => {
        this.tier = t;
        this.cdr.markForCheck();
      },
      error: () => {
        this.tier = {
          customerId,
          tier: 'BRONZE',
          totalPoints: 0,
          pointsRequiredForNextTier: 500
        };
        this.cdr.markForCheck();
      }
    });

    // 3. Cashback Wallet
    this.cashbackService.getWallet(customerId).subscribe({
      next: w => {
        this.wallet = w;
        this.cdr.markForCheck();
      },
      error: () => {}
    });

    // 4. Redemptions Count
    this.redemptionService.getMyRedemptionHistory(0, 10, customerId).subscribe({
      next: res => {
        this.totalRedemptionsCount = res.totalElements || (res.content ? res.content.length : 0);
        this.cdr.markForCheck();
      },
      error: () => {
        this.totalRedemptionsCount = 0;
      }
    });
  }

  onSubmit(): void {
    if (this.profileForm.invalid) return;
    const customerId = this.authService.currentUserId();
    if (!customerId) return;

    this.isSaving = true;
    this.cdr.markForCheck();

    this.customerService.updateCustomer(customerId, this.profileForm.value).subscribe({
      next: updated => {
        this.isSaving = false;
        this.customer = updated;
        this.toast.success('Your customer profile details have been saved!', 'Profile Updated');
        this.cdr.markForCheck();
      },
      error: err => {
        this.isSaving = false;
        const msg = err.error?.message || 'Failed to update profile.';
        this.toast.error(msg, 'Update Error');
        this.cdr.markForCheck();
      }
    });
  }

  formatDate(dateStr?: string): string {
    if (!dateStr) return 'Recently';
    try {
      return new Date(dateStr).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
    } catch {
      return dateStr;
    }
  }
}
