import { Component, inject, ChangeDetectorRef, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterLink],
  templateUrl: './register.component.html',
  styleUrl: './register.component.css'
})
export class RegisterComponent implements OnDestroy {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);
  private readonly cdr = inject(ChangeDetectorRef);

  accountType: 'CUSTOMER' | 'MERCHANT' = 'CUSTOMER';
  isLoading = false;
  errorMessage = '';

  // OTP Verification State
  isOtpStep = false;
  otpValue = '';
  pendingEmail = '';
  pendingName = '';
  otpError = '';
  isVerifyingOtp = false;
  isResendingOtp = false;
  resendCountdown = 0;
  private resendTimer: any = null;

  // Password visibility states (Feature 3: initially false = type="password")
  showCustomerPassword = false;
  showMerchantPassword = false;

  customerForm: FormGroup = this.fb.group({
    name: ['', [Validators.required]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
    phone: ['', [Validators.required]],
    preferences: ['']
  });

  merchantForm: FormGroup = this.fb.group({
    businessName: ['', [Validators.required]],
    ownerName: ['', [Validators.required]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
    phone: ['', [Validators.required]],
    category: ['', [Validators.required]],
    address: [''],
    description: ['']
  });

  get cf() { return this.customerForm.controls; }
  get mf() { return this.merchantForm.controls; }

  setAccountType(type: 'CUSTOMER' | 'MERCHANT'): void {
    this.accountType = type;
    this.errorMessage = '';
  }

  toggleCustomerPassword(): void {
    this.showCustomerPassword = !this.showCustomerPassword;
  }

  toggleMerchantPassword(): void {
    this.showMerchantPassword = !this.showMerchantPassword;
  }

  ngOnDestroy(): void {
    if (this.resendTimer) {
      clearInterval(this.resendTimer);
    }
  }

  onCustomerSubmit(): void {
    if (this.customerForm.invalid) {
      this.customerForm.markAllAsTouched();
      return;
    }

    this.pendingEmail = this.customerForm.value.email;
    this.pendingName = this.customerForm.value.name;
    this.sendOtpAndShowStep();
  }

  onMerchantSubmit(): void {
    if (this.merchantForm.invalid) {
      this.merchantForm.markAllAsTouched();
      return;
    }

    this.pendingEmail = this.merchantForm.value.email;
    this.pendingName = this.merchantForm.value.ownerName;
    this.sendOtpAndShowStep();
  }

  private sendOtpAndShowStep(): void {
    this.isLoading = true;
    this.errorMessage = '';
    this.cdr.detectChanges();

    this.authService.sendOtp(this.pendingEmail, this.pendingName).subscribe({
      next: () => {
        this.isLoading = false;
        this.isOtpStep = true;
        this.otpValue = '';
        this.otpError = '';
        this.startResendTimer();
        this.cdr.detectChanges();
      },
      error: err => {
        this.isLoading = false;
        this.errorMessage = err.message || 'Failed to dispatch verification code. Please try again.';
        this.cdr.detectChanges();
      }
    });
  }

  startResendTimer(): void {
    if (this.resendTimer) {
      clearInterval(this.resendTimer);
    }
    this.resendCountdown = 30;
    this.resendTimer = setInterval(() => {
      this.resendCountdown--;
      if (this.resendCountdown <= 0) {
        clearInterval(this.resendTimer);
        this.resendTimer = null;
      }
      this.cdr.detectChanges();
    }, 1000);
  }

  resendOtp(): void {
    if (this.resendCountdown > 0 || this.isResendingOtp) return;

    this.isResendingOtp = true;
    this.otpError = '';
    this.cdr.detectChanges();

    this.authService.sendOtp(this.pendingEmail, this.pendingName).subscribe({
      next: () => {
        this.isResendingOtp = false;
        this.startResendTimer();
        this.toast.info(`New code sent to ${this.pendingEmail}`, 'Code Resent');
        this.cdr.detectChanges();
      },
      error: err => {
        this.isResendingOtp = false;
        this.otpError = err.message || 'Failed to resend code.';
        this.cdr.detectChanges();
      }
    });
  }

  backToForm(): void {
    this.isOtpStep = false;
    this.otpValue = '';
    this.otpError = '';
    if (this.resendTimer) {
      clearInterval(this.resendTimer);
      this.resendTimer = null;
    }
    this.cdr.detectChanges();
  }

  verifyAndRegister(): void {
    if (!this.otpValue || this.otpValue.trim().length !== 6) {
      this.otpError = 'Please enter the complete 6-digit verification code.';
      return;
    }

    this.isVerifyingOtp = true;
    this.otpError = '';
    this.cdr.detectChanges();

    this.authService.verifyOtp(this.pendingEmail, this.otpValue.trim()).subscribe({
      next: () => {
        // OTP verified successfully! Now complete registration
        if (this.accountType === 'CUSTOMER') {
          this.completeCustomerRegistration();
        } else {
          this.completeMerchantRegistration();
        }
      },
      error: err => {
        this.isVerifyingOtp = false;
        this.otpError = err.message || 'Invalid or expired verification code.';
        this.cdr.detectChanges();
      }
    });
  }

  private completeCustomerRegistration(): void {
    this.authService.registerCustomer(this.customerForm.value).subscribe({
      next: () => {
        this.isVerifyingOtp = false;
        this.toast.success('Registration successful! Welcome to Deals & Coupons.', 'Account Created');
        this.router.navigate(['/customer/dashboard']);
      },
      error: err => {
        this.isVerifyingOtp = false;
        this.otpError = err.message || 'Failed to finalize customer registration.';
        this.cdr.detectChanges();
      }
    });
  }

  private completeMerchantRegistration(): void {
    this.authService.registerMerchant(this.merchantForm.value).subscribe({
      next: () => {
        this.isVerifyingOtp = false;
        this.toast.info('Your merchant account application is pending review by Admin.', 'Pending Approval');
        this.router.navigate(['/login']);
      },
      error: err => {
        this.isVerifyingOtp = false;
        this.otpError = err.message || 'Failed to finalize merchant registration.';
        this.cdr.detectChanges();
      }
    });
  }
}
