export type SubscriptionStatus =
  | 'PENDING_VERIFICATION'
  | 'ACTIVE'
  | 'SCHEDULED'
  | 'EXPIRED'
  | 'CANCELLED';

export interface SubscriptionPlanResponse {
  planId: number;
  name: string;
  durationInMonths: number;
  price: number;
  couponLimit: number;
  status: string;
}

export interface CreateSubscriptionPlanRequest {
  name: string;
  durationInMonths: number;
  price: number;
  couponLimit: number;
}

export interface CreateSubscriptionRequest {
  merchantId: number;
  planId: number;
}

export interface SubscriptionResponse {
  subscriptionId: number;
  merchantId: number;
  planId: number;
  planName: string;
  startDate?: string;
  endDate?: string;
  amount: number;
  paymentId?: number;
  status: SubscriptionStatus;
  couponLimit: number;
  couponsGenerated?: number;
  remainingCoupons?: number;
}
