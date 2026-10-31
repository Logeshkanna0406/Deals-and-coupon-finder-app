export type InterestSource = 'REDEMPTION' | 'MANUAL_FOLLOW';

export interface MerchantInterestResponse {
  id: number;
  customerId: number;
  merchantId: number;
  merchantName: string;
  source: InterestSource;
  followedAt: string;
}

export interface AlertPreferenceResponse {
  customerId: number;
  emailEnabled: boolean;
  smsEnabled: boolean;
  inAppEnabled: boolean;
  updatedAt?: string;
}

export interface UpdateAlertPreferenceRequest {
  customerId?: number;
  emailEnabled: boolean;
  smsEnabled: boolean;
  inAppEnabled: boolean;
}
