# Development Prompt: Clinic Billing Backend Modular Monolith (Node.js/TS)

Use this prompt to guide the development of a production-grade, highly reliable, and optimized backend for the **Clinic Billing & Patient Records** application. The backend must be designed as a **Modular Monolith** using **Node.js, TypeScript, Express (or NestJS), and Prisma**.

---

## 1. System Architecture & Modularity Rules

To ensure high maintainability and allow the system to scale or split into microservices in the future, you must build the backend as a **Modular Monolith**.

### Module Structure
Divide the codebase into self-contained modules under a `src/modules/` directory. Each module must encapsulate its own:
- **Routes / Controllers** (Entry points)
- **Services** (Business logic)
- **Data Access / Repositories** (Prisma interactions)
- **DTOs / Validation Schemas** (Request/response shapes)

```
src/
├── config/             # DB, Env, Logger configurations
├── common/             # Middleware, Guards, Exceptions, Decorators
├── modules/
│   ├── auth/           # Login, Session lock, Password management
│   ├── patients/       # CRUD, Fast search, Patient history
│   ├── inventory/      # Vendors, Medicines, Batches, Stock adjustments
│   ├── billing/        # Invoices, Payments, FIFO stock deduction, PDF generation
│   ├── services/       # Clinic price list management
│   ├── reports/        # GST, Collections, Stock valuation, Dues
│   ├── settings/       # Clinic profile, defaults
│   └── audit/          # System audit trail logs
└── server.ts           # Monolith bootstrapper
```

### Modular Boundary Rules
1. **No Cross-Module Database Joins**: A module must only query its own database tables using its own repository. If `billing` needs patient information, it must request it via the `patients` module's Service interface, *not* by running a join query directly on the `patients` table.
2. **Communication via Service Interfaces**: Modules must interact with each other through injected services or an internal event emitter (Mediatr/EventEmitter pattern).
3. **Circular Dependencies**: Prevent circular imports between modules. Use event-driven hooks (e.g., publish a `BillFinalizedEvent` when a bill is completed so that `inventory` can reactively deduct stock) to decouple modules.

---

## 2. Technology Stack & Environment

- **Runtime**: Node.js (v18+ or v20+)
- **Language**: TypeScript (Strict Mode enabled)
- **Framework**: NestJS (Preferred for structured modularity) OR Express.js with custom Router wrapper classes
- **ORM & DB**: Prisma Client with PostgreSQL (Production) / SQLite (Development/Offline Support)
- **Validation**: `class-validator` + `class-transformer` (NestJS) OR `zod` (Express)
- **Security**: `helmet`, `cors`, `express-rate-limit`, `bcrypt` (minimum cost 10)
- **Logging**: `winston` or `pino` for JSON-structured logging
- **Task Queue**: `BullMQ` (backed by Redis) or a lightweight worker thread pool for asynchronous tasks (e.g. PDF generation, complex exports)

---

## 3. Core Requirements & Optimization Dimensions

### 1. Performance Optimization
* **Database Indexing**: Define indexes in the `schema.prisma` file for frequently queried fields:
  - `patients`: `full_name` (trigram/gin index for autocomplete), `phone`, `patient_code` (unique)
  - `bills`: `bill_no` (unique), `patient_id`, `bill_date`
  - `inventory_batches`: `expiry_date` (crucial for FIFO sort), `medicine_id`
  - `audit_log`: `user_id`, `at`
* **Connection Pooling**: Configure the database connection pool in the Prisma environment (e.g., `connection_limit=20` and idle timeouts) to prevent resource exhaustion.
* **Eager vs. Lazy Loading**: Explicitly write Prisma select payloads. Avoid using generic `include: { ... }` that fetches bloated deep relation trees. Retrieve only fields necessary for the specific view.
* **Caching Layer**: Cache static and read-heavy settings (e.g., clinic profile, service price lists) using an in-memory TTL cache (e.g., NestJS CacheManager) to bypass the database.
* **Precise Math**: All billing calculations must be performed using integer value **paise/cents** (e.g. ₹10.50 = 1050 paise) or via a decimal math library (e.g., `decimal.js`). **Never use binary float operations (`+`, `-`, `*`) for monetary totals**.

