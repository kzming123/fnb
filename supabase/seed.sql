-- ============================================================
-- F&B Smart Ledger — Demo Seed Data v2
-- ============================================================
-- How to use:
--   1. Apply schema.sql first.
--   2. Sign up / create one user in Supabase Auth.
--   3. Copy that user's UUID from Authentication → Users.
--   4. Do a find-and-replace in this file:
--        DEMO_USER_UUID  →  your real auth.users UUID
--        DEMO_BIZ_UUID   →  any fresh UUID (e.g. from gen_random_uuid())
--   5. Run the whole file in the SQL Editor.
-- ============================================================

-- ─── Placeholder UUIDs (replace before running) ───────────────────────────────
-- DEMO_USER_UUID = 'aa50c907-73aa-4f99-8718-b6615d13d7fe'
-- DEMO_BIZ_UUID  = '6c777dee-8a42-4b45-845c-5242fec2ca0d'

-- ─── 1. Profile ──────────────────────────────────────────────────────────────

insert into public.profiles (id, full_name, email, preferred_language)
values (
  'aa50c907-73aa-4f99-8718-b6615d13d7fe',
  'Ahmad bin Abdullah',
  'owner@restaurantabc.my',
  'en'
)
on conflict (id) do update set
  full_name          = excluded.full_name,
  email              = excluded.email,
  preferred_language = excluded.preferred_language;

-- ─── 2. Business ─────────────────────────────────────────────────────────────

insert into public.businesses (id, user_id, business_name, business_type, currency, preferred_language, address, phone)
values (
  '6c777dee-8a42-4b45-845c-5242fec2ca0d',
  'aa50c907-73aa-4f99-8718-b6615d13d7fe',
  'Restaurant ABC',
  'restaurant',
  'MYR',
  'en',
  '12, Jalan Bukit Bintang, 55100 Kuala Lumpur',
  '+60 12-345 6789'
);

-- ─── 3. Expense categories (all 16 F&B categories) ───────────────────────────

insert into public.expense_categories (id, business_id, user_id, name, type) values
-- Food cost
('ec000001-0000-0000-0000-000000000001', '6c777dee-8a42-4b45-845c-5242fec2ca0d', 'aa50c907-73aa-4f99-8718-b6615d13d7fe', 'Meat',                'meat'),
('ec000001-0000-0000-0000-000000000002', '6c777dee-8a42-4b45-845c-5242fec2ca0d', 'aa50c907-73aa-4f99-8718-b6615d13d7fe', 'Seafood',             'seafood'),
('ec000001-0000-0000-0000-000000000003', '6c777dee-8a42-4b45-845c-5242fec2ca0d', 'aa50c907-73aa-4f99-8718-b6615d13d7fe', 'Vegetables',          'vegetables'),
('ec000001-0000-0000-0000-000000000004', '6c777dee-8a42-4b45-845c-5242fec2ca0d', 'aa50c907-73aa-4f99-8718-b6615d13d7fe', 'Dry Goods',           'dry_goods'),
('ec000001-0000-0000-0000-000000000005', '6c777dee-8a42-4b45-845c-5242fec2ca0d', 'aa50c907-73aa-4f99-8718-b6615d13d7fe', 'Beverages',           'beverages'),
('ec000001-0000-0000-0000-000000000006', '6c777dee-8a42-4b45-845c-5242fec2ca0d', 'aa50c907-73aa-4f99-8718-b6615d13d7fe', 'Packaging',           'packaging'),
('ec000001-0000-0000-0000-000000000007', '6c777dee-8a42-4b45-845c-5242fec2ca0d', 'aa50c907-73aa-4f99-8718-b6615d13d7fe', 'Sauce & Seasoning',   'sauce_seasoning'),
-- Operating
('ec000001-0000-0000-0000-000000000008', '6c777dee-8a42-4b45-845c-5242fec2ca0d', 'aa50c907-73aa-4f99-8718-b6615d13d7fe', 'Rent',                'rent'),
('ec000001-0000-0000-0000-000000000009', '6c777dee-8a42-4b45-845c-5242fec2ca0d', 'aa50c907-73aa-4f99-8718-b6615d13d7fe', 'Salaries',            'salaries'),
('ec000001-0000-0000-0000-000000000010', '6c777dee-8a42-4b45-845c-5242fec2ca0d', 'aa50c907-73aa-4f99-8718-b6615d13d7fe', 'Utilities',           'utilities'),
('ec000001-0000-0000-0000-000000000011', '6c777dee-8a42-4b45-845c-5242fec2ca0d', 'aa50c907-73aa-4f99-8718-b6615d13d7fe', 'Marketing',           'marketing'),
('ec000001-0000-0000-0000-000000000012', '6c777dee-8a42-4b45-845c-5242fec2ca0d', 'aa50c907-73aa-4f99-8718-b6615d13d7fe', 'Repairs',             'repairs'),
('ec000001-0000-0000-0000-000000000013', '6c777dee-8a42-4b45-845c-5242fec2ca0d', 'aa50c907-73aa-4f99-8718-b6615d13d7fe', 'Cleaning',            'cleaning'),
('ec000001-0000-0000-0000-000000000014', '6c777dee-8a42-4b45-845c-5242fec2ca0d', 'aa50c907-73aa-4f99-8718-b6615d13d7fe', 'POS / Software',      'pos_software'),
('ec000001-0000-0000-0000-000000000015', '6c777dee-8a42-4b45-845c-5242fec2ca0d', 'aa50c907-73aa-4f99-8718-b6615d13d7fe', 'Delivery Commission', 'delivery_commission'),
('ec000001-0000-0000-0000-000000000016', '6c777dee-8a42-4b45-845c-5242fec2ca0d', 'aa50c907-73aa-4f99-8718-b6615d13d7fe', 'Others',              'others');

