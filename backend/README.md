# Deals, Coupons & Merchant Subscription Platform

A backend-only enterprise-grade microservices platform built with **Java 21**, **Spring Boot 3.3.3**, **Spring Cloud 2023**, **MySQL 8.0**, **RabbitMQ**, **OpenFeign**, and **Resilience4j**.

Designed with **clean enterprise architectural principles**: strict database-per-service isolation, robust JWT authentication at the API Gateway, asynchronous Saga choreography, crowdsourced Wilson ranking, customer loyalty tiers, real-time merchant alerts, merchant revenue analytics, and comprehensive Resilience4j circuit breakers across all inter-service communications.

---

## 🏗️ 1. Architecture Overview

```
                                    +-----------------------+
                                    |     CLIENT APP        |
                                    | (Postman / Frontend)  |
                                    +-----------+-----------+
                                                |
                                                v
                                    +-----------------------+
                                    |  SPRING CLOUD GATEWAY | (Port 8080)
                                    | (Auth Filter/Routing) |
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
- CONFIG-SERVER (8888)         : Centralized .properties configurations
- EUREKA-SERVER (8761)         : Dynamic Service Discovery & Registry
- ADMIN-SERVICE (8089)         : Approvals, Audit Logs & Platform/Merchant Revenue Drilldowns
- NOTIFICATION-SERVICE (8090)  : RabbitMQ Event Consumer (Simulated Email & SMS Alerts)
- MYSQL (3306)                 : 11 Dedicated Databases (Database-per-Service Isolation)
- RABBITMQ (5672/15672)        : Distributed Asynchronous Event Broker
```

---

## 📦 2. Microservices Directory & Port Registry

| Service Name | Port | Database Schema | Primary Role & Description |
|---|---|---|---|
| `config-server` | **8888** | - | Externalizes `.properties` configurations across environments |
| `eureka-server` | **8761** | - | Dynamic Service Discovery, Registry & Health Tracking |
| `api-gateway` | **8080** | - | Single Entry Point, Reactive JWT Validation & Header Forwarding |
| `auth-service` | **8081** | `auth_db` | Customer & Merchant Registration, Login, Refresh Token Rotation |
| `customer-service` | **8082** | `customer_db` | Customer Profiles, Aggregated Profile & Redemption Dashboard |
| `merchant-service` | **8083** | `merchant_db` | Merchant Profile, Approval Status, Aggregated Merchant Dashboard |
| `subscription-service`| **8084**| `subscription_db` | Subscription Plans (Basic/Std/Prem/Biz), Lifecycle & Activation |
| `payment-service` | **8085** | `payment_db` | Mock Payment Checkout, Payment Invoices, Platform Revenue Ledger |
| `coupon-service` | **8086** | `coupon_db` | Deals/Coupons CRUD, Wilson Smart Ranking, Auto-Hiding & Voting |
| `redemption-service` | **8087**| `redemption_db` | Coupon Validation, Single-Use Enforcement, Redemption History |
| `cashback-service` | **8088** | `cashback_db` | Points (+100/redemption), Loyalty Tiers, Wallet Conversion & Payouts |
| `admin-service` | **8089** | `admin_db` | Back-Office Moderation, Platform Metrics & Merchant Revenue Drilldown |
| `notification-service`| **8090**| `notification_db` | Asynchronous Email & SMS Notification Consumer |
| `merchant-alert-service`| **8091**| `merchant_alert_db` | Follow/Unfollow Engine, Customer Interest Tracking & Coupon Alerts |

---

## 📋 3. Key Business Rules Implemented

