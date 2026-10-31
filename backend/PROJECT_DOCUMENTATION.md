# Project Documentation: Deals, Coupons & Merchant Subscription Platform

**Version:** 2.0.0  
**Target Environment:** Java 21 | Spring Boot 3.3.3 | Spring Cloud 2023.0.3 | MySQL 8.0 | RabbitMQ  
**Architecture:** Enterprise Distributed Microservices (Database-per-Service, Event-Driven Choreography, API Gateway, Resilience4j Circuit Breakers)

---

## 1. Executive Summary

The **Deals, Coupons & Merchant Subscription Platform** is an enterprise-grade, backend-driven distributed microservices platform designed to connect merchants with deal-seeking customers while providing a robust monetization model through tiered merchant subscriptions.

The platform delivers end-to-end functionality across core business capabilities:
1. **Merchant Onboarding & Approval**: Business registration, KYC document submission, and administrative verification workflow.
2. **Subscription Monetization**: Tiered merchant subscription plans (Basic, Standard, Premium, Business) with automated asynchronous payment verification via a Saga choreography pattern.
3. **Deals & Coupon Lifecycle**: Deal creation bounded by merchant subscription limits and expiry dates, hour-based validity precision, administrative moderation, and Wilson Score Confidence Interval ranking.
4. **Resilient Redemption & Loyalty Engine**: High-throughput coupon redemptions with fault-tolerant circuit breaking (Resilience4j), transactional customer point accounts (+100 points per redemption), loyalty tier progression (Bronze to Platinum), and point-to-wallet conversion (100 pts = ₹10).
5. **Real-time Merchant Alerts & Notification Fanout**: Merchant follow/unfollow engine, redemption interest tracking, and asynchronous event-driven SMS/email alerts via RabbitMQ for newly created deals.
6. **Administrative Governance & Merchant Revenue Analytics**: Back-office moderation, platform financial summaries, and merchant-wise grouped revenue drilldowns.

---

## 2. System Architecture & High-Level Design

The platform follows a **decentralized microservices architecture** adhering to standard enterprise cloud patterns:

```
                                    +-----------------------+
                                    |     CLIENT APP        |
                                    | (Postman / Web / App) |
                                    +-----------+-----------+
                                                |
                                                v
                                    +-----------------------+
                                    |  SPRING CLOUD GATEWAY | (Port 8080)
                                    | (JWT Auth & Routing)  |
                                    +-----------+-----------+
                                                |
            +-----------------------------------+-----------------------------------+
            |                                   |                                   |
            v                                   v                                   v
+-----------------------+           +-----------------------+           +-----------------------+
|      AUTH-SERVICE     |           |    CUSTOMER-SERVICE   |           |    MERCHANT-SERVICE   |
|      (Port 8081)      |           |      (Port 8082)      |           |      (Port 8083)      |
+-----------------------+           +-----------+-----------+           +-----------+-----------+
                                                |                                   |
                                                | (Feign + CircuitBreaker)          | (Feign + CircuitBreaker)
                                                v                                   v
                                    +-----------------------+           +-----------------------+
                                    |    CASHBACK-SERVICE   |           |  SUBSCRIPTION-SERVICE |
                                    |  (Wallet/Points/Tier) |           |      (Port 8084)      |
                                    |      (Port 8088)      |           +-----------+-----------+
                                    +-----------+-----------+                       |
                                                ^                                   v (Feign + CircuitBreaker)
                                                | (CouponRedeemedEvent via RMQ) +-----------------------+
                                                |                               |    PAYMENT-SERVICE    |
                                                |                               |      (Port 8085)      |
                                    +-----------+-----------+                   +-----------+-----------+
                                    |   REDEMPTION-SERVICE  |                               |
                                    |      (Port 8087)      |<-------+                      | (PaymentVerifiedEvent)
                                    +-----------+-----------+        |                      v
                                                | (Feign)            |          +-----------------------+
                                                v                    |          |     COUPON-SERVICE    |
                                    +-----------------------+        |          |      (Port 8086)      |
                                    |     COUPON-SERVICE    |--------+          +-----------+-----------+
                                    |      (Port 8086)      |                               |
                                    +-----------+-----------+                               | (CouponCreatedEvent)
                                                |                                           v
                                                | (Feign + CircuitBreaker)      +-----------------------+
                                                +------------------------------>| MERCHANT-ALERT-SERVICE|
                                                                                |      (Port 8091)      |
                                                                                +-----------+-----------+
                                                                                            |
                                                                                            v (RMQ Alert)
                                                                                +-----------------------+
                                                                                |  NOTIFICATION-SERVICE |
                                                                                |      (Port 8090)      |
                                                                                +-----------------------+

Supporting Infrastructure:
---------------------------------------------------------------------------------------------------
- CONFIG-SERVER (Port 8888)        : Centralized configuration properties management
- EUREKA-SERVER (Port 8761)        : Dynamic Service Discovery & Health Registry
- ADMIN-SERVICE (Port 8089)        : Moderation, Platform Metrics & Merchant Revenue Drilldown
- NOTIFICATION-SERVICE (Port 8090) : Asynchronous Email & SMS Notification Consumer
- MYSQL (Port 3306)                : 11 Isolated Database Schemas (Database-per-Service)
- RABBITMQ (Port 5672/15672)       : Distributed Asynchronous Messaging Broker
```

