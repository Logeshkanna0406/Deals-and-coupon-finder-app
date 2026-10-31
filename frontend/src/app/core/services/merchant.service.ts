import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  MerchantResponse,
  UpdateMerchantRequest,
  MerchantDashboardResponse,
  MerchantStatus
} from '../models/merchant.models';

@Injectable({
  providedIn: 'root'
})
export class MerchantService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/api/merchants`;

  getAllMerchants(): Observable<MerchantResponse[]> {
    return this.http.get<MerchantResponse[]>(this.apiUrl);
  }

  getMerchantById(id: number): Observable<MerchantResponse> {
    return this.http.get<MerchantResponse>(`${this.apiUrl}/${id}`);
  }

  updateMerchant(id: number, request: UpdateMerchantRequest): Observable<MerchantResponse> {
    return this.http.put<MerchantResponse>(`${this.apiUrl}/${id}`, request);
  }

  getDashboard(id: number): Observable<MerchantDashboardResponse> {
    return this.http.get<MerchantDashboardResponse>(`${this.apiUrl}/${id}/dashboard`);
  }

  updateStatus(id: number, status: MerchantStatus): Observable<MerchantResponse> {
    const params = new HttpParams().set('status', status);
    return this.http.put<MerchantResponse>(`${this.apiUrl}/${id}/status`, null, { params });
  }
}
