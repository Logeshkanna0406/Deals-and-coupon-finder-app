import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  PointAccountResponse,
  PointTransactionResponse,
  CustomerTierResponse,
  RedeemPointsRequest,
  RedeemPointsResponse
} from '../models/points-wallet.models';

@Injectable({
  providedIn: 'root'
})
export class PointsService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/api/points`;

  getPointAccount(customerId: number): Observable<PointAccountResponse> {
    return this.http.get<PointAccountResponse>(`${this.apiUrl}/customer/${customerId}`);
  }

  getPointTransactions(customerId: number): Observable<PointTransactionResponse[]> {
    return this.http.get<PointTransactionResponse[]>(`${this.apiUrl}/customer/${customerId}/transactions`);
  }

  getCustomerTier(customerId: number): Observable<CustomerTierResponse> {
    return this.http.get<CustomerTierResponse>(`${this.apiUrl}/customer/${customerId}/tier`);
  }

  getMyTier(customerId?: number): Observable<CustomerTierResponse> {
    let params = new HttpParams();
    if (customerId) {
      params = params.set('customerId', customerId.toString());
    }
    return this.http.get<CustomerTierResponse>(`${this.apiUrl}/my-tier`, { params });
  }

  redeemPoints(request: RedeemPointsRequest): Observable<RedeemPointsResponse> {
    return this.http.post<RedeemPointsResponse>(`${this.apiUrl}/redeem`, request);
  }
}