1. **RULE 1:** Only an `APPROVED` merchant can create coupons or access their merchant dashboard.
2. **RULE 2:** Only a merchant with an `ACTIVE` subscription can create coupons.
3. **RULE 3:** If subscription is `EXPIRED` or `PENDING_VERIFICATION`, coupon creation is rejected with `"Merchant must have an ACTIVE subscription to create coupons."` or `"Merchant subscription is expired."`.
4. **RULE 4:** **Subscription Window Validity:** Coupon validity must be completely within the active subscription: $\text{subscriptionStart} \le \text{validFrom} \le \text{validUntil} \le \text{subscriptionEnd}$. Rejects violations with explicit messages (`"Coupon validFrom cannot be before the subscription start date."`, `"Coupon validUntil cannot exceed the subscription expiry date."`, `"Coupon validFrom cannot be after validUntil."`).
5. **RULE 5:** Newly created coupons start in `PENDING_APPROVAL` status.
6. **RULE 6:** Only `ADMIN` can approve or reject coupons.
7. **RULE 7:** Customers can only discover coupons that are `ACTIVE` and within valid date ranges.
8. **RULE 8 & 9:** Merchant subscription is automatically activated upon successful mock payment via `PaymentVerifiedEvent` over RabbitMQ with zero manual intervention.
9. **RULE 10:** **One-Time Use:** One customer can use one specific coupon only once. Duplicate attempts are rejected with HTTP 400.
10. **RULE 11:** **Points Reward:** Every successful coupon redemption grants **exactly +100 POINTS** to the customer's point account (no direct wallet money).
11. **RULE 12 & 13:** **Points-to-Wallet Conversion:** 100 Points = ₹10 Wallet Money (redeemed in multiples of 100 points).
12. **RULE 14:** Customers cannot withdraw more money than their available wallet balance.
13. **RULE 15:** Coupon usage cannot exceed its configured `usageLimit`.
14. **RULE 16:** **Subscription Coupon Limits:** A merchant cannot create coupons beyond their active plan limit (`count >= plan.couponLimit`). Rejected with `"Your subscription coupon limit has been reached."`.
15. **RULE 17:** **Hour-Based Validity:** Coupons support hour-based durations via `validityHours` (e.g. 24 hours, 2 hours) and exact second-level `LocalDateTime` precision for discovery and redemption validation.
16. **RULE 18:** **Vote Eligibility:** Customers can vote (`UPVOTE` or `DOWNVOTE`) only on coupons they have redeemed/used. Re-voting updates the vote and recalculates reliability.
17. **RULE 19:** **Automatic Hiding:** Raw Reliability = $(upvotes / totalVotes) \times 100$. If $totalVotes \ge 10$ and $rawReliability < 40.00\%$, status transitions `ACTIVE \to HIDDEN`. If score recovers $\ge 40.00\%$, status returns to `ACTIVE`.
18. **RULE 20:** **Wilson Smart Ranking:** Discovery endpoint (`GET /api/coupons/ranked` or `?sort=smart`) orders active coupons by **Wilson Score Confidence Interval** ($z = 1.96$) $\text{DESC} \to totalVotes \text{ DESC} \to createdAt \text{ DESC}$. `HIDDEN` coupons are excluded from discovery.
19. **RULE 21:** **Immutable Validity Dates on Update:** Merchants cannot modify `validFrom` or `validUntil` on existing coupons. `CouponUpdateRequest` accepts only editable terms (`title`, `description`, `category`, `discount`, `cashbackPercentage`, `minimumPurchase`, `usageLimit`). Modifying validity dates returns HTTP 400 (`"Coupon validity dates cannot be modified after creation."`).
20. **RULE 22:** **Merchant Ownership Check:** Merchants can only create coupons for their own account and can only update coupons they own. Unauthorized attempts return HTTP 400 (`"Access denied: You cannot update coupons belonging to another merchant."`).
21. **RULE 23:** **Merchant-Wise Revenue Reporting:** Admin can view platform gross subscription revenue, merchant-wise grouped revenue (`GET /api/admin/revenue/merchants`), and specific merchant revenue (`GET /api/admin/revenue/merchants/{merchantId}`). Calculates strictly from `VERIFIED` subscription payments in `payment_db`. Zero-sales registered merchants report `totalRevenue: 0.00` and `successfulPayments: 0`.
22. **RULE 24:** **Revenue Date Range Filtering:** Revenue endpoints accept optional `fromDate` and `toDate` ISO parameters (e.g. `?fromDate=2026-09-01&toDate=2026-09-30`). Invalid ranges (`fromDate > toDate`) are rejected with HTTP 400 (`"fromDate cannot be after toDate"`).
23. **RULE 25:** **Admin Revenue Authorization:** All revenue endpoints require authenticated JWT with `ADMIN` role. Non-admin access is rejected with HTTP 400 / 403.
24. **RULE 26:** **Customer Redemption History:** Customers can view their redeemed coupons with pagination (`GET /api/redemptions/my-history`) sorted newest first, or recent items (`GET /api/redemptions/my-history/recent`). History includes redemption ID, coupon ID, coupon title, coupon code, merchant ID, merchant name, redemption date, purchase amount, discount, and points earned (+100). Access restricted to the authenticated customer (`X-User-Id`).
25. **RULE 27:** **Customer Loyalty Level / Tier System:** Customers have a dynamic loyalty level calculated from their point balance: **NO_TIER** (0-99 points), **BRONZE** (100-199 points), **SILVER** (200-499 points), **GOLD** (500-999 points), and **PLATINUM** (1000+ points). Accessible via `GET /api/points/my-tier` and `GET /api/points/customer/{customerId}/tier`, returning current tier, total points, next tier, and points needed to level up.
26. **RULE 28:** **Merchant New-Coupon Alerts & Follow System:** Customers who redeem a coupon from a merchant are automatically tracked as interested (`InterestSource.REDEMPTION`). Customers can also explicitly follow/unfollow merchants (`POST/DELETE /api/merchant-alerts/follow/{merchantId}`). When a merchant creates a new coupon (`CouponCreatedEvent` emitted on `deals.coupon.exchange`), `merchant-alert-service` finds all interested customers, checks customer alert preferences (`AlertPreference`: email, sms, in-app), deduplicates via `merchant_coupon_notifications`, and triggers notifications via `deals.notification.exchange` / `merchant.coupon.alert`.