---

## 3. Technology Stack

| Layer / Concern | Technology Used | Version / Details |
|---|---|---|
| **Language** | Java | JDK 21 (LTS) |
| **Framework** | Spring Boot | 3.3.3 |
| **Cloud Framework** | Spring Cloud | 2023.0.3 (Gateway, Eureka, Config, OpenFeign) |
| **Data Persistence** | Spring Data JPA / Hibernate | MySQL Dialect, HikariCP Connection Pool |
| **Databases** | MySQL | 8.0 (11 Dedicated Schema Namespaces) |
| **Messaging Broker** | RabbitMQ | AMQP 0-9-1 with Topic & Direct Exchanges |
| **Fault Tolerance** | Resilience4j | Circuit Breaker, Retry, Fallback Mechanisms |
| **Security & Auth** | Spring Security & JJWT | JWT (Access & Refresh Tokens), BCrypt Hashing |
| **API Documentation** | Springdoc OpenAPI (Swagger) | 2.6.0 (OpenAPI 3.0) |
| **Build & Tooling** | Apache Maven | Maven Multi-Module Project Structure (14 Modules) |
| **Testing** | JUnit 5, Mockito, MockMvc | Comprehensive Unit & Controller Integration Tests |
| **Containerization** | Docker & Docker Compose | Multi-container automated provisioning |

---

## 4. Complete Microservices Catalog

The platform consists of **13 dedicated microservices** organized across 14 Maven modules:

### A. Core Infrastructure Services

1. **`config-server` (Port 8888)**
   - Externalizes and centralizes configuration `.properties` for all microservices.
   - Eliminates hardcoded properties across environments.

2. **`eureka-server` (Port 8761)**
   - Netflix Eureka Service Registry.
   - Dynamic service registration, heartbeats, and client-side load balancing via OpenFeign.

3. **`api-gateway` (Port 8080)**
   - Single point of entry for all incoming traffic.
   - Reactive JWT validation filter, role check, and context header injection (`X-User-Email`, `X-User-Role`, `X-User-Id`).

### B. Business Microservices

4. **`auth-service` (Port 8081 | DB: `auth_db`)**
   - User authentication and role management (`ROLE_CUSTOMER`, `ROLE_MERCHANT`, `ROLE_ADMIN`).
   - Issues short-lived Access Tokens and database-backed Refresh Tokens.
   - Secure logout and token revocation mechanism.