-- ─── 4. Suppliers (10 suppliers) ─────────────────────────────────────────────

insert into public.suppliers (id, business_id, user_id, name, category, contact_person, phone, email, notes) values
('5c000001-0000-0000-0000-000000000001', '6c777dee-8a42-4b45-845c-5242fec2ca0d', 'aa50c907-73aa-4f99-8718-b6615d13d7fe', 'Fresh Produce Sdn Bhd',        'vegetables', 'Ah Kow',        '+60 11-2345 6789', 'orders@freshproduce.my', null),
('5c000001-0000-0000-0000-000000000002', '6c777dee-8a42-4b45-845c-5242fec2ca0d', 'aa50c907-73aa-4f99-8718-b6615d13d7fe', 'Premium Meats Trading',         'meat',       'Rahman',        '+60 12-876 5432',  'sales@premiummeats.my', null),
('5c000001-0000-0000-0000-000000000003', '6c777dee-8a42-4b45-845c-5242fec2ca0d', 'aa50c907-73aa-4f99-8718-b6615d13d7fe', 'Seafood Direct Marketing',      'seafood',    'Lim Ah Chong',  '+60 17-654 3210',  null,                    null),
('5c000001-0000-0000-0000-000000000004', '6c777dee-8a42-4b45-845c-5242fec2ca0d', 'aa50c907-73aa-4f99-8718-b6615d13d7fe', 'Pristine Dairy & Food Supply',  'food',       'Priya',         '+60 16-543 2109',  'dairy@pristine.my',     'Net-30 payment terms'),
('5c000001-0000-0000-0000-000000000005', '6c777dee-8a42-4b45-845c-5242fec2ca0d', 'aa50c907-73aa-4f99-8718-b6615d13d7fe', 'Wholesale Dry Goods Hub',       'food',       'Tan Wei Liang', '+60 13-432 1098',  'orders@wdghub.my',      null),
('5c000001-0000-0000-0000-000000000006', '6c777dee-8a42-4b45-845c-5242fec2ca0d', 'aa50c907-73aa-4f99-8718-b6615d13d7fe', 'Beverage & Drinks Co',          'beverages',  'Kumar',         '+60 14-321 0987',  'orders@bdco.my',        null),
('5c000001-0000-0000-0000-000000000007', '6c777dee-8a42-4b45-845c-5242fec2ca0d', 'aa50c907-73aa-4f99-8718-b6615d13d7fe', 'Green Pack Solutions',          'packaging',  'Michelle',      '+60 18-210 9876',  'sales@greenpacks.my',   null),
('5c000001-0000-0000-0000-000000000008', '6c777dee-8a42-4b45-845c-5242fec2ca0d', 'aa50c907-73aa-4f99-8718-b6615d13d7fe', 'Halal Certified Poultry',       'meat',       'Roslan',        '+60 19-109 8765',  null,                    'JAKIM certified — payment due end of month'),
('5c000001-0000-0000-0000-000000000009', '6c777dee-8a42-4b45-845c-5242fec2ca0d', 'aa50c907-73aa-4f99-8718-b6615d13d7fe', 'Sauce & Spice Wholesale',       'food',       'Wong Kah Wai',  '+60 12-998 7766',  null,                    'Bulk discount above RM500'),
('5c000001-0000-0000-0000-000000000010', '6c777dee-8a42-4b45-845c-5242fec2ca0d', 'aa50c907-73aa-4f99-8718-b6615d13d7fe', 'CleanPro Supply Co',            'cleaning',   'Siti Rahimah',  '+60 11-7654 3210', 'supply@cleanpro.my',    null);

