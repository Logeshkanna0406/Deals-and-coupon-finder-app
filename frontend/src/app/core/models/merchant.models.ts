import { SubscriptionResponse } from './subscription.models';

export type MerchantStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'SUSPENDED';

export interface MerchantResponse {
  merchantId: number;
  businessName: string;
  ownerName: string;
  email: string;
  phone: string;
  category: string;
  address?: string;
  description?: string;
  status: MerchantStatus;
  createdAt?: string;
}

export interface UpdateMerchantRequest {
  businessName: string;
  ownerName: string;
  phone: string;
  category: string;
  address?: string;
  description?: string;
}

export interface MerchantDashboardResponse {
  merchantProfile: MerchantResponse;
  activeSubscription?: SubscriptionResponse;
  totalCoupons: number;
  activeCoupons: number;
  totalRedemptions: number;
}
