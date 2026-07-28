// ============================================================
// ROLE → PERMISSIONS MAPPING
// ============================================================
//
// This file answers ONE question:
//   "What can each role do?"
//
// HOW TO READ IT:
//   SUPER_ADMIN → can do [everything listed]
//   OWNER       → can do [these specific things]
//   MANAGER     → can do [these specific things]
//   etc.
//
// HOW IT'S USED:
//   In API:     hasPermission(user.role, 'booking:create') → true/false → allow/block
//   In Web:     hasPermission(user.role, 'booking:create') → true/false → show/hide button
//

import { UserRole } from '@orvyn/shared-types';
import { PERMISSIONS, Permission } from './permissions';

export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {

  // ── SUPER ADMIN ──────────────────────────────────────────
  // Platform: Admin Panel only
  // Can do: EVERYTHING — manages every tenant, approves owners,
  //         sends notifications, designs invoice templates,
  //         monitors platform health and sync/backup
  [UserRole.SUPER_ADMIN]: Object.values(PERMISSIONS),

  // ── OWNER ────────────────────────────────────────────────
  // Platform: Web App (Mobile later)
  // Can do: Full control over their OWN properties — settings,
  //         staff (including permanent removal), bookings,
  //         invoices, payments, agencies, and reports
  [UserRole.OWNER]: [
    PERMISSIONS.PROPERTY_SETTINGS_VIEW,
    PERMISSIONS.PROPERTY_SETTINGS_EDIT,
    PERMISSIONS.STAFF_VIEW,
    PERMISSIONS.STAFF_INVITE,
    PERMISSIONS.STAFF_SUSPEND,
    PERMISSIONS.STAFF_REACTIVATE,
    PERMISSIONS.STAFF_REMOVE_PERMANENT,
    PERMISSIONS.BOOKING_VIEW,
    PERMISSIONS.BOOKING_CREATE,
    PERMISSIONS.BOOKING_EDIT,
    PERMISSIONS.BOOKING_DELETE,
    PERMISSIONS.INVOICE_VIEW,
    PERMISSIONS.INVOICE_SEND,
    PERMISSIONS.AGENCY_VIEW,
    PERMISSIONS.AGENCY_MANAGE,
    PERMISSIONS.TAC_VIEW,
    PERMISSIONS.TAC_MANAGE,
    PERMISSIONS.PAYMENT_VIEW,
    PERMISSIONS.PAYMENT_MANAGE,
    PERMISSIONS.REPORT_VIEW,
    PERMISSIONS.CALENDAR_VIEW,
  ],

  // ── MANAGER ──────────────────────────────────────────────
  // Platform: Web App (Mobile later)
  // Can do: Full operational access — bookings, invoices,
  //         agencies, TAC, reports + staff management
  //         (invite, suspend, reactivate).
  // CANNOT: edit property settings or permanently remove staff
  [UserRole.MANAGER]: [
    PERMISSIONS.PROPERTY_SETTINGS_VIEW,     // can VIEW but NOT edit
    PERMISSIONS.STAFF_VIEW,
    PERMISSIONS.STAFF_INVITE,
    PERMISSIONS.STAFF_SUSPEND,
    PERMISSIONS.STAFF_REACTIVATE,
    // NO: STAFF_REMOVE_PERMANENT
    // NO: PROPERTY_SETTINGS_EDIT
    PERMISSIONS.BOOKING_VIEW,
    PERMISSIONS.BOOKING_CREATE,
    PERMISSIONS.BOOKING_EDIT,
    PERMISSIONS.BOOKING_DELETE,
    PERMISSIONS.INVOICE_VIEW,
    PERMISSIONS.INVOICE_SEND,
    PERMISSIONS.AGENCY_VIEW,
    PERMISSIONS.AGENCY_MANAGE,
    PERMISSIONS.TAC_VIEW,
    PERMISSIONS.TAC_MANAGE,
    PERMISSIONS.PAYMENT_VIEW,
    PERMISSIONS.PAYMENT_MANAGE,
    PERMISSIONS.REPORT_VIEW,
    PERMISSIONS.CALENDAR_VIEW,
  ],

  // ── RECEPTION STAFF ──────────────────────────────────────
  // Platform: Web App (Mobile later)
  // Can do: Create/edit bookings, view/send invoices,
  //         manage agencies and TAC.
  // CANNOT: edit settings, view reports, delete bookings directly
  //         (can only REQUEST deletion — Manager/Owner approves)
  [UserRole.RECEPTION_STAFF]: [
    PERMISSIONS.BOOKING_VIEW,
    PERMISSIONS.BOOKING_CREATE,
    PERMISSIONS.BOOKING_EDIT,
    PERMISSIONS.BOOKING_REQUEST_DELETE,     // can REQUEST delete, not direct delete
    // NO: BOOKING_DELETE (needs approval)
    PERMISSIONS.INVOICE_VIEW,
    PERMISSIONS.INVOICE_SEND,
    PERMISSIONS.AGENCY_VIEW,
    PERMISSIONS.AGENCY_MANAGE,
    PERMISSIONS.TAC_VIEW,
    PERMISSIONS.TAC_MANAGE,
    PERMISSIONS.CALENDAR_VIEW,
    // NO: REPORT_VIEW
    // NO: PROPERTY_SETTINGS_VIEW/EDIT
    // NO: STAFF_*
    // NO: PAYMENT_*
  ],

  // ── VIEWER ───────────────────────────────────────────────
  // Platform: Web App (Mobile later)
  // Can do: Read-only access to bookings, invoices,
  //         calendar, and reports
  // CANNOT: create, edit, or delete anything
  [UserRole.VIEWER]: [
    PERMISSIONS.BOOKING_VIEW,
    PERMISSIONS.INVOICE_VIEW,
    PERMISSIONS.CALENDAR_VIEW,
    PERMISSIONS.REPORT_VIEW,
    // Nothing else — read only
  ],
};

// ============================================================
// HELPER FUNCTION
// ============================================================
// Use this ANYWHERE to check if a role can do something:
//
//   import { hasPermission } from '@orvyn/config';
//
//   if (hasPermission(user.role, 'booking:create')) {
//     // show the "Create Booking" button
//   }
//
//   In API guard:
//   if (!hasPermission(user.role, 'booking:delete')) {
//     throw new ForbiddenException('You cannot delete bookings');
//   }

export function hasPermission(role: UserRole, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
}
