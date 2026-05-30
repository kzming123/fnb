# CLIENT_DEMO_SCRIPT.md — F&B Smart Ledger

**Document type:** Live client demo script / presenter cheat-sheet (Phase 3 · Step 10)
**Audience:** Malaysian F&B owners — cafe, restaurant, kopitiam, bakery, cloud kitchen, stall, catering
**Duration:** ~12–15 minutes
**Tone:** Simple, warm, professional. No tech jargon. Talk about *money and time saved*, not software.

---

## ⚙️ Before you start (pre-flight checklist)

> **Do this 10 minutes before the client arrives. A smooth demo = a closed deal.**

- [ ] **Use a PREPARED REAL ACCOUNT** (not the "Try Demo" button) so you can actually add sales, scan invoices, and save — and pre-load it with **~10–14 days of sales + 3–4 suppliers + a few expenses** so the Dashboard and P&L already look alive.
- [ ] Set **`USE_MOCK_AI=true`** so invoice scanning is instant, free, and predictable. The mock always returns this invoice:
  > **Supplier:** ABC Frozen Food Sdn Bhd · **Invoice:** INV-2026-0522 · **Total:** RM 1,280.50
  > Items: Frozen Prawn, Chicken Breast, Cooking Oil, Packaging Box, Delivery (auto-categorised) · **Confidence 92%**
  > Have a printed copy or image of any invoice ready to "upload" — the result is the same.
