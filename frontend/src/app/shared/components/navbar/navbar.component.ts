import { Component, OnInit, OnDestroy, inject, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterLinkActive, NavigationEnd } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Subscription, filter } from 'rxjs';
import { AuthService } from '../../../core/services/auth.service';
import { NotificationService } from '../../../core/services/notification.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, FormsModule],
  template: `
    <header class="app-header">
      <div class="container header-container">
        <!-- Brand Logo -->
        <a routerLink="/" class="brand-logo" title="Deals & Coupons Finder">
          <div class="logo-icon">
            <svg class="brand-bolt-svg" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <linearGradient id="navTicketGrad" x1="10%" y1="10%" x2="90%" y2="90%">
                  <stop offset="0%" stop-color="#9333EA"/>
                  <stop offset="50%" stop-color="#7C3AED"/>
                  <stop offset="100%" stop-color="#6B21A8"/>
                </linearGradient>
                <linearGradient id="navBoltGrad" x1="20%" y1="0%" x2="80%" y2="100%">
                  <stop offset="0%" stop-color="#FEF08A"/>
                  <stop offset="40%" stop-color="#FACC15"/>
                  <stop offset="100%" stop-color="#EAB308"/>
                </linearGradient>
                <filter id="navBoltShadow" x="-20%" y="-20%" width="140%" height="140%">
                  <feDropShadow dx="0" dy="1.5" stdDeviation="1.5" flood-color="#1E1B4B" flood-opacity="0.35"/>
                </filter>
              </defs>
              <g transform="rotate(-10 32 32)" filter="url(#navBoltShadow)">
                <path d="M 12 16 L 52 16 A 6 6 0 0 1 52 28 L 52 36 A 6 6 0 0 1 52 48 L 12 48 A 6 6 0 0 1 12 36 L 12 28 A 6 6 0 0 1 12 16 Z"
                      fill="url(#navTicketGrad)" stroke="#3B0764" stroke-width="2.5" stroke-linejoin="round"/>
                <line x1="43" y1="18" x2="43" y2="46" stroke="#DDD6FE" stroke-width="2" stroke-dasharray="2.5 3.5" stroke-linecap="round" opacity="0.85"/>
                <circle cx="48" cy="32" r="2.5" fill="#C4B5FD" opacity="0.9"/>
              </g>
              <polygon points="35,4 18,31 32,31 22,60 48,27 34,27" fill="#78350F" stroke="#451A03" stroke-width="3.5" stroke-linejoin="round"/>
              <polygon points="35,4 18,31 32,31 22,60 48,27 34,27" fill="url(#navBoltGrad)" stroke="#FFFFFF" stroke-width="1.5" stroke-linejoin="round"/>
              <polygon points="34,7 23,29 32,29 26,52 32,31 23,31" fill="#FFFFFF" opacity="0.55"/>
            </svg>
          </div>
          <div class="logo-text">
            <span class="logo-main">Deals & Coupons</span>
            <span class="logo-tag">FINDER</span>
          </div>
        </a>

        <!-- Global Search Bar in Header -->
        <div class="header-search">
          <form (ngSubmit)="onSearchSubmit()">
            <div class="search-input-wrapper">
              <span class="search-icon">🔍</span>
              <input
                type="text"
                class="search-input"
                [(ngModel)]="searchQuery"
                name="searchQuery"
                placeholder="Search deals, coupons, merchants, categories..."
              />
              @if (searchQuery) {
                <button type="button" class="btn-clear-search" (click)="searchQuery = ''">&times;</button>
              }
            </div>
          </form>
        </div>

        <!-- Navigation Links (Desktop) -->
        <nav class="desktop-nav">
          <a routerLink="/" routerLinkActive="active" [routerLinkActiveOptions]="{ exact: true }" class="nav-link">
            Home
          </a>
          <a routerLink="/deals" routerLinkActive="active" class="nav-link">
            Explore Deals
          </a>
          <a routerLink="/merchants" routerLinkActive="active" class="nav-link">
            Merchants
          </a>

          <!-- Role Portals Shortcut -->
          @if (authService.isAuthenticated()) {
            @if (authService.isCustomer()) {
              <a routerLink="/customer/dashboard" routerLinkActive="active" class="nav-link role-link customer">
                <span>👤</span> My Dashboard
              </a>
              <a routerLink="/customer/points" routerLinkActive="active" class="nav-link rewards-badge">
                <span>⭐</span> Rewards
              </a>
              <a routerLink="/customer/notifications" routerLinkActive="active" class="nav-icon-link" title="Notifications">
                <span class="bell-icon-wrapper">
                  <span class="bell-icon">🔔</span>
                  @if (notificationService.unreadCount() > 0) {
                    <span class="notification-badge">{{ notificationService.unreadCount() > 99 ? '99+' : notificationService.unreadCount() }}</span>
                  }
                </span>
              </a>
            }
            @if (authService.isMerchant()) {
              <a routerLink="/merchant/dashboard" routerLinkActive="active" class="nav-link role-link merchant">
                <span>🏪</span> Merchant Portal
              </a>
              <a routerLink="/merchant/coupons/create" class="btn btn-accent btn-sm">
                + New Deal
              </a>
            }
            @if (authService.isAdmin()) {
              <a routerLink="/admin/dashboard" routerLinkActive="active" class="nav-link role-link admin">
                <span>⚡</span> Admin Console
              </a>
            }
          }
        </nav>

        <!-- Auth Actions / User Profile -->
        <div class="header-actions">
          @if (authService.isAuthenticated()) {
            <div class="user-menu">
              <div class="user-info">
                <span class="user-name">{{ authService.currentUser()?.name }}</span>
                <span class="user-role-badge badge badge-{{ authService.currentRole().toLowerCase() }}">
                  {{ authService.currentRole() }}
                </span>
              </div>
              <button class="btn btn-secondary btn-sm" (click)="authService.logout()">
                Logout
              </button>
            </div>
          } @else {
            <div class="auth-buttons">
              <a routerLink="/login" class="btn btn-outline btn-sm">Login</a>
              <a routerLink="/register" class="btn btn-primary btn-sm">Sign Up</a>
            </div>
          }

          <!-- Mobile Hamburger Menu Button -->
          <button class="mobile-toggle" (click)="isMobileMenuOpen = !isMobileMenuOpen" aria-label="Toggle menu">
            <span>{{ isMobileMenuOpen ? '✕' : '☰' }}</span>
          </button>
        </div>
      </div>

      <!-- Mobile Dropdown Navigation -->
      @if (isMobileMenuOpen) {
        <div class="mobile-menu fade-in">
          <!-- Mobile Search -->
          <div class="mobile-search">
            <form (ngSubmit)="onSearchSubmit()">
              <input
                type="text"
                class="search-input"
                [(ngModel)]="searchQuery"
                name="mobileSearchQuery"
                placeholder="Search deals, stores..."
              />
            </form>
          </div>

          <div class="mobile-links">
            <a routerLink="/" (click)="isMobileMenuOpen = false" class="mobile-link">Home</a>
            <a routerLink="/deals" (click)="isMobileMenuOpen = false" class="mobile-link">Explore Deals</a>
            <a routerLink="/merchants" (click)="isMobileMenuOpen = false" class="mobile-link">Merchants</a>

            @if (authService.isAuthenticated()) {
              @if (authService.isCustomer()) {
                <div class="mobile-section-divider">Customer Account</div>
                <a routerLink="/customer/dashboard" (click)="isMobileMenuOpen = false" class="mobile-link">Dashboard</a>
                <a routerLink="/customer/redemptions" (click)="isMobileMenuOpen = false" class="mobile-link">My Redemptions</a>
                <a routerLink="/customer/wallet" (click)="isMobileMenuOpen = false" class="mobile-link">Cashback Wallet</a>
                <a routerLink="/customer/points" (click)="isMobileMenuOpen = false" class="mobile-link">Points & Tier</a>
                <a routerLink="/customer/following" (click)="isMobileMenuOpen = false" class="mobile-link">Following Merchants</a>
                <a routerLink="/customer/notifications" (click)="isMobileMenuOpen = false" class="mobile-link flex-notif-link">
                  <span>🔔 Notifications</span>
                  @if (notificationService.unreadCount() > 0) {
                    <span class="mobile-notification-badge">{{ notificationService.unreadCount() }} New</span>
                  }
                </a>
                <a routerLink="/customer/profile" (click)="isMobileMenuOpen = false" class="mobile-link">Profile</a>
              }
              @if (authService.isMerchant()) {
                <div class="mobile-section-divider">Merchant Portal</div>
                <a routerLink="/merchant/dashboard" (click)="isMobileMenuOpen = false" class="mobile-link">Merchant Dashboard</a>
                <a routerLink="/merchant/coupons" (click)="isMobileMenuOpen = false" class="mobile-link">My Coupons</a>
                <a routerLink="/merchant/coupons/create" (click)="isMobileMenuOpen = false" class="mobile-link">+ Create Coupon</a>
                <a routerLink="/merchant/subscription" (click)="isMobileMenuOpen = false" class="mobile-link">Subscription & Plans</a>
                <a routerLink="/merchant/profile" (click)="isMobileMenuOpen = false" class="mobile-link">Business Profile</a>
              }
              @if (authService.isAdmin()) {
                <div class="mobile-section-divider">Admin Console</div>
                <a routerLink="/admin/dashboard" (click)="isMobileMenuOpen = false" class="mobile-link">Admin Dashboard</a>
                <a routerLink="/admin/merchants" (click)="isMobileMenuOpen = false" class="mobile-link">Merchant Approvals</a>
                <a routerLink="/admin/coupons" (click)="isMobileMenuOpen = false" class="mobile-link">Coupon Approvals</a>
                <a routerLink="/admin/payments" (click)="isMobileMenuOpen = false" class="mobile-link">Payment Verifications</a>
                <a routerLink="/admin/revenue" (click)="isMobileMenuOpen = false" class="mobile-link">Platform Revenue</a>
              }

              <button class="btn btn-danger btn-sm" style="margin-top: 1rem; width: 100%;" (click)="authService.logout(); isMobileMenuOpen = false">
                Logout ({{ authService.currentUser()?.name }})
              </button>
            } @else {
              <div class="mobile-auth-actions">
                <a routerLink="/login" (click)="isMobileMenuOpen = false" class="btn btn-outline" style="width: 100%;">Login</a>
                <a routerLink="/register" (click)="isMobileMenuOpen = false" class="btn btn-primary" style="width: 100%;">Create Account</a>
              </div>
            }
          </div>
        </div>
      }
    </header>
  `,
  styles: [`
    :host {
      display: block;
      position: sticky;
      top: 0;
      z-index: 1000;
      width: 100%;
    }

    .app-header {
      background: var(--surface);
      border-bottom: 1px solid var(--border);
      width: 100%;
      box-shadow: var(--shadow-sm);
    }

    .header-container {
      display: flex;
      align-items: center;
      justify-content: space-between;
      height: 72px;
      gap: 1rem;
    }

    .brand-logo {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      text-decoration: none;
      flex-shrink: 0;
    }

    .logo-icon {
      display: flex;
      align-items: center;
      justify-content: center;
      line-height: 1;
    }

    .brand-bolt-svg {
      width: 36px;
      height: 36px;
      filter: drop-shadow(0 2px 5px rgba(124, 58, 237, 0.28));
      transition: transform var(--transition-fast);
    }

    .brand-logo:hover .brand-bolt-svg {
      transform: scale(1.08) rotate(3deg);
    }

    .logo-text {
      display: flex;
      flex-direction: column;
    }

    .logo-main {
      font-family: var(--font-heading);
      font-size: 1.0625rem;
      font-weight: 800;
      color: var(--primary-dark);
      line-height: 1.1;
      white-space: nowrap;
    }

    .logo-tag {
      font-size: 0.625rem;
      font-weight: 800;
      letter-spacing: 0.15em;
      color: var(--accent);
    }

    .header-search {
      flex: 1;
      max-width: 280px;
      min-width: 120px;
    }

    .search-input-wrapper {
      position: relative;
      display: flex;
      align-items: center;
    }

    .search-icon {
      position: absolute;
      left: 0.75rem;
      color: var(--text-light);
      pointer-events: none;
      font-size: 0.875rem;
    }

    .search-input {
      width: 100%;
      padding: 0.45rem 1.75rem 0.45rem 2.25rem;
      border: 1.5px solid var(--border);
      border-radius: var(--radius-full);
      background-color: var(--bg-main);
      font-size: 0.8125rem;
      color: var(--text-main);
      transition: all var(--transition-fast);
      text-overflow: ellipsis;
    }

    .search-input:focus {
      outline: none;
      border-color: var(--primary);
      background-color: var(--surface);
      box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.12);
    }

    .btn-clear-search {
      position: absolute;
      right: 0.75rem;
      font-size: 1rem;
      color: var(--text-muted);
      cursor: pointer;
    }

    .desktop-nav {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      flex-shrink: 0;
    }

    .nav-link {
      font-size: 0.875rem;
      font-weight: 600;
      color: var(--text-muted);
      padding: 0.375rem 0.25rem;
      white-space: nowrap;
      border-bottom: 2px solid transparent;
      transition: all var(--transition-fast);
      display: inline-flex;
      align-items: center;
      gap: 0.375rem;
    }

    .nav-link:hover, .nav-link.active {
      color: var(--primary);
      border-bottom-color: var(--primary);
    }

    .rewards-badge {
      background: var(--warning-light);
      color: #b45309;
      border-radius: var(--radius-full);
      padding: 0.25rem 0.75rem;
      border: 1px solid #fde68a;
    }

    .role-link.customer { color: var(--secondary); }
    .role-link.merchant { color: #d97706; }
    .role-link.admin { color: #7c3aed; }

    .nav-icon-link {
      font-size: 1.125rem;
      padding: 0.375rem;
      border-radius: 50%;
      transition: background-color var(--transition-fast);
      position: relative;
    }
    .nav-icon-link:hover {
      background-color: var(--surface-alt);
    }

    .bell-icon-wrapper {
      position: relative;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      line-height: 1;
    }

    .bell-icon {
      font-size: 1.25rem;
      display: inline-block;
      transition: transform 0.2s ease;
    }

    .nav-icon-link:hover .bell-icon {
      transform: scale(1.15) rotate(10deg);
    }

    .notification-badge {
      position: absolute;
      top: -6px;
      right: -8px;
      background: #ef4444;
      color: #ffffff;
      font-size: 0.6875rem;
      font-weight: 800;
      min-width: 18px;
      height: 18px;
      padding: 0 4px;
      border-radius: 9999px;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 1px 3px rgba(239, 68, 68, 0.4);
      border: 1.5px solid #ffffff;
      line-height: 1;
      animation: badgePulse 2s infinite ease-in-out;
    }

    @keyframes badgePulse {
      0%, 100% { transform: scale(1); }
      50% { transform: scale(1.08); }
    }

    .flex-notif-link {
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .mobile-notification-badge {
      background: #ef4444;
      color: #ffffff;
      font-size: 0.75rem;
      font-weight: 700;
      padding: 0.15rem 0.5rem;
      border-radius: 9999px;
    }

    .header-actions {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      flex-shrink: 0;
    }

    .user-menu {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .user-info {
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      max-width: 140px;
    }

    .user-name {
      font-size: 0.8125rem;
      font-weight: 700;
      color: var(--text-main);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      max-width: 130px;
    }

    .auth-buttons {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .mobile-toggle {
      display: none;
      font-size: 1.5rem;
      color: var(--text-main);
      padding: 0.25rem;
    }

    /* Mobile Menu */
    .mobile-menu {
      display: none;
      background: var(--surface);
      border-top: 1px solid var(--border);
      padding: 1.25rem;
      box-shadow: var(--shadow-lg);
    }

    .mobile-search {
      margin-bottom: 1rem;
    }

    .mobile-links {
      display: flex;
      flex-direction: column;
      gap: 0.625rem;
    }

    .mobile-link {
      font-size: 1rem;
      font-weight: 600;
      color: var(--text-main);
      padding: 0.5rem 0;
      border-bottom: 1px solid var(--surface-alt);
    }

    .mobile-section-divider {
      font-size: 0.75rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: var(--text-light);
      margin-top: 0.75rem;
      padding-top: 0.5rem;
    }

    .mobile-auth-actions {
      display: flex;
      flex-direction: column;
      gap: 0.625rem;
      margin-top: 1rem;
    }

    @media (max-width: 1024px) {
      .header-search { display: none; }
    }

    @media (max-width: 820px) {
      .desktop-nav { display: none; }
      .user-info { display: none; }
      .mobile-toggle { display: block; }
      .mobile-menu { display: block; }
    }
  `]
})
export class NavbarComponent implements OnInit, OnDestroy {
  readonly authService = inject(AuthService);
  readonly notificationService = inject(NotificationService);
  private readonly router = inject(Router);

