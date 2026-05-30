-- ============================================================
-- F&B Smart Ledger — Supabase PostgreSQL Schema v2
-- Run in Supabase SQL Editor or via: supabase db push
-- ============================================================

-- ─── Extensions ──────────────────────────────────────────────────────────────

create extension if not exists "uuid-ossp";

-- ─── updated_at trigger function ─────────────────────────────────────────────
-- Shared by all tables that carry an updated_at column.

create or replace function public.handle_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ─── 1. profiles ─────────────────────────────────────────────────────────────
-- One row per authenticated user. Auto-created on sign-up.

create table public.profiles (
  id                  uuid primary key references auth.users(id) on delete cascade,
  full_name           text,
  email               text,
  preferred_language  text not null default 'en'
                        check (preferred_language in ('en', 'zh-CN')),
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "user reads own profile"
  on public.profiles for select using (id = auth.uid());

create policy "user updates own profile"
  on public.profiles for update using (id = auth.uid());

-- Auto-create profile row on every new sign-up
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name, email)
  values (
    new.id,
    new.raw_user_meta_data->>'full_name',
    new.email
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

create trigger profiles_updated_at
  before update on public.profiles
  for each row execute procedure public.handle_updated_at();

-- ─── 2. businesses ───────────────────────────────────────────────────────────
-- A user may own more than one business (multi-business support ready).
-- All downstream tables join on business_id and also carry user_id for fast
-- RLS lookups without an extra join.

create table public.businesses (
  id                  uuid primary key default uuid_generate_v4(),
  user_id             uuid not null references auth.users(id) on delete cascade,
  business_name       text not null,
  business_type       text not null check (business_type in (
                        'restaurant', 'cafe', 'bakery',
                        'cloud_kitchen', 'food_stall', 'catering', 'other')),
  currency            text not null default 'MYR',
  preferred_language  text not null default 'en'
                        check (preferred_language in ('en', 'zh-CN')),
  logo_url            text,
  address             text,
  phone               text,
  deleted_at          timestamptz,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

alter table public.businesses enable row level security;

create policy "user manages own businesses"
  on public.businesses for all using (user_id = auth.uid());

create trigger businesses_updated_at
  before update on public.businesses
  for each row execute procedure public.handle_updated_at();

-- ─── 3. daily_sales ──────────────────────────────────────────────────────────
-- One row per business per calendar day.
-- Revenue split by channel + payment method split stored side-by-side.
-- Application layer enforces: sum(channels) = sum(payments) = total.

create table public.daily_sales (
  id                uuid primary key default uuid_generate_v4(),
  business_id       uuid not null references public.businesses(id) on delete cascade,
  user_id           uuid not null references auth.users(id) on delete cascade,
  sale_date         date not null,

  -- Revenue by sales channel
  dine_in_sales     numeric(12,2) not null default 0 check (dine_in_sales     >= 0),
  takeaway_sales    numeric(12,2) not null default 0 check (takeaway_sales    >= 0),
  grabfood_sales    numeric(12,2) not null default 0 check (grabfood_sales    >= 0),
  foodpanda_sales   numeric(12,2) not null default 0 check (foodpanda_sales   >= 0),
  shopeefood_sales  numeric(12,2) not null default 0 check (shopeefood_sales  >= 0),
  catering_sales    numeric(12,2) not null default 0 check (catering_sales    >= 0),
  other_sales       numeric(12,2) not null default 0 check (other_sales       >= 0),

  -- Platform commission (NULL = not entered, app estimates from standard rates)
  -- GrabFood/Foodpanda typically charge ~30%, ShopeeFood ~25%
  grabfood_commission   numeric(12,2) check (grabfood_commission   >= 0),
  foodpanda_commission  numeric(12,2) check (foodpanda_commission  >= 0),
  shopeefood_commission numeric(12,2) check (shopeefood_commission >= 0),

  -- Payment method breakdown (must sum to same total as channels)
  cash_payment      numeric(12,2) not null default 0 check (cash_payment      >= 0),
  card_payment      numeric(12,2) not null default 0 check (card_payment      >= 0),
  ewallet_payment   numeric(12,2) not null default 0 check (ewallet_payment   >= 0),
  other_payment     numeric(12,2) not null default 0 check (other_payment     >= 0),

  notes             text,
  deleted_at        timestamptz,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

-- One entry per business per day (soft-delete aware)
create unique index daily_sales_business_date_uniq
  on public.daily_sales (business_id, sale_date)
  where deleted_at is null;

alter table public.daily_sales enable row level security;

create policy "user manages own daily_sales"
  on public.daily_sales for all using (user_id = auth.uid());

create trigger daily_sales_updated_at
  before update on public.daily_sales
  for each row execute procedure public.handle_updated_at();

-- ─── 4. suppliers ────────────────────────────────────────────────────────────

create table public.suppliers (
  id              uuid primary key default uuid_generate_v4(),
  business_id     uuid not null references public.businesses(id) on delete cascade,
  user_id         uuid not null references auth.users(id) on delete cascade,
  name            text not null,
  category        text not null check (category in (
                    'food', 'seafood', 'meat', 'vegetables',
                    'packaging', 'beverages', 'cleaning', 'others')),
  contact_person  text,
  phone           text,
  email           text,
  notes           text,
  deleted_at      timestamptz,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

alter table public.suppliers enable row level security;

create policy "user manages own suppliers"
  on public.suppliers for all using (user_id = auth.uid());

create trigger suppliers_updated_at
  before update on public.suppliers
  for each row execute procedure public.handle_updated_at();

-- ─── 5. expense_categories ───────────────────────────────────────────────────
-- Pre-seeded per business on creation. User can add custom ones.

create table public.expense_categories (
  id          uuid primary key default uuid_generate_v4(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  user_id     uuid not null references auth.users(id) on delete cascade,
  name        text not null,
  -- type maps to the front-end ExpenseCategoryKind union
  type        text not null check (type in (
                -- Food cost categories
                'meat', 'seafood', 'vegetables', 'dry_goods', 'beverages',
                'packaging', 'sauce_seasoning',
                -- Operating categories
                'rent', 'salaries', 'utilities', 'marketing',
                'repairs', 'cleaning', 'pos_software',
                'delivery_commission', 'others')),
  created_at  timestamptz not null default now()
);

alter table public.expense_categories enable row level security;

create policy "user manages own expense_categories"
  on public.expense_categories for all using (user_id = auth.uid());

-- ─── 6. expenses ─────────────────────────────────────────────────────────────

create table public.expenses (
  id              uuid primary key default uuid_generate_v4(),
  business_id     uuid not null references public.businesses(id) on delete cascade,
  user_id         uuid not null references auth.users(id) on delete cascade,
  supplier_id     uuid references public.suppliers(id) on delete set null,
  category_id     uuid not null references public.expense_categories(id),
  expense_date    date not null,
  amount          numeric(12,2) not null check (amount >= 0),
  payment_method  text check (payment_method in ('cash', 'card', 'bank_transfer', 'ewallet')),
  description     text,
  attachment_url  text,
  -- 'manual' = typed in by user; 'invoice_scan' = created from a confirmed invoice
  source          text not null default 'manual'
                    check (source in ('manual', 'invoice_scan')),
  deleted_at      timestamptz,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

alter table public.expenses enable row level security;

create policy "user manages own expenses"
  on public.expenses for all using (user_id = auth.uid());

create trigger expenses_updated_at
  before update on public.expenses
  for each row execute procedure public.handle_updated_at();

-- ─── 7. invoices ─────────────────────────────────────────────────────────────

create table public.invoices (
  id                uuid primary key default uuid_generate_v4(),
  business_id       uuid not null references public.businesses(id) on delete cascade,
  user_id           uuid not null references auth.users(id) on delete cascade,
  supplier_id       uuid references public.suppliers(id) on delete set null,
  invoice_number    text,
  invoice_date      date not null,
  total_amount      numeric(12,2) not null check (total_amount >= 0),
  tax_amount        numeric(12,2) not null default 0 check (tax_amount >= 0),
  file_url          text,                   -- Supabase Storage path
  ai_extracted_json jsonb,                  -- raw LLM/OCR output, kept for audit
  confidence_score  numeric(4,3)            -- 0.000 – 1.000
                      check (confidence_score between 0 and 1),
  status            text not null default 'processing'
                      check (status in ('processing', 'pending_review', 'confirmed')),
  deleted_at        timestamptz,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

alter table public.invoices enable row level security;

create policy "user manages own invoices"
  on public.invoices for all using (user_id = auth.uid());

create trigger invoices_updated_at
  before update on public.invoices
  for each row execute procedure public.handle_updated_at();

-- ─── 8. invoice_items ────────────────────────────────────────────────────────

create table public.invoice_items (
  id                  uuid primary key default uuid_generate_v4(),
  invoice_id          uuid not null references public.invoices(id) on delete cascade,
  item_name           text not null,
  quantity            numeric(10,3),
  unit_price          numeric(12,2),
  amount              numeric(12,2) not null check (amount >= 0),
  suggested_category  text check (suggested_category in (
                        'meat', 'seafood', 'vegetables', 'dry_goods', 'beverages',
                        'packaging', 'sauce_seasoning', 'others')),
  created_at          timestamptz not null default now()
);

alter table public.invoice_items enable row level security;

-- RLS via parent invoice's user_id — no extra join needed thanks to the subquery
create policy "user manages own invoice_items"
  on public.invoice_items for all
  using (
    invoice_id in (
      select id from public.invoices where user_id = auth.uid()
    )
  );

-- ─── 9. pnl_reports ──────────────────────────────────────────────────────────
-- One cached report per business per month.
-- Regenerated on demand; ai_summary stores the AI-written paragraph.

create table public.pnl_reports (
  id                  uuid primary key default uuid_generate_v4(),
  business_id         uuid not null references public.businesses(id) on delete cascade,
  user_id             uuid not null references auth.users(id) on delete cascade,
  -- Always the 1st of the month, e.g. '2026-05-01'
  report_month        date not null,
  total_revenue       numeric(14,2) not null default 0,
  total_cogs          numeric(14,2) not null default 0,
  gross_profit        numeric(14,2) not null default 0,
  gross_margin        numeric(5,2),        -- percentage, e.g. 68.00
  operating_expenses  numeric(14,2) not null default 0,
  net_profit          numeric(14,2) not null default 0,
  net_margin          numeric(5,2),        -- percentage
  ai_summary          text,                -- plain-text AI insight paragraph
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  unique (business_id, report_month)
);

alter table public.pnl_reports enable row level security;

create policy "user manages own pnl_reports"
  on public.pnl_reports for all using (user_id = auth.uid());

create trigger pnl_reports_updated_at
  before update on public.pnl_reports
  for each row execute procedure public.handle_updated_at();

-- ─── Performance indexes ──────────────────────────────────────────────────────

create index on public.daily_sales       (business_id, sale_date      desc);
create index on public.daily_sales       (user_id);
create index on public.suppliers         (business_id);
create index on public.suppliers         (user_id);
create index on public.expenses          (business_id, expense_date   desc);
create index on public.expenses          (user_id);
create index on public.expenses          (category_id);
create index on public.expenses          (supplier_id);
create index on public.invoices          (business_id, invoice_date   desc);
create index on public.invoices          (user_id);
create index on public.invoices          (supplier_id);
create index on public.invoices          (status);
create index on public.invoice_items     (invoice_id);
create index on public.pnl_reports       (business_id, report_month   desc);
create index on public.pnl_reports       (user_id);

-- ─── Useful views ─────────────────────────────────────────────────────────────

-- Monthly revenue aggregated from daily_sales
create or replace view public.v_monthly_revenue as
select
  business_id,
  user_id,
  date_trunc('month', sale_date)::date                             as month,
  sum(dine_in_sales + takeaway_sales + grabfood_sales
      + foodpanda_sales + shopeefood_sales + catering_sales
      + other_sales)                                               as total_revenue,
  count(*)                                                         as days_logged
from public.daily_sales
where deleted_at is null
group by 1, 2, 3;

-- COGS by food category from confirmed invoice items
create or replace view public.v_cogs_by_category as
select
  inv.business_id,
  inv.user_id,
  date_trunc('month', inv.invoice_date)::date                      as month,
  ii.suggested_category                                            as category,
  sum(ii.amount)                                                   as total_amount
from public.invoices inv
join public.invoice_items ii on ii.invoice_id = inv.id
where inv.status    = 'confirmed'
  and inv.deleted_at is null
group by 1, 2, 3, 4;

-- Operating expenses by category per month
create or replace view public.v_opex_by_category as
select
  e.business_id,
  e.user_id,
  date_trunc('month', e.expense_date)::date                        as month,
  ec.type                                                          as category,
  sum(e.amount)                                                    as total_amount
from public.expenses e
join public.expense_categories ec on ec.id = e.category_id
where e.deleted_at is null
group by 1, 2, 3, 4;

-- ─── Supabase Storage buckets ────────────────────────────────────────────────
-- Create these in the Supabase dashboard (Storage → New bucket):
--
--   Name: invoice-files        Access: Private   Max size: 10 MB
--   Name: expense-attachments  Access: Private   Max size: 10 MB
--
--   Allowed MIME types: image/jpeg, image/png, image/webp, application/pdf
--
-- Storage RLS (add via dashboard → Storage → Policies):
--   Policy template: "Give users access to only their own top-level folder"
--   Folder structure: {user_id}/{filename}
--   The user_id prefix is enforced by the upload helper in lib/supabase/.
