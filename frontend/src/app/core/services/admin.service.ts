import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { MerchantResponse } from '../models/merchant.models';
import { CouponResponse } from '../models/coupon.models';
import {
  PaymentResponse,
  RevenueResponse,
  PlatformMerchantRevenueResponse,
  SpecificMerchantRevenueResponse
} from '../models/payment.models';
import {
  SubscriptionPlanResponse,
  CreateSubscriptionPlanRequest
} from '../models/subscription.models';

@Injectable({
  providedIn: 'root'
})
export class AdminService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/api/admin`;

  getAllMerchants(): Observable<MerchantResponse[]> {
    return this.http.get<MerchantResponse[]>(`${this.apiUrl}/merchants`);
  }

  approveMerchant(id: number): Observable<MerchantResponse> {
    return this.http.put<MerchantResponse>(`${this.apiUrl}/merchants/${id}/approve`, {});
  }

  rejectMerchant(id: number): Observable<MerchantResponse> {
    return this.http.put<MerchantResponse>(`${this.apiUrl}/merchants/${id}/reject`, {});
  }

  suspendMerchant(id: number): Observable<MerchantResponse> {
    return this.http.put<MerchantResponse>(`${this.apiUrl}/merchants/${id}/suspend`, {});
  }

  getAllCoupons(): Observable<CouponResponse[]> {
    return this.http.get<CouponResponse[]>(`${this.apiUrl}/coupons`);
  }

  approveCoupon(id: number): Observable<CouponResponse> {
    return this.http.put<CouponResponse>(`${this.apiUrl}/coupons/${id}/approve`, {});
  }

  rejectCoupon(id: number): Observable<CouponResponse> {
    return this.http.put<CouponResponse>(`${this.apiUrl}/coupons/${id}/reject`, {});
  }

  getAllPayments(): Observable<PaymentResponse[]> {
    return this.http.get<PaymentResponse[]>(`${this.apiUrl}/payments`);
  }

  verifyPayment(id: number): Observable<PaymentResponse> {
    return this.http.put<PaymentResponse>(`${this.apiUrl}/payments/${id}/verify`, {});
  }

  getRevenue(fromDate?: string, toDate?: string): Observable<RevenueResponse> {
    let params = new HttpParams();
    if (fromDate) params = params.set('fromDate', fromDate);
    if (toDate) params = params.set('toDate', toDate);
    return this.http.get<RevenueResponse>(`${this.apiUrl}/revenue`, { params });
  }

  getMerchantRevenueSummary(fromDate?: string, toDate?: string): Observable<PlatformMerchantRevenueResponse> {
    let params = new HttpParams();
    if (fromDate) params = params.set('fromDate', fromDate);
    if (toDate) params = params.set('toDate', toDate);
    return this.http.get<PlatformMerchantRevenueResponse>(`${this.apiUrl}/revenue/merchants`, { params });
  }

  getSpecificMerchantRevenue(merchantId: number, fromDate?: string, toDate?: string): Observable<SpecificMerchantRevenueResponse> {
    let params = new HttpParams();
    if (fromDate) params = params.set('fromDate', fromDate);
    if (toDate) params = params.set('toDate', toDate);
    return this.http.get<SpecificMerchantRevenueResponse>(`${this.apiUrl}/revenue/merchants/${merchantId}`, { params });
  }

  createSubscriptionPlan(request: CreateSubscriptionPlanRequest): Observable<SubscriptionPlanResponse> {
    return this.http.post<SubscriptionPlanResponse>(`${this.apiUrl}/subscription-plans`, request);
  }

  updateSubscriptionPlan(planId: number, request: CreateSubscriptionPlanRequest): Observable<SubscriptionPlanResponse> {
    return this.http.put<SubscriptionPlanResponse>(`${this.apiUrl}/subscription-plans/${planId}`, request);
  }

  deleteSubscriptionPlan(planId: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/subscription-plans/${planId}`);
  }
}