-- ─── 5. Daily sales — May 2026 (31 days) ─────────────────────────────────────
-- Channels:  dine_in(45%) + takeaway(25%) + grabfood(15%) + foodpanda(10%) + catering(5%)
-- Payments:  cash(40%) + card(45%) + ewallet(15%)

insert into public.daily_sales
  (business_id, user_id, sale_date,
   dine_in_sales, takeaway_sales, grabfood_sales, foodpanda_sales, catering_sales,
   cash_payment, card_payment, ewallet_payment)
values
  ('6c777dee-8a42-4b45-845c-5242fec2ca0d','aa50c907-73aa-4f99-8718-b6615d13d7fe','2026-05-01', 1053.00,  585.00,  351.00,  234.00,  117.00,   936.00, 1053.00,  351.00),
  ('6c777dee-8a42-4b45-845c-5242fec2ca0d','aa50c907-73aa-4f99-8718-b6615d13d7fe','2026-05-02',  891.00,  495.00,  297.00,  198.00,   99.00,   792.00,  891.00,  297.00),
  ('6c777dee-8a42-4b45-845c-5242fec2ca0d','aa50c907-73aa-4f99-8718-b6615d13d7fe','2026-05-03', 1192.50,  662.50,  397.50,  265.00,  132.50,  1060.00, 1192.50,  397.50),
  ('6c777dee-8a42-4b45-845c-5242fec2ca0d','aa50c907-73aa-4f99-8718-b6615d13d7fe','2026-05-04', 1395.00,  775.00,  465.00,  310.00,  155.00,  1240.00, 1395.00,  465.00),
  ('6c777dee-8a42-4b45-845c-5242fec2ca0d','aa50c907-73aa-4f99-8718-b6615d13d7fe','2026-05-05', 1300.50,  722.50,  433.50,  289.00,  144.50,  1156.00, 1300.50,  433.50),
  ('6c777dee-8a42-4b45-845c-5242fec2ca0d','aa50c907-73aa-4f99-8718-b6615d13d7fe','2026-05-06', 1102.50,  612.50,  367.50,  245.00,  122.50,   980.00, 1102.50,  367.50),
  ('6c777dee-8a42-4b45-845c-5242fec2ca0d','aa50c907-73aa-4f99-8718-b6615d13d7fe','2026-05-07',  792.00,  440.00,  264.00,  176.00,   88.00,   704.00,  792.00,  264.00),
  ('6c777dee-8a42-4b45-845c-5242fec2ca0d','aa50c907-73aa-4f99-8718-b6615d13d7fe','2026-05-08', 1152.00,  640.00,  384.00,  256.00,  128.00,  1024.00, 1152.00,  384.00),
  ('6c777dee-8a42-4b45-845c-5242fec2ca0d','aa50c907-73aa-4f99-8718-b6615d13d7fe','2026-05-09', 1003.50,  557.50,  334.50,  223.00,  111.50,   892.00, 1003.50,  334.50),
  ('6c777dee-8a42-4b45-845c-5242fec2ca0d','aa50c907-73aa-4f99-8718-b6615d13d7fe','2026-05-10', 1300.50,  722.50,  433.50,  289.00,  144.50,  1156.00, 1300.50,  433.50),
  ('6c777dee-8a42-4b45-845c-5242fec2ca0d','aa50c907-73aa-4f99-8718-b6615d13d7fe','2026-05-11', 1503.00,  835.00,  501.00,  334.00,  167.00,  1336.00, 1503.00,  501.00),
  ('6c777dee-8a42-4b45-845c-5242fec2ca0d','aa50c907-73aa-4f99-8718-b6615d13d7fe','2026-05-12', 1228.50,  682.50,  409.50,  273.00,  136.50,  1092.00, 1228.50,  409.50),
  ('6c777dee-8a42-4b45-845c-5242fec2ca0d','aa50c907-73aa-4f99-8718-b6615d13d7fe','2026-05-13', 1201.50,  667.50,  400.50,  267.00,  133.50,  1068.00, 1201.50,  400.50),
  ('6c777dee-8a42-4b45-845c-5242fec2ca0d','aa50c907-73aa-4f99-8718-b6615d13d7fe','2026-05-14', 1237.50,  687.50,  412.50,  275.00,  137.50,  1100.00, 1237.50,  412.50),
  ('6c777dee-8a42-4b45-845c-5242fec2ca0d','aa50c907-73aa-4f99-8718-b6615d13d7fe','2026-05-15', 1350.00,  750.00,  450.00,  300.00,  150.00,  1200.00, 1350.00,  450.00),
  ('6c777dee-8a42-4b45-845c-5242fec2ca0d','aa50c907-73aa-4f99-8718-b6615d13d7fe','2026-05-16', 1053.00,  585.00,  351.00,  234.00,  117.00,   936.00, 1053.00,  351.00),
  ('6c777dee-8a42-4b45-845c-5242fec2ca0d','aa50c907-73aa-4f99-8718-b6615d13d7fe','2026-05-17', 1341.00,  745.00,  447.00,  298.00,  149.00,  1192.00, 1341.00,  447.00),
  ('6c777dee-8a42-4b45-845c-5242fec2ca0d','aa50c907-73aa-4f99-8718-b6615d13d7fe','2026-05-18', 1552.50,  862.50,  517.50,  345.00,  172.50,  1380.00, 1552.50,  517.50),
  ('6c777dee-8a42-4b45-845c-5242fec2ca0d','aa50c907-73aa-4f99-8718-b6615d13d7fe','2026-05-19', 1395.00,  775.00,  465.00,  310.00,  155.00,  1240.00, 1395.00,  465.00),
  ('6c777dee-8a42-4b45-845c-5242fec2ca0d','aa50c907-73aa-4f99-8718-b6615d13d7fe','2026-05-20', 1152.00,  640.00,  384.00,  256.00,  128.00,  1024.00, 1152.00,  384.00),
  ('6c777dee-8a42-4b45-845c-5242fec2ca0d','aa50c907-73aa-4f99-8718-b6615d13d7fe','2026-05-21', 1251.00,  695.00,  417.00,  278.00,  139.00,  1112.00, 1251.00,  417.00),
  ('6c777dee-8a42-4b45-845c-5242fec2ca0d','aa50c907-73aa-4f99-8718-b6615d13d7fe','2026-05-22', 1102.50,  612.50,  367.50,  245.00,  122.50,   980.00, 1102.50,  367.50),
  ('6c777dee-8a42-4b45-845c-5242fec2ca0d','aa50c907-73aa-4f99-8718-b6615d13d7fe','2026-05-23', 1404.00,  780.00,  468.00,  312.00,  156.00,  1248.00, 1404.00,  468.00),
  ('6c777dee-8a42-4b45-845c-5242fec2ca0d','aa50c907-73aa-4f99-8718-b6615d13d7fe','2026-05-24', 1300.50,  722.50,  433.50,  289.00,  144.50,  1156.00, 1300.50,  433.50),
  ('6c777dee-8a42-4b45-845c-5242fec2ca0d','aa50c907-73aa-4f99-8718-b6615d13d7fe','2026-05-25', 1192.50,  662.50,  397.50,  265.00,  132.50,  1060.00, 1192.50,  397.50),
  ('6c777dee-8a42-4b45-845c-5242fec2ca0d','aa50c907-73aa-4f99-8718-b6615d13d7fe','2026-05-26', 1053.00,  585.00,  351.00,  234.00,  117.00,   936.00, 1053.00,  351.00),
  ('6c777dee-8a42-4b45-845c-5242fec2ca0d','aa50c907-73aa-4f99-8718-b6615d13d7fe','2026-05-27', 1251.00,  695.00,  417.00,  278.00,  139.00,  1112.00, 1251.00,  417.00),
  ('6c777dee-8a42-4b45-845c-5242fec2ca0d','aa50c907-73aa-4f99-8718-b6615d13d7fe','2026-05-28',  891.00,  495.00,  297.00,  198.00,   99.00,   792.00,  891.00,  297.00),
  ('6c777dee-8a42-4b45-845c-5242fec2ca0d','aa50c907-73aa-4f99-8718-b6615d13d7fe','2026-05-29', 1053.00,  585.00,  351.00,  234.00,  117.00,   936.00, 1053.00,  351.00),
  ('6c777dee-8a42-4b45-845c-5242fec2ca0d','aa50c907-73aa-4f99-8718-b6615d13d7fe','2026-05-30', 1300.50,  722.50,  433.50,  289.00,  144.50,  1156.00, 1300.50,  433.50),
  ('6c777dee-8a42-4b45-845c-5242fec2ca0d','aa50c907-73aa-4f99-8718-b6615d13d7fe','2026-05-31', 1503.00,  835.00,  501.00,  334.00,  167.00,  1336.00, 1503.00,  501.00);

