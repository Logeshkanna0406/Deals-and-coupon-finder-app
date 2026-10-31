import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { roleGuard } from './core/guards/role.guard';

// Public Feature Components
import { HomeComponent } from './features/public/home/home.component';
import { DealsDiscoveryComponent } from './features/public/deals/deals-discovery.component';
import { DealDetailsComponent } from './features/public/deal-details/deal-details.component';
import { MerchantsListComponent } from './features/public/merchants/merchants-list.component';

// Auth Feature Components
import { LoginComponent } from './features/auth/login/login.component';
import { RegisterComponent } from './features/auth/register/register.component';
import { ForgotPasswordComponent } from './features/auth/forgot-password/forgot-password.component';
import { ResetPasswordComponent } from './features/auth/reset-password/reset-password.component';

// Customer Feature Components
import { CustomerLayoutComponent } from './features/customer/customer-layout/customer-layout.component';
import { CustomerDashboardComponent } from './features/customer/dashboard/customer-dashboard.component';
import { CustomerPointsComponent } from './features/customer/points/customer-points.component';
import { CustomerWalletComponent } from './features/customer/wallet/customer-wallet.component';
import { CustomerRedemptionsComponent } from './features/customer/redemptions/customer-redemptions.component';
import { CustomerFollowingComponent } from './features/customer/following/customer-following.component';
import { CustomerNotificationsComponent } from './features/customer/notifications/customer-notifications.component';
import { CustomerProfileComponent } from './features/customer/profile/customer-profile.component';

// Merchant Feature Components
import { MerchantLayoutComponent } from './features/merchant/merchant-layout/merchant-layout.component';
import { MerchantDashboardComponent } from './features/merchant/dashboard/merchant-dashboard.component';
import { MerchantCouponsComponent } from './features/merchant/coupons/merchant-coupons.component';
import { CreateCouponComponent } from './features/merchant/create-coupon/create-coupon.component';
import { EditCouponComponent } from './features/merchant/edit-coupon/edit-coupon.component';
import { MerchantSubscriptionComponent } from './features/merchant/subscription/merchant-subscription.component';
import { MerchantPaymentsComponent } from './features/merchant/payment/merchant-payments.component';
import { MerchantProfileComponent } from './features/merchant/profile/merchant-profile.component';

// Admin Feature Components
import { AdminLayoutComponent } from './features/admin/admin-layout/admin-layout.component';
import { AdminDashboardComponent } from './features/admin/dashboard/admin-dashboard.component';
import { AdminMerchantsComponent } from './features/admin/merchants/admin-merchants.component';
import { AdminCouponsComponent } from './features/admin/coupons/admin-coupons.component';
import { AdminPaymentsComponent } from './features/admin/payments/admin-payments.component';
import { AdminPlansComponent } from './features/admin/plans/admin-plans.component';
import { AdminRevenueComponent } from './features/admin/revenue/admin-revenue.component';

export const routes: Routes = [
  // 1. Public Discovery Routes
  { path: '', component: HomeComponent },
  { path: 'home', redirectTo: '', pathMatch: 'full' },
  { path: 'deals', component: DealsDiscoveryComponent },
  { path: 'deals/:id', component: DealDetailsComponent },
  { path: 'merchants', component: MerchantsListComponent },

  // 2. Authentication Routes
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  { path: 'forgot-password', component: ForgotPasswordComponent },
  { path: 'reset-password', component: ResetPasswordComponent },
  // Auth alias paths
  { path: 'auth/login', redirectTo: 'login', pathMatch: 'full' },
  { path: 'auth/register', redirectTo: 'register', pathMatch: 'full' },
  { path: 'auth/forgot-password', redirectTo: 'forgot-password', pathMatch: 'full' },
  { path: 'auth/reset-password', redirectTo: 'reset-password', pathMatch: 'full' },

  // 3. Customer Portal Routes (RBAC Protected: CUSTOMER)
  {
    path: 'customer',
    component: CustomerLayoutComponent,
    canActivate: [authGuard, roleGuard],
    data: { roles: ['CUSTOMER'] },
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', component: CustomerDashboardComponent },
      { path: 'points', component: CustomerPointsComponent },
      { path: 'wallet', component: CustomerWalletComponent },
      { path: 'redemptions', component: CustomerRedemptionsComponent },
      { path: 'following', component: CustomerFollowingComponent },
      { path: 'notifications', component: CustomerNotificationsComponent },
      { path: 'profile', component: CustomerProfileComponent }
    ]
  },

  // 4. Merchant Portal Routes (RBAC Protected: MERCHANT)
  {
    path: 'merchant',
    component: MerchantLayoutComponent,
    canActivate: [authGuard, roleGuard],
    data: { roles: ['MERCHANT'] },
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', component: MerchantDashboardComponent },
      { path: 'coupons', component: MerchantCouponsComponent },
      { path: 'coupons/create', component: CreateCouponComponent },
      { path: 'coupons/edit/:id', component: EditCouponComponent },
      { path: 'subscription', component: MerchantSubscriptionComponent },
      { path: 'payments', component: MerchantPaymentsComponent },
      { path: 'profile', component: MerchantProfileComponent }
    ]
  },

  // 5. Admin Console Routes (RBAC Protected: ADMIN)
  {
    path: 'admin',
    component: AdminLayoutComponent,
    canActivate: [authGuard, roleGuard],
    data: { roles: ['ADMIN'] },
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', component: AdminDashboardComponent },
      { path: 'merchants', component: AdminMerchantsComponent },
      { path: 'coupons', component: AdminCouponsComponent },
      { path: 'payments', component: AdminPaymentsComponent },
      { path: 'plans', component: AdminPlansComponent },
      { path: 'revenue', component: AdminRevenueComponent }
    ]
  },

  // 6. Catch-all Wildcard Route
  { path: '**', redirectTo: '' }
];
