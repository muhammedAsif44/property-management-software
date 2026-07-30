# 🌐 Orvyn PMS Workspace Rules & Customizations

## 1. Automatic English ↔ Malayalam (i18n) Support for All New Features
- Whenever creating or extending ANY new web component, page, modal, or feature in `@orvyn/web` (e.g., Bookings, Rooms Tape Chart, Housekeeping, Invoices, Guests, OTA Channel Sync):
  - **MUST** automatically add corresponding English (`en`) and Malayalam (`ml — മലയാളം`) dictionary keys in `apps/web/src/lib/i18n/translations.ts`.
  - **MUST** consume translation strings via the `useTranslation()` hook (e.g. `const { t } = useTranslation()`).
  - **MUST** ensure layout text container elements use `min-w-0`, `truncate`, or responsive flex settings so Malayalam text never breaks UI layouts or overflows borders.
