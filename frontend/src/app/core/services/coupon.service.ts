import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, catchError, map, of, tap, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthService } from './auth.service';
import {
  CouponResponse,
  CreateCouponRequest,
  CouponUpdateRequest,
  VoteRequest,
  VoteResponse,
  CouponReliabilityResponse,
  VoteType
} from '../models/coupon.models';

@Injectable({
  providedIn: 'root'
})
export class CouponService {
  private readonly http = inject(HttpClient);
  private readonly authService = inject(AuthService);
  private readonly apiUrl = `${environment.apiUrl}/api/coupons`;

  getActiveCoupons(sort?: string): Observable<CouponResponse[]> {
    let params = new HttpParams();
    if (sort) {
      params = params.set('sort', sort);
    }
    return this.http.get<CouponResponse[]>(this.apiUrl, { params });
  }

  getRankedCoupons(): Observable<CouponResponse[]> {
    return this.http.get<CouponResponse[]>(`${this.apiUrl}/ranked`).pipe(
      catchError(() => {
        // Fallback for unauthenticated guest visitors: get active coupons and sort by score
        return this.getActiveCoupons().pipe(
          map(coupons =>
            [...coupons].sort((a, b) => (b.reliabilityScore ?? 0) - (a.reliabilityScore ?? 0))
          )
        );
      })
    );
  }

  getCouponsByCategory(category: string): Observable<CouponResponse[]> {
    return this.http.get<CouponResponse[]>(`${this.apiUrl}/category/${encodeURIComponent(category)}`);
  }

  getCouponById(id: number): Observable<CouponResponse> {
    return this.http.get<CouponResponse>(`${this.apiUrl}/${id}`).pipe(
      catchError(err => {
        // If guest access is blocked by 401 on /api/coupons/{id}, attempt fallback from public /api/coupons list
        if (err.status === 401) {
          return this.getActiveCoupons().pipe(
            map(coupons => {
              const found = coupons.find(c => c.couponId === Number(id));
              if (found) return found;
              throw new Error(`Coupon with ID ${id} not found.`);
            })
          );
        }
        return throwError(() => err);
      })
    );
  }

  getCouponsByMerchant(merchantId: number): Observable<CouponResponse[]> {
    return this.http.get<CouponResponse[]>(`${this.apiUrl}/merchant/${merchantId}`);
  }

  getCouponsBySubscription(subscriptionId: number): Observable<CouponResponse[]> {
    return this.http.get<CouponResponse[]>(`${this.apiUrl}/subscription/${subscriptionId}`);
  }

  getAllCoupons(): Observable<CouponResponse[]> {
    return this.http.get<CouponResponse[]>(`${this.apiUrl}/all`);
  }

  createCoupon(request: CreateCouponRequest): Observable<CouponResponse> {
    return this.http.post<CouponResponse>(this.apiUrl, request);
  }

  updateCoupon(id: number, request: CouponUpdateRequest): Observable<CouponResponse> {
    return this.http.put<CouponResponse>(`${this.apiUrl}/${id}`, request);
  }

  deleteCoupon(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  getUserVote(couponId: number): VoteType | null {
    const userId = this.authService.currentUserId();
    if (!userId) return null;
    const stored = localStorage.getItem(`coupon_vote_${userId}_${couponId}`);
    return (stored === 'UPVOTE' || stored === 'DOWNVOTE') ? (stored as VoteType) : null;
  }

  setUserVote(couponId: number, voteType: VoteType): void {
    const userId = this.authService.currentUserId();
    if (!userId) return;
    localStorage.setItem(`coupon_vote_${userId}_${couponId}`, voteType);
  }

  castVote(id: number, request: VoteRequest): Observable<VoteResponse> {
    const customerId = request.customerId || this.authService.currentUserId() || undefined;
    const payload: VoteRequest = {
      voteType: request.voteType,
      customerId: customerId ? Number(customerId) : undefined
    };
    return this.http.post<VoteResponse>(`${this.apiUrl}/${id}/votes`, payload).pipe(
      tap(res => {
        if (res && res.voteType) {
          this.setUserVote(id, res.voteType);
        }
      })
    );
  }

  getCouponReliability(id: number): Observable<CouponReliabilityResponse> {
    return this.http.get<CouponReliabilityResponse>(`${this.apiUrl}/${id}/reliability`);
  }

  approveCoupon(id: number): Observable<CouponResponse> {
    return this.http.put<CouponResponse>(`${this.apiUrl}/${id}/approve`, {});
  }

  rejectCoupon(id: number): Observable<CouponResponse> {
    return this.http.put<CouponResponse>(`${this.apiUrl}/${id}/reject`, {});
  }
}
