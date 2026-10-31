import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  CreateRedemptionRequest,
  RedemptionResponse,
  CustomerRedemptionHistoryResponse,
  CustomerRedemptionHistoryItem
} from '../models/redemption.models';

@Injectable({
  providedIn: 'root'
})
export class RedemptionService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/api/redemptions`;

  redeemCoupon(request: CreateRedemptionRequest): Observable<RedemptionResponse> {
    return this.http.post<RedemptionResponse>(this.apiUrl, request);
  }

  getRedemptionById(id: number): Observable<RedemptionResponse> {
    return this.http.get<RedemptionResponse>(`${this.apiUrl}/${id}`);
  }

  getMyRedemptionHistory(page = 0, size = 10, customerId?: number): Observable<CustomerRedemptionHistoryResponse> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());
    if (customerId) {
      params = params.set('customerId', customerId.toString());
    }
    return this.http.get<CustomerRedemptionHistoryResponse>(`${this.apiUrl}/my-history`, { params });
  }

  getRecentRedemptionHistory(limit = 10, customerId?: number): Observable<CustomerRedemptionHistoryItem[]> {
    let params = new HttpParams().set('limit', limit.toString());
    if (customerId) {
      params = params.set('customerId', customerId.toString());
    }
    return this.http.get<CustomerRedemptionHistoryItem[]>(`${this.apiUrl}/my-history/recent`, { params });
  }

  hasCustomerRedeemed(customerId: number, couponId: number): Observable<boolean> {
    const params = new HttpParams()
      .set('customerId', customerId.toString())
      .set('couponId', couponId.toString());
    return this.http.get<boolean>(`${this.apiUrl}/check`, { params });
  }
}
