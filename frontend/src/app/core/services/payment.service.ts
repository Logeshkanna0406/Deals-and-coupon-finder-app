import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  PaymentRequest,
  PaymentResponse,
  RevenueResponse,
  MerchantRevenueItemDto
} from '../models/payment.models';

@Injectable({
  providedIn: 'root'
})
export class PaymentService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/api/payments`;

  createPayment(request: PaymentRequest): Observable<PaymentResponse> {
    return this.http.post<PaymentResponse>(this.apiUrl, request);
  }

  getPaymentById(id: number): Observable<PaymentResponse> {
    return this.http.get<PaymentResponse>(`${this.apiUrl}/${id}`);
  }

  getPaymentsByMerchant(merchantId: number): Observable<PaymentResponse[]> {
    return this.http.get<PaymentResponse[]>(`${this.apiUrl}/merchant/${merchantId}`);
  }

  getAllPayments(): Observable<PaymentResponse[]> {
    return this.http.get<PaymentResponse[]>(this.apiUrl);
  }

  verifyPayment(id: number): Observable<PaymentResponse> {
    return this.http.put<PaymentResponse>(`${this.apiUrl}/${id}/verify`, {});
  }

  rejectPayment(id: number): Observable<PaymentResponse> {
    return this.http.put<PaymentResponse>(`${this.apiUrl}/${id}/reject`, {});
  }

  getRevenueSummary(fromDate?: string, toDate?: string): Observable<RevenueResponse> {
    let params = new HttpParams();
    if (fromDate) params = params.set('fromDate', fromDate);
    if (toDate) params = params.set('toDate', toDate);
    return this.http.get<RevenueResponse>(`${this.apiUrl}/revenue`, { params });
  }

  getMerchantRevenueSummary(fromDate?: string, toDate?: string): Observable<MerchantRevenueItemDto[]> {
    let params = new HttpParams();
    if (fromDate) params = params.set('fromDate', fromDate);
    if (toDate) params = params.set('toDate', toDate);
    return this.http.get<MerchantRevenueItemDto[]>(`${this.apiUrl}/revenue/merchants`, { params });
  }

  getRevenueForMerchant(merchantId: number, fromDate?: string, toDate?: string): Observable<MerchantRevenueItemDto> {
    let params = new HttpParams();
    if (fromDate) params = params.set('fromDate', fromDate);
    if (toDate) params = params.set('toDate', toDate);
    return this.http.get<MerchantRevenueItemDto>(`${this.apiUrl}/revenue/merchants/${merchantId}`, { params });
  }
}
