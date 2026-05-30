-- ============================================================
-- Migration: Add platform commission columns to daily_sales
-- Run in Supabase SQL Editor or via: supabase db push
-- ============================================================
--
-- NULL  = commission not entered by the user yet
--         → the app displays an estimated value from standard rates
--           (GrabFood 30%, Foodpanda 30%, ShopeeFood 25%)
-- value = confirmed actual commission from the platform's monthly statement
--

ALTER TABLE public.daily_sales
  ADD COLUMN IF NOT EXISTS grabfood_commission   numeric(12,2)
    CHECK (grabfood_commission   >= 0),
  ADD COLUMN IF NOT EXISTS foodpanda_commission  numeric(12,2)
    CHECK (foodpanda_commission  >= 0),
  ADD COLUMN IF NOT EXISTS shopeefood_commission numeric(12,2)
    CHECK (shopeefood_commission >= 0);

-- ── Comments for clarity ──────────────────────────────────────────────────────

COMMENT ON COLUMN public.daily_sales.grabfood_commission
  IS 'Actual GrabFood commission this day (NULL = not entered, app estimates at 30%)';

COMMENT ON COLUMN public.daily_sales.foodpanda_commission
  IS 'Actual Foodpanda commission this day (NULL = not entered, app estimates at 30%)';

COMMENT ON COLUMN public.daily_sales.shopeefood_commission
  IS 'Actual ShopeeFood commission this day (NULL = not entered, app estimates at 25%)';
