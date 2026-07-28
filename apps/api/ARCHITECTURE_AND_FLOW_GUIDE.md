# 🎓 Orvyn PMS — Comprehensive Architecture & File Guide

This document explains every single file in your NestJS Backend (`apps/api`), why `AuthService` was modularized into sub-services, and how the entire flow works end-to-end.

---

## 💡 Why Was `AuthService` Modularized?

In enterprise NestJS development, when a service class grows over 200–300 lines (handling passwords, tokens, cookies, database transactions, and account settings all at once), NestJS best practice recommends **Single Responsibility Principle (SRP)**.

We split authentication into 3 focused, clean services:

1. 🔐 **`PasswordService`** (`src/modules/auth/services/password.service.ts`):
   - Responsible *only* for bcrypt password hashing, comparisons, and password reset token generation/verification.
2. 🪙 **`TokenService`** (`src/modules/auth/services/token.service.ts`):
   - Responsible *only* for signing 15m access tokens & 30d refresh tokens, setting HTTP-only cookies, token rotation, and server-side DB token revocation.
3. 👤 **`AuthService`** (`src/modules/auth/auth.service.ts`):
   - Clean orchestrator (~100 lines) handling signup transactions, login status gates, and account setting workflows by injecting `TokenService` and `PasswordService`.

---

## 📁 1. Directory Structure

```text
apps/api/src/
├── common/                         <── Shared Utilities Across API
│   ├── decorators/
│   │   ├── current-user.decorator.ts  (@CurrentUser parameter decorator)
│   │   └── roles.decorator.ts         (@Roles metadata decorator)
│   └── guards/
│       └── roles.guard.ts             (RBAC Guard for SUPER_ADMIN, OWNER, etc.)
├── database/                       <── Prisma Database Provider
│   ├── prisma.module.ts
│   └── prisma.service.ts
├── modules/                        <── Feature Modules
│   ├── admin/                      <── Super Admin Governance Module
│   │   ├── dto/
│   │   │   └── reject-owner.dto.ts
│   │   ├── admin.controller.ts     (HTTP endpoints /admin/*)
│   │   ├── admin.module.ts         (Admin Dependency Wiring)
│   │   └── admin.service.ts        (Super Admin DB queries)
│   └── auth/                       <── Auth & Account Settings Module
│       ├── dto/
│       │   ├── change-email.dto.ts
│       │   ├── change-password.dto.ts
│       │   ├── forgot-password.dto.ts
│       │   ├── login.dto.ts
│       │   ├── owner-signup.dto.ts
│       │   ├── register.dto.ts
│       │   └── reset-password.dto.ts
│       ├── guards/
│       │   └── jwt-auth.guard.ts   (Passport AuthGuard)
│       ├── services/               <── Refactored Modular Services
│       │   ├── password.service.ts (Bcrypt & Password Reset Tokens)
│       │   └── token.service.ts    (JWT Tokens, Cookies & Rotation)
│       ├── strategies/
│       │   └── jwt.strategy.ts     (Live DB Status Check Strategy)
│       ├── auth.controller.ts     (HTTP endpoints /auth/*)
│       ├── auth.module.ts         (Auth Dependency Wiring)
│       └── auth.service.ts        (Orchestration Service)
├── app.controller.ts               <── Root Health Controller
├── app.module.ts                   <── Root NestJS Module
├── app.service.ts                  <── Root Health Service
└── main.ts                         <── Bootstrap & CookieParser Middleware
```

---

## 📄 2. Detailed File-by-File Breakdown

### A. Core Entry Files

