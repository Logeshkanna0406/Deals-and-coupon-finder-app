import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <footer class="app-footer">
      <div class="container footer-content">
        <div class="footer-grid">
          <!-- Col 1: Brand & About -->
          <div class="footer-col brand-col">
            <div class="footer-logo">
              <span class="logo-icon">🏷️</span>
              <span class="logo-text">Deals & Coupons Finder</span>
            </div>
            <p class="brand-desc">
              Your trusted destination for verified discounts, merchant cashback, and smart loyalty rewards. Discover, save, and earn points on every purchase.
            </p>
            <div class="trust-badges">
              <span class="trust-badge">🛡️ 100% Verified Deals</span>
              <span class="trust-badge">⚡ Instant Redemptions</span>
              <span class="trust-badge">⭐ Wilson Ranked</span>
            </div>
          </div>

          <!-- Col 2: Discover Deals -->
          <div class="footer-col">
            <h4 class="footer-heading">Discover Deals</h4>
            <ul class="footer-links">
              <li><a routerLink="/deals">All Active Deals</a></li>
              <li><a routerLink="/deals" [queryParams]="{ sort: 'smart' }">Smart-Ranked Deals</a></li>
              <li><a routerLink="/deals" [queryParams]="{ category: 'Food & Dining' }">Food & Dining</a></li>
              <li><a routerLink="/deals" [queryParams]="{ category: 'Electronics' }">Electronics</a></li>
              <li><a routerLink="/deals" [queryParams]="{ category: 'Fashion' }">Fashion & Apparel</a></li>
              <li><a routerLink="/merchants">Featured Merchants</a></li>
            </ul>
          </div>

          <!-- Col 3: Customer Rewards -->
          <div class="footer-col">
            <h4 class="footer-heading">Customer Rewards</h4>
            <ul class="footer-links">
              <li><a routerLink="/customer/dashboard">My Dashboard</a></li>
              <li><a routerLink="/customer/points">Points & Loyalty Tier</a></li>
              <li><a routerLink="/customer/wallet">Cashback Wallet</a></li>
              <li><a routerLink="/customer/redemptions">Redemption History</a></li>
              <li><a routerLink="/customer/following">Followed Merchants</a></li>
              <li><a routerLink="/customer/notifications">Deal Alerts</a></li>
            </ul>
          </div>

          <!-- Col 4: For Merchants & Admin -->
          <div class="footer-col">
            <h4 class="footer-heading">Partners & Admin</h4>
            <ul class="footer-links">
              <li><a routerLink="/register">Merchant Registration</a></li>
              <li><a routerLink="/merchant/dashboard">Merchant Portal</a></li>
              <li><a routerLink="/merchant/subscription">Subscription Plans</a></li>
              <li><a routerLink="/merchant/coupons/create">Publish a Deal</a></li>
              <li><a routerLink="/admin/dashboard">Admin Dashboard</a></li>
              <li><a routerLink="/admin/revenue">Revenue Analytics</a></li>
            </ul>
          </div>
        </div>

        <div class="footer-bottom">
          <p class="copyright">
            &copy; 2026 Deals & Coupons Finder Platform
          </p>
        </div>
      </div>
    </footer>
  `,
  styles: [`
    .app-footer {
      background-color: var(--primary-dark);
      color: #94a3b8;
      border-top: 1px solid #1e293b;
      padding-top: 3.5rem;
      padding-bottom: 2rem;
      margin-top: auto;
    }

    .footer-grid {
      display: grid;
      grid-template-columns: 2fr 1fr 1fr 1fr;
      gap: 2.5rem;
      margin-bottom: 3rem;
    }

    .footer-logo {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-family: var(--font-heading);
      font-size: 1.25rem;
      font-weight: 800;
      color: white;
      margin-bottom: 0.875rem;
    }

    .brand-desc {
      font-size: 0.875rem;
      line-height: 1.6;
      color: #cbd5e1;
      margin-bottom: 1.25rem;
      max-width: 380px;
    }

    .trust-badges {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
    }

    .trust-badge {
      font-size: 0.75rem;
      background: rgba(255, 255, 255, 0.08);
      color: #e2e8f0;
      padding: 0.25rem 0.625rem;
      border-radius: var(--radius-full);
      border: 1px solid rgba(255, 255, 255, 0.12);
    }

    .footer-heading {
      font-size: 0.9375rem;
      font-weight: 700;
      color: white;
      margin-bottom: 1rem;
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }

    .footer-links {
      list-style: none;
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .footer-links a {
      font-size: 0.875rem;
      color: #94a3b8;
      transition: color var(--transition-fast);
    }

    .footer-links a:hover {
      color: #38bdf8;
    }

    .footer-bottom {
      padding-top: 1.5rem;
      border-top: 1px solid #334155;
      display: flex;
      align-items: center;
      justify-content: center;
      text-align: center;
      font-size: 0.8125rem;
      color: #94a3b8;
    }

    @media (max-width: 1024px) {
      .footer-grid {
        grid-template-columns: 1fr 1fr;
      }
    }

    @media (max-width: 640px) {
      .footer-grid {
        grid-template-columns: 1fr;
      }
      .footer-bottom {
        flex-direction: column;
        align-items: flex-start;
      }
    }
  `]
})
export class FooterComponent {}
