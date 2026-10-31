export type UserRole = 'CUSTOMER' | 'MERCHANT' | 'ADMIN';

export interface AuthResponse {
  token: string;
  refreshToken?: string;
  userId: number;
  name: string;
  email: string;
  role: UserRole | string;
  message?: string;
}

export interface RegisterCustomerRequest {
  name: string;
  email: string;
  password: string;
  phone: string;
  preferences?: string;
}

export interface RegisterMerchantRequest {
  businessName: string;
  ownerName: string;
  email: string;
  password: string;
  phone: string;
  category: string;
  address?: string;
  description?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ForgotPasswordResponse {
  message: string;
  resetToken?: string;
}

export interface ResetPasswordRequest {
  token: string;
  newPassword: string;
  email?: string;
}

export interface ResetPasswordResponse {
  message: string;
}

export interface GoogleLoginRequest {
  email: string;
  name?: string;
  googleId?: string;
  avatarUrl?: string;
}

export interface SendOtpRequest {
  email: string;
  name?: string;
}

export interface SendOtpResponse {
  success: boolean;
  message: string;
  email: string;
  otpPreview?: string;
}

export interface VerifyOtpRequest {
  email: string;
  otp: string;
}

export interface VerifyOtpResponse {
  success: boolean;
  message: string;
}