5. **`customer-service` (Port 8082 | DB: `customer_db`)**
   - Manages customer profiles, delivery addresses, and category preferences.
   - Aggregated customer profile dashboard pulling wallet, loyalty tier, and recent redemption history via Resilience4j-protected OpenFeign clients.

6. **`merchant-service` (Port 8083 | DB: `merchant_db`)**
   - Merchant onboarding, business details, KYC submission, and approval status tracking.
   - Merchant dashboard metrics (active deals, total claims, subscription state) protected by circuit breakers.

7. **`subscription-service` (Port 8084 | DB: `subscription_db`)**
   - Subscription plan catalog (Basic, Standard, Premium, Business).
   - Subscription lifecycle management (`PENDING_VERIFICATION`, `ACTIVE`, `EXPIRED`, `CANCELLED`).
   - Consumes `PaymentVerifiedEvent` to activate subscriptions automatically.

8. **`payment-service` (Port 8085 | DB: `payment_db`)**
   - Simulates UPI/Card/NetBanking checkout for merchant subscriptions.
   - Generates payment receipts and records platform revenue ledger.
   - Provides merchant-specific revenue aggregation endpoints (`/api/payments/revenue/merchants/{merchantId}`).
   - Publishes `PaymentVerifiedEvent` over RabbitMQ (`deals.payment.exchange`).

9. **`coupon-service` (Port 8086 | DB: `coupon_db`)**
   - Deals and coupons authoring, categorization, validity period, and usage limits.
   - Hour-based durations (`validityHours`) with exact second-level precision.
   - Wilson Score Confidence Interval ranking (`GET /api/coupons/ranked`) and crowdsourced voting with auto-hiding.
   - Publishes `CouponCreatedEvent` over RabbitMQ (`deals.coupon.exchange`).

10. **`redemption-service` (Port 8087 | DB: `redemption_db`)**
    - High-throughput coupon validation and redemption engine.
    - Validates usage count against `usageLimit` and enforces **one coupon per customer** (`existsByCustomerIdAndCouponId` & unique DB constraint).
    - Customer redemption history endpoints (`/api/redemptions/my-history` & `/recent`).
    - Dispatches `CouponRedeemedEvent` with `pointsEarned = 100` to RabbitMQ.

11. **`cashback-service` (Port 8088 | DB: `cashback_db`)**
    - Customer Point Account, Wallet & Loyalty Tier engine.
    - Consumes `CouponRedeemedEvent` and credits **+100 Points** to the Customer Point Account (zero direct wallet money).
    - Dynamic tier calculation: **NO_TIER** (0-99), **BRONZE** (100-199), **SILVER** (200-499), **GOLD** (500-999), **PLATINUM** (1000+).
    - Converts points to wallet money: **100 Points = ₹10 Wallet Money** via `POST /api/points/redeem`.
    - Supports customer wallet withdrawal with strict balance validation (`POST /api/cashback/redeem`).

12. **`admin-service` (Port 8089 | DB: `admin_db`)**
    - Platform management back-office.
    - Merchant approval/rejection and Coupon approval/rejection endpoints.
    - Financial reporting: platform subscription revenue, merchant-wise revenue breakdown (`GET /api/admin/revenue/merchants`), and audit trails.

13. **`notification-service` (Port 8090 | DB: `notification_db`)**
    - Asynchronous message consumer listening to RabbitMQ exchanges.
    - Logs and records simulated Email and SMS alerts for payment receipts, subscription activations, coupon approvals, "+100 Points added" credits, and new-coupon alerts.

14. **`merchant-alert-service` (Port 8091 | DB: `merchant_alert_db`)**
    - Tracks customer interest in merchants via coupon redemptions (`REDEMPTION`) or explicit follow actions (`MANUAL_FOLLOW`).
    - Consumes `CouponCreatedEvent` to automatically dispatch new coupon alerts to interested customers across their enabled channels (Email, SMS, In-App).
    - Prevents duplicate alerts via `merchant_coupon_notifications` table and respects user notification preferences.