### 2. Scalability Improvements
* **Stateless JWT Authentications**: Use stateless JSON Web Tokens for authentication. Store access tokens in HTTP-only, Secure cookies. Implement a secure refresh token rotation flow.
* **API Route Versioning**: Standardize all routes under URI versioning (e.g., `/api/v1/patients`, `/api/v1/billing`). Keep deprecated routes backward-compatible.
* **Background Processing**: Heavy report generations, bulk exports, and invoice PDF compilations must run inside a background worker using a queue (e.g., `BullMQ`) or Node.js `worker_threads`, preventing blocking of the main event loop.
* **Dockerization**: Provide a multi-stage `Dockerfile` and a `docker-compose.yml` defining the application services, a PostgreSQL DB instance, and Redis for queuing.

### 3. Code Quality & Maintainability
* **Strict Typing**: No `any` type usage. All request bodies, parameters, and query options must map to strict DTOs.
* **Controller-Service-Repository Pattern**:
  - *Controllers*: Handle HTTP serialization, validations, cookies, and route mapping.
  - *Services*: Contain business logic, orchestrate workflows, and coordinate transactions.
  - *Repositories/Prisma Client*: Contain pure data-access queries.
* **Centralized Error Handling**: Implement a global exception filter/middleware. Catch all thrown errors, log their stack traces, and map them to structured JSON error payloads:
  ```json
  {
    "statusCode": 400,
    "message": "Validation failed: Phone number is invalid",
    "error": "Bad Request",
    "timestamp": "2026-07-21T17:18:00Z",
    "path": "/api/v1/patients",
    "correlationId": "req-xxxx-yyyy"
  }
  ```
* **Testing Guidelines**: Define unit tests for billing arithmetic and stock transaction logic using Jest. Include integration tests with an isolated test database (using Prisma migrations) to verify critical routes.

### 4. Security Review & Best Practices
* **Role-Based Access Control (RBAC)**: Ensure route-level guards block non-admin users from sensitive endpoints (e.g. settings updates, stock adjustments, database restores, invoice cancellations, audit logs).
* **Bcrypt Password Storage**: Seeds must hash passwords using `bcrypt` with a cost factor of at least 10.
* **Input Validation & Sanitization**: Sanitize all text fields using tools like `dompurify` or custom validators to prevent HTML/XSS injections. Reject payloads exceeding payload size limits (e.g., body limit 1MB, except for profile image upload limit 5MB).
* **Secure HTTP Headers**: Initialize `helmet` to set secure HTTP headers (e.g. HSTS, X-Content-Type-Options, CSP).
* **Rate Limiting**: Apply global rate limiting (e.g., maximum 100 requests per 15 minutes per IP) with stricter limits on auth endpoints (e.g. 5 attempts per 15 minutes).

### 5. Database & API Optimization
* **ACID Transaction Management**:
  - The **Bill Finalization** step must execute inside a single Prisma database transaction (`$transaction`). It must sequentially:
    1. Read and validate target batches (check `qty_available` and expiry).
    2. Subtract stock from selected batches (block if insufficient or expired).
    3. Generate the next sequential, gap-free bill number (e.g., `INV/2026-27/0001`).
    4. Write the `bills` record, `bill_items` rows, and payment receipts.
    5. Write `stock_transactions` log rows for every medicine line item.
  - If any of these steps fail, the entire database transaction must rollback instantly.
* **Pagination**: Standardize on cursor-based or offset pagination for all list-view endpoints (e.g., `GET /api/v1/patients?limit=50&offset=0`).
* **Soft Deletes**: Ensure deletions in `patients`, `medicines`, and `vendors` set a `deleted_at` timestamp. Intercept queries to exclude soft-deleted entities by default, unless explicitly requested.

### 6. Logging, Monitoring & System Reliability
* **Structured JSON Logging**: Standardize winston/pino to output logs in JSON format to stdout. Include: `timestamp`, `level`, `context` (e.g., module name), `message`, `userId`, and `correlationId`.
* **Request Correlation Middleware**: Generate a unique correlation ID (UUID) for each incoming request and bind it to the execution context (using `AsyncLocalStorage` or CLS-hooked) so that all downstream logs generated by that request share the same ID.
* **Health Check API**: Expose `GET /health` providing system metrics:
  - Database connection status
  - Disk storage availability
  - Memory consumption (heap used vs limit)
  - Queue latency (if using BullMQ)
