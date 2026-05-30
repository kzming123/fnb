# CLAUDE.md — F&B Smart Ledger

This file defines the product context, scope, and engineering rules for the **F&B Smart Ledger** web app. Claude (and any AI coding agent) must read this file before generating or editing code in this repository.

## 0. Working Rules (read first)

- **Standard context only.** Do not use the 1M context window. Stay within standard 200K context. Run `/compact` when the session grows long.
- **Minimal file access.** Only read or edit the specific file(s) explicitly mentioned by the user. Do not scan, glob, or grep across the whole project unless the user asks.
- **No unsolicited exploration.** Do not spawn agents or run broad searches to "understand the codebase" unless instructed.

---

## 1. Product Overview

**F&B Smart Ledger** is an AI-powered web application that helps Malaysian F&B business owners run a clean, simple, and accurate ledger for their daily operations.

It is **not** a full accounting system (no double-entry bookkeeping, no tax filing, no SST/GST submission). It is a **smart ledger + financial dashboard** focused on the day-to-day money decisions an F&B owner actually makes:

- How much did I sell today?
- How much did I pay my suppliers this week?
- What's my real food cost percentage?
- Am I profitable this month?

The product replaces the messy mix of WhatsApp screenshots, paper invoices, Excel sheets, and napkin math that most small F&B operators currently rely on.

**One-line pitch:** *"Snap your supplier invoice, log today's sales, and see your real profit — without hiring an accountant."*

---

## 2. Target Users

Primary users in Malaysia:

- **Restaurant owners** — single outlet and small chains (2–5 outlets)
- **Cafe owners** — independent cafes, specialty coffee shops
- **Bakery owners** — neighborhood bakeries, home-based bakers going commercial
- **Cloud kitchen operators** — delivery-only kitchens running on GrabFood / foodpanda / ShopeeFood
- **Food stall / hawker operators** — pasar malam, food court, kopitiam stall owners

**User profile assumptions:**
- Non-accountant, non-technical
- Often bilingual: English + Simplified Chinese (some prefer 简体中文 only)
- Uses phone more than desktop
- Time-poor — must be able to log a day's sales in under 60 seconds
- Distrusts complex software; will abandon if onboarding is confusing

---

## 3. Core User Flow

The happy-path flow the MVP must support end-to-end:

1. **Sign up / log in** (email + password via Supabase Auth)
2. **Onboard the business** — name, type (restaurant / cafe / bakery / cloud kitchen / stall), currency (default MYR), preferred language
3. **Log daily sales** — enter today's total revenue, optionally split by channel (dine-in, takeaway, GrabFood, foodpanda, ShopeeFood)
4. **Scan or upload supplier invoice** — take a photo or upload PDF; the app extracts supplier name, date, line items, and total (mocked in MVP, real OCR + LLM later)
5. **Confirm and categorize** — user reviews extracted data and assigns a category (e.g. *Meat*, *Vegetables*, *Beverages*, *Packaging*)
6. **Log other expenses** — rent, utilities, salaries, marketing, etc.
7. **View dashboard** — today's sales, week-to-date, month-to-date, food cost %, top suppliers
8. **Generate monthly P&L report** — revenue − COGS − operating expenses = net profit; exportable as PDF

---

## 4. MVP Features

### 4.1 Pages (MVP scope)

| Page | Purpose |
|---|---|
| `/login` and `/register` | Supabase Auth — email + password, with language toggle |
| `/dashboard` | Snapshot: today's sales, MTD revenue, MTD expenses, food cost %, profit trend chart |
| `/sales` | Daily sales log — list view + quick-add form |
| `/invoices` | Invoice scanner — upload image/PDF, view extracted data, confirm & save |
| `/expenses` | Non-supplier expenses (rent, utilities, salaries, marketing, misc) |
| `/suppliers` | Supplier directory — name, contact, category, total spent YTD |
| `/reports` | Monthly P&L report — revenue, COGS, expenses, gross/net profit, export to PDF |
| `/settings` | Business profile, language preference, currency, account, logout |

### 4.2 Core feature list

- Track daily sales (with optional channel breakdown)
- Track supplier invoices with line-item detail
- Track non-supplier expenses by category
- Categorize F&B food cost (Meat, Seafood, Vegetables, Dairy, Dry Goods, Beverages, Packaging, Others)
- Upload invoice image (JPG/PNG) or PDF to Supabase Storage
- **Mock** AI invoice extraction in MVP — return a hard-coded structured response so the flow is testable; swap in real OCR + LLM later behind the same interface
- Generate monthly P&L report (web view + PDF export)
- Dashboard with Recharts visualizations (bar, line, donut)
- English / Simplified Chinese language switch with persisted preference

