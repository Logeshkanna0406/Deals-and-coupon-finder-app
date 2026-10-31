import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CouponService } from '../../../core/services/coupon.service';
import { MerchantService } from '../../../core/services/merchant.service';
import { CouponResponse } from '../../../core/models/coupon.models';
import { CouponCardComponent } from '../../../shared/components/coupon-card/coupon-card.component';
import { LoadingSkeletonComponent } from '../../../shared/components/loading-skeleton/loading-skeleton.component';
import { RedemptionModalComponent } from '../../../shared/components/redemption-modal/redemption-modal.component';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    FormsModule,
    CouponCardComponent,
    LoadingSkeletonComponent,
    RedemptionModalComponent
  ],
  template: `
    <div class="home-page">
      <!-- 1. HERO SECTION -->
      <section class="hero-section">
        <div class="container hero-container">
          <div class="hero-text-col fade-in">
            <div class="hero-pill">
              <span class="pill-fire">🔥</span>
              <span>Discover Verified Deals, Cashback & Rewards</span>
            </div>
            <h1 class="hero-heading">
              Find the Best Deals.<br />
              <span class="gradient-text">Save More.</span> Every Day.
            </h1>
            <p class="hero-subheading">
              Browse thousands of crowd-verified coupons, exclusive merchant discounts, and earn +100 reward points on every single purchase.
            </p>

            <!-- Hero Search Form -->
            <form class="hero-search-bar" (ngSubmit)="onSearch()">
              <span class="search-icon">🔍</span>
              <input
                type="text"
                class="search-field"
                [(ngModel)]="searchQuery"
                name="heroSearch"
                placeholder="Search deals, restaurants, electronics, clothing..."
              />
              <button type="submit" class="btn btn-accent btn-search">
                Explore Deals
              </button>
            </form>

            <!-- Popular Quick Tags -->
            <div class="quick-tags">
              <span class="tags-label">Trending Now:</span>
              <a [routerLink]="['/deals']" [queryParams]="{ category: 'Food & Dining' }" class="quick-tag">🍔 Food</a>
              <a [routerLink]="['/deals']" [queryParams]="{ category: 'Electronics' }" class="quick-tag">💻 Tech</a>
              <a [routerLink]="['/deals']" [queryParams]="{ category: 'Fashion' }" class="quick-tag">👗 Fashion</a>
              <a [routerLink]="['/deals']" [queryParams]="{ minDiscount: 30 }" class="quick-tag">⚡ 30%+ Off</a>
            </div>
          </div>

          <!-- Hero Illustration / Interactive Badge Box -->
          <div class="hero-visual-col fade-in">
            <div class="hero-visual-card card">
              <div class="deal-highlight-top">
                <span class="highlight-tag">⭐ TODAY'S TOP DEAL</span>
                <span class="highlight-percent">30% OFF</span>
              </div>
              <div class="highlight-body">
                <div class="highlight-merchant">PIZZA PLANET BISTRO</div>
                <h3 class="highlight-title">Flat 30% Off on Gourmet Woodfired Artisan Pizzas</h3>
                <div class="highlight-code">
                  <code>SAVE30</code>
                  <span class="verified-check">✓ Verified Today</span>
                </div>
                <div class="highlight-points">
                  <span>✨ Bonus Reward:</span>
                  <strong>+10 Points</strong> upon redemption
                </div>
                <a routerLink="/deals" class="btn btn-primary" style="width: 100%; margin-top: 1rem;">
                  Browse 50+ Live Coupons →
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- 2. POPULAR CATEGORIES -->
      <section class="section categories-section">
        <div class="container">
          <div class="section-header">
            <div>
              <span class="section-badge">CATEGORIES</span>
              <h2 class="section-title">Explore by Category</h2>
            </div>
            <a routerLink="/deals" class="view-all-link">View All Categories →</a>
          </div>

          <div class="categories-grid">
            @for (cat of categories; track cat.name) {
              <a
                [routerLink]="['/deals']"
                [queryParams]="{ category: cat.name }"
                class="category-card card card-interactive"
              >
                <div class="category-icon">{{ cat.icon }}</div>
                <h4 class="category-name">{{ cat.name }}</h4>
                <span class="category-count">{{ cat.tagline }}</span>
              </a>
            }
          </div>
        </div>
      </section>

      <!-- 3. TRENDING DEALS SECTION (Real Backend Data) -->
      <section class="section deals-section">
        <div class="container">
          <div class="section-header">
            <div>
              <span class="section-badge">FEATURED</span>
              <h2 class="section-title">Today's Trending Deals</h2>
              <p class="section-subtitle">Real-time verified discounts available right now</p>
            </div>
            <a routerLink="/deals" class="btn btn-outline btn-sm">Explore All Deals</a>
          </div>

          @if (isLoadingDeals) {
            <app-loading-skeleton type="card"></app-loading-skeleton>
          } @else if (trendingCoupons.length === 0) {
            <div class="empty-notice card text-center">
              <p>No active deals currently published. Check back shortly!</p>
            </div>
          } @else {
            <div class="coupons-grid">
              @for (coupon of trendingCoupons; track coupon.couponId) {
                <app-coupon-card
                  [coupon]="coupon"
                  [merchantName]="getMerchantName(coupon.merchantId)"
                  [isFeatured]="true"
                  (redeem)="openRedeemModal($event)"
                ></app-coupon-card>
              }
            </div>
          }
        </div>
      </section>

      <!-- 4. WILSON SMART-RANKED DEALS SECTION -->
      <section class="section ranked-section">
        <div class="container">
          <div class="section-header">
            <div>
              <span class="section-badge" style="background: #e0e7ff; color: #4338ca;">SMART RANKING</span>
              <h2 class="section-title">Highest Reliability Deals</h2>
              <p class="section-subtitle">Ranked by Wilson Score Confidence Interval based on authentic user votes</p>
            </div>
            <a routerLink="/deals" [queryParams]="{ sort: 'smart' }" class="btn btn-secondary btn-sm">
              See All Ranked
            </a>
          </div>

          @if (isLoadingRanked) {
            <app-loading-skeleton type="card"></app-loading-skeleton>
          } @else if (rankedCoupons.length === 0) {
            <div class="empty-notice card text-center">
              <p>Coupons will appear here as users redeem and vote on reliability.</p>
            </div>
          } @else {
            <div class="coupons-grid">
              @for (coupon of rankedCoupons; track coupon.couponId) {
                <app-coupon-card
                  [coupon]="coupon"
                  [merchantName]="getMerchantName(coupon.merchantId)"
                  (redeem)="openRedeemModal($event)"
                ></app-coupon-card>
              }
            </div>
          }
        </div>
      </section>

      <!-- 5. HOW IT WORKS GUIDE -->
      <section class="section how-it-works-section">
        <div class="container">
          <div class="section-header text-center" style="margin-bottom: 3rem;">
            <span class="section-badge">SEAMLESS EXPERIENCE</span>
            <h2 class="section-title">How Deals & Coupons Finder Works</h2>
            <p class="section-subtitle" style="margin: 0 auto; max-width: 500px;">
              Four simple steps from discovering a discount to pocketing cashback and loyalty points
            </p>
          </div>

          <div class="steps-grid">
            <div class="step-card card">
              <div class="step-num">1</div>
              <div class="step-icon">🔍</div>
              <h4 class="step-title">Discover Verified Deals</h4>
              <p class="step-desc">
                Search among thousands of deals across food, electronics, and fashion with smart reliability ranking.
              </p>
            </div>

            <div class="step-card card">
              <div class="step-num">2</div>
              <div class="step-icon">📋</div>
              <h4 class="step-title">Copy Code & Redeem</h4>
              <p class="step-desc">
                Copy the coupon code or click Redeem to apply instant discounts directly against your order total.
              </p>
            </div>

            <div class="step-card card">
              <div class="step-num">3</div>
              <div class="step-icon">⭐</div>
              <h4 class="step-title">Earn +10 Points</h4>
              <p class="step-desc">
                Every successful redemption automatically credits exactly +10 Points to your persistent Point Account.
              </p>
            </div>

            <div class="step-card card">
              <div class="step-num">4</div>
              <div class="step-icon">💰</div>
              <h4 class="step-title">Convert to Wallet Money</h4>
              <p class="step-desc">
                Convert points into real wallet currency at the rate of 100 Points = ₹10 or advance your Loyalty Tier.
              </p>
            </div>
          </div>
        </div>
      </section>

      <!-- 6. WHY USE US HIGHLIGHTS -->
      <section class="section why-us-section">
        <div class="container">
          <div class="why-us-grid">
            <div class="why-us-text">
              <span class="section-badge">WHY DEALS & COUPONS</span>
              <h2 class="section-title">A Real E-Commerce Deals Platform Built for Trust</h2>
              <p class="section-desc">
                Unlike scrapers that show expired and broken coupons, our platform is powered by direct merchant subscriptions, administrative verification, and mathematical Wilson Score confidence calculations.
              </p>
              <div class="feature-bullets">
                <div class="feature-bullet">
                  <div class="bullet-icon">🛡️</div>
                  <div>
                    <strong>Admin Approved Merchants</strong>
                    <p>Only verified businesses with active subscriptions can publish coupons.</p>
                  </div>
                </div>
                <div class="feature-bullet">
                  <div class="bullet-icon">📉</div>
                  <div>
                    <strong>Auto-Hiding Bad Coupons</strong>
                    <p>Coupons falling below 40% reliability score are automatically hidden from discovery.</p>
                  </div>
                </div>
                <div class="feature-bullet">
                  <div class="bullet-icon">🔔</div>
                  <div>
                    <strong>Merchant Following & Alerts</strong>
                    <p>Follow your favorite stores to receive immediate notification when new deals drop.</p>
                  </div>
                </div>
              </div>
            </div>

            <div class="why-us-stats-card card">
              <h3 class="tier-card-title">Dynamic Loyalty Tiers</h3>
              <p class="tier-card-subtitle">Level up your status with every deal redeemed</p>

              <div class="tiers-preview">
                <div class="tier-preview-row">
                  <span class="badge badge-tier-bronze">BRONZE</span>
                  <span>100 - 199 Points</span>
                  <span class="tier-perk">Starter Level</span>
                </div>
                <div class="tier-preview-row">
                  <span class="badge badge-tier-silver">SILVER</span>
                  <span>200 - 499 Points</span>
                  <span class="tier-perk">Priority Alerts</span>
                </div>
                <div class="tier-preview-row">
                  <span class="badge badge-tier-gold">GOLD</span>
                  <span>500 - 999 Points</span>
                  <span class="tier-perk">Special Offers</span>
                </div>
                <div class="tier-preview-row">
                  <span class="badge badge-tier-platinum">PLATINUM</span>
                  <span>1000+ Points</span>
                  <span class="tier-perk">VIP Member</span>
                </div>
              </div>

              <a routerLink="/register" class="btn btn-primary" style="width: 100%; margin-top: 1.5rem;">
                Join & Start Earning Points →
              </a>
            </div>
          </div>
        </div>
      </section>

      <!-- 7. BOTTOM BANNER CTA -->
      <section class="cta-banner-section">
        <div class="container text-center">
          <h2 class="cta-heading">Ready to Stop Paying Full Price?</h2>
          <p class="cta-subheading">
            Browse verified coupons now and get your first +100 reward points on redemption.
          </p>
          <div class="cta-buttons">
            <a routerLink="/deals" class="btn btn-accent btn-lg">
              Explore All Deals Now →
            </a>
            <a routerLink="/register" class="btn btn-outline btn-lg" style="color: white; border-color: white;">
              Create Free Account
            </a>
          </div>
        </div>
      </section>
    </div>

    <!-- Redemption Modal -->
    <app-redemption-modal
      [isOpen]="isRedeemModalOpen"
      [coupon]="selectedCouponForRedemption"
      (close)="isRedeemModalOpen = false"
      (redeemed)="onRedeemedSuccess($event)"
    ></app-redemption-modal>
  `,
  styles: [`
    .hero-section {
      background: linear-gradient(180deg, #eff6ff 0%, var(--bg-main) 100%);
      padding: 4.5rem 0 3.5rem;
    }

    .hero-container {
      display: grid;
      grid-template-columns: 1.25fr 0.85fr;
      gap: 3rem;
      align-items: center;
    }

    .hero-pill {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      background: white;
      border: 1px solid #bfdbfe;
      padding: 0.375rem 0.875rem;
      border-radius: var(--radius-full);
      font-size: 0.8125rem;
      font-weight: 700;
      color: var(--primary);
      margin-bottom: 1.25rem;
      box-shadow: var(--shadow-sm);
    }

    .pill-fire { font-size: 1rem; }

    .hero-heading {
      font-size: 3.25rem;
      font-weight: 800;
      line-height: 1.15;
      color: var(--text-main);
      margin-bottom: 1.25rem;
      letter-spacing: -0.02em;
    }

    .gradient-text {
      background: linear-gradient(135deg, var(--primary) 0%, var(--accent) 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }

    .hero-subheading {
      font-size: 1.125rem;
      color: var(--text-muted);
      line-height: 1.6;
      margin-bottom: 2rem;
      max-width: 540px;
    }

    .hero-search-bar {
      display: flex;
      align-items: center;
      background: white;
      border: 2px solid #bfdbfe;
      border-radius: var(--radius-full);
      padding: 0.375rem 0.375rem 0.375rem 1.25rem;
      box-shadow: var(--shadow-md);
      max-width: 580px;
      margin-bottom: 1.25rem;
      position: relative;
    }

    .search-icon {
      font-size: 1.125rem;
      margin-right: 0.5rem;
      color: var(--text-light);
    }

    .search-field {
      flex: 1;
      border: none;
      outline: none;
      font-size: 0.9375rem;
      font-family: inherit;
      color: var(--text-main);
    }

    .btn-search {
      border-radius: var(--radius-full);
      padding: 0.75rem 1.5rem;
    }

    .quick-tags {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      flex-wrap: wrap;
      font-size: 0.8125rem;
    }

    .tags-label {
      color: var(--text-muted);
      font-weight: 600;
    }

    .quick-tag {
      background: white;
      border: 1px solid var(--border);
      padding: 0.25rem 0.625rem;
      border-radius: var(--radius-full);
      color: var(--text-main);
      font-weight: 500;
      transition: all var(--transition-fast);
    }
    .quick-tag:hover {
      border-color: var(--primary);
      color: var(--primary);
      background: var(--primary-light);
    }

    .hero-visual-card {
      padding: 2rem;
      border-radius: var(--radius-xl);
      background: white;
      border: 1px solid #bfdbfe;
      box-shadow: var(--shadow-xl);
      position: relative;
    }

    .deal-highlight-top {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 1rem;
    }

    .highlight-tag {
      font-size: 0.75rem;
      font-weight: 800;
      color: var(--accent);
      letter-spacing: 0.05em;
    }

    .highlight-percent {
      background: linear-gradient(135deg, #ef4444, #ea580c);
      color: white;
      font-weight: 800;
      font-size: 0.875rem;
      padding: 0.25rem 0.75rem;
      border-radius: var(--radius-full);
    }

    .highlight-merchant {
      font-size: 0.75rem;
      font-weight: 700;
      color: var(--text-light);
      letter-spacing: 0.05em;
    }

    .highlight-title {
      font-size: 1.25rem;
      font-weight: 800;
      color: var(--text-main);
      margin: 0.375rem 0 1rem;
      line-height: 1.35;
    }

    .highlight-code {
      display: flex;
      align-items: center;
      justify-content: space-between;
      background: #f8fafc;
      border: 1.5px dashed #cbd5e1;
      border-radius: var(--radius-md);
      padding: 0.625rem 1rem;
      margin-bottom: 0.875rem;
    }

    .highlight-code code {
      font-size: 1.125rem;
      font-weight: 800;
      color: var(--primary);
      letter-spacing: 0.05em;
    }

    .verified-check {
      font-size: 0.75rem;
      font-weight: 700;
      color: var(--success-dark);
    }

    .highlight-points {
      font-size: 0.8125rem;
      color: #92400e;
      background: var(--warning-light);
      padding: 0.5rem 0.75rem;
      border-radius: var(--radius-sm);
      display: flex;
      align-items: center;
      gap: 0.375rem;
    }

    /* Sections */
    .section {
      padding: 4.5rem 0;
    }

    .section-header {
      display: flex;
      align-items: flex-end;
      justify-content: space-between;
      margin-bottom: 2rem;
      gap: 1rem;
      flex-wrap: wrap;
    }

    .section-header.text-center {
      flex-direction: column;
      align-items: center;
      justify-content: center;
      text-align: center;
      gap: 0.5rem;
    }

    .section-badge {
      display: inline-block;
      font-size: 0.75rem;
      font-weight: 800;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      color: var(--primary);
      background: var(--primary-light);
      padding: 0.25rem 0.625rem;
      border-radius: var(--radius-full);
      margin-bottom: 0.5rem;
    }

    .section-title {
      font-size: 2rem;
      font-weight: 800;
      color: var(--text-main);
    }

    .section-subtitle {
      font-size: 0.9375rem;
      color: var(--text-muted);
      margin-top: 0.25rem;
    }

    .view-all-link {
      font-weight: 700;
      font-size: 0.9375rem;
      color: var(--primary);
    }

    /* Categories Grid */
    .categories-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
      gap: 1.25rem;
    }

    .category-card {
      padding: 1.5rem 1rem;
      text-align: center;
      border-radius: var(--radius-lg);
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.375rem;
    }

    .category-icon {
      font-size: 2.5rem;
      margin-bottom: 0.5rem;
      line-height: 1;
    }

    .category-name {
      font-size: 1rem;
      font-weight: 700;
      color: var(--text-main);
    }

    .category-count {
      font-size: 0.75rem;
      color: var(--text-muted);
    }

    /* Coupons Grid */
    .coupons-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 1.5rem;
    }

    .empty-notice {
      padding: 2.5rem;
      color: var(--text-muted);
    }

    /* Steps */
    .steps-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 1.5rem;
    }

    .step-card {
      padding: 2rem 1.5rem;
      position: relative;
      text-align: center;
      border-radius: var(--radius-xl);
    }

    .step-num {
      position: absolute;
      top: 1rem;
      right: 1.25rem;
      font-size: 1.25rem;
      font-weight: 900;
      color: #e2e8f0;
      font-family: var(--font-heading);
    }

    .step-icon {
      font-size: 2.5rem;
      margin-bottom: 1rem;
      line-height: 1;
    }

    .step-title {
      font-size: 1.125rem;
      font-weight: 700;
      margin-bottom: 0.5rem;
    }

    .step-desc {
      font-size: 0.875rem;
      color: var(--text-muted);
      line-height: 1.5;
    }

    /* Why Us */
    .why-us-section {
      background: white;
    }

    .why-us-grid {
      display: grid;
      grid-template-columns: 1.2fr 0.8fr;
      gap: 3.5rem;
      align-items: center;
    }

    .section-desc {
      font-size: 1.0625rem;
      color: var(--text-muted);
      line-height: 1.6;
      margin: 1rem 0 2rem;
    }

    .feature-bullets {
      display: flex;
      flex-direction: column;
      gap: 1.25rem;
    }

    .feature-bullet {
      display: flex;
      gap: 1rem;
      align-items: flex-start;
    }

    .bullet-icon {
      font-size: 1.5rem;
      background: var(--surface-alt);
      padding: 0.5rem;
      border-radius: var(--radius-md);
      line-height: 1;
    }

    .feature-bullet strong {
      display: block;
      font-size: 1rem;
      color: var(--text-main);
      margin-bottom: 0.125rem;
    }

    .feature-bullet p {
      font-size: 0.875rem;
      color: var(--text-muted);
    }

    .why-us-stats-card {
      padding: 2.5rem;
      border-radius: var(--radius-xl);
      border: 1px solid var(--border);
      background: linear-gradient(180deg, #f8fafc 0%, white 100%);
    }

    .tier-card-title {
      font-size: 1.25rem;
      font-weight: 800;
      margin-bottom: 0.25rem;
    }

    .tier-card-subtitle {
      font-size: 0.875rem;
      color: var(--text-muted);
      margin-bottom: 1.5rem;
    }

    .tiers-preview {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    .tier-preview-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0.75rem 1rem;
      background: white;
      border: 1px solid var(--border);
      border-radius: var(--radius-md);
      font-size: 0.875rem;
      font-weight: 600;
    }

    .tier-perk {
      font-size: 0.75rem;
      color: var(--text-muted);
    }

    /* CTA Banner */
    .cta-banner-section {
      background: linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%);
      color: white;
      padding: 5rem 0;
    }

    .cta-heading {
      font-size: 2.5rem;
      font-weight: 800;
      color: white;
      margin-bottom: 1rem;
    }

    .cta-subheading {
      font-size: 1.125rem;
      color: #93c5fd;
      margin-bottom: 2rem;
      max-width: 580px;
      margin-left: auto;
      margin-right: auto;
    }

    .cta-buttons {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 1rem;
      flex-wrap: wrap;
    }

    /* Responsive */
    @media (max-width: 1200px) {
      .coupons-grid { grid-template-columns: repeat(3, 1fr); }
    }

    @media (max-width: 1024px) {
      .hero-container { grid-template-columns: 1fr; }
      .why-us-grid { grid-template-columns: 1fr; }
      .steps-grid { grid-template-columns: 1fr 1fr; }
      .coupons-grid { grid-template-columns: repeat(2, 1fr); }
    }

    @media (max-width: 640px) {
      .hero-heading { font-size: 2.25rem; }
      .steps-grid { grid-template-columns: 1fr; }
      .coupons-grid { grid-template-columns: 1fr; }
      .hero-search-bar { flex-direction: column; padding: 0.5rem; border-radius: var(--radius-lg); }
      .btn-search { width: 100%; border-radius: var(--radius-md); }
    }
  `]
})
export class HomeComponent implements OnInit {
  private readonly couponService = inject(CouponService);
  private readonly merchantService = inject(MerchantService);
  private readonly router = inject(Router);
  private readonly cdr = inject(ChangeDetectorRef);