-- ─── 6. Invoices ─────────────────────────────────────────────────────────────

insert into public.invoices
  (id, business_id, user_id, supplier_id,
   invoice_number, invoice_date, total_amount, tax_amount, confidence_score, status)
values
  ('1b000001-0000-0000-0000-000000000001','6c777dee-8a42-4b45-845c-5242fec2ca0d','aa50c907-73aa-4f99-8718-b6615d13d7fe','5c000001-0000-0000-0000-000000000002','PMT-2026-0892','2026-05-27',1250.00, 75.00,0.92,'confirmed'),
  ('1b000001-0000-0000-0000-000000000002','6c777dee-8a42-4b45-845c-5242fec2ca0d','aa50c907-73aa-4f99-8718-b6615d13d7fe','5c000001-0000-0000-0000-000000000001','FP-2026-1145', '2026-05-26', 580.50, 34.83,0.89,'confirmed'),
  ('1b000001-0000-0000-0000-000000000003','6c777dee-8a42-4b45-845c-5242fec2ca0d','aa50c907-73aa-4f99-8718-b6615d13d7fe','5c000001-0000-0000-0000-000000000003','SDM-2026-0441','2026-05-25', 980.00, 58.80,0.95,'confirmed'),
  ('1b000001-0000-0000-0000-000000000004','6c777dee-8a42-4b45-845c-5242fec2ca0d','aa50c907-73aa-4f99-8718-b6615d13d7fe','5c000001-0000-0000-0000-000000000005','WDG-2026-0234','2026-05-22', 745.00, 44.70,0.88,'confirmed'),
  ('1b000001-0000-0000-0000-000000000005','6c777dee-8a42-4b45-845c-5242fec2ca0d','aa50c907-73aa-4f99-8718-b6615d13d7fe','5c000001-0000-0000-0000-000000000006','BDC-2026-0567','2026-05-20', 430.00, 25.80,0.77,'pending_review'),
  ('1b000001-0000-0000-0000-000000000006','6c777dee-8a42-4b45-845c-5242fec2ca0d','aa50c907-73aa-4f99-8718-b6615d13d7fe','5c000001-0000-0000-0000-000000000007','GPS-2026-0189','2026-05-18', 285.00, 17.10,0.91,'confirmed');