- [ ] Start in **English**, with the **Dashboard** open, language toggle ready.
- [ ] Phone + laptop both logged in (show it's mobile-first).
- [ ] Stable internet. Close other tabs. Full screen.

> 💡 **Optional instant-wow opener:** the **"Try Demo — no sign-up"** button on the login page loads a fully-populated Kopitiam dashboard in one click — great for the first 30 seconds. But it is **view-only** (you can't add/edit/scan-save in it), so switch to your prepared real account before Step 6.

---

## 🎬 The demo (18 steps)

Each step shows: **Page → Click → Say (EN / 中文) → Pain point → Value → On-screen result.**

---

### Step 1 — Opening pitch
- **Page:** Login screen (or your logo / a slide).
- **Click:** Nothing yet — just hold eye contact.
- **Say (EN):** *"You run a great F&B business. But let me ask — at the end of a busy month, do you actually know how much profit you made? Not sales — profit. Most owners don't, until it's too late. I built something that shows you, in under a minute a day."*
- **Say (中文):** *"您的生意做得很好。但我想问一句——忙完一个月,您真的知道自己赚了多少钱吗?不是营业额,是利润。很多老板都不清楚,等发现时已经太迟了。我做了一个工具,每天花不到一分钟,就能让您看得清清楚楚。"*
- **Pain point:** Owners track sales, not profit.
- **Value:** Frames the product as *profit clarity*, not "software."
- **Result:** Client leans in.

---

### Step 2 — Explain the pain point
- **Page:** Still login / a slide. (Optional: hold up your phone showing a messy WhatsApp/photos folder.)
- **Click:** Nothing.
- **Say (EN):** *"Right now your records are everywhere — invoices in a drawer, sales in a notebook, GrabFood in one app, Foodpanda in another, and Excel you never have time to update. When you want to know your real food cost, you can't. This puts all of it in one place — and does the typing for you."*
- **Say (中文):** *"现在您的记录到处都是——发票塞在抽屉里,营业额写在本子上,GrabFood 一个 app,Foodpanda 另一个,Excel 又没空更新。想知道真正的食材成本时,根本算不出来。这个工具把所有东西放在一起,还帮您自动输入。"*
- **Pain point:** Scattered records, manual work, no visibility.
- **Value:** "One place + does the typing for you."
- **Result:** Client recognises their own daily mess.

---

### Step 3 — Login
- **Page:** `/login`
- **Click:** Enter your prepared account email/password → **Sign In**.
- **Say (EN):** *"Simple login — just email and password. It works on your phone in the kitchen, or your laptop at home. Let me sign in to a real shop's account."*
- **Say (中文):** *"登录很简单,邮箱加密码就行。在厨房用手机、在家用电脑都可以。我登录一个真实店铺的账号给您看。"*
- **Pain point:** Owners fear "complicated systems."
- **Value:** Low friction, mobile-ready.
- **Result:** Lands on the **Dashboard**.

---

### Step 4 — Dashboard overview
- **Page:** `/dashboard`
- **Click:** Point (don't click) at the hero banner, then the KPI cards.
- **Say (EN):** *"This is your whole business on one screen. Today's sales here. This month's sales here. And the number every owner wants — your **food cost percentage**, your **gross profit**, and your **net profit**. Green is good, red means look closer. No accounting words — just money in, money out, profit."*
- **Say (中文):** *"这是您整个生意的一目了然。今天的营业额在这里,这个月的在这里。还有每个老板最关心的数字——**食材成本率**、**毛利润** 和 **净利润**。绿色是好的,红色就要注意了。没有会计术语,就是:收入、开销、利润。"*
- **Pain point:** Owners can't see performance at a glance.
- **Value:** Instant, jargon-free clarity. Numbers are the hero.
- **Result:** Big tabular numbers, trend chips, charts, "AI Business Insight" panel.

---

### Step 5 — Switch language to Simplified Chinese
- **Page:** `/dashboard` (or `/settings`)
- **Click:** Language toggle → **简体中文** (or open Settings → Language).
- **Say (EN):** *"And if you, your spouse, or your cashier prefer Chinese — one tap, the whole app changes instantly. English and 简体中文, fully built in. Numbers stay as RM."*
- **Say (中文):** *"如果您、您的太太或收银员习惯看中文——点一下,整个系统马上变成中文。中英文都完整支持,金额一律用 RM 显示。"*
- **Pain point:** Bilingual households/staff; English-only tools get abandoned.
- **Value:** Real Malaysian bilingual support, instant switch.
- **Result:** Entire UI flips to 简体中文 with no reload.

---

### Step 6 — Add daily sales
- **Page:** `/daily-sales`
- **Click:** **+ Add Entry** → fill Dine-in, Takeaway, GrabFood, Foodpanda → fill Cash/Card/E-wallet → **Save**.
- **Say (EN):** *"Closing time. The owner enters today's takings by channel — dine-in, takeaway, GrabFood, Foodpanda. Watch the totals add up live. Under a minute, done. Notice it won't let you save a negative or empty amount — it keeps your records clean."*
- **Say (中文):** *"打烊了,老板按渠道输入今天的收入——堂食、外带、GrabFood、Foodpanda,总额会自动相加。不到一分钟就搞定。而且它不让您输入负数或空白,帮您把账记得干干净净。"*
- **Pain point:** End-of-day logging is tedious and error-prone.
- **Value:** <60-second logging, channel split, friendly validation.
- **Result:** New row in the table; toast *"Sales for {date} saved — RM …"*; Dashboard/P&L will reflect it.

---

### Step 7 — Edit daily sales
- **Page:** `/daily-sales`
- **Click:** Tap a row → **Edit (pencil)** → change a number → **Update**. (Optionally show **Delete** → confirmation dialog.)
- **Say (EN):** *"Made a mistake? Just tap the row and fix it. Delete asks you to confirm first — nothing disappears by accident. Everything updates everywhere automatically."*
- **Say (中文):** *"输错了?点一下那一行就能改。删除会先跟您确认,绝不会不小心删掉。改完之后,所有页面会自动同步更新。"*
- **Pain point:** Fear of messing up records; no easy undo.
- **Value:** Forgiving editing, delete confirmation, auto-sync.
- **Result:** Row updates instantly; toast confirms.

---

### Step 8 — Add a supplier
- **Page:** `/suppliers`
- **Click:** **+ Add Supplier** → name (e.g. "Premium Meats Trading"), category (Meat), contact → **Save**.
- **Say (EN):** *"Let's add a supplier — your meat guy, your vegetable guy, your coffee bean supplier. Once they're here, the app tracks how much you spend with each one."*
- **Say (中文):** *"我们来加一个供应商——卖肉的、卖菜的、卖咖啡豆的。加进来之后,系统会帮您统计每一家花了多少钱。"*
- **Pain point:** Owners don't know who they spend the most with.
- **Value:** Supplier directory feeds spend analytics.
- **Result:** Supplier appears in the list and in the Expenses dropdown.

---

### Step 9 — Add an expense linked to the supplier
- **Page:** `/expenses`
- **Click:** **+ Add Expense** → pick **Supplier** from dropdown → **Category** (e.g. Meat = food cost; or Rent = operating) → amount → **Save**.
- **Say (EN):** *"Now an expense. Pick the supplier from the list. Notice categories are split into two groups: **Food Cost** — your ingredients — and **Operating Expenses** like rent, salaries, utilities. That split is exactly what gives you a real food cost percentage later."*
- **Say (中文):** *"现在记一笔开销。从列表里选供应商。注意类别分成两组:**食材成本**(您的材料)和**营运开销**(房租、薪水、水电)。正是这个分类,等下才能算出真正的食材成本率。"*
- **Pain point:** Owners mix ingredient cost with rent/salary and lose the real picture.
- **Value:** Clear COGS vs operating split; supplier-linked.
- **Result:** Expense row shows the supplier name; toast confirms; CSV export includes supplier.

---

### Step 10 — Upload / scan a supplier invoice
- **Page:** `/invoice-scanner`
- **Click:** Show the clean upload area → **Upload** an invoice photo/PDF.
- **Say (EN):** *"This is the part owners love. Instead of typing an invoice line by line, you just snap a photo — JPG, PNG or PDF — and let the AI read it."*
- **Say (中文):** *"这是老板们最喜欢的部分。发票不用一行一行打字,直接拍张照——JPG、PNG 或 PDF——让 AI 帮您读。"*
- **Pain point:** Typing supplier invoices is the most hated chore.
- **Value:** Snap-and-go; no manual line entry.
- **Result:** Premium uploader → switches to the scanning animation.

---

### Step 11 — AI extracts the invoice information
- **Page:** `/invoice-scanner` (scanning → result)
- **Click:** Wait ~2 seconds for the AI to "read" it.
- **Say (EN):** *"In a couple of seconds, the AI pulls out the supplier, the invoice number, every line item, the prices, and the total — and even suggests a category for each item. It tells you how confident it is, so you stay in control. You just check and confirm — you never type it all."*
- **Say (中文):** *"几秒钟之内,AI 就把供应商、发票号码、每一项货品、价格和总额都读出来了,还帮每一项建议好类别。它会显示识别的把握度,让您心里有数。您只需要核对一下,完全不用从头打字。"*
- **Pain point:** Manual data entry = wasted hours + mistakes.
- **Value:** AI does the typing; owner just reviews (no silent auto-save).
- **Result:** Extraction card shows **ABC Frozen Food Sdn Bhd · INV-2026-0522 · RM 1,280.50**, 5 categorised line items, **92% confidence**.

---

### Step 12 — Save invoice as expense
- **Page:** `/invoice-scanner`
- **Click:** Confirm supplier match → **Save Invoice** (it also creates the linked expense).
- **Say (EN):** *"One tap to save. The invoice is filed, and it's automatically added to your expenses and your food cost — no double entry. It's now part of your profit picture."*
- **Say (中文):** *"点一下保存。发票就归档了,而且自动算进您的开销和食材成本——不用重复输入。它现在已经是您利润计算的一部分了。"*
- **Pain point:** Same data entered twice (invoice + expense).
- **Value:** Save once → flows into expenses + COGS + P&L automatically.
- **Result:** Toast *"Invoice saved — RM 1,280.50 added to expenses"*; appears in scan history.

---

### Step 13 — Show supplier spending analytics
- **Page:** `/suppliers`
- **Click:** Point at the **top suppliers** / spend figures and trend.
- **Say (EN):** *"Now look — the app shows your **top suppliers** and how much you spend with each, all in RM. If one supplier is taking 60% of your food budget, you'll see it here — that's your cue to negotiate or find a backup."*
- **Say (中文):** *"您看——系统列出您的**主要供应商**,以及在每一家花了多少钱,全部用 RM 显示。如果某一家占了您食材预算的 60%,这里一眼就看到——这就是提醒您去谈价或找备用供应商的信号。"*
- **Pain point:** No visibility into supplier concentration / overspend.
- **Value:** Spot your biggest costs and negotiation leverage.
- **Result:** Ranked suppliers with RM totals (e.g. *Premium Meats Trading — RM 9,200*) and trend.

---

### Step 14 — Show the P&L report
- **Page:** `/pnl-report`
- **Click:** Pick the current month from the selector.
- **Say (EN):** *"Here's the big one — your monthly Profit & Loss, in plain language. Sales at the top. Take away your food cost. Take away rent, salaries, utilities. What's left is your **real profit**. No accountant needed to read it."*
- **Say (中文):** *"重点来了——您每个月的盈亏报告,用大白话写。上面是营业额,减掉食材成本,再减掉房租、薪水、水电,剩下的就是您**真正赚的钱**。不用会计也看得懂。"*
- **Pain point:** Owners never see a clear monthly profit number.
- **Value:** Automatic, readable P&L from data they already entered.
- **Result:** Revenue → COGS breakdown → operating expenses → **Gross & Net profit**.

---

### Step 15 — Explain the key percentages
- **Page:** `/pnl-report`
- **Click:** Point at **Food Cost %**, **Gross Margin %**, **Net Margin %**.
- **Say (EN):** *"Three numbers tell you the health of your shop. **Food cost %** — for most F&B, under 35% is healthy. **Gross margin** — what's left after ingredients. **Net margin** — your real take-home after everything. The app even flags if any of them drift into the danger zone."*
- **Say (中文):** *"三个数字就能看出店铺的健康状况。**食材成本率**——餐饮业一般低于 35% 算健康。**毛利率**——扣掉材料后剩下的。**净利率**——扣掉所有开销后真正到手的。哪个数字进入危险区,系统还会提醒您。"*
- **Pain point:** Owners don't know their benchmark numbers.
- **Value:** Industry benchmarks + automatic warnings.
- **Result:** Percentages with healthy/warning colour cues.

---

### Step 16 — Export PDF / CSV
- **Page:** `/pnl-report`
- **Click:** **Export PDF** (opens a clean printable report) → then **Export CSV**.
- **Say (EN):** *"Need to show the bank, a partner, or your accountant? One click — a clean PDF report. Or export CSV to open in Excel. Your accountant gets organised numbers instead of a shoebox of receipts."*
- **Say (中文):** *"要给银行、合伙人或会计看?点一下就有干净的 PDF 报告。或者导出 CSV 用 Excel 打开。您的会计拿到的是整理好的数据,而不是一鞋盒的收据。"*
- **Pain point:** Hard to share numbers; accountant charges more for messy records.
- **Value:** Professional PDF + Excel-ready CSV; saves accountant fees.
- **Result:** PDF print view / CSV download (labels respect the chosen language).

---

### Step 17 — Explain the AI business insight
- **Page:** `/dashboard` (AI Insight panel) or `/pnl-report` summary.
- **Click:** Point at the **AI Business Insight** card.
- **Say (EN):** *"And the app doesn't just show numbers — it reads them for you. It points out things like 'your food cost went up this month' or 'one supplier is 60% of your spend.' Like a smart assistant whispering what to watch."*
- **Say (中文):** *"而且系统不只是给您数字,它还帮您解读。比如'这个月食材成本上升了',或'一家供应商占了您六成的开销'。就像一个聪明的小助手,提醒您该注意什么。"*
- **Pain point:** Numbers without interpretation = still confusing.
- **Value:** Plain-language, actionable insight.
- **Result:** Insight chips/sentences (food cost, margin, supplier-risk read-outs).
- **⚠️ Honesty note:** today these are **smart rule-based** read-outs (instant, free, offline). If asked "is it real AI?", say: *"The invoice reading is real AI; the insights are smart automatic analysis today, and get even smarter over time."* Don't oversell.

---

### Step 18 — Set expectations (what it is / isn't)
- **Page:** Anywhere (look up, talk to the client).
- **Click:** Nothing.
- **Say (EN):** *"To be straight with you: this is a **smart ledger and profit dashboard** — it shows you your money clearly and saves you hours. It is **not** a certified accounting system, it does **not** file your SST or LHDN e-invoice, and it's not a stock/inventory system. It works alongside your accountant — it just means they (and you) finally have clean numbers."*
- **Say (中文):** *"老实跟您说:这是一个**智能记账加利润看板**——让您把钱看得清楚,帮您省下很多时间。它**不是**正式的会计系统,**不会**帮您报 SST 或 LHDN 电子发票,也不是库存系统。它是配合您的会计一起用的——只是让您和会计终于有一份干净的数据。"*
- **Pain point:** Avoid future disputes / over-expectation.
- **Value:** Builds trust through honesty; positions correctly.
- **Result:** Client trusts you more, not less.

---

### Closing pitch
- **Page:** Dashboard (end where you began — on the profit number).
- **Click:** Nothing — let the profit number sit on screen.
- **Say (EN):** *"So — a minute a day to log sales, snap a photo for invoices, and at month-end you see your real profit, in English or Chinese, on your phone. No more guessing. I'm onboarding a few founding shops now at a special price, and I'll set everything up for you personally. Shall we get your shop started this week?"*
- **Say (中文):** *"所以——每天一分钟记营业额,发票拍张照,到月底就能看到真正的利润,中英文都行,手机上就能看。不用再猜了。我现在以特别优惠价招募几家创始店铺,而且我会亲自帮您把一切设置好。我们这星期就帮您的店开通,好吗?"*
- **Value:** Clear ask + the Founding-Member offer (see PRICING_PLAN.md) + done-for-you setup.
- **Result:** You ask for the close. 🤝

---

## 🗺️ One-page cheat sheet (print this)

| # | Step | Page | Key click | One-liner |
|---|---|---|---|---|
| 1–2 | Pitch + pain | Login | — | "Do you know your *profit*, not just sales?" |
| 3 | Login | `/login` | Sign In | "Email + password, works on your phone." |
| 4 | Dashboard | `/dashboard` | — | "Whole business, one screen." |
| 5 | Language | toggle | 简体中文 | "One tap → full Chinese." |
| 6 | Add sales | `/daily-sales` | + Add → Save | "Under a minute a day." |
| 7 | Edit sales | `/daily-sales` | row → Edit | "Fix mistakes, safe delete." |
| 8 | Add supplier | `/suppliers` | + Add | "Track who you pay." |
| 9 | Add expense | `/expenses` | + Add → supplier | "Food cost vs operating, split clearly." |
| 10 | Upload invoice | `/invoice-scanner` | Upload | "Snap, don't type." |
| 11 | AI extracts | scanner | wait ~2s | "AI reads supplier, items, total (92%)." |
| 12 | Save invoice | scanner | Save Invoice | "Files + adds to expenses automatically." |
| 13 | Supplier analytics | `/suppliers` | — | "Your top suppliers in RM." |
| 14 | P&L | `/pnl-report` | pick month | "Real profit, plain language." |
| 15 | Percentages | `/pnl-report` | — | "Food cost <35%, margins, auto-warnings." |
| 16 | Export | `/pnl-report` | PDF / CSV | "Clean report for bank/accountant." |
| 17 | AI insight | `/dashboard` | — | "It reads the numbers for you." |
| 18 | Boundaries | — | — | "Smart ledger, not a tax/accounting system." |
| ★ | Close | `/dashboard` | — | "Founding price + I set it up. Start this week?" |

---

## ✅ Top selling points (lead with these)
1. **Profit clarity** — see real net profit, not just sales.
2. **Snap-don't-type** AI invoice scanning.
3. **Real food cost %** from the COGS/operating split.
4. **GrabFood / Foodpanda net** after commission.
5. **Bilingual EN / 简体中文**, instant switch, mobile-first.
6. **Professional PDF / CSV** for bank & accountant.

## ⚠️ What NOT to promise during the demo
- ❌ Not a **certified accounting** system / not audited books.
- ❌ Does **not** file **SST/GST** or **LHDN e-Invoice (MyInvois)**.
- ❌ Not a **stock / inventory** or recipe-costing system.
- ❌ **Staff/team logins & multi-outlet** = **Phase 4 (planned)** — show as roadmap, price-locked for Premium/founding clients, never as "live today."
- ❌ Never say **"unlimited AI scans"** — scanning is **quota-based** (see PRICING_PLAN.md).
- ❌ Only demo what's built — if asked about insights, say invoice reading is real AI, insights are smart auto-analysis today.

> Golden rule: **under-promise, over-deliver.** An honest demo closes more F&B owners than a flashy one.
