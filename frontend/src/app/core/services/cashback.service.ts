import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  WalletResponse,
  CashbackTransactionResponse,
  RedeemCashbackRequest
} from '../models/points-wallet.models';

@Injectable({
  providedIn: 'root'
})
export class CashbackService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/api/cashback`;

  getWallet(customerId: number): Observable<WalletResponse> {
    return this.http.get<WalletResponse>(`${this.apiUrl}/wallet/${customerId}`);
  }

  getTransactions(customerId: number): Observable<CashbackTransactionResponse[]> {
    return this.http.get<CashbackTransactionResponse[]>(`${this.apiUrl}/transactions/${customerId}`);
  }

  redeemCashback(request: RedeemCashbackRequest): Observable<WalletResponse> {
    return this.http.post<WalletResponse>(`${this.apiUrl}/redeem`, request);
  }
}
