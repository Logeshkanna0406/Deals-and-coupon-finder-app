import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { ToastService } from '../services/toast.service';

export const roleGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const toast = inject(ToastService);

  if (!authService.isAuthenticated()) {
    return router.createUrlTree(['/login'], {
      queryParams: { returnUrl: state.url }
    });
  }

  const expectedRoles: string[] = route.data?.['roles'] || [];
  const userRole = authService.currentRole();

  if (expectedRoles.length === 0 || expectedRoles.includes(userRole)) {
    return true;
  }

  toast.error(`Access denied. This section requires ${expectedRoles.join(' or ')} role.`, 'Unauthorized');

  // Redirect to their role's natural landing page
  if (userRole === 'ADMIN') {
    return router.createUrlTree(['/admin/dashboard']);
  } else if (userRole === 'MERCHANT') {
    return router.createUrlTree(['/merchant/dashboard']);
  } else {
    return router.createUrlTree(['/customer/dashboard']);
  }
};