* 📄 **[main.ts](file:///c:/Users/muham/Desktop/Orvyn-PMS/apps/api/src/main.ts)**:
  - Initializes NestJS server on port `4000`.
  - Configures `cookie-parser` middleware for reading HTTP-only cookies.
  - Sets global API prefix `/api/v1`.
  - Enables CORS credentials for frontend communication.

* 📄 **[app.module.ts](file:///c:/Users/muham/Desktop/Orvyn-PMS/apps/api/src/app.module.ts)**:
  - Root NestJS module importing `ConfigModule`, `PrismaModule`, `AuthModule`, and `AdminModule`.

---

### B. Shared Utilities (`src/common/`)

* 📄 **[current-user.decorator.ts](file:///c:/Users/muham/Desktop/Orvyn-PMS/apps/api/src/common/decorators/current-user.decorator.ts)**:
  - Custom parameter decorator. Usage: `@CurrentUser()` gets full user object, `@CurrentUser('id')` gets user ID directly.

* 📄 **[roles.decorator.ts](file:///c:/Users/muham/Desktop/Orvyn-PMS/apps/api/src/common/decorators/roles.decorator.ts)**:
  - Attaches metadata specifying which `UserRole` values are allowed on a route (e.g. `@Roles(UserRole.SUPER_ADMIN)`).

* 📄 **[roles.guard.ts](file:///c:/Users/muham/Desktop/Orvyn-PMS/apps/api/src/common/guards/roles.guard.ts)**:
  - Evaluates `@Roles()` metadata against `req.user.role`. Throws `ForbiddenException` if unauthorized.

---

### C. Authentication Module (`src/modules/auth/`)

* 📄 **[owner-signup.dto.ts](file:///c:/Users/muham/Desktop/Orvyn-PMS/apps/api/src/modules/auth/dto/owner-signup.dto.ts)**:
  - Validates registration fields (`name`, `email`, `phone`, `password`, `organizationName`).

* 📄 **[password.service.ts](file:///c:/Users/muham/Desktop/Orvyn-PMS/apps/api/src/modules/auth/services/password.service.ts)**:
  - `hashPassword()`: Encrypts passwords using bcrypt with 10 salt rounds.
  - `comparePassword()`: Compares plain password against stored hash.
  - `generateResetToken()` / `verifyResetToken()`: Signs and verifies 15-minute password reset JWT tokens.

* 📄 **[token.service.ts](file:///c:/Users/muham/Desktop/Orvyn-PMS/apps/api/src/modules/auth/services/token.service.ts)**:
  - `generateTokensAndSetCookies()`: Generates 15m Access Token & 30d Refresh Token. Hashes refresh token into database (`refresh_tokens` table) and sets HTTP-only cookies.
  - `rotateRefreshToken()`: Validates refresh token, revokes the old token, and issues a new pair (**Refresh Token Rotation**).
  - `revokeUserTokens()`: Server-side token revocation and cookie clearing on logout or password change.

* 📄 **[auth.service.ts](file:///c:/Users/muham/Desktop/Orvyn-PMS/apps/api/src/modules/auth/auth.service.ts)**:
  - `ownerSignup()`: Atomically creates Organization + User (`PENDING`) + Owner profile in a single Prisma transaction.
  - `login()`: Validates password, checks live admin approval status gate (`PENDING`/`REJECTED`/`SUSPENDED`), updates `lastLoginAt`, and calls `TokenService`.
  - `logout()`, `forgotPassword()`, `resetPassword()`, `changePassword()`, `changeEmail()`.

* 📄 **[jwt.strategy.ts](file:///c:/Users/muham/Desktop/Orvyn-PMS/apps/api/src/modules/auth/strategies/jwt.strategy.ts)**:
  - Passport Strategy that intercepts every authenticated request.
  - Extracts JWT from HTTP-only cookie or Bearer header.
  - Runs a live query on Neon DB to ensure the account is active, not deleted, and approved.

* 📄 **[auth.controller.ts](file:///c:/Users/muham/Desktop/Orvyn-PMS/apps/api/src/modules/auth/auth.controller.ts)**:
  - REST controller exposing `/auth/signup/owner`, `/auth/login`, `/auth/refresh`, `/auth/logout`, `/auth/forgot-password`, `/auth/reset-password`, `/auth/change-password`, `/auth/change-email`, and `/auth/me`.

---

### D. Super Admin Module (`src/modules/admin/`)

* 📄 **[admin.service.ts](file:///c:/Users/muham/Desktop/Orvyn-PMS/apps/api/src/modules/admin/admin.service.ts)**:
  - `getPendingOwners()`: Queries all owner applications in `PENDING` status.
  - `approveOwner()`: Updates `approvalStatus` to `APPROVED` allowing owner login.
  - `rejectOwner()`: Updates `approvalStatus` to `REJECTED`, records `rejectionReason`, and revokes tokens.

* 📄 **[admin.controller.ts](file:///c:/Users/muham/Desktop/Orvyn-PMS/apps/api/src/modules/admin/admin.controller.ts)**:
  - REST controller guarded by `JwtAuthGuard` and `@Roles(UserRole.SUPER_ADMIN)`.
