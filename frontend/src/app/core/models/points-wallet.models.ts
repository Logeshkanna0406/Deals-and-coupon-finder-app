export type CustomerTier = 'NO_TIER' | 'BRONZE' | 'SILVER' | 'GOLD' | 'PLATINUM';

export interface CustomerTierResponse {
  customerId: number;
  totalPoints: number;
  tier: CustomerTier;
  nextTier?: CustomerTier;
  pointsRequiredForNextTier?: number;
}

export interface PointAccountResponse {
  id?: number;
  customerId: number;
  points?: number;
  totalPoints?: number;
}

export interface PointTransactionResponse {
  id?: number;
  transactionId?: number;
  customerId: number;
  points: number;
  type: string;
  description?: string;
  referenceId?: string;
  createdAt?: string;
}

export interface RedeemPointsRequest {
  customerId: number;
  points: number;
}

export interface RedeemPointsResponse {
  customerId: number;
  pointsDeducted: number;
  remainingPoints: number;
  walletCredited: number;
  newWalletBalance: number;
}

export interface WalletResponse {
  walletId: number;
  customerId: number;
  balance: number;
}

export interface CashbackTransactionResponse {
  transactionId: number;
  customerId: number;
  amount: number;
  type: 'CREDIT' | 'DEBIT';
  referenceId: string;
  createdAt: string;
}

export interface RedeemCashbackRequest {
  customerId: number;
  amount: number;
}