-- ─── 7. Invoice items ─────────────────────────────────────────────────────────

insert into public.invoice_items (invoice_id, item_name, quantity, unit_price, amount, suggested_category) values
-- PMT-2026-0892 — Premium Meats Trading
('1b000001-0000-0000-0000-000000000001','Chicken Breast (Boneless)',10,  22.00,  220.00,'meat'),
('1b000001-0000-0000-0000-000000000001','Beef Tenderloin',           3,  65.00,  195.00,'meat'),
('1b000001-0000-0000-0000-000000000001','Pork Belly',                5,  38.00,  190.00,'meat'),
('1b000001-0000-0000-0000-000000000001','Duck (whole)',               4,  45.00,  180.00,'meat'),
('1b000001-0000-0000-0000-000000000001','Lamb Shoulder',             2,  82.50,  165.00,'meat'),
('1b000001-0000-0000-0000-000000000001','Minced Pork',               5,  26.00,  130.00,'meat'),
('1b000001-0000-0000-0000-000000000001','Chicken Wings',             5,  14.00,   70.00,'meat'),
('1b000001-0000-0000-0000-000000000001','Pork Ribs',                 3,  33.33,  100.00,'meat'),
-- FP-2026-1145 — Fresh Produce
('1b000001-0000-0000-0000-000000000002','Kai Lan',                   8,   6.50,   52.00,'vegetables'),
('1b000001-0000-0000-0000-000000000002','Choy Sum',                 10,   5.50,   55.00,'vegetables'),
('1b000001-0000-0000-0000-000000000002','Tomatoes',                 15,   4.50,   67.50,'vegetables'),
('1b000001-0000-0000-0000-000000000002','Onions',                   20,   3.50,   70.00,'vegetables'),
('1b000001-0000-0000-0000-000000000002','Garlic',                    5,  12.00,   60.00,'vegetables'),
('1b000001-0000-0000-0000-000000000002','Ginger',                    3,   9.00,   27.00,'vegetables'),
('1b000001-0000-0000-0000-000000000002','Bird Eye Chili',            2,  22.00,   44.00,'vegetables'),
('1b000001-0000-0000-0000-000000000002','Beansprouts',              10,   3.50,   35.00,'vegetables'),
('1b000001-0000-0000-0000-000000000002','Spring Onion',              3,   8.00,   24.00,'vegetables'),
('1b000001-0000-0000-0000-000000000002','Coriander',                 2,  16.00,   32.00,'vegetables'),
('1b000001-0000-0000-0000-000000000002','Lady Fingers',              5,   6.50,   32.50,'vegetables'),
('1b000001-0000-0000-0000-000000000002','Brinjal',                   4,   5.00,   20.00,'vegetables'),
-- SDM-2026-0441 — Seafood Direct Marketing
('1b000001-0000-0000-0000-000000000003','Tiger Prawns',              3,  95.00,  285.00,'seafood'),
('1b000001-0000-0000-0000-000000000003','Sea Bass (whole)',           4,  65.00,  260.00,'seafood'),
('1b000001-0000-0000-0000-000000000003','Squid',                     5,  28.00,  140.00,'seafood'),
('1b000001-0000-0000-0000-000000000003','Clams',                     3,  22.00,   66.00,'seafood'),
('1b000001-0000-0000-0000-000000000003','Crab',                      2,  72.00,  144.00,'seafood'),
('1b000001-0000-0000-0000-000000000003','Fish Paste',                2,  42.50,   85.00,'seafood'),
-- WDG-2026-0234 — Wholesale Dry Goods Hub
('1b000001-0000-0000-0000-000000000004','Jasmine Rice 25kg',         1,  95.00,   95.00,'dry_goods'),
('1b000001-0000-0000-0000-000000000004','Cooking Oil 18L',           2,  82.00,  164.00,'dry_goods'),
('1b000001-0000-0000-0000-000000000004','Soy Sauce 5L',              3,  28.00,   84.00,'dry_goods'),
('1b000001-0000-0000-0000-000000000004','Oyster Sauce 5L',           2,  35.00,   70.00,'dry_goods'),
('1b000001-0000-0000-0000-000000000004','Salt 1kg x10',              1,  22.00,   22.00,'dry_goods'),
('1b000001-0000-0000-0000-000000000004','Sugar 5kg',                 4,  14.50,   58.00,'dry_goods'),
('1b000001-0000-0000-0000-000000000004','Dried Noodles 5kg',         6,  18.00,  108.00,'dry_goods'),
('1b000001-0000-0000-0000-000000000004','Sesame Oil 750ml',          4,  36.00,  144.00,'dry_goods'),
-- GPS-2026-0189 — Green Pack Solutions
('1b000001-0000-0000-0000-000000000006','Takeaway Boxes 500pcs',     2,  65.00,  130.00,'packaging'),
('1b000001-0000-0000-0000-000000000006','Paper Bags 200pcs',         3,  28.00,   84.00,'packaging'),
('1b000001-0000-0000-0000-000000000006','Plastic Cutlery Set 100pcs',3,  14.00,   42.00,'packaging'),
('1b000001-0000-0000-0000-000000000006','Cling Film Roll',           3,   9.67,   29.00,'packaging');