---

## 🔄 4. Saga Choreography Workflow: Subscription Purchase

```
Merchant Selects Plan (e.g. Standard ₹1299)
       ↓
POST /api/subscriptions (Subscription Service)
   -> Subscription created with status = PENDING_VERIFICATION
       ↓
Merchant Makes Mock Payment: POST /api/payments (Payment Service)
   -> Payment processed automatically as successful (status = VERIFIED)
   -> Publishes PaymentVerifiedEvent to RabbitMQ ('deals.payment.exchange')
       ↓
Subscription Service receives PaymentVerifiedEvent (PaymentVerifiedConsumer):
   -> Validates merchantId and subscriptionId
   -> Sets status = ACTIVE
   -> Sets startDate = today, endDate = today + durationInMonths
   -> Sets paymentId = paymentId from event
       ↓
Notification Service receives event and logs simulated Email confirmation to Merchant.
       ↓
Merchant has ACTIVE subscription and is authorized to create coupons.
```

---

## ⚡ 5. Resilience4j Circuit Breakers & Fault Tolerance

All inter-service synchronous calls via OpenFeign are hardened with **Resilience4j Circuit Breakers**, **Retries (3 attempts with exponential backoff)**, and graceful **Fallbacks**:

| Microservice | OpenFeign Client | Target Service & Endpoint | Fallback Strategy |
|---|---|---|---|
| `coupon-service` | `SubscriptionClient` | `subscription-service`: `GET /api/subscriptions/merchant/{id}/active` | Fast-fail with HTTP 503 (`ServiceUnavailableException`) |
| `customer-service` | `CashbackClient` | `cashback-service`: `GET /api/cashback/wallet/{id}`, `GET /api/points/...` | Returns default empty wallet & fallback tier |
| `customer-service` | `RedemptionClient` | `redemption-service`: `GET /api/redemptions/customer/{id}/history/recent` | Returns empty redemption list |
| `merchant-service` | `SubscriptionClient` | `subscription-service`: `GET /api/subscriptions/merchant/{id}/active` | Returns null/inactive subscription gracefully |
| `merchant-service` | `CouponClient` | `coupon-service`: `GET /api/coupons/merchant/{id}/stats` | Returns zeroed coupon statistics |
| `redemption-service` | `CouponClient` | `coupon-service`: `GET /api/coupons/{id}`, `PUT .../increment-usage` | Fast-fail with HTTP 503 during coupon validation |
| `redemption-service` | `MerchantClient` | `merchant-service`: `GET /api/merchants/{id}` | Returns fallback merchant profile |
| `merchant-alert-service` | `MerchantClient` | `merchant-service`: `GET /api/merchants/{id}` | Returns fallback merchant metadata |
| `subscription-service` | `PaymentClient` | `payment-service`: `GET /api/payments/verify/{paymentId}` | Fast-fail with HTTP 503 |
| `admin-service` | `PaymentAdminClient`, `CouponAdminClient`, etc. | Multiple services | Fallback to safe defaults / partial summaries |

