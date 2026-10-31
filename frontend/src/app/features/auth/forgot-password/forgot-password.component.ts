import { Component, inject, OnDestroy, ChangeDetectorRef, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <div class="forgot-wrapper container">
      <div class="card forgot-card fade-in">
        
        <!-- STEP INDICATOR -->
        <div class="step-indicator">
          <div class="step-dot" [class.active]="step === 1" [class.done]="step > 1">
            <span>{{ step > 1 ? '✓' : '1' }}</span>
            <label>Email</label>
          </div>
          <div class="step-line" [class.filled]="step > 1"></div>
          <div class="step-dot" [class.active]="step === 2" [class.done]="step > 2">
            <span>{{ step > 2 ? '✓' : '2' }}</span>
            <label>Verify OTP</label>
          </div>
          <div class="step-line" [class.filled]="step > 2"></div>
          <div class="step-dot" [class.active]="step === 3">
            <span>3</span>
            <label>New Password</label>
          </div>
        </div>

        <!-- STEP 1: ENTER REGISTERED EMAIL -->
        @if (step === 1) {
          <div class="icon-circle">🔑</div>
          <h2 class="title">Forgot Password?</h2>
          <p class="subtitle">
            Enter your registered email address and we'll send a 6-digit verification OTP to your inbox.
          </p>

          <form [formGroup]="emailForm" (ngSubmit)="sendOtp()">
            <div class="form-group text-left">
              <label class="form-label" for="email">Registered Email Address</label>
              <input
                id="email"
                type="email"
                class="form-control"
                [class.is-invalid]="fEmail['email'].touched && fEmail['email'].invalid"
                formControlName="email"
                placeholder="name@example.com"
                autocomplete="email"
              />
              @if (fEmail['email'].touched && fEmail['email'].invalid) {
                <span class="form-text-error">Please enter a valid registered email.</span>
              }
            </div>

            @if (errorMessage) {
              <div class="alert-box error fade-in">
                <span>⚠️ {{ errorMessage }}</span>
              </div>
            }

            <button
              type="submit"
              class="btn btn-primary"
              style="width: 100%; margin-top: 1rem;"
              [disabled]="emailForm.invalid || isLoading"
            >
              @if (isLoading) {
                <span>⏳ Sending Verification Code...</span>
              } @else {
                <span>Send Verification OTP →</span>
              }
            </button>
          </form>
        }

        <!-- STEP 2: ENTER OTP CODE -->
        @if (step === 2) {
          <div class="icon-circle">✉️</div>
          <h2 class="title">Check Your Email</h2>
          <p class="subtitle">
            We sent a 6-digit verification code to<br />
            <strong class="highlight-email">{{ targetEmail }}</strong>
          </p>

          <form [formGroup]="otpForm" (ngSubmit)="verifyOtp()">
            <div class="form-group text-left">
              <label class="form-label" for="otp">Enter 6-Digit Verification Code</label>
              <input
                id="otp"
                type="text"
                class="form-control otp-input"
                [class.is-invalid]="fOtp['otp'].touched && fOtp['otp'].invalid"
                formControlName="otp"
                placeholder="123456"
                maxlength="6"
                inputmode="numeric"
                autocomplete="one-time-code"
                autofocus
              />
              @if (fOtp['otp'].touched && fOtp['otp'].invalid) {
                <span class="form-text-error">Please enter the 6-digit code.</span>
              }
            </div>

            @if (errorMessage) {
              <div class="alert-box error fade-in">
                <span>⚠️ {{ errorMessage }}</span>
              </div>
            }

            <button
              type="submit"
              class="btn btn-primary"
              style="width: 100%; margin-top: 1rem;"
              [disabled]="otpForm.invalid || isLoading"
            >
              @if (isLoading) {
                <span>⏳ Verifying Code...</span>
              } @else {
                <span>Verify Code & Continue →</span>
              }
            </button>

            <div class="otp-actions">
              <button
                type="button"
                class="btn-text-link"
                [disabled]="resendCooldown > 0 || isLoading"
                (click)="resendOtp()"
              >
                {{ resendCooldown > 0 ? ('Resend code in ' + resendCooldown + 's') : '🔄 Resend Code' }}
              </button>
              <span class="divider-dot">•</span>
              <button
                type="button"
                class="btn-text-link"
                (click)="backToEmailStep()"
              >
                Change Email
              </button>
            </div>
          </form>
        }

        <!-- STEP 3: SET NEW PASSWORD -->
        @if (step === 3) {
          <div class="icon-circle">🔐</div>
          <h2 class="title">Set New Password</h2>
          <p class="subtitle">
            Identity verified! Create a strong new password for your account.
          </p>

          <form [formGroup]="passwordForm" (ngSubmit)="resetPassword()">
            <div class="form-group text-left">
              <label class="form-label" for="newPassword">New Password (min 6 characters)</label>
              <div class="password-wrapper">
                <input
                  id="newPassword"
                  [type]="showPassword ? 'text' : 'password'"
                  class="form-control"
                  [class.is-invalid]="fPass['newPassword'].touched && fPass['newPassword'].invalid"
                  formControlName="newPassword"
                  placeholder="Enter new password"
                />
                <button
                  type="button"
                  class="btn-toggle-eye"
                  (click)="showPassword = !showPassword"
                >
                  {{ showPassword ? '🙈' : '👁️' }}
                </button>
              </div>
              @if (fPass['newPassword'].touched && fPass['newPassword'].invalid) {
                <span class="form-text-error">Password must be at least 6 characters.</span>
              }
            </div>

            <div class="form-group text-left">
              <label class="form-label" for="confirmPassword">Confirm New Password</label>
              <div class="password-wrapper">
                <input
                  id="confirmPassword"
                  [type]="showConfirm ? 'text' : 'password'"
                  class="form-control"
                  [class.is-invalid]="fPass['confirmPassword'].touched && (fPass['confirmPassword'].invalid || passwordMismatch)"
                  formControlName="confirmPassword"
                  placeholder="Confirm new password"
                />
                <button
                  type="button"
                  class="btn-toggle-eye"
                  (click)="showConfirm = !showConfirm"
                >
                  {{ showConfirm ? '🙈' : '👁️' }}
                </button>
              </div>
              @if (passwordMismatch && fPass['confirmPassword'].touched) {
                <span class="form-text-error">Passwords do not match.</span>
              }
            </div>

            @if (errorMessage) {
              <div class="alert-box error fade-in">
                <span>⚠️ {{ errorMessage }}</span>
              </div>
            }

            <button
              type="submit"
              class="btn btn-primary"
              style="width: 100%; margin-top: 1rem;"
              [disabled]="passwordForm.invalid || passwordMismatch || isLoading"
            >
              @if (isLoading) {
                <span>⏳ Updating Password...</span>
              } @else {
                <span>Change Password & Sign In →</span>
              }
            </button>
          </form>
        }

        <div class="back-link">
          <a routerLink="/login">← Back to Sign In</a>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .forgot-wrapper {
      min-height: calc(100vh - 72px);
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 2rem 1rem;
    }

    .forgot-card {
      width: 100%;
      max-width: 460px;
      padding: 2.25rem 2rem;
      text-align: center;
      border-radius: var(--radius-xl, 16px);
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.08);
      background: var(--surface, #ffffff);
      border: 1px solid var(--border, #e2e8f0);
    }

    /* STEP INDICATOR */
    .step-indicator {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 2rem;
      padding: 0 0.5rem;
    }

    .step-dot {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.25rem;
    }

    .step-dot span {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      background: var(--surface-alt, #f1f5f9);
      color: var(--text-muted, #64748b);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.875rem;
      font-weight: 700;
      border: 2px solid var(--border, #cbd5e1);
      transition: all 0.2s ease;
    }

    .step-dot label {
      font-size: 0.6875rem;
      font-weight: 600;
      color: var(--text-muted, #64748b);
      text-transform: uppercase;
      letter-spacing: 0.03em;
    }

    .step-dot.active span {
      background: var(--primary, #2563eb);
      color: #ffffff;
      border-color: var(--primary, #2563eb);
      box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.2);
    }

    .step-dot.active label {
      color: var(--primary, #2563eb);
      font-weight: 700;
    }

    .step-dot.done span {
      background: #10b981;
      color: #ffffff;
      border-color: #10b981;
    }

    .step-line {
      flex: 1;
      height: 2px;
      background: var(--border, #cbd5e1);
      margin: 0 0.5rem 1.25rem 0.5rem;
      transition: background 0.3s ease;
    }

    .step-line.filled {
      background: #10b981;
    }

    .icon-circle {
      font-size: 2.75rem;
      margin-bottom: 0.75rem;
      line-height: 1;
    }

    .title {
      font-size: 1.5rem;
      font-weight: 800;
      color: var(--text-main, #0f172a);
      margin-bottom: 0.375rem;
    }

    .subtitle {
      font-size: 0.9375rem;
      color: var(--text-muted, #64748b);
      margin-bottom: 1.5rem;
      line-height: 1.45;
    }

    .highlight-email {
      color: var(--primary, #2563eb);
      word-break: break-all;
    }

    .text-left { text-align: left; }

    .otp-input {
      text-align: center;
      font-size: 1.5rem;
      font-weight: 800;
      letter-spacing: 0.4em;
      padding: 0.75rem 1rem;
      font-family: monospace;
    }

    .password-wrapper {
      position: relative;
    }

    .btn-toggle-eye {
      position: absolute;
      right: 0.75rem;
      top: 50%;
      transform: translateY(-50%);
      background: none;
      border: none;
      cursor: pointer;
      font-size: 1.1rem;
      padding: 0.25rem;
    }

    .otp-actions {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.75rem;
      margin-top: 1.25rem;
      font-size: 0.875rem;
    }

    .btn-text-link {
      background: none;
      border: none;
      color: var(--primary, #2563eb);
      font-weight: 600;
      cursor: pointer;
      padding: 0;
      font-size: 0.875rem;
    }

    .btn-text-link:disabled {
      color: var(--text-muted, #94a3b8);
      cursor: not-allowed;
    }

    .divider-dot {
      color: var(--text-muted, #cbd5e1);
    }

    .alert-box {
      padding: 0.75rem 1rem;
      border-radius: var(--radius-md, 8px);
      font-size: 0.875rem;
      margin-top: 1rem;
      text-align: left;
    }

    .alert-box.error {
      background: #fef2f2;
      color: #991b1b;
      border: 1px solid #fecaca;
    }

    .back-link {
      margin-top: 1.75rem;
      font-size: 0.875rem;
    }

    .back-link a {
      color: var(--text-muted, #64748b);
      text-decoration: none;
      font-weight: 600;
      transition: color 0.15s ease;
    }

    .back-link a:hover {
      color: var(--primary, #2563eb);
    }
  `]
})
export class ForgotPasswordComponent implements OnDestroy {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly ngZone = inject(NgZone);

  step: 1 | 2 | 3 = 1;
  isLoading = false;
  errorMessage = '';

  targetEmail = '';
  verifiedOtp = '';

  showPassword = false;
  showConfirm = false;

  resendCooldown = 0;
  private cooldownInterval: any = null;

  // Step 1 Form
  emailForm: FormGroup = this.fb.group({
    email: ['', [Validators.required, Validators.email]]
  });

  // Step 2 Form
  otpForm: FormGroup = this.fb.group({
    otp: ['', [Validators.required, Validators.minLength(6), Validators.maxLength(6)]]
  });

  // Step 3 Form
  passwordForm: FormGroup = this.fb.group({
    newPassword: ['', [Validators.required, Validators.minLength(6)]],
    confirmPassword: ['', [Validators.required]]
  });

  get fEmail() { return this.emailForm.controls; }
  get fOtp() { return this.otpForm.controls; }
  get fPass() { return this.passwordForm.controls; }

  get passwordMismatch(): boolean {
    const p1 = this.passwordForm.get('newPassword')?.value;
    const p2 = this.passwordForm.get('confirmPassword')?.value;
    return Boolean(p1 && p2 && p1 !== p2);
  }

  ngOnDestroy(): void {
    if (this.cooldownInterval) clearInterval(this.cooldownInterval);
  }

  sendOtp(): void {
    if (this.emailForm.invalid) return;

    this.isLoading = true;
    this.errorMessage = '';
    const email = this.emailForm.value.email.trim();
    this.cdr.detectChanges();

    this.authService.forgotPassword({ email }).subscribe({
      next: res => {
        this.ngZone.run(() => {
          this.isLoading = false;
          this.targetEmail = email;
          this.step = 2;
          this.startCooldown();
          this.toast.success(res.message || 'Verification code sent to your registered email!', 'OTP Dispatched');
          this.cdr.detectChanges();
        });
      },
      error: err => {
        this.ngZone.run(() => {
          this.isLoading = false;
          this.errorMessage = err.error?.message || err.message || 'No registered account found with that email address.';
          this.toast.error(this.errorMessage, 'Error');
          this.cdr.detectChanges();
        });
      }
    });
  }

  resendOtp(): void {
    if (this.resendCooldown > 0 || !this.targetEmail) return;

    this.isLoading = true;
    this.errorMessage = '';
    this.cdr.detectChanges();

    this.authService.forgotPassword({ email: this.targetEmail }).subscribe({
      next: res => {
        this.ngZone.run(() => {
          this.isLoading = false;
          this.startCooldown();
          this.toast.success(res.message || 'A new verification code has been sent to your email.', 'Code Resent');
          this.cdr.detectChanges();
        });
      },
      error: err => {
        this.ngZone.run(() => {
          this.isLoading = false;
          this.errorMessage = err.error?.message || 'Failed to resend code. Please try again later.';
          this.toast.error(this.errorMessage, 'Resend Failed');
          this.cdr.detectChanges();
        });
      }
    });
  }

  verifyOtp(): void {
    if (this.otpForm.invalid) return;

    this.isLoading = true;
    this.errorMessage = '';
    const otp = this.otpForm.value.otp.trim();
    this.cdr.detectChanges();

    this.authService.verifyForgotPasswordOtp(this.targetEmail, otp).subscribe({
      next: res => {
        this.ngZone.run(() => {
          this.isLoading = false;
          this.verifiedOtp = otp;
          this.step = 3;
          this.toast.success('Code verified! Please enter your new password.', 'Identity Verified');
          this.cdr.detectChanges();
        });
      },
      error: err => {
        this.ngZone.run(() => {
          this.isLoading = false;
          this.errorMessage = err.error?.message || err.message || 'Invalid or expired verification code.';
          this.toast.error(this.errorMessage, 'Verification Failed');
          this.cdr.detectChanges();
        });
      }
    });
  }

  resetPassword(): void {
    if (this.passwordForm.invalid || this.passwordMismatch) return;

    this.isLoading = true;
    this.errorMessage = '';
    const newPassword = this.passwordForm.value.newPassword;
    this.cdr.detectChanges();

    this.authService.resetPassword({
      token: this.verifiedOtp,
      email: this.targetEmail,
      newPassword: newPassword
    }).subscribe({
      next: res => {
        this.ngZone.run(() => {
          this.isLoading = false;
          this.toast.success('Your password has been changed successfully! Please log in.', 'Password Reset Success');
          this.router.navigate(['/login']);
          this.cdr.detectChanges();
        });
      },
      error: err => {
        this.ngZone.run(() => {
          this.isLoading = false;
          this.errorMessage = err.error?.message || 'Failed to update password. Please try again.';
          this.toast.error(this.errorMessage, 'Reset Failed');
          this.cdr.detectChanges();
        });
      }
    });
  }

  backToEmailStep(): void {
    this.step = 1;
    this.errorMessage = '';
    this.cdr.detectChanges();
  }

  private startCooldown(): void {
    this.resendCooldown = 60;
    if (this.cooldownInterval) clearInterval(this.cooldownInterval);
    this.cooldownInterval = setInterval(() => {
      this.ngZone.run(() => {
        this.resendCooldown--;
        if (this.resendCooldown <= 0) {
          clearInterval(this.cooldownInterval);
        }
        this.cdr.detectChanges();
      });
    }, 1000);
  }
}
