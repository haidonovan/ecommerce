# E-Commerce + POS PWA Gap Analysis

## Current Architecture

- Frontend: Next.js App Router with React client pages, TailwindCSS, Zustand for POS state, and local/offline helpers.
- Backend: Next.js REST-style API routes with Prisma and PostgreSQL.
- Authentication: JWT cookie sessions with `CLIENT`, `ADMIN`, and `CASHIER` roles.
- Data: One Prisma schema currently centered on users, products, online orders, coupons, comments, favorites, and support tickets.
- Offline: IndexedDB/localStorage support exists for POS products, transactions, queued sync actions, and storefront fallback state.
- PWA: Manifest, service worker, icons, offline page, and provider components exist.

## Implemented Coverage

- Customer storefront, product catalog, cart, checkout, favorites, comments, profile, order history.
- Admin product management, inventory import/restock, orders, coupons, sales report, support inbox.
- POS new sale, local/offline cart, payment modal, receipt view, products, orders, settings, dashboard.
- Multi-currency USD/KHR formatting and settings.
- Basic role routing for Admin, Cashier, and Customer.

## Major Gaps

- RBAC is role-gated, but not permission-based.
- POS sales were mostly local/offline and lacked durable server persistence.
- Online orders had no explicit `channel`.
- Inventory had stock quantity but no movement/audit history.
- No stock reservation table or dedicated reservation lifecycle.
- No customer groups, loyalty, notes, or activity timeline.
- No brands/categories as first-class tables.
- No returns/refunds workflow.
- No shift/cash drawer lifecycle.
- Reports are partial and do not export Excel/PDF.
- KHQR payment is represented as a method but not integrated with a provider or QR payload generation.
- TanStack Query is not installed/used yet.
- Khmer localization is not implemented across UI strings.

## Missing Database Tables From Spec

- `roles`, `permissions`, role-permission join tables.
- `customers`, customer groups, loyalty ledger, customer notes/activity timeline.
- First-class `categories` and `brands`.
- Stock reservations.
- Returns/refunds.
- Shifts/cash drawer sessions.
- Expenses.
- Report/export jobs.
- Delivery/fulfillment records.

## Missing APIs

- Permission management.
- Customer CRUD, loyalty, groups, notes, timeline.
- Category/brand CRUD beyond current category listing.
- Inventory movement listing and adjustment APIs.
- Online order queue APIs for cashier accept/process/complete/cancel.
- Returns/refunds APIs.
- Shift open/close and cash drawer APIs.
- Reports APIs with filters and exports.
- KHQR payment initiation/confirmation APIs.
- Sync conflict-resolution APIs.

## Missing UI Pages

- Admin users and roles.
- Admin reports center.
- Admin brands/categories management.
- Admin inventory movement history and adjustments.
- Admin/customer management.
- POS online order queue.
- POS returns.
- POS shift management.
- Cashier reports.
- Khmer/English language switcher.

## Prioritized Roadmap

1. Foundation: shared sales channel, server POS transactions, inventory movement logging, audit logs, POS settings persistence.
2. Inventory: movement history UI, stock adjustment API, low/out-of-stock reports, reservation lifecycle.
3. Order queue: cashier queue for online orders with statuses `PENDING`, `PREPARING`, `READY`, `COMPLETED`, `CANCELLED`.
4. RBAC: permission tables, route/UI permission checks, users and roles admin page.
5. Reports: unified reports API and UI, then CSV/Excel/PDF export.
6. Customer CRM: customer profiles, groups, notes, loyalty ledger.
7. POS operations: returns/refunds, shifts, cash drawer, end-of-day report.
8. Cambodia polish: KHQR QR payload workflow and Khmer localization.
9. Scalability: branch/warehouse/supplier/purchase-order models.

## This Upgrade Slice

- Added schema foundation for sales channels, POS sales, payments, inventory movements, audit logs, settings, and richer product fields.
- Added durable POS transaction sync endpoint.
- Added POS settings persistence endpoint.
- Made online orders channel-aware.
- Added guarded stock decrement for online and POS sales to reduce overselling risk.
- Added inventory movement and audit log writes for online order creation, order updates, product changes, and POS sales.