  searchQuery = '';
  trendingCoupons: CouponResponse[] = [];
  rankedCoupons: CouponResponse[] = [];
  merchantNames = new Map<number, string>();
  isLoadingDeals = true;
  isLoadingRanked = true;

  isRedeemModalOpen = false;
  selectedCouponForRedemption: CouponResponse | null = null;

  categories = [
    { name: 'Food & Dining', icon: '🍔', tagline: 'Dining & Takeaway' },
    { name: 'Electronics', icon: '💻', tagline: 'Gadgets & Laptops' },
    { name: 'Fashion', icon: '👗', tagline: 'Clothing & Shoes' },
    { name: 'Travel', icon: '✈️', tagline: 'Hotels & Flights' },
    { name: 'Beauty & Health', icon: '💄', tagline: 'Skincare & Spas' },
    { name: 'Grocery', icon: '🛒', tagline: 'Supermarket & Essentials' }
  ];

  ngOnInit(): void {
    this.loadMerchants();
    this.loadTrendingDeals();
    this.loadRankedDeals();
  }

  loadMerchants(): void {
    this.merchantService.getAllMerchants().subscribe({
      next: list => {
        (list || []).forEach(m => {
          this.merchantNames.set(m.merchantId, m.businessName);
        });
        this.cdr.markForCheck();
      },
      error: () => {}
    });
  }

