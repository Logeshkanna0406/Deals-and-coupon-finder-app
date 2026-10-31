import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../core/services/toast.service';
import { GoogleLoginRequest } from '../../../core/models/auth.models';
import { environment } from '../../../../environments/environment';

declare const google: any;

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterLink],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly toast = inject(ToastService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly cdr = inject(ChangeDetectorRef);

  loginForm: FormGroup = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required]]
  });

  showPassword = false;
  isLoading = false;
  errorMessage = '';

  // Google Sign-In state
  isGoogleLoading = false;

  get f() {
    return this.loginForm.controls;
  }

  ngOnInit(): void {
    // If returning from an auth guard redirect, check for messages
    const reason = this.route.snapshot.queryParams['reason'];
    if (reason === 'session_expired') {
      this.errorMessage = 'Your session expired. Please sign in again.';
    }
  }

  onSubmit(): void {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';
    this.cdr.detectChanges();

    this.authService.login(this.loginForm.value).pipe(
      finalize(() => {
        // Guarantee that loading state is immediately terminated regardless of outcome
        this.isLoading = false;
        this.cdr.detectChanges();
      })
    ).subscribe({
      next: res => {
        const returnUrl = this.route.snapshot.queryParams['returnUrl'];
        if (returnUrl) {
          this.router.navigateByUrl(returnUrl);
          return;
        }

        const role = (res.role || '').toUpperCase();
        if (role === 'ADMIN' || role === 'ROLE_ADMIN') {
          this.router.navigate(['/admin/dashboard']);
        } else if (role === 'MERCHANT' || role === 'ROLE_MERCHANT') {
          this.router.navigate(['/merchant/dashboard']);
        } else {
          this.router.navigate(['/customer/dashboard']);
        }
      },
      error: err => {
        // Display immediate error feedback both on screen banner and toast
        this.errorMessage = err?.message || 'Invalid email or password. Please check your credentials.';
        this.cdr.detectChanges();
      }
    });
  }

  triggerGoogleSignIn(): void {
    const clientId = environment.googleClientId;

    if (!clientId) {
      this.errorMessage = 'Google OAuth Client ID is required. Please check environment configuration.';
      this.cdr.detectChanges();
      return;
    }

    // Preferred: Google OAuth2 token client with prompt='select_account'
    // Opens the official Google Account Selector popup without pre-rendering the user's email on the form
    const googleOAuth = (window as any).google?.accounts?.oauth2;
    if (googleOAuth) {
      this.isGoogleLoading = true;
      this.errorMessage = '';
      this.cdr.detectChanges();

      try {
        const tokenClient = googleOAuth.initTokenClient({
          client_id: clientId,
          scope: 'email profile openid',
          prompt: 'select_account',
          callback: async (tokenResponse: any) => {
            if (tokenResponse?.error) {
              this.isGoogleLoading = false;
              if (tokenResponse.error !== 'user_closed_popup') {
                this.errorMessage = 'Google sign-in was not completed.';
              }
              this.cdr.detectChanges();
              return;
            }

            if (tokenResponse?.access_token) {
              try {
                const userRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
                  headers: { Authorization: `Bearer ${tokenResponse.access_token}` }
                });
                const userInfo = await userRes.json();
                this.submitGoogleAuth({
                  email: userInfo.email,
                  name: userInfo.name || userInfo.email?.split('@')[0] || 'Google User',
                  googleId: userInfo.sub || userInfo.id,
                  avatarUrl: userInfo.picture
                });
              } catch (e: any) {
                this.isGoogleLoading = false;
                this.errorMessage = 'Failed to retrieve profile from Google: ' + (e?.message || e);
                this.cdr.detectChanges();
              }
            } else {
              this.isGoogleLoading = false;
              this.cdr.detectChanges();
            }
          },
          error_callback: (err: any) => {
            this.isGoogleLoading = false;
            this.errorMessage = 'Google sign-in error: ' + (err?.message || err);
            this.cdr.detectChanges();
          }
        });

        tokenClient.requestAccessToken({ prompt: 'select_account' });
        return;
      } catch (err: any) {
        console.warn('OAuth2 client init warning, falling back to OneTap:', err);
      }
    }

    // Fallback: Google Identity Services One-Tap / ID prompt
    const googleId = (window as any).google?.accounts?.id;
    if (googleId) {
      this.isGoogleLoading = true;
      this.errorMessage = '';
      this.cdr.detectChanges();

      try {
        googleId.initialize({
          client_id: clientId,
          callback: (response: any) => this.handleGoogleCredentialResponse(response),
          auto_select: false
        });

        googleId.prompt((notification: any) => {
          this.isGoogleLoading = false;
          if (notification.isNotDisplayed()) {
            console.warn('Google Prompt not displayed:', notification.getNotDisplayedReason());
          }
          this.cdr.detectChanges();
        });
      } catch (e: any) {
        this.isGoogleLoading = false;
        this.errorMessage = 'Google Sign-In initialization error: ' + (e?.message || e);
        this.cdr.detectChanges();
      }
    } else {
      this.errorMessage = 'Google Identity Services is loading. Please check your network connection.';
      this.cdr.detectChanges();
    }
  }

  private handleGoogleCredentialResponse(response: any): void {
    if (!response || !response.credential) {
      this.errorMessage = 'Google did not return credentials. Please try again.';
      this.isGoogleLoading = false;
      this.cdr.detectChanges();
      return;
    }

    try {
      const base64Url = response.credential.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      const googleUser = JSON.parse(jsonPayload);

      const email = googleUser.email;
      const name = googleUser.name || googleUser.given_name || email.split('@')[0];
      const googleId = googleUser.sub;
      const avatarUrl = googleUser.picture;

      this.submitGoogleAuth({ email, name, googleId, avatarUrl });
    } catch (e: any) {
      this.isGoogleLoading = false;
      this.errorMessage = 'Failed to parse Google sign-in response.';
      this.cdr.detectChanges();
    }
  }

  private submitGoogleAuth(payload: GoogleLoginRequest): void {
    this.isGoogleLoading = true;
    this.errorMessage = '';
    this.cdr.detectChanges();

    this.authService.loginWithGoogle(payload).pipe(
      finalize(() => {
        this.isGoogleLoading = false;
        this.cdr.detectChanges();
      })
    ).subscribe({
      next: res => {
        const returnUrl = this.route.snapshot.queryParams['returnUrl'];
        if (returnUrl) {
          this.router.navigateByUrl(returnUrl);
          return;
        }

        const role = (res.role || '').toUpperCase();
        if (role === 'ADMIN' || role === 'ROLE_ADMIN') {
          this.router.navigate(['/admin/dashboard']);
        } else if (role === 'MERCHANT' || role === 'ROLE_MERCHANT') {
          this.router.navigate(['/merchant/dashboard']);
        } else {
          this.router.navigate(['/customer/dashboard']);
        }
      },
      error: err => {
        this.errorMessage = err?.message || 'Google sign-in authentication failed on backend.';
        this.cdr.detectChanges();
      }
    });
  }
}