---

## 5. Key Business Rules & Domain Validation

| Rule ID | Domain | Business Rule Description |
|---|---|---|
| **RULE 1** | Merchant | Only merchants with status `APPROVED` can purchase subscriptions or access their merchant dashboard. |
| **RULE 2** | Subscription | Only merchants with an `ACTIVE` subscription can create deals or coupons. |
| **RULE 3** | Coupon | If a merchant's subscription is `EXPIRED` or `PENDING_VERIFICATION`, coupon creation is rejected with an HTTP 400 Bad Request error (`"Merchant must have an ACTIVE subscription to create coupons."` / `"Merchant subscription is expired."`). |
| **RULE 4** | Coupon Validity Boundary | A coupon's validity period must be completely within the active subscription: $\text{subscriptionStart} \le \text{validFrom} \le \text{validUntil} \le \text{subscriptionEnd}$. Rejections: `"Coupon validFrom cannot be before the subscription start date."`, `"Coupon validUntil cannot exceed the subscription expiry date."`, `"Coupon validFrom cannot be after validUntil."`. |
| **RULE 5** | Coupon | Newly created coupons start in `PENDING_APPROVAL` status until reviewed by an Administrator. |
| **RULE 6** | Admin | Only users with `ROLE_ADMIN` can approve or reject merchant registrations and coupons. |
| **RULE 7** | Discovery | Customers can only browse and search coupons that are `ACTIVE`, approved, and within their valid date range. |
| **RULE 8** | Saga Event | Successful mock payment verification automatically triggers subscription activation via `PaymentVerifiedEvent` without manual admin intervention. |
| **RULE 9** | Subscription | Upon activation, subscription `startDate` is set to the current date and `endDate` is set to `startDate + plan.durationInMonths`. |
| **RULE 10**| One-Time Use | **One customer can use one specific coupon only once.** Duplicate redemptions by the same customer are rejected with HTTP 400. |
| **RULE 11**| Points Reward | Every successful coupon redemption grants **exactly +100 POINTS** to the customer's persistent Point Account. No direct money is credited to the wallet. |
| **RULE 12**| Point Conversion| Customers explicitly convert points to wallet money at the rate of **100 POINTS = ₹10 WALLET MONEY** (in multiples of 100 points). |
| **RULE 13**| Wallet vs Points| Points and money are strictly segregated. Wallet contains only currency (₹) and point account contains points. |
| **RULE 14**| Wallet Limit | Customer wallet withdrawal cannot exceed the current available wallet balance. |
| **RULE 15**| Security | Customers can only view and redeem their own points and wallet balance. |
| **RULE 16**| Subscription Limit | A merchant cannot exceed the coupon creation limit of their active subscription plan (`count >= plan.couponLimit`). Rejected with `"Your subscription coupon limit has been reached."`. |
| **RULE 17**| Hour-Based Validity | Coupons support hour-based durations via `validityHours` (e.g. 24 hours, 2 hours) and exact second-level `LocalDateTime` precision for both discovery and redemption validation. |
| **RULE 18**| Vote Eligibility | Customers can vote (UPVOTE or DOWNVOTE) only for coupons they have redeemed/used. Re-voting updates the vote and recalculates reliability. |
| **RULE 19**| Automatic Hiding | Raw Reliability = $(upvotes / totalVotes) \times 100$. If $totalVotes \ge 10$ and $rawReliability < 40.00\%$, status transitions `ACTIVE \to HIDDEN`. If score recovers $\ge 40.00\%$, status returns to `ACTIVE`. |
| **RULE 20**| Wilson Smart Ranking | Discovery API sorts active coupons by **Wilson Score Confidence Interval** ($z = 1.96$) $\text{DESC} \to totalVotes \text{ DESC} \to createdAt \text{ DESC}$. `HIDDEN` coupons are excluded from discovery and rejected during redemption. |
| **RULE 21**| Immutable Validity Dates | Merchants cannot update `validFrom` or `validUntil` on existing coupons. `CouponUpdateRequest` accepts only editable terms (`title`, `description`, `category`, `discount`, `cashbackPercentage`, `minimumPurchase`, `usageLimit`). Attempts to alter validity dates are rejected with HTTP 400 (`"Coupon validity dates cannot be modified after creation."`). Core metadata (`merchantId`, `couponCode`, `status`, `usageCount`, `approvedBy`, `createdAt`) are strictly preserved. |
| **RULE 22**| Merchant Ownership | Merchants can only create coupons for their own merchant account and can only update coupons they own. Non-matching IDs are rejected with HTTP 400 (`"Access denied: You cannot update coupons belonging to another merchant."`). |
| **RULE 23**| Merchant-Wise Revenue Reporting | Admin can view overall platform subscription revenue, merchant-wise grouped revenue (`GET /api/admin/revenue/merchants`), and specific merchant revenue (`GET /api/admin/revenue/merchants/{merchantId}`). Calculated strictly from `VERIFIED` subscription payments in `payment_db`. Excludes PENDING, REJECTED, and coupon cashbacks. Registered merchants with 0 payments report `totalRevenue: 0.00` and `successfulPayments: 0`. |
| **RULE 24**| Revenue Date Range Filtering | Revenue endpoints accept optional ISO dates `fromDate` and `toDate` (e.g. `?fromDate=2026-09-01&toDate=2026-09-30`). Date ranges are validated against `paymentDate`: if `fromDate > toDate`, request is rejected with HTTP 400 (`"fromDate cannot be after toDate"`). |
| **RULE 25**| Admin Revenue Authorization | All admin revenue endpoints require authenticated JWT with `ADMIN` role. Access by `CUSTOMER` or `MERCHANT` is rejected with HTTP 400 / 403. |
| **RULE 26**| Customer Redemption History | Customers can view their redeemed coupons with pagination (`GET /api/redemptions/my-history`) sorted newest first, or recent items (`GET /api/redemptions/my-history/recent`). History includes redemption ID, coupon ID, coupon title, coupon code, merchant ID, merchant name, redemption date, purchase amount, discount, and points earned (+100). Access restricted to the authenticated customer (`X-User-Id`). |
| **RULE 27**| Customer Loyalty Level / Tier System | Customers have a dynamic loyalty level calculated from their point balance: **NO_TIER** (0-99 points), **BRONZE** (100-199 points), **SILVER** (200-499 points), **GOLD** (500-999 points), and **PLATINUM** (1000+ points). Accessible via `GET /api/points/my-tier` and `GET /api/points/customer/{customerId}/tier`, returning current tier, total points, next tier, and points needed to level up. |
| **RULE 28**| Merchant New-Coupon Alerts & Follow System | Customers who redeem a coupon from a merchant are automatically tracked as interested (`InterestSource.REDEMPTION`). Customers can also explicitly follow/unfollow merchants (`POST/DELETE /api/merchant-alerts/follow/{merchantId}`). When a merchant creates a new coupon (`CouponCreatedEvent` emitted on `deals.coupon.exchange`), `merchant-alert-service` finds all interested customers, checks customer alert preferences (`AlertPreference`: email, sms, in-app), deduplicates via `merchant_coupon_notifications`, and triggers notifications via `deals.notification.exchange` / `merchant.coupon.alert`. |

