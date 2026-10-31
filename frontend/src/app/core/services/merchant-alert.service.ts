import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  MerchantInterestResponse,
  AlertPreferenceResponse,
  UpdateAlertPreferenceRequest
} from '../models/alert.models';

@Injectable({
  providedIn: 'root'
})
export class MerchantAlertService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/api/merchant-alerts`;

  getCustomerInterests(customerId?: number): Observable<MerchantInterestResponse[]> {
    let params = new HttpParams();
    if (customerId) params = params.set('customerId', customerId.toString());
    return this.http.get<MerchantInterestResponse[]>(`${this.apiUrl}/interests`, { params });
  }

  followMerchant(merchantId: number, customerId?: number): Observable<MerchantInterestResponse> {
    let params = new HttpParams();
    if (customerId) params = params.set('customerId', customerId.toString());
    return this.http.post<MerchantInterestResponse>(`${this.apiUrl}/follow/${merchantId}`, null, { params });
  }

  unfollowMerchant(merchantId: number, customerId?: number): Observable<void> {
    let params = new HttpParams();
    if (customerId) params = params.set('customerId', customerId.toString());
    return this.http.delete<void>(`${this.apiUrl}/follow/${merchantId}`, { params });
  }

  getAlertPreferences(customerId?: number): Observable<AlertPreferenceResponse> {
    let params = new HttpParams();
    if (customerId) params = params.set('customerId', customerId.toString());
    return this.http.get<AlertPreferenceResponse>(`${this.apiUrl}/preferences`, { params });
  }

  updateAlertPreferences(request: UpdateAlertPreferenceRequest): Observable<AlertPreferenceResponse> {
    return this.http.put<AlertPreferenceResponse>(`${this.apiUrl}/preferences`, request);
  }
}
