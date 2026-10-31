import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <div class="reset-wrapper container">
      <div class="card reset-card fade-in">
        <div class="icon-circle">🔐</div>
        <h2 class="title">Reset Your Password</h2>
        <p class="subtitle">Enter your 6-digit verification OTP and your desired new password. Need an OTP? <a routerLink="/forgot-password" class="text-primary font-bold">Request here</a></p>

        <form [formGroup]="resetForm" (ngSubmit)="onSubmit()">
          <div class="form-group text-left">
            <label class="form-label" for="token">Verification OTP Code *</label>
            <input
              id="token"
              type="text"
              class="form-control"
              [class.is-invalid]="f['token'].touched && f['token'].invalid"
              formControlName="token"
              placeholder="Enter 6-digit code received on email"
            />
            @if (f['token'].touched && f['token'].invalid) {
              <span class="form-text-error">Verification OTP is required.</span>
            }
          </div>

          <div class="form-group text-left">
            <label class="form-label" for="newPassword">New Password (min 6 characters) *</label>
            <input
              id="newPassword"
              type="password"
              class="form-control"
              [class.is-invalid]="f['newPassword'].touched && f['newPassword'].invalid"
              formControlName="newPassword"
              placeholder="At least 6 characters"
            />
            @if (f['newPassword'].touched && f['newPassword'].invalid) {
              <span class="form-text-error">Password must be at least 6 characters.</span>
            }
          </div>

          <button
            type="submit"
            class="btn btn-primary"
            style="width: 100%; margin-top: 1rem;"
            [disabled]="resetForm.invalid || isLoading"
          >
            @if (isLoading) {
              <span>Updating Password...</span>
            } @else {
              <span>Confirm New Password →</span>
            }
          </button>
        </form>

        <div class="back-link">
          <a routerLink="/login">← Back to Sign In</a>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .reset-wrapper {
      min-height: calc(100vh - 72px);
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 2rem 1rem;
    }

    .reset-card {
      width: 100%;
      max-width: 440px;
      padding: 2.5rem;
      text-align: center;
    }

    .icon-circle {
      font-size: 3rem;
      margin-bottom: 1rem;
    }

    .title {
      font-size: 1.5rem;
      font-weight: 800;
      margin-bottom: 0.375rem;
    }

    .subtitle {
      font-size: 0.9375rem;
      color: var(--text-muted);
      margin-bottom: 1.75rem;
    }

    .text-left { text-align: left; }

    .back-link {
      margin-top: 1.5rem;
      font-size: 0.875rem;
    }
  `]
})
export class ResetPasswordComponent {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);

  resetForm: FormGroup = this.fb.group({
    token: ['', [Validators.required]],
    newPassword: ['', [Validators.required, Validators.minLength(6)]]
  });

  isLoading = false;

  get f() { return this.resetForm.controls; }

  onSubmit(): void {
    if (this.resetForm.invalid) return;

    this.isLoading = true;
    this.authService.resetPassword(this.resetForm.value).subscribe({
      next: res => {
        this.isLoading = false;
        this.toast.success(res.message || 'Password updated successfully! Please sign in.', 'Password Reset');
        this.router.navigate(['/login']);
      },
      error: err => {
        this.isLoading = false;
        const msg = err.error?.message || 'Invalid or expired reset token.';
        this.toast.error(msg, 'Reset Failed');
      }
    });
  }
}