---

## 6. Distributed Patterns & Inter-Service Workflows

### A. Saga Choreography Pattern: Subscription Purchase Flow

```
1. Merchant Selects Plan:
   POST /api/subscriptions -> Status: PENDING_VERIFICATION
         |
2. Merchant Makes Payment:
   POST /api/payments -> Status: VERIFIED
         |
3. Payment Service emits event:
   RabbitMQ: PaymentVerifiedEvent (Exchange: 'deals.payment.exchange', RoutingKey: 'payment.verified')
         |
   +-----+-----------------------------------------+
   |                                               |
   v                                               v
[subscription-service]                   [notification-service]
- Consumes PaymentVerifiedEvent          - Consumes PaymentVerifiedEvent
- Validates merchantId & subscriptionId  - Logs simulated Email receipt to merchant
- Updates Status: ACTIVE                 - Stores notification audit record
- Sets startDate & endDate
- Merchant can now create coupons
```

### B. Event-Driven Points & Notification Flow

```
1. Customer Redeems Coupon:
   POST /api/redemptions -> Validates limits & checks single-use per customer
         |
2. Redemption Service emits event:
   RabbitMQ: CouponRedeemedEvent (Exchange: 'deals.redemption.exchange', RoutingKey: 'coupon.redeemed')
         |
   +-----+-----------------------------------------+
   |                                               |
   v                                               v
[cashback-service]                       [notification-service]
- Consumes CouponRedeemedEvent           - Consumes CouponRedeemedEvent
- Idempotency check via referenceId      - Sends SMS to customer: "+100 Points added!"
- Credits +100 Points to Point Account
- Recalculates Loyalty Tier (Bronze/Silver/Gold/Platinum)
```

