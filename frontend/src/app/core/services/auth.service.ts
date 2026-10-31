import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap, catchError, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  AuthResponse,
  LoginRequest,
  RegisterCustomerRequest,
  RegisterMerchantRequest,
  RefreshTokenRequest,
  ForgotPasswordRequest,
  ForgotPasswordResponse,
  ResetPasswordRequest,
  ResetPasswordResponse,
  UserRole,
  GoogleLoginRequest,
  SendOtpRequest,
  SendOtpResponse,
  VerifyOtpRequest,
  VerifyOtpResponse
} from '../models/auth.models';
import { ToastService } from './toast.service';
import { NotificationService } from './notification.service';

export interface UserSession {
  userId: number;
  name: string;
  email: string;
  role: string;
  token: string;
  refreshToken?: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);
  private readonly notificationService = inject(NotificationService);
  private readonly apiUrl = `${environment.apiUrl}/api/auth`;

  private readonly userSessionSignal = signal<UserSession | null>(this.loadStoredSession());

  readonly userSession = this.userSessionSignal.asReadonly();
  readonly isAuthenticated = computed(() => !!this.userSessionSignal()?.token);
  readonly currentRole = computed(() => this.userSessionSignal()?.role?.toUpperCase() || '');
  readonly currentUser = computed(() => this.userSessionSignal());
  readonly currentUserId = computed(() => this.userSessionSignal()?.userId ?? null);

  readonly isCustomer = computed(() => this.currentRole() === 'CUSTOMER' || this.currentRole() === 'ROLE_CUSTOMER');
  readonly isMerchant = computed(() => this.currentRole() === 'MERCHANT' || this.currentRole() === 'ROLE_MERCHANT');
  readonly isAdmin = computed(() => this.currentRole() === 'ADMIN' || this.currentRole() === 'ROLE_ADMIN');

  login(credentials: LoginRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/login`, credentials).pipe(
      tap(res => {
        this.saveSession(res);
        this.toast.success(`Welcome back, ${res.name || 'User'}!`, 'Logged In');
      }),
      catchError(err => {
        const errorMsg =
          err.error?.message ||
          (typeof err.error === 'string' ? err.error : null) ||
          'Invalid email or password. Please check your credentials.';
        this.toast.error(errorMsg, 'Authentication Failed');
        return throwError(() => new Error(errorMsg));
      })
    );
  }

  loginWithGoogle(data: GoogleLoginRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/google`, data).pipe(
      tap(res => {
        this.saveSession(res);
        this.toast.success(`Welcome, ${res.name || 'User'}! Signed in with Google.`, 'Google Sign-In');
      }),
      catchError(err => {
        const errorMsg =
          err.error?.message ||
          (typeof err.error === 'string' ? err.error : null) ||
          'Google authentication failed. Please try again.';
        this.toast.error(errorMsg, 'Google Sign-In Failed');
        return throwError(() => new Error(errorMsg));
      })
    );
  }

  sendOtp(email: string, name?: string): Observable<SendOtpResponse> {
    const payload: SendOtpRequest = { email, name };
    return this.http.post<SendOtpResponse>(`${this.apiUrl}/send-otp`, payload).pipe(
      tap(res => {
        this.toast.info(`Verification code sent to ${email}`, 'OTP Dispatched');
      }),
      catchError(err => {
        const errorMsg =
          err.error?.message ||
          (typeof err.error === 'string' ? err.error : null) ||
          'Failed to send OTP code.';
        this.toast.error(errorMsg, 'OTP Error');
        return throwError(() => new Error(errorMsg));
      })
    );
  }

  verifyOtp(email: string, otp: string): Observable<VerifyOtpResponse> {
    const payload: VerifyOtpRequest = { email, otp };
    return this.http.post<VerifyOtpResponse>(`${this.apiUrl}/verify-otp`, payload).pipe(
      tap(() => {
        this.toast.success('Email verified successfully!', 'Verified');
      }),
      catchError(err => {
        const errorMsg =
          err.error?.message ||
          (typeof err.error === 'string' ? err.error : null) ||
          'Invalid verification code.';
        this.toast.error(errorMsg, 'Verification Failed');
        return throwError(() => new Error(errorMsg));
      })
    );
  }

  registerCustomer(data: RegisterCustomerRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/register/customer`, data).pipe(
      tap(res => {
        if (res.token) {
          this.saveSession(res);
          this.toast.success('Registration successful! Welcome to Deals & Coupons.', 'Account Created');
        }
      }),
      catchError(err => {
        const errorMsg = err.error?.message || 'Registration failed. Please verify your details.';
        return throwError(() => new Error(errorMsg));
      })
    );
  }

  registerMerchant(data: RegisterMerchantRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/register/merchant`, data).pipe(
      tap(res => {
        this.toast.success(
          res.message || 'Merchant registration submitted! Please wait for Admin approval before logging in.',
          'Application Submitted'
        );
      }),
      catchError(err => {
        const errorMsg = err.error?.message || 'Merchant registration failed.';
        return throwError(() => new Error(errorMsg));
      })
    );
  }

  refreshToken(): Observable<AuthResponse> {
    const session = this.userSessionSignal();
    if (!session?.refreshToken) {
      this.clearSession();
      return throwError(() => new Error('No refresh token available'));
    }

    const payload: RefreshTokenRequest = { refreshToken: session.refreshToken };
    return this.http.post<AuthResponse>(`${this.apiUrl}/refresh-token`, payload).pipe(
      tap(res => {
        this.saveSession(res);
      }),
      catchError(err => {
        this.clearSession();
        return throwError(() => err);
      })
    );
  }

  forgotPassword(data: ForgotPasswordRequest): Observable<ForgotPasswordResponse> {
    return this.http.post<ForgotPasswordResponse>(`${this.apiUrl}/forgot-password`, data);
  }

  verifyForgotPasswordOtp(email: string, otp: string): Observable<VerifyOtpResponse> {
    return this.http.post<VerifyOtpResponse>(`${this.apiUrl}/forgot-password/verify-otp`, { email, otp });
  }

  resetPassword(data: ResetPasswordRequest): Observable<ResetPasswordResponse> {
    return this.http.post<ResetPasswordResponse>(`${this.apiUrl}/reset-password`, data);
  }

  logout(): void {
    const session = this.userSessionSignal();
    if (session?.refreshToken) {
      this.http.post(`${this.apiUrl}/logout`, { refreshToken: session.refreshToken }).subscribe({
        error: () => { /* ignore backend logout error */ }
      });
    }
    this.clearSession();
    this.toast.info('You have been logged out safely.', 'Logged Out');
    this.router.navigate(['/login']);
  }

  getToken(): string | null {
    return this.userSessionSignal()?.token || null;
  }

  private saveSession(res: AuthResponse): void {
    const roleNormalized = (res.role || '').replace('ROLE_', '').toUpperCase();
    const session: UserSession = {
      userId: res.userId,
      name: res.name,
      email: res.email,
      role: roleNormalized,
      token: res.token,
      refreshToken: res.refreshToken || this.userSessionSignal()?.refreshToken
    };
    this.userSessionSignal.set(session);
    try {
      localStorage.setItem('deals_session', JSON.stringify(session));
    } catch (e) {
      console.error('Failed to save session to localStorage', e);
    }

    if (roleNormalized === 'CUSTOMER') {
      this.notificationService.refreshUnreadCount(res.userId, res.email);
    }
  }

  private loadStoredSession(): UserSession | null {
    try {
      const data = localStorage.getItem('deals_session');
      if (data) {
        return JSON.parse(data) as UserSession;
      }
    } catch (e) {
      console.error('Failed to parse stored session', e);
    }
    return null;
  }

  private clearSession(): void {
    this.userSessionSignal.set(null);
    this.notificationService.unreadCount.set(0);
    try {
      localStorage.removeItem('deals_session');
    } catch (e) {
      console.error('Failed to clear session', e);
    }
  }
}