### 4.3 Explicitly out of scope for MVP

- Multi-outlet consolidation (single outlet only in MVP)
- Inventory tracking / stock levels
- Recipe costing
- Payroll / employee management
- SST submission / tax filing
- POS integration (Storehub, Slurp, etc.)
- E-invoicing (LHDN MyInvois)
- Team accounts / role-based access
- Mobile native apps (responsive web only)

---

## 5. Database Modules (Supabase Postgres)

High-level schema (final column-level design happens during implementation, not here):

| Module | Purpose | Key entities |
|---|---|---|
| **auth** | Managed by Supabase | `auth.users` |
| **business** | One business profile per user | `businesses` (id, owner_id, name, type, currency, language, created_at) |
| **sales** | Daily revenue records | `sales_entries` (id, business_id, entry_date, channel, amount, note) |
| **suppliers** | Supplier directory | `suppliers` (id, business_id, name, category, contact, notes) |
| **invoices** | Supplier invoices + line items | `invoices` (id, business_id, supplier_id, invoice_date, total, currency, file_url, status, extracted_json) · `invoice_items` (id, invoice_id, description, category, quantity, unit_price, line_total) |
| **expenses** | Non-supplier operating expenses | `expense_categories` (id, business_id, name, kind) · `expenses` (id, business_id, category_id, expense_date, amount, vendor, note) |
| **reports** | Cached monthly aggregates (optional in MVP) | `monthly_summaries` (business_id, year, month, revenue, cogs, expenses, net_profit, generated_at) |

**Rules:**
- Every row tied to a business **must** include `business_id` and be protected by Supabase **Row Level Security (RLS)** so a user can only read/write their own data.
- All monetary columns: `numeric(12,2)`, no floats.
- All timestamps: `timestamptz`, stored UTC, formatted in the user's locale on the client.
- Soft-delete via `deleted_at timestamptz` rather than hard-delete, so an owner can undo mistakes.

---

## 6. Design Direction

**Aesthetic:** Modern SaaS, clean, premium, calm — closer to Linear / Notion / Stripe Dashboard than to a traditional accounting tool.

**Principles:**
- **One screen, one job.** Each page answers one question.
- **Mobile-first.** Most owners will use this on a phone in the kitchen. Touch targets ≥ 44px. Forms work one-handed.
- **Numbers are the hero.** Big, legible figures with clear units (RM). Charts secondary.
- **No accounting jargon.** Say "Money in", "Money out", "Profit" before "Revenue", "COGS", "Net income".
- **Low cognitive load.** Show defaults, hide advanced options, allow override.
- **Quiet UI.** Neutral background, restrained color, one accent color for actions and key metrics.

**Component system:** shadcn/ui as the base. Tailwind CSS for all styling. No competing UI libraries.

**Charts:** Recharts only. Avoid pie charts with more than 5 slices; prefer bar and line.

**Empty states matter.** Every list/dashboard ships with a designed empty state that teaches the user the next action.

---

## 7. Language Support Rules

- **Supported locales:** `en` (English) and `zh-CN` (简体中文).
- **Default locale:** `en`.
- **Storage:** user's preferred locale is stored on the `businesses` row and also persisted in `localStorage` for unauthenticated pages (login, register, landing).
- **Switcher:** language toggle is available on the login/register pages and inside `/settings`. Once toggled, the change applies immediately without a page reload.
- **Implementation:** use `next-intl` (preferred) for App Router-friendly i18n. Translation files live at `src/i18n/messages/en.json` and `src/i18n/messages/zh-CN.json`.
- **Rule:** **no hard-coded user-facing strings** in components. Every label, button, toast, error message, and empty state must go through the translation layer.
- **Numbers & dates:** use `Intl.NumberFormat` and `Intl.DateTimeFormat` with the active locale. Currency always shown as `RM 1,234.56` regardless of locale.
- **Translations are a first-class deliverable.** A PR that adds an English string without its Simplified Chinese counterpart should not be merged.

---

## 8. Development Rules

### 8.1 Language & framework
- **TypeScript strict mode** on. No `any` unless justified with a comment.
- **Next.js App Router** only — no Pages Router.
- **Server Components by default.** Use `"use client"` only when the component needs interactivity, browser APIs, or React state/effects.

### 8.2 Data access
- **All Supabase access** goes through helpers in `src/lib/supabase/` — never instantiate the client inline in a component.
- Use the **server client** for Server Components / Route Handlers, and the **browser client** only in Client Components.
- **Never bypass RLS.** The service-role key is used only in trusted server contexts (e.g. scheduled jobs), never shipped to the client.