### C. Merchant New-Coupon Alert & Interest Fanout Flow

```
1. Merchant Creates Approved Coupon:
   POST /api/coupons -> Status: PENDING_APPROVAL -> (Admin Approves) -> Status: ACTIVE
         |
2. Coupon Service emits event:
   RabbitMQ: CouponCreatedEvent (Exchange: 'deals.coupon.exchange', RoutingKey: 'coupon.created')
         |
3. Merchant Alert Service consumes CouponCreatedEvent:
   - Queries 'customer_merchant_interest' for customers who follow or previously redeemed from this merchant
   - Queries 'customer_alert_preferences' for channel settings (Email, SMS, In-App)
   - Checks 'merchant_coupon_notifications' for idempotency & deduplication
   - Emits Alert Event to 'deals.notification.exchange' with RoutingKey 'merchant.coupon.alert'
         |
4. Notification Service logs simulated Email/SMS alerts to all interested customers.
```

### D. Comprehensive Resilience4j Circuit Breaker Matrix

All inter-service synchronous calls via OpenFeign are protected by Resilience4j:

| Service | OpenFeign Client | Protected Endpoint | Fallback Action |
|---|---|---|---|
| `coupon-service` | `SubscriptionClient` | `GET /api/subscriptions/merchant/{id}/active` | Throws `ServiceUnavailableException` (HTTP 503) |
| `customer-service` | `CashbackClient` | `GET /api/cashback/wallet/{customerId}` | Returns fallback wallet (`balance: 0`, `status: UNAVAILABLE`) |
| `customer-service` | `CashbackClient` | `GET /api/points/customer/{customerId}/tier` | Returns default `NO_TIER` fallback |
| `customer-service` | `RedemptionClient` | `GET /api/redemptions/customer/{customerId}/history/recent` | Returns empty redemption history list |
| `merchant-service` | `SubscriptionClient` | `GET /api/subscriptions/merchant/{merchantId}/active` | Returns null/inactive subscription gracefully |
| `merchant-service` | `CouponClient` | `GET /api/coupons/merchant/{merchantId}/stats` | Returns zeroed coupon statistics |
| `redemption-service` | `CouponClient` | `GET /api/coupons/{id}` | Throws `ServiceUnavailableException` (HTTP 503) |
| `redemption-service` | `CouponClient` | `PUT /api/coupons/{id}/increment-usage` | Throws `ServiceUnavailableException` (HTTP 503) |
| `redemption-service` | `MerchantClient` | `GET /api/merchants/{id}` | Returns fallback merchant profile |
| `merchant-alert-service` | `MerchantClient` | `GET /api/merchants/{id}` | Returns fallback merchant metadata |
| `subscription-service` | `PaymentClient` | `GET /api/payments/verify/{paymentId}` | Throws `ServiceUnavailableException` (HTTP 503) |
| `admin-service` | `PaymentAdminClient` | `GET /api/payments/revenue/summary` | Returns fallback revenue summary (`totalRevenue: 0.00`) |
| `admin-service` | `CouponAdminClient` | `GET /api/coupons/stats/summary` | Returns zeroed coupon metrics |