### Circuit Breaker Code Pattern Example (`customer-service`):
```java
@FeignClient(name = "cashback-service")
public interface CashbackClient {

    @GetMapping("/api/cashback/wallet/{customerId}")
    @CircuitBreaker(name = "cashbackService", fallbackMethod = "getWalletFallback")
    @Retry(name = "cashbackService")
    WalletResponseDto getWalletByCustomerId(@PathVariable("customerId") Long customerId);

    default WalletResponseDto getWalletFallback(Long customerId, Throwable t) {
        return WalletResponseDto.builder()
                .customerId(customerId)
                .balance(BigDecimal.ZERO)
                .status("UNAVAILABLE")
                .build();
    }
}
```

---

## 🚀 6. How to Run the Project

### Prerequisites:
- **Java 21 JDK**
- **Maven 3.8+**
- **Docker & Docker Compose** (Optional for containerized run)
- **MySQL (Port 3306)** & **RabbitMQ (Port 5672/15672)**

### Option A: Running with Docker Compose (Single Command)

```bash
# 1. Build all Maven jars
mvn clean package -DskipTests

# 2. Launch complete infrastructure & all 13 services
docker-compose up --build
```

### Option B: Running Locally Step-by-Step

1. **Start MySQL & RabbitMQ** (or via Docker: `docker run -d -p 3306:3306 -e MYSQL_ROOT_PASSWORD=password mysql:8.0` and `docker run -d -p 5672:5672 -p 15672:15672 rabbitmq:3-management-alpine`).
2. **Start Infrastructure Services (in order):**
   ```bash
   # 1. Config Server (8888)
   cd config-server && mvn spring-boot:run

   # 2. Eureka Server (8761 - Dashboard at http://localhost:8761)
   cd eureka-server && mvn spring-boot:run

   # 3. API Gateway (8080)
   cd api-gateway && mvn spring-boot:run
   ```
3. **Start Core & Business Services:**
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

## 🧪 7. Running Unit & Integration Tests

Every microservice includes JUnit 5 and Mockito tests covering happy paths, edge cases, business rule violations, and MockMvc controller endpoints:

```bash
# Run tests for all modules
mvn clean test
```

Tested scenarios include:
- `shouldRegisterCustomerSuccessfully` & `shouldThrowExceptionWhenRegisteringExistingEmail`
- `shouldNotCreateCouponWhenSubscriptionIsExpired`
- `shouldNotCreateCouponWhenValidityExceedsSubscriptionExpiry`
- `shouldActivateSubscriptionFromPaymentVerifiedEvent`
- `shouldCalculateAndCreditPointsCorrectly` (+100 points reward)
- `shouldConvertPointsToWalletMoneyInMultiplesOf100` (100 pts = ₹10)
- `shouldThrowExceptionWhenRedeemingMoreThanBalance`
- `shouldCalculateWilsonScoreConfidenceIntervalCorrectly`
- `shouldTrackMerchantInterestAndFanoutAlerts`

---

## 📬 8. End-to-End Postman 20-Step Testing Plan

Import the included `postman_collection.json` file into Postman.

### Complete 20-Step Testing Sequence:

| Step | Action | Method & Endpoint | Payload / Header | Expected Status |
|---|---|---|---|---|
| **1** | Register Merchant | `POST /api/auth/register/merchant` | `{"businessName":"Pizza Planet","email":"merchant@pizzaplanet.com",...}` | `201 CREATED` |
| **2** | Admin Login | `POST /api/auth/login` | `{"email":"admin@dealsplatform.com","password":"admin123"}` | `200 OK` (Copy JWT) |
| **3** | Admin Approves Merchant | `PUT /api/admin/merchants/2/approve` | `Authorization: Bearer <admin_token>` | `200 OK` (Status: APPROVED) |
| **4** | Merchant Login | `POST /api/auth/login` | `{"email":"merchant@pizzaplanet.com","password":"password123"}` | `200 OK` (Copy JWT) |
| **5** | Get Subscription Plans | `GET /api/subscriptions/plans` | `Authorization: Bearer <merchant_token>` | `200 OK` (Basic/Std/Prem/Biz) |
| **6** | Purchase Subscription | `POST /api/subscriptions` | `{"merchantId":2,"planId":2}` | `201 CREATED` (PENDING_VERIFICATION) |
| **7** | Merchant Makes Mock Payment | `POST /api/payments` | `{"merchantId":2,"subscriptionId":1,"amount":1299.00,"paymentMethod":"UPI"}` | `201 CREATED` (VERIFIED / Dispatches Saga Event) |
| **8** | Verify Subscription Active | `GET /api/subscriptions/merchant/2/active` | `Authorization: Bearer <merchant_token>` | `200 OK` (Status: ACTIVE) |
| **9** | Merchant Creates Coupon | `POST /api/coupons` | `{"merchantId":2,"couponCode":"PIZZA50","discount":50,"validityHours":24,...}` | `201 CREATED` (PENDING_APPROVAL) |
| **10**| Admin Approves Coupon | `PUT /api/admin/coupons/1/approve` | `Authorization: Bearer <admin_token>` | `200 OK` (Status: ACTIVE) |
| **11**| Register Customer | `POST /api/auth/register/customer` | `{"name":"Alice","email":"alice@gmail.com",...}` | `201 CREATED` |
| **12**| Customer Login | `POST /api/auth/login` | `{"email":"alice@gmail.com","password":"password123"}` | `200 OK` (Copy Customer JWT) |
| **13**| Customer Discovers Coupons | `GET /api/coupons/ranked` | `Authorization: Bearer <customer_token>` | `200 OK` (Wilson ranked active coupons) |
| **14**| Customer Redeems Coupon | `POST /api/redemptions` | `{"couponId":1,"customerId":3,"purchaseAmount":1000}` | `201 CREATED` (Dispatches +100 Points event) |
| **15**| Check Customer Points & Tier | `GET /api/points/my-tier` | `Authorization: Bearer <customer_token>` | `200 OK` (Points: 100, Tier: BRONZE) |
| **16**| Convert Points to Wallet Money | `POST /api/points/redeem` | `{"customerId":3,"pointsToRedeem":100}` | `200 OK` (₹10 credited to wallet) |
| **17**| Check Customer Wallet Balance | `GET /api/cashback/wallet/3` | `Authorization: Bearer <customer_token>` | `200 OK` (Balance: ₹10.00) |
| **18**| Customer Withdraws Wallet Money | `POST /api/cashback/redeem` | `{"customerId":3,"amount":10.00}` | `200 OK` (Balance: ₹0.00) |
| **19**| Check Follows & Dispatched Alerts | `GET /api/merchant-alerts/my-follows` | `Authorization: Bearer <customer_token>` | `200 OK` (Interest & alerts tracked) |
| **20**| Admin Checks Merchant Revenue | `GET /api/admin/revenue/merchants` | `Authorization: Bearer <admin_token>` | `200 OK` (Grouped revenue breakdown) |

---

## 💡 9. Interview Cheat Sheet for Interns / Freshers

When explaining this project in an interview:

1. **Why Microservices over Monolith?**  
   *Isolation of business boundaries* (e.g. Payment & Subscription failures do not bring down Coupon discovery for customers). Independent database ownership prevents monolithic bottlenecks.
2. **How does Service Discovery work?**  
   Each service registers its host/port with **Netflix Eureka**. When `coupon-service` calls `subscription-service`, OpenFeign queries Eureka for instances of `SUBSCRIPTION-SERVICE` and load balances automatically.
3. **How does the Saga work?**  
   It is a **choreography-based Saga**. Payment verification does not use a central orchestrator; instead, `payment-service` publishes a `PaymentVerifiedEvent` to RabbitMQ, and `subscription-service` independently consumes it to activate the subscription.
4. **Why OpenFeign for some calls and RabbitMQ for others?**  
   - **OpenFeign (Synchronous):** Used when an immediate answer is required to make a business decision (e.g. "Does this merchant have an active subscription right now?").
   - **RabbitMQ (Asynchronous):** Used for non-blocking side-effects (e.g. calculating loyalty points, sending SMS/Email alerts, and fanning out new-coupon notifications).
5. **How is Resilience handled?**  
   **Resilience4j Circuit Breakers** prevent cascading failures when downstream microservices are slow or offline. If a service call fails, retries are attempted before falling back to cached or default responses.
6. **How is security handled?**  
   The **API Gateway** intercepts incoming requests, validates the JWT Bearer token, extracts user claims (`email`, `role`, `userId`), and attaches header metadata (`X-User-Email`, `X-User-Role`, `X-User-Id`) for downstream services. Short-lived JWT Access Tokens are paired with database-backed **Refresh Tokens** (`POST /api/auth/refresh-token`), and logging out (`POST /api/auth/logout`) explicitly revokes the Refresh Token in `auth_db` to prevent session reuse.

---

## 📄 License
Academic / Learning Project - Built for Spring Boot & Microservices Fresher Learning.