### 8.3 Code quality
- ESLint + Prettier enforced. CI fails on lint errors.
- Components should be small and single-purpose. Split a file once it crosses ~200 lines.
- No comments that just restate the code. Comments explain *why*, not *what*.
- No dead code, no commented-out blocks. Remove it; git remembers.

### 8.4 Validation & errors
- All form input is validated with **Zod** schemas shared between client and server.
- Server actions and route handlers return typed results: `{ ok: true, data } | { ok: false, error }`.
- User-facing errors are translated strings, not raw exception messages.

### 8.5 Money & precision
- Money is stored and computed as **`numeric`** in Postgres and as **strings or `Decimal`** (via `decimal.js`) on the server. Never use JS `number` for arithmetic on money.
- Display formatting happens at the very edge (the component), not in the data layer.

### 8.6 Mock-first for AI features
- Invoice extraction in MVP is a **mock function** with the same signature the real OCR/LLM call will have. This lets the rest of the app — upload, review, save, categorize — be built and tested today, and swapped to real AI without touching the UI.

### 8.7 Git & PRs
- Conventional commits (`feat:`, `fix:`, `chore:`, `refactor:`, `docs:`).
- Each PR ships: code + tests (where applicable) + translations for both locales.

---

## 9. Folder Structure Plan

```
F&B Smart Ledger/
├── CLAUDE.md
├── README.md
├── package.json
├── tsconfig.json
├── tailwind.config.ts
├── next.config.ts
├── .env.local.example
│
├── public/
│   └── (logos, favicons, marketing images)
│
├── src/
│   ├── app/
│   │   ├── layout.tsx                  # Root layout, i18n provider, theme
│   │   ├── page.tsx                    # Marketing / landing
│   │   ├── (auth)/
│   │   │   ├── login/page.tsx
│   │   │   └── register/page.tsx
│   │   ├── (app)/                      # Authenticated app shell
│   │   │   ├── layout.tsx              # Sidebar / topbar, auth guard
│   │   │   ├── dashboard/page.tsx
│   │   │   ├── sales/page.tsx
│   │   │   ├── invoices/
│   │   │   │   ├── page.tsx
│   │   │   │   └── [id]/page.tsx       # Invoice detail / review extracted data
│   │   │   ├── expenses/page.tsx
│   │   │   ├── suppliers/page.tsx
│   │   │   ├── reports/page.tsx
│   │   │   └── settings/page.tsx
│   │   └── api/                        # Route handlers (server-only)
│   │       ├── invoices/extract/route.ts   # Mock now, real OCR/LLM later
│   │       └── reports/pdf/route.ts        # PDF export
│   │
│   ├── components/
│   │   ├── ui/                         # shadcn/ui primitives
│   │   ├── layout/                     # Sidebar, Topbar, AppShell
│   │   ├── charts/                     # Recharts wrappers (RevenueChart, etc.)
│   │   ├── forms/                      # SalesForm, ExpenseForm, InvoiceReviewForm
│   │   └── shared/                     # EmptyState, MoneyDisplay, LanguageSwitcher
│   │
│   ├── features/                       # Feature-grouped business logic
│   │   ├── sales/
│   │   ├── invoices/
│   │   ├── expenses/
│   │   ├── suppliers/
│   │   └── reports/
│   │
│   ├── lib/
│   │   ├── supabase/
│   │   │   ├── server.ts               # Server client
│   │   │   ├── browser.ts              # Browser client
│   │   │   └── middleware.ts           # Auth-refresh middleware helper
│   │   ├── ai/
│   │   │   └── invoice-extractor.ts    # Mock today, real OCR+LLM tomorrow
│   │   ├── pdf/
│   │   │   └── pnl-report.ts           # P&L PDF generator
│   │   ├── money.ts                    # Decimal-safe money helpers
│   │   └── utils.ts
│   │
│   ├── i18n/
│   │   ├── config.ts
│   │   └── messages/
│   │       ├── en.json
│   │       └── zh-CN.json
│   │
│   ├── types/                          # Shared TS types & Zod schemas
│   │
│   └── middleware.ts                   # Next.js middleware — auth + locale
│
└── supabase/
    ├── migrations/                     # SQL migrations (versioned)
    ├── seed.sql                        # Demo data for local dev
    └── policies/                       # RLS policy SQL, grouped by table
```

**Why this shape:**
- **Route groups** `(auth)` and `(app)` keep the authenticated shell separate from the marketing/auth pages without leaking into the URL.
- **`features/`** holds business logic (queries, mutations, view-models) per domain, so a page file stays thin and a feature can be moved or extracted later without a rewrite.
- **`lib/ai/`** isolates the AI seam so the mock → real swap is a one-file change.
- **`supabase/`** at the repo root mirrors the Supabase CLI convention and keeps SQL out of the app bundle.