  getMerchantName(merchantId?: number): string | undefined {
    return merchantId ? this.merchantNames.get(merchantId) : undefined;
  }

  loadTrendingDeals(): void {
    this.isLoadingDeals = true;
    this.cdr.markForCheck();
    this.couponService.getActiveCoupons().subscribe({
      next: data => {
        this.trendingCoupons = (data || []).slice(0, 4);
        this.isLoadingDeals = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.isLoadingDeals = false;
        this.cdr.markForCheck();
      }
    });
  }

  loadRankedDeals(): void {
    this.isLoadingRanked = true;
    this.cdr.markForCheck();
    this.couponService.getRankedCoupons().subscribe({
      next: data => {
        this.rankedCoupons = (data || []).slice(0, 4);
        this.isLoadingRanked = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.isLoadingRanked = false;
        this.cdr.markForCheck();
      }
    });
  }

  onSearch(): void {
    if (this.searchQuery.trim()) {
      this.router.navigate(['/deals'], { queryParams: { q: this.searchQuery.trim() } });
    }
  }

  openRedeemModal(coupon: CouponResponse): void {
    this.selectedCouponForRedemption = coupon;
    this.isRedeemModalOpen = true;
    this.cdr.markForCheck();
  }

  onRedeemedSuccess(res: any): void {
    // Refresh deal usage
    this.loadTrendingDeals();
  }
}