  searchQuery = '';
  isMobileMenuOpen = false;
  private refreshTimer: any = null;
  private routerSub: Subscription | null = null;

  constructor() {
    effect(() => {
      const user = this.authService.currentUser();
      if (user && this.authService.isCustomer()) {
        this.notificationService.refreshUnreadCount(user.userId, user.email);
      } else if (!user) {
        this.notificationService.unreadCount.set(0);
      }
    });
  }

  ngOnInit(): void {
    this.refreshNotifications();

    this.routerSub = this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe(() => {
        this.refreshNotifications();
      });

    this.refreshTimer = setInterval(() => {
      this.refreshNotifications();
    }, 20000);
  }

  ngOnDestroy(): void {
    if (this.refreshTimer) {
      clearInterval(this.refreshTimer);
    }
    if (this.routerSub) {
      this.routerSub.unsubscribe();
    }
  }

  refreshNotifications(): void {
    const user = this.authService.currentUser();
    if (user && this.authService.isCustomer()) {
      this.notificationService.refreshUnreadCount(user.userId, user.email);
    }
  }

  onSearchSubmit(): void {
    if (this.searchQuery.trim()) {
      this.isMobileMenuOpen = false;
      this.router.navigate(['/deals'], { queryParams: { q: this.searchQuery.trim() } });
    }
  }
}