-- ─── 8. Expenses — May 2026 ───────────────────────────────────────────────────

insert into public.expenses
  (business_id, user_id, supplier_id, category_id,
   expense_date, amount, payment_method, description, source)
values
-- Food cost from scanned invoices
('6c777dee-8a42-4b45-845c-5242fec2ca0d','aa50c907-73aa-4f99-8718-b6615d13d7fe','5c000001-0000-0000-0000-000000000002','ec000001-0000-0000-0000-000000000001','2026-05-27',1250.00,'bank_transfer','INV PMT-2026-0892',  'invoice_scan'),
('6c777dee-8a42-4b45-845c-5242fec2ca0d','aa50c907-73aa-4f99-8718-b6615d13d7fe','5c000001-0000-0000-0000-000000000003','ec000001-0000-0000-0000-000000000002','2026-05-25', 980.00,'bank_transfer','INV SDM-2026-0441',  'invoice_scan'),
('6c777dee-8a42-4b45-845c-5242fec2ca0d','aa50c907-73aa-4f99-8718-b6615d13d7fe','5c000001-0000-0000-0000-000000000001','ec000001-0000-0000-0000-000000000003','2026-05-26', 580.50,'bank_transfer','INV FP-2026-1145',   'invoice_scan'),
('6c777dee-8a42-4b45-845c-5242fec2ca0d','aa50c907-73aa-4f99-8718-b6615d13d7fe','5c000001-0000-0000-0000-000000000005','ec000001-0000-0000-0000-000000000004','2026-05-22', 745.00,'bank_transfer','INV WDG-2026-0234',  'invoice_scan'),
('6c777dee-8a42-4b45-845c-5242fec2ca0d','aa50c907-73aa-4f99-8718-b6615d13d7fe','5c000001-0000-0000-0000-000000000006','ec000001-0000-0000-0000-000000000005','2026-05-20', 430.00,'cash',          'INV BDC-2026-0567',  'invoice_scan'),
('6c777dee-8a42-4b45-845c-5242fec2ca0d','aa50c907-73aa-4f99-8718-b6615d13d7fe','5c000001-0000-0000-0000-000000000007','ec000001-0000-0000-0000-000000000006','2026-05-18', 285.00,'bank_transfer','INV GPS-2026-0189',  'invoice_scan'),
('6c777dee-8a42-4b45-845c-5242fec2ca0d','aa50c907-73aa-4f99-8718-b6615d13d7fe','5c000001-0000-0000-0000-000000000009','ec000001-0000-0000-0000-000000000007','2026-05-15', 320.00,'cash',          'Monthly seasoning restock',   'manual'),
-- Operating expenses
('6c777dee-8a42-4b45-845c-5242fec2ca0d','aa50c907-73aa-4f99-8718-b6615d13d7fe',null,'ec000001-0000-0000-0000-000000000008','2026-05-01',4500.00,'bank_transfer','May 2026 rent',                  'manual'),
('6c777dee-8a42-4b45-845c-5242fec2ca0d','aa50c907-73aa-4f99-8718-b6615d13d7fe',null,'ec000001-0000-0000-0000-000000000009','2026-05-31',9800.00,'bank_transfer','Staff payroll — 4 pax May 2026', 'manual'),
('6c777dee-8a42-4b45-845c-5242fec2ca0d','aa50c907-73aa-4f99-8718-b6615d13d7fe',null,'ec000001-0000-0000-0000-000000000010','2026-05-05', 820.00,'ewallet',       'TNB electricity (April)',        'manual'),
('6c777dee-8a42-4b45-845c-5242fec2ca0d','aa50c907-73aa-4f99-8718-b6615d13d7fe',null,'ec000001-0000-0000-0000-000000000010','2026-05-06', 185.00,'ewallet',       'Air Selangor water (April)',     'manual'),
('6c777dee-8a42-4b45-845c-5242fec2ca0d','aa50c907-73aa-4f99-8718-b6615d13d7fe',null,'ec000001-0000-0000-0000-000000000011','2026-05-10', 350.00,'card',          'Meta Ads — Raya campaign',       'manual'),
('6c777dee-8a42-4b45-845c-5242fec2ca0d','aa50c907-73aa-4f99-8718-b6615d13d7fe',null,'ec000001-0000-0000-0000-000000000011','2026-05-18', 200.00,'card',          'Google Ads promotion',           'manual'),
('6c777dee-8a42-4b45-845c-5242fec2ca0d','aa50c907-73aa-4f99-8718-b6615d13d7fe',null,'ec000001-0000-0000-0000-000000000012','2026-05-14', 230.00,'cash',          'Kitchen drain repair',           'manual'),
('6c777dee-8a42-4b45-845c-5242fec2ca0d','aa50c907-73aa-4f99-8718-b6615d13d7fe',null,'ec000001-0000-0000-0000-000000000012','2026-05-22', 450.00,'cash',          'Commercial fridge service',      'manual'),
('6c777dee-8a42-4b45-845c-5242fec2ca0d','aa50c907-73aa-4f99-8718-b6615d13d7fe','5c000001-0000-0000-0000-000000000010','ec000001-0000-0000-0000-000000000013','2026-05-08', 180.00,'cash',          'Monthly deep cleaning',          'manual'),
('6c777dee-8a42-4b45-845c-5242fec2ca0d','aa50c907-73aa-4f99-8718-b6615d13d7fe',null,'ec000001-0000-0000-0000-000000000014','2026-05-01', 150.00,'card',          'Slurp POS monthly subscription', 'manual'),
('6c777dee-8a42-4b45-845c-5242fec2ca0d','aa50c907-73aa-4f99-8718-b6615d13d7fe',null,'ec000001-0000-0000-0000-000000000015','2026-05-31',1850.00,'bank_transfer', 'GrabFood May 2026 commission',   'manual');

-- ─── 9. P&L Report — May 2026 ─────────────────────────────────────────────────

insert into public.pnl_reports
  (business_id, user_id, report_month,
   total_revenue, total_cogs, gross_profit, gross_margin,
   operating_expenses, net_profit, net_margin, ai_summary)
values (
  '6c777dee-8a42-4b45-845c-5242fec2ca0d',
  'aa50c907-73aa-4f99-8718-b6615d13d7fe',
  '2026-05-01',
  75890.00,
  24285.50,
  51604.50,
  68.00,
  18715.00,
  32889.50,
  43.34,
  'This month your revenue is RM75,890. Food cost is 32.0%, which is within a healthy range for a restaurant. Net profit margin is 43.3%. Your biggest food cost category is Meat (RM8,640). Seafood spending (RM4,900) rose compared to last month — worth monitoring.'
);
