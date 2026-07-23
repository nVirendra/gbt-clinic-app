

## Role & Context

You are building production-grade software for **small Indian clinics** (1–3 doctors, 1 receptionist). Users are **non-technical**; the app must be forgiving of mistakes, fast on modest hardware, and able to run **without internet access** (deployed on the clinic's own machine or LAN). Assume unreliable power — a process may be force-killed at any moment and the system must never corrupt data or lose a finalized bill.

Because this is now a client–server web app, everything is expected to run on the clinic's premises: Postgres, the Express API, and the Next.js frontend all on one machine (or a small dedicated mini-PC / local server), accessed through a browser at `localhost` or a LAN address. No clinic data leaves the premises.

## Tech Stack (fixed — do not substitute)

- **Next.js 14+ (App Router) + React 18** — frontend (browser client). Used purely as the UI layer.
- **Express.js on Node.js** — standalone backend API server. **All database access happens here.**
- **PostgreSQL 15+** via **Prisma** (typed ORM, migrations)
- **Tailwind CSS** for styling
- **Deployment**: containerized with **Docker Compose** (services: `postgres`, `api`, `web`) so a clinic machine can run everything with one command. A non-Docker path (local Postgres install + `node`/`pm2` services) should also be documented.
- **PDF generation**: `pdfmake` (server-side, in the Express layer) for invoice/receipt PDFs; browser `window.print()` with print-specific CSS for direct printing. For 80 mm thermal, generate a thermal-width PDF and/or an ESC/POS-friendly layout (see Printing notes).
- **Auth & security boundary**: the Next.js frontend **never connects to Postgres directly**. It talks to Express over a **typed REST API** (JSON) using **httpOnly session cookies or JWT**. Express holds all Prisma/DB logic, enforces roles in middleware, and hashes passwords with **bcrypt (cost ≥ 10)**. No secrets or DB credentials ever reach the browser.

## Database Schema (build this first)

Create Prisma models with these tables. Add `created_at`, `updated_at` to every table, and use **soft deletes** (`deleted_at`) for patients, medicines, and vendors — never hard-delete anything referenced by a bill.

**Postgres/Prisma-specific rules:**
- **Money is `Decimal`, never `Float`.** Use `Decimal @db.Decimal(12, 2)` for all amounts/prices/totals so Postgres stores exact `NUMERIC` values. Do all money math with a decimal library or integer paise — never binary floats.
- **Fast patient search**: enable the `pg_trgm` extension and add a **GIN trigram index** on `full_name` (plus btree indexes on `phone` and `patient_code`) so search-as-you-type over 50k rows stays well under 200 ms.
- **Gap-free bill numbering (important Postgres gotcha)**: do **not** use a Postgres `SEQUENCE` for the human-facing bill number — sequences are non-transactional and leave gaps on rollback. Instead keep a per-(prefix, financial-year) counter row and increment it with `SELECT … FOR UPDATE` **inside the same transaction** as the bill insert, so numbers are sequential and gap-free.

| Table | Key fields |
|---|---|
| `patients` | id, patient_code (auto: `P-000001`), full_name, dob **or** age_years, gender, phone, address, referring_doctor, allergies_notes |
| `vendors` | id, name, phone, address, gstin (optional), notes |
| `medicines` | id, name, type (TABLET / CAPSULE / INJECTION / SYRUP / OINTMENT / OTHER), unit_label (strip/vial/bottle/pcs), hsn_code (optional), reorder_level, default_gst_percent |
| `purchases` | id, vendor_id, purchase_invoice_no, purchase_date, total_amount, notes |
| `inventory_batches` | id, medicine_id, purchase_id, batch_no, expiry_date, qty_purchased, qty_available, purchase_price_per_unit, selling_price_per_unit |
| `services` | id, name (e.g. Consultation, Dressing, Injection charge), default_price, gst_percent, sac_code (optional) |
| `bills` | id, bill_no (see numbering rules), patient_id (nullable for walk-in + walkin_name), bill_date, status (DRAFT / FINALIZED / CANCELLED), subtotal, discount_total, tax_total, round_off, grand_total, amount_paid, balance_due, notes |
| `bill_items` | id, bill_id, item_type (SERVICE / MEDICINE / MISC), service_id?, batch_id?, description, qty, unit_price, discount_amount, gst_percent, line_total |
| `payments` | id, bill_id, amount, mode (CASH / CARD / UPI / BANK), reference_no, paid_at, is_refund (boolean) |
| `stock_transactions` | id, batch_id, type (IN / OUT / ADJUST / RETURN), qty (signed), bill_id?, purchase_id?, reason, user_id |
| `users` | id, username, password_hash (bcrypt, cost ≥ 10), role (ADMIN / RECEPTIONIST), is_active |
| `settings` | key-value: clinic_name, address, phone, logo (file path or bytea), gstin, default_gst_percent, invoice_prefix, financial_year_reset (bool), backup_dir |
| `bill_counters` | id, prefix, financial_year, last_number — the FOR-UPDATE counter used for gap-free numbering |
| `audit_log` | id, user_id, action, entity, entity_id, details_json, at |

Every stock movement must be represented as a `stock_transactions` row; `qty_available` on a batch must always equal the sum of its transactions (enforce in code inside DB transactions via `prisma.$transaction`).

## Core Features

### 1. Patient Records
- Add/edit/search patients; search-as-you-type across name, phone, and patient_code (must return in < 200 ms with 50,000 patients — use the trigram + btree indexes above; debounce the API call from the frontend)
- Patient detail page shows visit/bill history with totals and outstanding balance
- Duplicate warning: on save, if same phone + similar name exists, warn before creating

### 2. Billing & Invoicing
- **Bill lifecycle**: DRAFT → FINALIZED → (optionally) CANCELLED. Stock is deducted **only on finalization**, inside a single Postgres transaction (`prisma.$transaction`) along with the bill write and the counter increment. Cancelling a finalized bill restores stock (as RETURN transactions) and requires an Admin session + reason (logged to audit_log).
- Line items: services (picked from price list with autocomplete), medicines (see below), and free-text misc charges. Each line: qty, unit price (editable), per-line discount.
- **Integrated medicine billing**: medicine picker → shows only batches with `qty_available > 0`, sorted **FIFO by expiry (earliest first, pre-selected)**. Display batch no., expiry, and available qty inline. **Hard-block** dispensing from expired batches; warn (yellow) if expiring within 30 days. Block qty greater than available — no negative stock, ever. Enforce these checks **server-side** in the Express layer, not just in the UI, so they can't be bypassed by hitting the API directly.
- **Totals & GST (India)**: per-line GST %; tax shown as **CGST + SGST split** (half each) on the invoice; configurable default rate in Settings; support 0% for exempt items. Grand total rounded to the nearest rupee with the rounding difference shown as "Round off". Use `Decimal`/integer paise internally — **never binary floats for money**.
- **Bill numbering**: sequential, gap-free per financial year, e.g. `INV/2026-27/0001`, generated atomically at finalization (not at draft) via the `bill_counters` `FOR UPDATE` pattern. Prefix and FY-reset configurable in Settings.
- **Payments**: partial payments allowed; multiple payments per bill across modes (Cash/Card/UPI/Bank + reference no.). Balance due tracked and visible on the patient page. Support recording a refund (negative payment flagged `is_refund`).
- **Receipt/Invoice PDF**: clinic letterhead (name, address, logo, GSTIN), patient details, itemized lines with HSN/SAC where set, tax breakup, amount in words, paid/balance summary. Two print layouts: **A5/A4** and **80 mm thermal**. Generated server-side with `pdfmake`; support both direct browser print and PDF download.

### 3. Reports
All reports filterable by date range, viewable on screen, and exportable to **CSV/Excel and PDF** (export handled by the Express API):
- Daily/weekly/monthly collections, broken down by payment mode
- Outstanding dues (unpaid/partial bills) with patient contact info
- Patient-wise billing history
- Inventory: current stock valuation (at purchase price and at selling price), expired list, expiring in 30/60/90 days, low-stock list (below reorder_level), batch-wise stock ledger (all IN/OUT/ADJUST movements), vendor-wise purchase summary
- GST summary for a period (taxable value, CGST, SGST by rate) to hand to an accountant

### 4. Admin & Settings
- Clinic profile (name, address, logo upload, GSTIN, default tax %, invoice prefix)
- Service price list management (add/edit/deactivate)
- User management: Admin can create users and reset passwords. **Roles enforced in Express middleware**: Receptionist can bill and add patients/stock; only Admin can cancel finalized bills, edit settings, adjust stock, delete anything, and restore backups.
- Login screen on app start; server-side session/JWT auth; auto-lock/logout after configurable idle minutes; passwords hashed with bcrypt (never stored or logged in plaintext); rate-limit login attempts.

### 5. Medicine & Inventory
- **Stock In**: purchase entry form — pick/create vendor, purchase invoice no., date, then add multiple items in one grid (medicine, type, batch no., expiry, qty, purchase price, selling price). Saving creates the purchase, batches, and IN transactions atomically in one transaction.
- **Stock adjustment** (Admin only): correct counts with a mandatory reason (damage, count error, expiry write-off) — recorded as ADJUST transactions.
- **Dashboard alerts** on the home screen: expired items, expiring ≤ 30 days, low stock — each clickable through to the relevant report.
- **Vendor management**: CRUD list of pharmacies/medical stores with purchase history per vendor.

## Non-Functional Requirements
- **Runs on-premises without internet**: no third-party telemetry, no analytics, no external API calls. All traffic stays on `localhost`/LAN. (The frontend↔backend HTTP calls are internal to the clinic's own network.)
- **PostgreSQL durability**: rely on Postgres's WAL and ACID guarantees; wrap every multi-row write in a transaction (`prisma.$transaction`). A force-kill of the API or the machine must leave either a complete bill or no bill — never a half-written one. Keep `synchronous_commit = on` so committed bills survive a crash.
- **Server-side enforcement**: all business rules (no expired dispensing, no negative stock, role checks, gap-free numbering, money reconciliation) are enforced in the Express/Prisma layer, not just the UI.
- **Backup/Restore**: one-click backup uses **`pg_dump`** (custom/`-Fc` format) to a chosen folder/USB. Filename `clinic-backup-YYYY-MM-DD-HHmm.dump`. Optional scheduled/auto-backup. Restore is Admin-only, with a confirmation step and an **automatic safety `pg_dump` of the current DB first**, then `pg_restore`. Never rely on copying raw Postgres data files while the server is running.
- **Keyboard-first billing**: the entire "select patient → add items → take payment → print" flow must be doable without a mouse (define shortcuts, e.g. `F2` new bill, `F4` add medicine, `Ctrl+P` print) using browser key handlers.
- Dates displayed as DD-MM-YYYY; currency as ₹ with Indian digit grouping (₹1,23,456.00)
- Simple, high-contrast UI with large click targets; every destructive action has a confirm dialog
- **Deployment must not require internet at runtime** and should run under a normal user account (no admin-elevated writes at runtime); Docker volumes or a local Postgres data directory hold the data.

## Security Notes (new for the web stack)
- `nodeIntegration`/`contextBridge` no longer apply. Instead: httpOnly, `SameSite=Strict` session cookies (or short-lived JWT + refresh); CSRF protection on state-changing routes; input validation on every endpoint (e.g. `zod`); parameterized queries via Prisma (no raw string SQL); rate limiting on `/login`.
- For LAN access beyond `localhost`, serve over HTTPS with a self-signed/local CA cert so credentials aren't sent in cleartext.
- The Express API is the only component with the Postgres connection string; keep it in a server-side `.env`, never shipped to the browser bundle.

## Printing Notes
- **A5/A4 and 80 mm thermal** invoices are generated server-side with `pdfmake` (define separate document definitions per layout / paper width).
- Direct printing from the browser via `window.print()` with `@media print` CSS for the on-screen invoice; for reliable 80 mm thermal output, print the thermal-width PDF to the thermal printer, or optionally emit ESC/POS from a small local print helper if the clinic uses a raw receipt printer.

## Project Structure
```
clinic-billing-app/
├── api/                     # Express backend (all DB access, PDF, backup)
│   ├── src/
│   │   ├── routes/          # one file per domain: patients, billing, inventory, reports…
│   │   ├── services/        # business logic (billing txns, FIFO, numbering)
│   │   ├── middleware/      # auth, role checks, error handling, validation
│   │   ├── pdf/             # pdfmake invoice/receipt templates (A5/A4 + thermal)
│   │   ├── backup/          # pg_dump / pg_restore wrappers
│   │   └── db/              # Prisma client
│   └── package.json
├── web/                     # Next.js frontend (App Router)
│   ├── app/                 # Dashboard, Patients, Billing, Inventory, Reports, Settings
│   ├── components/
│   └── lib/                 # typed API client, formatting helpers (money, dates)
├── prisma/                  # schema.prisma + migrations (commented)
├── resources/               # icons, print assets, seed data
├── docker-compose.yml       # postgres + api + web
├── .env.example
└── package.json             # workspaces
```

## Build Order (phases — each must end in a runnable app)
1. Scaffold **Next.js** (`web`) + **Express** (`api`) + **Prisma/Postgres** with **Docker Compose**; commented Prisma schema + first migration; `pg_trgm` extension enabled; auth skeleton (login route, session/JWT, role middleware); seeded Admin user; a "hello, logged-in" page proving the full frontend→API→Postgres path.
2. Patient module (CRUD + fast trigram search + detail page)
3. Inventory module (vendors, stock-in, batches, adjustments, alerts)
4. Billing module (draft/finalize lifecycle, service + medicine lines, FIFO batch pick, GST totals, payments, stock deduction + gap-free numbering all in one `prisma.$transaction`)
5. Invoice/receipt PDF + printing (A5/A4 + thermal via pdfmake; browser print)
6. Reports module (all reports + CSV/Excel/PDF export)
7. Settings (clinic profile, price list, users/roles, GST config)
8. Backup/restore (`pg_dump`/`pg_restore`) + audit log viewer
9. Package & deploy: finalize `docker-compose.yml` for one-command startup on a clean machine; document the non-Docker path (local Postgres + `pm2`); smoke-test on a fresh machine with no internet.

## Acceptance Criteria (test these explicitly)
- Finalizing a bill with 3 medicines deducts exactly the billed quantities from the chosen batches; killing the API/Postgres mid-finalization rolls the transaction back — leaving either a complete bill or no bill, never a partial one
- Cannot bill an expired batch or more than available quantity **through the API directly** (not just the UI) — server-side enforcement
- Cancelling a bill restores stock and requires an Admin session + reason; both actions appear in the audit log
- Bill numbers are sequential with no gaps or duplicates, even after cancellations and even under two near-simultaneous finalizations (the `FOR UPDATE` counter serializes them); cancelled numbers remain, marked CANCELLED
- ₹ totals always reconcile: sum of line totals + tax − discounts + round-off = grand total; payments − refunds = amount_paid (verified with `Decimal`, no float drift)
- Search over 50k seeded patients returns in under 200 ms via the trigram index
- A `pg_dump` backup taken while the app is running restores cleanly (`pg_restore`) into a fresh Postgres on another machine

## Out of Scope (v1 — do not build)
Appointments/scheduling, prescriptions/EMR clinical notes, SMS/WhatsApp, cloud sync, barcode scanning, e-invoicing/IRN integration.

> Note: because the app is now client–server, **multi-terminal use on the clinic LAN** (e.g. receptionist + doctor on separate browsers hitting the same API) works naturally and is not blocked — but it isn't a v1 focus, and the app must remain fully usable on a single machine.

## Deliverables
- Full source code organized as above (`web` + `api`), with `docker-compose.yml`, `.env.example`, and a seed script (sample patients, medicines, batches, services)
- Commented `schema.prisma` + generated migrations
- `pg_dump` / `pg_restore` backup and restore scripts wired into the Admin UI
- `README.md`: local dev setup (Docker and non-Docker), how to run migrations and seed, where Postgres data lives, and how backups work
- 1–2 page illustrated user guide for staff: add a patient, record a purchase, create & print a bill, take a backup, restore a backup