---

## 7. Security Architecture

1. **Stateless Authentication:** 
   - Uses `auth-service` to authenticate credentials using BCrypt.
   - Generates standard signed HS256/RS256 JWT tokens containing `sub`, `roles`, `userId`, and `exp`.
2. **API Gateway Interception:**
   - Public paths (`/api/auth/**`, Swagger UI) are bypassed.
   - Protected endpoints require an `Authorization: Bearer <token>` header.
   - Gateway decrypts and verifies the signature, attaching sanitized user metadata as HTTP headers:
     - `X-User-Id`
     - `X-User-Email`
     - `X-User-Role`
3. **Session Revocation (Refresh Token Rotation):**
   - Refresh tokens are stored in `auth_db`.
   - Logging out (`POST /api/auth/logout`) revokes the stored refresh token to invalidate future session refreshes.

---

## 8. Database Architecture & Per-Service Isolation

The project enforces the **Database-per-Service** pattern to maintain domain independence across 11 MySQL schemas:

| Database Name | Owning Microservice | Key Tables / Entities |
|---|---|---|
| `auth_db` | `auth-service` | `users`, `roles`, `refresh_tokens` |
| `customer_db` | `customer-service` | `customers`, `preferences`, `addresses` |
| `merchant_db` | `merchant-service` | `merchants`, `business_profiles`, `kyc_documents` |
| `subscription_db` | `subscription-service`| `subscription_plans`, `merchant_subscriptions` |
| `payment_db` | `payment-service` | `payments`, `invoices`, `platform_revenue_records` |
| `coupon_db` | `coupon-service` | `coupons`, `categories`, `coupon_votes`, `coupon_tags` |
| `redemption_db` | `redemption-service` | `redemptions`, `redemption_audit_logs` |
| `cashback_db` | `cashback-service` | `wallets`, `wallet_transactions`, `customer_point_accounts`, `point_transactions` |
| `admin_db` | `admin-service` | `admin_users`, `approval_logs`, `platform_metrics` |
| `notification_db` | `notification-service`| `notification_logs`, `message_templates` |
| `merchant_alert_db`| `merchant-alert-service`| `customer_merchant_interest`, `customer_alert_preferences`, `merchant_coupon_notifications` |

---

## 9. End-to-End Postman 20-Step Verification Workflow

The project includes an end-to-end integration test collection in `postman_collection.json`:

```
Step 1:  Register Merchant            (POST /api/auth/register/merchant)
Step 2:  Admin Login                  (POST /api/auth/login -> Receive Admin JWT)
Step 3:  Admin Approves Merchant      (PUT  /api/admin/merchants/2/approve -> APPROVED)
Step 4:  Merchant Login               (POST /api/auth/login -> Receive Merchant JWT)
Step 5:  Get Subscription Plans       (GET  /api/subscriptions/plans)
Step 6:  Purchase Subscription        (POST /api/subscriptions -> PENDING_VERIFICATION)
Step 7:  Mock Payment Processing      (POST /api/payments -> VERIFIED & Saga event emitted)
Step 8:  Verify Subscription Status   (GET  /api/subscriptions/merchant/2/active -> ACTIVE)
Step 9:  Merchant Creates Coupon      (POST /api/coupons -> PENDING_APPROVAL)
Step 10: Admin Approves Coupon        (PUT  /api/admin/coupons/1/approve -> ACTIVE)
Step 11: Register Customer            (POST /api/auth/register/customer)
Step 12: Customer Login               (POST /api/auth/login -> Receive Customer JWT)
Step 13: Customer Discovers Deals     (GET  /api/coupons/ranked -> Wilson Ranked Deals)
Step 14: Customer Redeems Coupon      (POST /api/redemptions -> Dispatches +100 Points Event)
Step 15: Check Customer Points & Tier (GET  /api/points/my-tier -> Points: 100, Tier: BRONZE)
Step 16: Convert Points to Wallet     (POST /api/points/redeem -> 100 Pts = ₹10.00 Money)
Step 17: Check Customer Wallet        (GET  /api/cashback/wallet/3 -> Balance: ₹10.00)
Step 18: Customer Redeems Wallet      (POST /api/cashback/redeem -> ₹10.00 Redeemed)
Step 19: Check Follows & Alerts       (GET  /api/merchant-alerts/my-follows -> Tracked)
Step 20: Admin Checks Merchant Revenue(GET  /api/admin/revenue/merchants -> Grouped Revenue)
```

