# 📖 Core Booking Engine & Management Module — Source of Truth

> **System Designation:** Heart of Orvyn PMS  
> **Status:** Active Master Specification (Phase 3 Engine)  
> **Dependencies:** Master source for Payments, Invoices, Reports, Guest History, Agency Commissions, Housekeeping, and Occupancy.

---

## 1. Module Overview & Data Requirements

This module handles the full lifecycle of guest reservations: creation, editing, cancellation (refund/forfeit), soft-deletion, multi-level deletion approvals, agency commission (TAC) management, GST calculation, idempotency, and concurrency conflict detection.

### Core Database Entities

1. `bookings` — Primary reservation registry.
2. `booking_facilities` — Add-on extra amenities & services with historical price snapshots.
3. `room_types` — Room categories & inventory unit caps.
4. `guests` — Deduplicated guest profiles.
5. `booking_deletion_requests` — Audit trail for reception deletion requests and manager/owner approvals.
6. `agencies` — Travel agency / OTA commission tracking.

---

## 2. Core Functional Requirements

### 1. Booking Creation & Idempotency
- **Idempotency Key:** Every booking creation request must include a unique `Idempotency-Key` header.
- **Handling:** If a request with the same idempotency key is submitted twice (e.g., due to network lag or double-clicking), the backend intercepts the second request and returns the existing booking payload instead of creating a duplicate booking.

### 2. Conflict / Double-Booking Prevention (Pessimistic / Advisory Locking)
- **Concurrency Protection:** Uses PostgreSQL row-level locks (`SELECT ... FOR UPDATE`) or atomic database transactions.
- **Validation:** Verifies if the requested room type has available unbooked units for `[checkInDate, checkOutDate]`.
- **Atomic Rollback:** If another receptionist locks the room at the same millisecond, the transaction rolls back cleanly without creating partial records.

### 3. Booking Edits
- Allows modifying guest details, dates, room types, add-on facilities, and pricing adjustments on an existing booking without altering its primary identity.

### 4. Cancel Booking (Refund vs. Forfeit) & TAC Reversal
- **Refund:** Advance amount returned to the guest (`refundAmount = paidAmount`).
- **Forfeit:** Hotel retains advance payment (`refundAmount = 0`).
- **TAC Commission Reversal:** If the booking originated from a Travel Agency, any pending agency commission (`pendingTac`) is automatically reversed to prevent paying commission on cancelled stays.

### 5. Soft Delete & Deletion Approval Workflow
- **Soft Delete:** Bookings are never hard-deleted from the database; `deletedAt` timestamp is set instead.
- **Direct Delete:** Allowed only for `OWNER` and `SUPER_ADMIN` roles.
- **Staff Deletion Workflow:** `RECEPTION_STAFF` cannot delete bookings directly. Clicking "Delete" creates a record in `booking_deletion_requests` with status `PENDING` and a required reason string.
- **Manager Approval Queue:** `MANAGER` or `OWNER` can `APPROVE` (which triggers soft-delete on the booking) or `REJECT` the request.

### 6. Direct vs Agency Channel Tracking
- Every booking records its channel origin: `DIRECT` (Walk-in / Phone), `AGENCY` (Travel Agent), or `OTA` (Booking.com / Airbnb).

### 7. GST Calculation System
- If `property_settings.gstEnabled === true`, automatically computes taxable base and GST tax amount based on property tax configuration. If disabled, tax is 0.

### 8. Add-on Facilities (Price Snapshot Pattern)
- Selected extra facilities (e.g., BBQ, Airport Transfer, Extra Bed) store a **historical price snapshot** inside `booking_facilities` at the time of booking creation so future price changes do not modify past invoice totals.

### 9. Booking Lifecycle States
- Flow: `CONFIRMED` ➔ `CHECKED_IN` ➔ `CHECKED_OUT` (or `CANCELLED`).

### 10. Creator Audit Trail
- Every booking tracks `createdByUserId` and `createdAt` timestamp for full accountability.

---

## 3. Database Indexes Required

- `(property_id, check_in_date, check_out_date)`
- `(property_id, status, created_at)`

---

## 4. API Endpoints Contract

- `POST /v1/bookings` — Create Booking (Supports `Idempotency-Key`)
- `PATCH /v1/bookings/:id` — Edit Booking
- `POST /v1/bookings/:id/cancel` — Cancel Booking (Refund / Forfeit & TAC Reversal)
- `GET /v1/bookings` — Booking History with Search, Date Range, Status & Channel Filters
- `POST /v1/bookings/:id/request-deletion` — Staff Deletion Request
- `POST /v1/deletion-requests/:id/approve` — Manager/Owner Approve Deletion
- `POST /v1/deletion-requests/:id/reject` — Manager/Owner Reject Deletion
- `GET /v1/properties/:id/occupancy` — Calendar Occupancy & Tape Chart Grid API

---

## 5. Testing & Verification Requirements

1. **Test 1 (Double Booking)**: Simultaneous requests for same room & dates ➔ Only 1 succeeds.
2. **Test 2 (Idempotency)**: Duplicate `Idempotency-Key` payload ➔ Returns original booking object.
3. **Test 3 (Staff Permission Gate)**: Staff calling direct delete ➔ `403 Forbidden`.
4. **Test 4 (Approval Workflow)**: Manager approval soft-deletes booking; rejection keeps booking active.
