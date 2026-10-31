export type CouponStatus =
  | 'PENDING_APPROVAL'
  | 'APPROVED'
  | 'REJECTED'
  | 'ACTIVE'
  | 'INACTIVE'
  | 'EXPIRED'
  | 'HIDDEN';

export type VoteType = 'UPVOTE' | 'DOWNVOTE';

export interface CouponResponse {
  couponId: number;
  merchantId: number;
  subscriptionId?: number;
  title: string;
  description: string;
  category: string;
  discount: number;
  cashbackPercentage?: number;
  couponCode: string;
  minimumPurchase: number;
  validFrom: string;
  validUntil: string;
  usageLimit: number;
  usageCount: number;
  status: CouponStatus;
  createdAt?: string;
  approvedBy?: string;
  upvoteCount?: number;
  downvoteCount?: number;
  totalVotes?: number;
  reliabilityScore?: number;
}

export interface CreateCouponRequest {
  merchantId: number;
  title: string;
  description: string;
  category: string;
  discount: number;
  cashbackPercentage?: number;
  couponCode: string;
  minimumPurchase: number;
  validityHours?: number;
  validFrom?: string;
  validUntil?: string;
  usageLimit: number;
}

export interface CouponUpdateRequest {
  title: string;
  description: string;
  category: string;
  discount: number;
  cashbackPercentage?: number;
  minimumPurchase: number;
  usageLimit: number;
}

export interface VoteRequest {
  voteType: VoteType;
  customerId?: number;
}

export interface VoteResponse {
  id?: number;
  couponId: number;
  customerId?: number;
  voteType: VoteType;
  votedAt?: string;
  currentReliabilityScore?: number;
  upvoteCount?: number;
  downvoteCount?: number;
  totalVotes?: number;
  reliabilityScore?: number;
  status?: CouponStatus;
  message?: string;
}

export interface CouponReliabilityResponse {
  couponId: number;
  upvoteCount: number;
  downvoteCount: number;
  totalVotes: number;
  reliabilityScore: number;
  minimumVoteThreshold: number;
  status: CouponStatus;
}