* **Automated WAL Backups (Offline-centric)**: If SQLite is utilized for offline servers, implement the `VACUUM INTO` command via cron task or event emitter to trigger backup without locking the database.

---

## 4. API Endpoints Contract (to align with the Frontend)

Your backend must support the following API routes, returning JSON structured identically to the mock API in the React frontend:

### Authentication
* `POST /api/v1/auth/login` -> Authenticate user, return JWT cookie + user profile data.
* `POST /api/v1/auth/logout` -> Clear authentication cookies.
* `GET /api/v1/auth/me` -> Validate session, return current user metadata.

### Patients
* `GET /api/v1/patients?q=searchString` -> Search-as-you-type (across name, phone, code). Return list.
* `GET /api/v1/patients/:id` -> Get patient profile, visit logs, outstanding balance, and billing history.
* `POST /api/v1/patients/check-duplicate` -> Payloads phone/name, return duplicate flag.
* `POST /api/v1/patients` -> Create new patient (generate code `P-xxxxxx`).
* `PUT /api/v1/patients/:id` -> Update patient details.
* `DELETE /api/v1/patients/:id` -> Soft delete patient.

### Inventory & Stock
* `GET /api/v1/medicines` -> List medicines, showing nested stock batches.
* `POST /api/v1/medicines` -> Add a new medicine type.
* `PUT /api/v1/medicines/:id` -> Update medicine info.
* `DELETE /api/v1/medicines/:id` -> Soft delete medicine.
* `GET /api/v1/vendors` -> List active suppliers.
* `POST /api/v1/vendors` -> Create supplier.
* `POST /api/v1/purchases` -> Record a new stock-in invoice. Create vendor transaction logs, batches, and IN transactions atomically.
* `GET /api/v1/inventory/batches?medicineId=xxx` -> Get batches for a medicine sorted FIFO by expiry date (`expiry_date` ascending).
* `POST /api/v1/inventory/adjust` -> Admin-only stock correction (damage, expiry) creating ADJUST transactions.

### Billing & Payments
* `POST /api/v1/bills` -> Create DRAFT bill.
* `POST /api/v1/bills/:id/finalize` -> Finalize bill, deduct stock inside a transaction, generate invoice number.
* `POST /api/v1/bills/:id/cancel` -> Admin-only, rollback stock inside a transaction, write audit log with reason.
* `POST /api/v1/bills/:id/payments` -> Add payment to a bill (partial/full, support multiple payment modes).
* `GET /api/v1/bills/:id/print` -> Get print layout metadata or trigger head-less print layout compilation.

### Reports (date-range filterable)
* `GET /api/v1/reports/collections` -> Total collections, broken down by cash/card/UPI/bank.
* `GET /api/v1/reports/outstanding` -> Outstanding patient dues list.
* `GET /api/v1/reports/inventory-valuation` -> Total stock valuation at purchase and selling prices.
* `GET /api/v1/reports/gst-summary` -> GST period summary (taxable value, CGST, SGST by slab).

### Settings & Settings
* `GET /api/v1/settings/profile` -> Fetch clinic metadata.
* `PUT /api/v1/settings/profile` -> Update profile (clinic name, GSTIN, default tax, invoice prefix).
* `GET /api/v1/audit-logs` -> Admin-only system logs viewer.

---

## 5. Verification Plan

### Database Constraints Tests
1. **FIFO Allocation Test**: Seed a medicine with 2 batches (Batch A expiring in 15 days, Batch B expiring in 60 days). Issue a bill and verify the system automatically allocates stock from Batch A first.
2. **Negative Stock Block Test**: Try to bill a quantity higher than the available stock. Verify the API throws a 400 error and no rows are modified.
3. **Transaction Rollback Test**: Force a write failure during the payment log step of a bill finalization. Verify that no stock is deducted and no bill record is created.

### Security & Load Verification
1. **Authorization Test**: Request `/api/v1/audit-logs` or `/api/v1/settings/profile` using a JWT corresponding to a RECEPTIONIST role. Verify that the server returns a 403 Forbidden.
2. **SQL Injection Test**: Attempt SQL Injection queries inside search strings (e.g. patients search). Verify that Prisma parameterized queries escape all special characters.
3. **Rate Limiting Verification**: Run a load-generator script (e.g., autocannon or artillery) sending 200 rapid requests. Verify that subsequent requests return a 429 Too Many Requests response.
