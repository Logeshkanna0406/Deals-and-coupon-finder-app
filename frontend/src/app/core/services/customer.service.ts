import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  CustomerResponse,
  UpdateCustomerRequest,
  UpdatePreferencesRequest
} from '../models/customer.models';
import { WalletResponse, CashbackTransactionResponse } from '../models/points-wallet.models';
import { RedemptionResponse } from '../models/redemption.models';

@Injectable({
  providedIn: 'root'
})
export class CustomerService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/api/customers`;

  getCustomer(id: number): Observable<CustomerResponse> {
    return this.http.get<CustomerResponse>(`${this.apiUrl}/${id}`);
  }

  updateCustomer(id: number, request: UpdateCustomerRequest): Observable<CustomerResponse> {
    return this.http.put<CustomerResponse>(`${this.apiUrl}/${id}`, request);
  }

  updatePreferences(id: number, request: UpdatePreferencesRequest): Observable<CustomerResponse> {
    return this.http.put<CustomerResponse>(`${this.apiUrl}/${id}/preferences`, request);
  }

  getCustomerWallet(id: number): Observable<WalletResponse> {
    return this.http.get<WalletResponse>(`${this.apiUrl}/${id}/wallet`);
  }

  getCustomerTransactions(id: number): Observable<CashbackTransactionResponse[]> {
    return this.http.get<CashbackTransactionResponse[]>(`${this.apiUrl}/${id}/transactions`);
  }

  getCustomerRedemptions(id: number): Observable<RedemptionResponse[]> {
    return this.http.get<RedemptionResponse[]>(`${this.apiUrl}/${id}/redemptions`);
  }
}