---

## 10. How to Run & Build

### Prerequisites
- **Java 21 JDK**
- **Apache Maven 3.8+**
- **Docker & Docker Compose** (or local MySQL 8.0 & RabbitMQ 3.x)

### Option A: Docker Compose (All-in-One)
```bash
# 1. Compile and package all jars
mvn clean package -DskipTests

# 2. Start MySQL, RabbitMQ, and all 13 services
docker-compose up --build
```

### Option B: Local Step-by-Step
1. **Start Infrastructure Services:**
   - MySQL on port `3306` (password: `password`)
   - RabbitMQ on port `5672` (Management on `15672`)
2. **Start Spring Cloud Core (in order):**
   ```bash
   cd config-server && mvn spring-boot:run
   cd eureka-server && mvn spring-boot:run
   cd api-gateway && mvn spring-boot:run
   ```
3. **Start Application Services:**
   ```bash
   cd auth-service && mvn spring-boot:run
   cd customer-service && mvn spring-boot:run
   cd merchant-service && mvn spring-boot:run
   cd subscription-service && mvn spring-boot:run
   cd payment-service && mvn spring-boot:run
   cd coupon-service && mvn spring-boot:run
   cd redemption-service && mvn spring-boot:run
   cd cashback-service && mvn spring-boot:run
   cd admin-service && mvn spring-boot:run
   cd notification-service && mvn spring-boot:run
   cd merchant-alert-service && mvn spring-boot:run
   ```

---

## 11. Project Summary & Completed Milestones

- [x] Multi-module Maven architecture with Java 21 and Spring Boot 3.3.3 (14 modules).
- [x] Netflix Eureka Service Discovery and dynamic registration.
- [x] Spring Cloud Gateway with reactive JWT authentication filtering and claims propagation.
- [x] Authentication service with role-based access control (Admin, Merchant, Customer) and Refresh Token rotation.
- [x] Merchant profile onboarding and administrative moderation workflow.
- [x] Tiered subscription model with pricing, duration, and feature sets.
- [x] Mock Payment service with asynchronous Saga choreography via RabbitMQ for subscription activation.
- [x] Coupon authoring with strict subscription verification, date validation, and Wilson Score smart ranking.
- [x] Coupon redemption validation with single-use enforcement and event publishing.
- [x] Customer Point Account (+100 points/redemption) and Loyalty Tier engine (Bronze/Silver/Gold/Platinum).
- [x] Point-to-wallet conversion (100 pts = ₹10) and wallet money withdrawals.
- [x] Merchant follow system, redemption interest tracking, and real-time coupon alerts.
- [x] Back-office administrative service for platform-wide metrics, merchant revenue drilldown, and approvals.
- [x] Asynchronous Notification service for simulated Email/SMS alerts.
- [x] Comprehensive Resilience4j Circuit Breakers across all 7 communicating microservices.
- [x] Complete 20-step Postman integration test collection (`postman_collection.json`).
- [x] Full test suite verification across all modules (`mvn clean test` passing with 0 failures).