---

## 10. Future AI / OCR Integration Plan

The MVP ships with a **mock** invoice extractor so the full user flow (upload → review → categorize → save) can be built and shipped immediately. The real AI is layered on later behind the same interface.

### 10.1 Contract (stable from day one)

```ts
// src/lib/ai/invoice-extractor.ts
export type ExtractedInvoice = {
  supplierName: string | null;
  invoiceNumber: string | null;
  invoiceDate: string | null;        // ISO date
  currency: string;                  // default "MYR"
  subtotal: string | null;           // decimal string
  tax: string | null;
  total: string | null;
  items: Array<{
    description: string;
    category: string | null;         // suggested F&B category
    quantity: string | null;
    unitPrice: string | null;
    lineTotal: string | null;
  }>;
  confidence: number;                // 0–1
  rawText?: string;                  // OCR output for debugging
};

export async function extractInvoice(file: File | Blob): Promise<ExtractedInvoice>;
```

The UI is built against this type. The mock returns a realistic hard-coded `ExtractedInvoice`. When the real backend lands, only the function body changes.

### 10.2 Phased roadmap

| Phase | What ships | How it works |
|---|---|---|
| **Phase 0 — MVP (now)** | Mock extractor | Returns a fixed `ExtractedInvoice` after a short artificial delay. Real upload still goes to Supabase Storage. |
| **Phase 1 — OCR** | Real text extraction | Server route runs the uploaded file through an OCR provider (e.g. Google Document AI, AWS Textract, Mistral OCR, or a self-hosted Tesseract for cost control) and returns raw text + bounding boxes. |
| **Phase 2 — LLM structuring** | Structured invoice data | Pass OCR text to Claude (Anthropic API) with a JSON schema and few-shot examples of Malaysian supplier invoices (Chinese + English, mixed currency formats, common SKU patterns). Returns `ExtractedInvoice` directly. Use prompt caching for the schema + examples. |
| **Phase 3 — Auto-categorization** | Smart category suggestions | LLM suggests the most likely F&B cost category per line item, learning from the user's prior categorizations on this business (stored in Postgres as a lightweight feedback table). |
| **Phase 4 — Insights** | Proactive AI summaries | Monthly "AI Insights" panel on the dashboard: anomalous spend, food cost % trend, top supplier concentration risk, "you spent 18% more on seafood vs last month". |
| **Phase 5 — Voice & WhatsApp logging** | Friction-zero logging | Voice note → daily sales entry. WhatsApp bot to forward invoice photos directly into the ledger. |

### 10.3 Guardrails
- Every AI extraction is **reviewed by the user** before being saved. No silent writes.
- Confidence score is shown in the UI; low-confidence fields are highlighted for manual correction.
- Raw OCR text and the LLM response are stored on the `invoices` row (`extracted_json`) so we can re-process or audit later.
- Costs are tracked per call; route choice (Haiku for line-item parsing, Sonnet for structuring, Opus only for tricky bilingual invoices) is made server-side.
- PII / business data sent to third-party AI providers is documented in the privacy policy.

---

## Proposed Structure — Summary for the User

This `CLAUDE.md` locks in:

1. **Scope** — smart ledger + dashboard, not full accounting. Prevents scope creep into payroll, inventory, tax filing.
2. **Users** — Malaysian F&B owners on phones, bilingual EN / 简体中文, non-accountants.
3. **MVP surface** — 8 pages, 8 core features, clear out-of-scope list.
4. **Data model** — 6 logical modules (business, sales, suppliers, invoices, expenses, reports) all protected by Supabase RLS, money stored as `numeric`.
5. **Design** — modern SaaS, mobile-first, shadcn/ui + Tailwind + Recharts, no jargon.
6. **i18n** — `next-intl`, no hard-coded strings, both languages required per PR.
7. **Engineering rules** — TS strict, Server Components by default, Supabase access centralized, money via `Decimal`, AI behind a stable mock-first interface.
8. **Folder shape** — App Router with `(auth)` / `(app)` route groups, `features/` for domain logic, `lib/ai/` as the swappable AI seam, `supabase/` at root for migrations & RLS.
9. **AI roadmap** — five-phase plan from mocked extraction today to voice + WhatsApp logging later, all behind the same `extractInvoice()` contract.

**Next step (when you give the go-ahead):** scaffold the Next.js project per this structure, set up Supabase Auth + RLS, ship the `/login` `/register` `/dashboard` skeleton with i18n wired up, then iterate one page at a time in this order: Dashboard → Daily Sales → Suppliers → Invoice Scanner (mock) → Expenses → P&L Report → Settings.
