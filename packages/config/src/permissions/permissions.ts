// ============================================================
// PERMISSIONS — Every single action in the system is listed here
// ============================================================
//
// HOW IT WORKS:
//   - Each permission is a string like 'booking:create'
//   - The API checks: "Does this user's role have this permission?"
//   - The Web/Admin/Mobile checks: "Should I show this button to this user?"
//
// WHY SHARED?
//   - The API uses these to BLOCK unauthorized actions
//   - The Web/Admin uses these to HIDE buttons the user can't use
//   - Same file = same rules everywhere = no bugs
//

export const PERMISSIONS = {
  // ── Property Settings ──────────────────────────────────
  PROPERTY_SETTINGS_VIEW: 'property-settings:view',
  PROPERTY_SETTINGS_EDIT: 'property-settings:edit',

  // ── Staff Management ───────────────────────────────────
  STAFF_VIEW: 'staff:view',
  STAFF_INVITE: 'staff:invite',
  STAFF_SUSPEND: 'staff:suspend',
  STAFF_REACTIVATE: 'staff:reactivate',
  STAFF_REMOVE_PERMANENT: 'staff:remove-permanent',

  // ── Bookings ───────────────────────────────────────────
  BOOKING_VIEW: 'booking:view',
  BOOKING_CREATE: 'booking:create',
  BOOKING_EDIT: 'booking:edit',
  BOOKING_DELETE: 'booking:delete',
  BOOKING_REQUEST_DELETE: 'booking:request-delete',

  // ── Invoices ───────────────────────────────────────────
  INVOICE_VIEW: 'invoice:view',
  INVOICE_SEND: 'invoice:send',

  // ── Agencies ───────────────────────────────────────────
  AGENCY_VIEW: 'agency:view',
  AGENCY_MANAGE: 'agency:manage',

  // ── TAC (Terms and Conditions) ─────────────────────────
  TAC_VIEW: 'tac:view',
  TAC_MANAGE: 'tac:manage',

  // ── Payments ───────────────────────────────────────────
  PAYMENT_VIEW: 'payment:view',
  PAYMENT_MANAGE: 'payment:manage',

  // ── Reports ────────────────────────────────────────────
  REPORT_VIEW: 'report:view',

  // ── Calendar ───────────────────────────────────────────
  CALENDAR_VIEW: 'calendar:view',

  // ── Tenants (Super Admin only) ─────────────────────────
  TENANT_MANAGE: 'tenant:manage',
  TENANT_APPROVE_OWNER: 'tenant:approve-owner',

  // ── Notifications (Super Admin only) ───────────────────
  NOTIFICATION_SEND: 'notification:send',

  // ── Invoice Templates (Super Admin only) ───────────────
  INVOICE_TEMPLATE_DESIGN: 'invoice-template:design',

  // ── Platform Health (Super Admin only) ─────────────────
  PLATFORM_HEALTH_MONITOR: 'platform:health-monitor',
  PLATFORM_SYNC_BACKUP: 'platform:sync-backup',
} as const;

export type Permission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];
