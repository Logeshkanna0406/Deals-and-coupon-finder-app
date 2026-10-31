# Deals and Coupons Platform

## Overview

This repository contains a **full‑stack Deals & Coupons platform** built with:
- **Backend** – a collection of Spring Boot micro‑services (authentication, merchant, subscription, payment, coupon, redemption, cashback, notification, admin, config/eureka infrastructure, etc.).
- **Frontend** – an Angular application that consumes the backend APIs and provides the user interface for searching, applying and managing coupons.

The project is organised into a single top‑level folder with two distinct sections:

```
deals-and-coupons-platform/
├─ backend/      ← all micro‑service source code
└─ frontend/    ← Angular application
```

## Tech Stack

| Layer      | Technology                                 |
|-----------|--------------------------------------------|
| Backend   | Java 17, Spring Boot 3, Spring Cloud Netflix (Eureka), Maven, Lombok |
| Frontend  | Angular 16, TypeScript, RxJS, SCSS, Node.js (npm) |
| Build/CI  | Maven for backend, npm scripts for frontend |
| Deployment| Docker (each service can be containerised) |

## Repository Structure

- **backend/** – contains each micro‑service in its own folder (e.g., `auth-service`, `merchant-service`, `payment-service`, …). Each service follows the standard Maven layout (`src/main/java`, `src/main/resources`, `src/test/java`).
- **frontend/** – the Angular project with the usual `src/`, `e2e/`, `angular.json`, `package.json`, etc.
- **README.md** – you are reading it!
- **.gitignore** – excludes generated files, dependencies and IDE artefacts.

## Prerequisites

| Tool | Minimum version |
|------|-----------------|
| Java | 17 (JDK) |
| Maven | 3.9.x |
| Node.js | 20.x |
| npm | 10.x |
| Git | any recent version |

## Setup – Backend

```bash
# Navigate to the backend root
cd deals-and-coupons-platform/backend

# Build all services (Maven will compile each module)
./mvnw clean install

# Run a specific service (example: auth-service)
cd auth-service
./mvnw spring-boot:run
```

Each service reads its configuration from `src/main/resources/application.properties` (or `*.yml`).
Environment‑specific values (database URLs, secret keys, JWT signing secret, etc.) **must be provided via environment variables** – see the "Configuration" section below.

## Setup – Frontend

```bash
# Navigate to the Angular project
cd deals-and-coupons-platform/frontend

# Install dependencies
npm ci

# Run the development server
npm start   # or ng serve
```
The app will be available at `http://localhost:4200`.

## Configuration (Secrets)

All hard‑coded secrets have been replaced with placeholders. The following environment variables are expected:

| Variable | Description |
|----------|-------------|
| `DB_URL` | JDBC URL for the database |
| `DB_USERNAME` | Database user |
| `DB_PASSWORD` | Database password |
| `JWT_SECRET` | Secret key used to sign JWT tokens |
| `AWS_ACCESS_KEY_ID` | (optional) AWS credentials |
| `AWS_SECRET_ACCESS_KEY` | (optional) AWS credentials |
| `PAYMENT_API_KEY` | API key for the payment gateway |
| `EMAIL_SMTP_PASSWORD` | SMTP password for email notifications |

Create a `.env` file (NOT committed) or export the variables in your shell before starting each service.

## Running the Full Stack Locally

1. Start the **config server** and **eureka server** first (they provide service discovery and configuration).\
2. Start each micro‑service in any order; they will register with Eureka automatically.\
3. Finally, start the Angular frontend.

## Testing

- Backend unit/integration tests can be run with `./mvnw test` inside each service folder.
- Frontend tests with `npm test`.

## License

This project is provided under the **MIT License** – feel free to modify, extend and deploy.

---
Author : Logeshkanna R P
