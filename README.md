# RaPaX_v1.0.0_Complete
⚠️ PRIVATE AND PROPRIETARY. Copyright © 2026 Archer Chain Analytics. All rights reserved.  PROPRIETARY AND CONFIDENTIAL  Copyright (c) 2026 Archer Chain Analytics. All rights reserved. Unauthorized use is strictly forbidden.

# RaPaX™ — Sovereign Digital Products Vending Machine

> Black. Gold. Sovereign.

---

## Architecture

```
rapax/
├── src/
│   ├── config/         — Central env-driven config
│   ├── middleware/      — Auth (JWT operator guard)
│   ├── models/          — DB models (SQLite via better-sqlite3)
│   │   ├── productModel.js
│   │   ├── transactionModel.js
│   │   ├── paymentAddressModel.js
│   │   ├── fingerprintModel.js
│   │   └── deliveryModel.js
│   ├── routes/          — Express route handlers
│   │   ├── products.js  — Public product API
│   │   ├── purchase.js  — Purchase initiation + status
│   │   ├── download.js  — Tokenized secure download
│   │   ├── internal.js  — Internal pipeline controls
│   │   └── operator.js  — Operator dashboard API
│   ├── services/        — Business logic
│   │   ├── paymentService.js   — Address gen + blockchain monitors
│   │   ├── acerbeService.js    — AcerbE™ fingerprinting integration
│   │   ├── deliveryService.js  — Secure expiring link issuance
│   │   ├── pipeline.js         — End-to-end orchestrator
│   │   ├── paymentPoller.js    — Cron: polls pending transactions
│   │   └── exportService.js    — JSON/CSV audit exports
│   ├── utils/
│   │   ├── initDb.js    — Schema DDL + DB init
│   │   ├── seedDb.js    — Dev seed data
│   │   ├── ensureDirs.js
│   │   └── auditLogger.js  — Immutable append-only audit log
│   └── server.js        — Express app entry point
├── dashboard/
│   └── dist/index.html  — Mobile-first operator dashboard SPA
├── storage/
│   ├── products/        — Uploaded product files
│   └── fingerprinted/   — AcerbE™ fingerprinted output files
├── logs/                — Exported CSV/JSON audit files
├── .env.example
└── package.json
```

---

## Setup

```bash
# 1. Clone and install
cd rapax
npm install

# 2. Configure environment
cp .env.example .env
# Edit .env — set OPERATOR_SECRET, blockchain provider keys, ACERBE_BASE_URL

# 3. Initialize database
npm run db:init

# 4. (Optional) Seed sample products
npm run db:seed

# 5. Start server
npm run dev       # development (nodemon)
npm start         # production
```

---

## Public API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/products` | List all available products |
| GET | `/api/product/:id` | Single product details |
| POST | `/api/purchase/initiate` | Start a purchase — returns payment address |
| GET | `/api/purchase/status/:id` | Poll transaction status |
| GET | `/api/download/:token` | Secure tokenized file download |

### Purchase Initiation

```json
POST /api/purchase/initiate
{
  "product_id": "uuid",
  "currency": "BTC",
  "buyer_wallet": "bc1q..."
}
```

Response:
```json
{
  "success": true,
  "transaction_id": "uuid",
  "status": "pending",
  "currency": "BTC",
  "amount_expected": 0.0008,
  "payment_address": "bc1q...",
  "expires_at": "2024-01-01T01:00:00.000Z"
}
```

---

## Internal API Endpoints (Operator Auth Required)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/operator/login` | Get operator JWT |
| POST | `/api/fingerprint` | Manually trigger AcerbE™ fingerprinting |
| POST | `/api/payment/confirm` | Manually confirm a payment |
| POST | `/api/delivery/issue` | Manually issue a delivery link |

---

## Operator Dashboard API

All require `Authorization: Bearer <token>`

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/operator/products` | All products (including unavailable) |
| POST | `/api/operator/products` | Upload new product (multipart) |
| PATCH | `/api/operator/products/:id` | Update product metadata |
| PATCH | `/api/operator/products/:id/file` | Replace product file |
| PATCH | `/api/operator/products/:id/toggle` | Toggle availability |
| DELETE | `/api/operator/products/:id` | Soft delete |
| GET | `/api/operator/transactions` | All transactions |
| GET | `/api/operator/deliveries` | All deliveries |
| GET | `/api/operator/logs` | Audit log (filterable) |
| GET | `/api/operator/export/json` | Export audit log as JSON |
| GET | `/api/operator/export/csv` | Export audit log as CSV |
| GET | `/api/operator/export/deliveries` | Export delivery log as JSON |

---

## End-to-End Flow

```
1. Buyer → GET /products
2. Buyer → POST /purchase/initiate  → receives payment address
3. Buyer sends crypto to address
4. Poller (60s cron) detects payment on-chain
5. Transaction marked 'confirmed'
6. Pipeline.run() triggered:
   a. AcerbE™ called → asset fingerprinted
   b. Fingerprint record stored
   c. Secure expiring download token generated
   d. Transaction marked 'delivering'
7. Buyer polls GET /purchase/status → sees download_link
8. Buyer → GET /download/:token → receives fingerprinted asset
9. Transaction marked 'complete'
10. All events immutably logged in audit_log
```

---

## AcerbE™ Integration

RaPaX calls AcerbE™ at `POST {ACERBE_BASE_URL}/fingerprint`:

```json
Request:
{
  "product_id": "uuid",
  "buyer_wallet": "bc1q...",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "file_path": "/path/to/product.zip"
}

Response:
{
  "fingerprint_id": "uuid",
  "fingerprinted_file_path": "/path/to/fingerprinted.zip",
  "hash": "sha256hex"
}
```

In development (`NODE_ENV !== production`), a local fallback is used when AcerbE™ is unreachable — copies the file and appends a fingerprint marker.

---

## Security

- All download links are random 96-character hex tokens — no file paths ever exposed
- Download links expire (default: 1 hour, configurable via `DOWNLOAD_LINK_TTL`)
- Audit log is append-only — no DELETE or UPDATE ever issued against it
- Fingerprinted assets stored separately from originals
- Unique payment address generated per transaction
- Operator endpoints protected by JWT
- Rate limiting on all public endpoints
- Helmet security headers on all responses

---

## FIAT (Future)

FIAT is stubbed and gated by `FIAT_ENABLED=false` in `.env`. The `FiatService` class exists in `paymentService.js` ready for Stripe/merchant rail integration. Set `FIAT_ENABLED=true` and implement `FiatService.initiate()` when ready.
