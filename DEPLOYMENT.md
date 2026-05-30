# F&B Smart Ledger — Deployment Guide

> **Target stack:** Next.js 14 (App Router) · Supabase (Postgres + Auth + Storage) · Vercel
>
> This guide assumes you are deploying for the first time from scratch.
> All steps are written for a non-technical owner — no command-line experience required beyond copy-paste.

---

## Table of Contents

1. [Prerequisites](#1-prerequisites)
2. [Environment Variables](#2-environment-variables)
3. [Supabase Setup](#3-supabase-setup)
4. [Database Migration Order](#4-database-migration-order)
5. [Vercel Deployment](#5-vercel-deployment)
6. [AI / Invoice Extraction Setup](#6-ai--invoice-extraction-setup)
7. [Post-Deployment Testing Checklist](#7-post-deployment-testing-checklist)
8. [Current Limitations](#8-current-limitations)
9. [Common Errors and Fixes](#9-common-errors-and-fixes)

---

## 1. Prerequisites

Before you start, make sure you have:

- [ ] A [Supabase](https://supabase.com) account (free tier is fine for MVP)
- [ ] A [Vercel](https://vercel.com) account (free tier is fine)
- [ ] Your code pushed to a GitHub repository
- [ ] (Optional) An [OpenAI](https://platform.openai.com) account if you want real AI invoice extraction

---

## 2. Environment Variables

Copy `.env.example` to `.env.local` for local development. For production, add these in Vercel (see Section 5).

| Variable | Required | Where to get it |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ Yes | Supabase → Project Settings → API → Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ Yes | Supabase → Project Settings → API → `anon` `public` key |
| `SUPABASE_SERVICE_ROLE_KEY` | Recommended | Supabase → Project Settings → API → `service_role` key |
| `NEXT_PUBLIC_APP_URL` | ✅ Yes | Your Vercel app URL (e.g. `https://your-app.vercel.app`) |
| `OPENAI_API_KEY` | Optional | [platform.openai.com/api-keys](https://platform.openai.com/api-keys) |

> **Security note:** `NEXT_PUBLIC_*` variables are safe to expose — they are visible in the browser.
> `SUPABASE_SERVICE_ROLE_KEY` and `OPENAI_API_KEY` are server-only secrets — never put them in a `NEXT_PUBLIC_` variable.

---

## 3. Supabase Setup

### 3.1 Create a Supabase project

1. Go to [supabase.com](https://supabase.com) and sign in.
2. Click **New Project**.
3. Choose your organization, give the project a name (e.g. `fb-smart-ledger`), set a strong database password, and choose the nearest region (e.g. **Singapore** for Malaysia).
4. Click **Create new project** and wait ~2 minutes for it to provision.

### 3.2 Enable Email/Password Auth

1. In your Supabase project, go to **Authentication → Providers**.
2. Find **Email** and make sure it is **Enabled**.
3. Under **Auth → Email Templates**, you can customise the confirmation email (optional).
4. Under **Authentication → URL Configuration**, add your production URL to **Redirect URLs**:
   ```
   https://your-app.vercel.app/**
   ```
   Also add `http://localhost:3000/**` for local development.

### 3.3 Run the database schema

1. Go to **SQL Editor** in your Supabase dashboard.
2. Click **New query**.
3. Open the file `supabase/schema.sql` from this repository and paste the entire contents into the editor.
4. Click **Run** (Ctrl+Enter).
5. You should see `Success. No rows returned` — this means all tables, RLS policies, and triggers were created.

> If you see an error like `relation "businesses" already exists`, the schema has already been run. Skip this step.

### 3.4 Run migrations in order

After the schema, run each migration file **one at a time** in this exact order:

| Order | File | What it does |
|---|---|---|
| 1 | `supabase/schema.sql` | Creates all tables, RLS policies, triggers |
| 2 | `supabase/migrations/add_onboarding_completed.sql` | Adds `onboarding_completed` flag to `businesses` |
| 3 | `supabase/migrations/add_platform_commission_fields.sql` | Adds delivery platform commission fields to `daily_sales` |
| 4 | `supabase/migrations/add_user_roles.sql` | Adds `role` column to `profiles` (owner/manager/staff/accountant) |

For each file:
1. Open **SQL Editor → New query**.
2. Paste the file contents.
3. Click **Run**.
4. Confirm no errors appear.

### 3.5 Create Storage buckets

The app uses two private storage buckets. Create both:

#### Bucket 1 — Invoice files

1. Go to **Storage** in your Supabase dashboard.
2. Click **New bucket**.
3. Name: `invoice-files`
4. Toggle **Public bucket** to **OFF** (private).
5. Set **File size limit** to `10 MB`.
6. Click **Create bucket**.

#### Bucket 2 — Expense attachments

1. Click **New bucket** again.
2. Name: `expense-attachments`
3. Toggle **Public bucket** to **OFF** (private).
4. Set **File size limit** to `10 MB`.
5. Click **Create bucket**.

#### Storage access policies

For each bucket, add a policy so users can only access their own files:

1. Click on the bucket name → **Policies** tab → **New policy**.
2. Choose **For full customisation**.
3. Apply this policy to `invoice-files`:

```sql
-- Allow authenticated users to upload to their own folder
CREATE POLICY "Users upload own invoices"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'invoice-files' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Allow authenticated users to read their own invoices
CREATE POLICY "Users read own invoices"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'invoice-files' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Allow authenticated users to delete their own invoices
CREATE POLICY "Users delete own invoices"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'invoice-files' AND auth.uid()::text = (storage.foldername(name))[1]);
```

Apply the same pattern to `expense-attachments` (replace `invoice-files` with `expense-attachments`).

> **Tip:** Run all three statements as one query in the SQL Editor for each bucket.

### 3.6 Verify RLS is working

Row Level Security (RLS) ensures each user can only see their own data. To confirm it is active:

1. Go to **Table Editor** in Supabase.
2. Click on the `businesses` table.
3. Check the **RLS enabled** badge — it should show a green lock icon.
4. Repeat for: `profiles`, `daily_sales`, `expenses`, `expense_categories`, `suppliers`, `invoices`, `invoice_items`.

To test RLS manually:
1. Register two different accounts in the app.
2. Add data with Account A.
3. Log in as Account B — you should see no data from Account A.

---

## 4. Database Migration Order

Run these SQL files in this exact order. Each builds on the previous one.

```
supabase/
  schema.sql                           ← Run first (base schema)
  migrations/
    add_onboarding_completed.sql       ← Run second
    add_platform_commission_fields.sql ← Run third
    add_user_roles.sql                 ← Run fourth
```

> **Do NOT run `supabase/seed.sql`** in production unless you want demo/test data in your live database. Seed data is for local development only.

---

## 5. Vercel Deployment

### 5.1 Connect your GitHub repository

1. Go to [vercel.com](https://vercel.com) and sign in.
2. Click **Add New → Project**.
3. Import your GitHub repository (`fb-smart-ledger` or whatever you named it).
4. Vercel will auto-detect it as a **Next.js** project.

### 5.2 Configure build settings

Vercel should auto-detect these, but verify:

| Setting | Value |
|---|---|
| **Framework Preset** | Next.js |
| **Build Command** | `npm run build` |
| **Install Command** | `npm install` |
| **Output Directory** | *(leave blank — Next.js default)* |
| **Root Directory** | *(leave blank if your project is at the repo root)* |

### 5.3 Add environment variables

Before clicking **Deploy**, click **Environment Variables** and add each one:

| Name | Value | Environment |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL | Production, Preview, Development |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Your Supabase anon key | Production, Preview, Development |
| `SUPABASE_SERVICE_ROLE_KEY` | Your Supabase service role key | Production, Preview |
| `NEXT_PUBLIC_APP_URL` | `https://your-app.vercel.app` | Production |
| `NEXT_PUBLIC_APP_URL` | `http://localhost:3000` | Development |
| `OPENAI_API_KEY` | `sk-...` (optional) | Production, Preview |

> After the first deploy, if you add or change an environment variable in Vercel, you must **Redeploy** for the change to take effect.

### 5.4 Deploy

1. Click **Deploy**.
2. Wait for the build to complete (~2–3 minutes).
3. Vercel will give you a URL like `https://fb-smart-ledger-abc123.vercel.app`.
4. Copy this URL and update `NEXT_PUBLIC_APP_URL` in Vercel to match the final domain.
5. Also add this URL to Supabase → Authentication → URL Configuration → Redirect URLs.

### 5.5 Custom domain (optional)

1. In Vercel, go to your project → **Settings → Domains**.
2. Add your custom domain (e.g. `app.fbsmartledger.com`).
3. Follow the DNS instructions from Vercel.
4. Update `NEXT_PUBLIC_APP_URL` to your custom domain.
5. Update Supabase Redirect URLs to include your custom domain.

---

## 6. AI / Invoice Extraction Setup

### How it works

The invoice scanner has three modes:

| Mode | When active | What happens |
|---|---|---|
| **Mock mode** | No API key set | Returns realistic sample data after a short delay. Full UI flow works — upload, review, save all function normally. |
| **OpenAI GPT-4o** | `OPENAI_API_KEY` is set | Sends the invoice image to OpenAI Vision API for real extraction. |
| **Anthropic Claude** | Requires code change | Available but not enabled by default. See `lib/ai/invoice-extractor.ts`. |

### Enabling real AI extraction (OpenAI)

1. Get an API key from [platform.openai.com/api-keys](https://platform.openai.com/api-keys).
2. Add `OPENAI_API_KEY=sk-...` to your Vercel environment variables.
3. Redeploy.

### What happens if the API key is missing

- The app detects no key is configured and silently falls back to mock mode.
- No error is shown to the user during mock extraction.
- The mock returns a realistic Malaysian kopitiam invoice so the save/review flow can be tested.

### Testing the invoice scanner

**With mock mode (no API key):**
1. Go to **Invoice Scanner** in the app.
2. Upload any JPG, PNG, or PDF file.
3. The app will show a "scanning" animation for ~2 seconds.
4. A pre-filled extraction result appears with sample data.
5. Review the result, adjust the category and supplier if needed.
6. Click **Save as Expense** — the invoice is saved and appears in Expenses.

**With real AI (OpenAI key set):**
1. Same steps as above — use a real supplier invoice image.
2. The app calls `/api/invoice-extract` which forwards to OpenAI.
3. Extracted fields (supplier name, date, line items, total) are populated from the real invoice.

---

## 7. Post-Deployment Testing Checklist

Run through all of these after deploying to confirm the app is fully functional.

### Authentication

- [ ] Register a new account with email and password
- [ ] Confirm the verification email arrives (if email confirmation is enabled in Supabase)
- [ ] Log in with the registered account
- [ ] Log out and log back in

### Onboarding

- [ ] After first login, the onboarding flow appears
- [ ] Enter business name, type, and language preference
- [ ] Complete onboarding — dashboard loads correctly
- [ ] Log out and back in — onboarding does NOT appear again

### Daily Sales

- [ ] Add a daily sales entry (enter revenue and channel breakdown)
- [ ] The new entry appears in the sales table
- [ ] Edit the entry — changes are saved correctly
- [ ] Delete the entry — entry is removed from the list
- [ ] Switch to a previous month — correct entries appear

### Expenses

- [ ] Add an expense (select category, enter amount, choose payment method)
- [ ] The expense appears in the list with the correct category badge
- [ ] Edit the expense — changes are saved
- [ ] Delete the expense — entry is removed
- [ ] Attach a receipt image to an expense (optional)
- [ ] Export expenses as CSV — file downloads correctly

### Suppliers

- [ ] Add a new supplier (name, category, contact)
- [ ] Supplier appears in the directory
- [ ] Edit the supplier
- [ ] Delete the supplier
- [ ] Supplier spending analytics update when invoices are added

### Invoice Scanner

- [ ] Upload a JPG or PNG file
- [ ] Scanning animation appears
- [ ] Extraction result is shown (mock or real AI)
- [ ] Review and adjust the extracted data
- [ ] Click **Save as Expense** — invoice is saved and linked to expense
- [ ] Invoice appears in the scan history list

### Dashboard

- [ ] After adding sales and expenses, the dashboard KPI cards update
- [ ] Today's sales card shows the correct figure
- [ ] Month-to-date revenue is accurate
- [ ] Food cost percentage is calculated correctly
- [ ] Gross profit and net profit cards are visible (Owner/Manager role)
- [ ] Charts (Sales vs Expenses bar chart, expense category donut) render correctly
- [ ] Recent transactions list shows the latest entries

### P&L Report

- [ ] Go to P&L Report → select the current month → click Generate
- [ ] Revenue, COGS, operating expenses, and net profit are shown
- [ ] Export PDF — the PDF file downloads and opens correctly
- [ ] Export CSV — the CSV file downloads with correct data

### Language Switch

- [ ] Switch to Simplified Chinese (简体中文) — all labels change immediately
- [ ] Switch back to English — labels restore
- [ ] Language preference is remembered after logout and login

### Role Permissions (single-owner mode)

- [ ] As Owner: all pages and buttons are accessible
- [ ] Settings page is accessible and changes can be saved
- [ ] The role badge in the sidebar shows "Owner"

---

## 8. Current Limitations

### Single-owner mode

The current version is designed for **one owner per business**. Every registered user is automatically assigned the `owner` role with full access to all features.

### Team / Staff Management — Planned for Phase 4

Role and permission infrastructure is fully built into the codebase:
- Roles defined: Owner, Manager, Staff, Accountant
- Permission map controls what each role can see and do
- UI guards are in place on all pages (buttons hide, pages block access)

**However, staff account creation is not included yet.** You cannot currently invite a team member or assign a non-owner role through the app. This must be done manually via Supabase Studio:

1. Find the user's row in the `profiles` table.
2. Change the `role` column value to `manager`, `staff`, or `accountant`.
3. The user's app experience will update immediately on next page load.

Full team management UI (invite by email, assign roles, remove members) is planned for **Phase 4**.

### Mock AI extraction

Invoice extraction currently runs in mock mode unless an OpenAI API key is configured. See Section 6 for how to enable real AI extraction.

### No inventory or payroll

This is a ledger tool, not a full accounting system. Inventory tracking, recipe costing, payroll, SST/GST filing, and POS integration are all out of scope for the current version.

---

## 9. Common Errors and Fixes

### "NEXT_PUBLIC_SUPABASE_URL is not defined" / blank white screen

**Cause:** Environment variables are missing or not loaded.

**Fix:**
1. Confirm `.env.local` exists and has the correct values (local dev).
2. Confirm Vercel environment variables are set and you have **redeployed** since adding them.
3. Variable names must match exactly — `NEXT_PUBLIC_SUPABASE_URL`, not `SUPABASE_URL`.

---

### "new row violates row-level security policy"

**Cause:** RLS is enabled but the insert is being blocked because `user_id` or `business_id` does not match the logged-in user.

**Fix:**
1. Make sure the user is logged in before inserting data.
2. Check that the insert includes the correct `user_id` (from `auth.uid()`) and `business_id`.
3. In Supabase → Table Editor, verify the RLS policies on that table look correct.
4. As a temporary debug step, you can disable RLS on the table in Supabase Studio — **re-enable it before going live**.

---

### "StorageApiError: The resource already exists" / upload fails

**Cause:** A file with the same path already exists in the bucket, or the bucket does not exist.

**Fix:**
1. Confirm both buckets exist: `invoice-files` and `expense-attachments`.
2. Confirm the storage policies are applied (Section 3.5).
3. If a file path collision occurs, the app generates a unique path using `userId/timestamp-filename` — this should not repeat. If it does, check system clock skew.

---

### Build fails with TypeScript errors

**Cause:** A type mismatch was introduced, or a new translation key was added to English but not Simplified Chinese.

**Fix:**
1. Run `npx tsc --noEmit` locally to see the exact error.
2. If it is a missing translation key: add the key to both `en` and `zhCN` in `lib/i18n/translations.ts`.
3. Never use `any` types — TypeScript strict mode is enforced.

---

### "OPENAI_API_KEY is not set" / invoices always show mock data

**Cause:** The API key is missing or not loaded by the server.

**Fix:**
1. Add `OPENAI_API_KEY` to Vercel environment variables (not `NEXT_PUBLIC_`).
2. Redeploy after adding the key — Vercel does not hot-reload env vars.
3. The fallback to mock is intentional and safe — if you want to confirm the key is being read, add a temporary `console.log(!!process.env.OPENAI_API_KEY)` in the API route.

---

### Auth redirect loop / "Unable to exchange code for session"

**Cause:** The `NEXT_PUBLIC_APP_URL` does not match the URL Supabase is redirecting to, or the redirect URL was not added to Supabase's allowed list.

**Fix:**
1. In Supabase → Authentication → URL Configuration, add your exact production URL to **Redirect URLs**:
   ```
   https://your-app.vercel.app/**
   ```
2. Make sure `NEXT_PUBLIC_APP_URL` in Vercel matches the URL your app is served at (no trailing slash).
3. If using a custom domain, add both the Vercel `.vercel.app` URL and your custom domain to the allow list.

---

### Vercel environment variable not loaded / shows old value

**Cause:** Vercel caches a build snapshot — new env vars only take effect after a redeploy.

**Fix:**
1. Go to Vercel → your project → **Deployments**.
2. Click the **three-dot menu** on the latest deployment → **Redeploy**.
3. Confirm **"Use existing build cache"** is **unchecked** if the issue persists.

---

*Last updated: Phase 3 Step 6 — Single-owner MVP*
