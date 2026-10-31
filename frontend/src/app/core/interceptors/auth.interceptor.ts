import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { ToastService } from '../services/toast.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const toast = inject(ToastService);
  const token = authService.getToken();

  let clonedReq = req;
  if (token) {
    clonedReq = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
  }

  const isPublicRoute =
    (req.url.includes('/api/coupons') && req.method === 'GET') ||
    (req.url.includes('/api/subscriptions/plans') && req.method === 'GET') ||
    (req.url.includes('/api/merchants') && req.method === 'GET');

  return next(clonedReq).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401) {
        // If a public discovery route returned 401 because of an expired token,
        // retry the request anonymously without Authorization header so the page always renders!
        if (isPublicRoute && token) {
          const anonymousReq = req.clone({
            headers: req.headers.delete('Authorization')
          });
          return next(anonymousReq);
        }

        // For secured routes, if token is expired, clean session and notify
        if (!req.url.includes('/api/auth/')) {
          if (token) {
            toast.warning('Your session has expired. Please log in again.', 'Session Expired');
            authService.logout();
          }
        }
      } else if (error.status === 403) {
        toast.error('You do not have permission to perform this action.', 'Access Denied');
      } else if (error.status === 404) {
        // Let component handle 404
      } else if (error.status === 409) {
        const msg = error.error?.message || 'A business rule conflict occurred.';
        toast.warning(msg, 'Conflict');
      } else if (error.status === 503) {
        toast.error('Service is temporarily unavailable (Circuit Breaker open). Please retry shortly.', 'Service Unavailable');
      } else if (error.status >= 500) {
        const msg = error.error?.message || 'Internal server error occurred.';
        toast.error(msg, 'Server Error');
      }

      return throwError(() => error);
    })
  );
};
