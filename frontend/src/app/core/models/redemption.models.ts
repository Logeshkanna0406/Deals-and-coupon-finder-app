export type RedemptionStatus = 'SUCCESS' | 'FAILED';

export interface CreateRedemptionRequest {
  couponId: number;
  customerId: number;
  purchaseAmount: number;
}

export interface RedemptionResponse {
  redemptionId: number;
  couponId: number;
  merchantId: number;
  customerId: number;
  redeemedAt: string;
  purchaseAmount: number;
  discountAmount: number;
  status: RedemptionStatus;
  pointsEarned: number;
}

export interface CustomerRedemptionHistoryItem {
  redemptionId: number;
  couponId: number;
  couponTitle: string;
  couponCode: string;
  merchantId: number;
  merchantName: string;
  redemptionDate: string;
  purchaseAmount: number;
  discountAmount: number;
  pointsEarned: number;
  status: string;
}

export interface CustomerRedemptionHistoryResponse {
  content: CustomerRedemptionHistoryItem[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  last: boolean;
}
