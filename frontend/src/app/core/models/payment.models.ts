export type PaymentStatus = 'PENDING' | 'VERIFIED' | 'REJECTED';

export interface PaymentRequest {
  merchantId: number;
  subscriptionId: number;
  amount: number;
  paymentMethod: string; // e.g. 'UPI' | 'Card' | 'NetBanking'
}

export interface PaymentResponse {
  paymentId: number;
  merchantId: number;
  subscriptionId: number;
  amount: number;
  paymentDate: string;
  paymentMethod: string;
  transactionReference: string;
  status: PaymentStatus;
  verifiedBy?: string;
  verifiedAt?: string;
}

export interface RevenueResponse {
  totalRevenue: number;
  totalVerifiedTransactions: number;
}

export interface MerchantRevenueItemDto {
  merchantId: number;
  merchantName: string;
  totalRevenue: number;
  successfulPayments: number;
}

export interface PlatformMerchantRevenueResponse {
  totalPlatformRevenue: number;
  currency: string;
  merchants: MerchantRevenueItemDto[];
}

export interface SpecificMerchantRevenueResponse {
  merchantId: number;
  merchantName: string;
  totalRevenue: number;
  successfulPayments: number;
  payments?: PaymentResponse[];
}
