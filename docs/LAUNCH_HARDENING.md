# Phase 7 — Launch Hardening & Deployment Manual

This document records the operational procedures, security checks, connection pooling configuration, and database migration protocols required for the go-live deployment of **Orvyn PMS**.

---

## 1. Connection Pooling & Database Setup (PgBouncer + Neon)

### Overview
In production serverless & containers environments (e.g. Vercel, Render, Railway, AWS ECS), direct PostgreSQL connections can quickly saturate maximum connection limits.
Orvyn PMS utilizes **Neon PostgreSQL** with PgBouncer connection pooling.

### Configuration Specification
1. **Application Connection (Pooled Mode)**:
   - **Host / Port**: `ep-example-123456.us-east-2.aws.neon.tech:6543` (Port 6543 handles PgBouncer pooling)
   - **Mode**: Transaction Pooling (`pgbouncer=true`)
   - **Environment variable**: `DATABASE_URL="postgresql://user:pass@ep-example-123456-pooler.us-east-2.aws.neon.tech:6543/orvyn_pms?pgbouncer=true&sslmode=require"`

2. **Migration Connection (Direct Mode)**:
   - **Host / Port**: `ep-example-123456.us-east-2.aws.neon.tech:5432` (Direct PostgreSQL connection for DDL migrations)
   - **Environment variable**: `DIRECT_URL="postgresql://user:pass@ep-example-123456.us-east-2.aws.neon.tech:5432/orvyn_pms?sslmode=require"`

---

## 2. High-Value Indexes & RLS Policy Verification

### Multi-Tenant Scoping & Index Audit
The PostgreSQL database schema enforces strict tenant isolation on every tenant-scoped table (`organization_id`, `property_id`). High-value composite indexes have been applied in `prisma/schema.prisma`:

| Model / Table | Index Columns | Purpose |
| :--- | :--- | :--- |
| `Organization` | `@@map("organizations")` | Tenant root scoping |
| `User` | `@@index([organizationId])`, `@@index([deletedAt])` | Tenant isolation & active user lookup |
| `Property` | `@@index([ownerId, deletedAt])`, `@@index([organizationId])` | Property listing by tenant |
| `Booking` | `@@index([propertyId, status, deletedAt])` | Fast room grid queries |
| `Booking` | `@@index([propertyId, checkInDate, status, deletedAt])` | Check-in conflict detection |
| `Booking` | `@@index([propertyId, checkOutDate, status, deletedAt])` | Check-out processing |
| `Guest` | `@@unique([propertyId, phone])`, `@@index([propertyId, fullName])` | Guest search & deduplication |
| `HousekeepingTask` | `@@index([propertyId, status])` | Room unit cleanliness overview |
| `AuditLog` | `@@index([organizationId, createdAt])` | Multi-tenant audit trail |

---

## 3. Rate Limiting & Input Validation Audit

### Security Configurations
1. **NestJS Rate Limiting (`@nestjs/throttler`)**:
   - Default rate limit: 100 requests per minute per IP.
   - Public auth endpoints (`/api/v1/auth/login`, `/api/v1/auth/register`): 10 requests per minute per IP.
2. **Global Validation Pipe (`ValidationPipe`)**:
   - `whitelist: true`: Strips undeclared query/body properties.
   - `forbidNonWhitelisted: true`: Rejects payload containing rogue parameters.
   - `transform: true`: Implicit type coercion for numeric route params.
3. **Security Headers (`Helmet`)**:
   - Cross-Origin Resource Policy (`cross-origin`) configured to permit signed PDF invoice downloads while preventing clickjacking.

---

## 4. Schema Migration Rehearsal Protocol (Neon Preview Branches)

Before applying any Prisma migration to the production database branch:

1. **Create Neon Branch**:
   ```bash
   neon branch create --name migration-rehearsal-v1
   ```
2. **Test Migration Application**:
   ```bash
   DATABASE_URL="<neon-branch-pooled-url>" DIRECT_URL="<neon-branch-direct-url>" npx pnpm --filter @orvyn/api prisma:migrate
   ```
3. **Verify API Compatibility & Data Integrity**:
   Run full regression suite against the rehearsal branch.
4. **Promote to Main Database Branch**:
   ```bash
   npx pnpm --filter @orvyn/api prisma:migrate deploy
   ```

---

## 5. Concurrency & Double-Booking Load Test Verification

### Conflict Detection Test
To verify double-booking prevention under concurrent requests:

```bash
# Execute concurrent booking creation test script
npx ts-node apps/api/src/modules/bookings/tests/concurrent-booking.spec.ts
```

- Optimistic concurrency control using `version` column and idempotency key locks (`idempotencyKey`) ensures that only 1 booking succeeds when 5+ concurrent requests attempt to reserve the same room unit on overlapping dates.
