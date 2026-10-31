import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  SubscriptionPlanResponse,
  CreateSubscriptionPlanRequest,
  CreateSubscriptionRequest,
  SubscriptionResponse
} from '../models/subscription.models';

@Injectable({
  providedIn: 'root'
})
export class SubscriptionService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/api/subscriptions`;

  getAllPlans(): Observable<SubscriptionPlanResponse[]> {
    return this.http.get<SubscriptionPlanResponse[]>(`${this.apiUrl}/plans`);
  }

  getPlanById(planId: number): Observable<SubscriptionPlanResponse> {
    return this.http.get<SubscriptionPlanResponse>(`${this.apiUrl}/plans/${planId}`);
  }

  createPlan(request: CreateSubscriptionPlanRequest): Observable<SubscriptionPlanResponse> {
    return this.http.post<SubscriptionPlanResponse>(`${this.apiUrl}/plans`, request);
  }

  updatePlan(planId: number, request: CreateSubscriptionPlanRequest): Observable<SubscriptionPlanResponse> {
    return this.http.put<SubscriptionPlanResponse>(`${this.apiUrl}/plans/${planId}`, request);
  }

  deletePlan(planId: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/plans/${planId}`);
  }

  createSubscription(request: CreateSubscriptionRequest): Observable<SubscriptionResponse> {
    return this.http.post<SubscriptionResponse>(this.apiUrl, request);
  }

  getSubscriptionById(id: number): Observable<SubscriptionResponse> {
    return this.http.get<SubscriptionResponse>(`${this.apiUrl}/${id}`);
  }

  getSubscriptionsByMerchant(merchantId: number): Observable<SubscriptionResponse[]> {
    return this.http.get<SubscriptionResponse[]>(`${this.apiUrl}/merchant/${merchantId}`);
  }

  getActiveSubscription(merchantId: number): Observable<SubscriptionResponse> {
    return this.http.get<SubscriptionResponse>(`${this.apiUrl}/merchant/${merchantId}/active`);
  }

  getUpcomingSubscriptions(merchantId: number): Observable<SubscriptionResponse[]> {
    return this.http.get<SubscriptionResponse[]>(`${this.apiUrl}/merchant/${merchantId}/upcoming`);
  }

  activateSubscription(subscriptionId: number, merchantId: number): Observable<SubscriptionResponse> {
    return this.http.put<SubscriptionResponse>(`${this.apiUrl}/${subscriptionId}/activate?merchantId=${merchantId}`, {});
  }
}
