// Marketing copy for the public landing page (sales-funnel structure), EN + 简体中文.
// Kept out of the global i18n dictionary so long-form sales copy stays
// maintainable in one place. The landing reads `isZh` from LanguageContext.
//
// NOTE: the `proof.testimonials` entries are PLACEHOLDERS. Replace them with real
// quotes from your founding clients before you publish — do not present invented
// quotes as real customer testimonials.

export const CONTACT_EMAIL = 'hello@fbsmartledger.com'

export interface LandingCopy {
  nav: { login: string; demo: string; offer: string }
  hero: {
    offer:    string
    badge:    string
    h1a:      string
    accent:   string
    h1b:      string
    sub:      string
    zhNote:   string
    ctaDemo:  string
    ctaPrice: string
    micro:    string
    chips:    string[]
    preview:  { net: string; today: string; food: string; month: string; scanned: string }
  }
  trust:  { kicker: string; items: string[] }
  agitate:{ eyebrow: string; title: string; sub: string; items: { title: string; desc: string }[] }
  cost:   { eyebrow: string; title: string; points: string[]; kicker: string }
  solution:{ eyebrow: string; title: string; sub: string; items: string[] }
  how:    { eyebrow: string; title: string; sub: string; steps: { title: string; desc: string }[] }
  features:{ eyebrow: string; title: string; sub: string; items: { title: string; desc: string }[] }
  proof: {
    eyebrow: string; title: string; sub: string
    testimonials: { quote: string; name: string; role: string }[]
  }
  pricing: {
    eyebrow: string; title: string; sub: string; note: string; popular: string; perMonth: string
    offerTitle: string; offerSub: string; offerCta: string
    tiers: { name: string; price: string; tagline: string; features: string[]; cta: string }[]
  }
  faq: { eyebrow: string; title: string; items: { q: string; a: string }[] }
  final: { title: string; sub: string; micro: string }
  disclaimer: string
  footer: { tagline: string; login: string; demo: string; contact: string; rights: string; mini: string }
  sticky: { price: string; cta: string }
}

const en: LandingCopy = {
  nav: { login: 'Log in', demo: 'View Demo', offer: 'Founding offer' },
  hero: {
    offer:    'Founding price for the first 10 shops — limited',
    badge:    'AI-powered F&B smart ledger',
    h1a:      'Know your F&B',
    accent:   'profit',
    h1b:      'without the messy paperwork',
    sub:      'Scan supplier invoices, track daily sales, and see your real monthly profit — in one simple dashboard. Under a minute a day.',
    zhNote:   '不用再靠 Excel 和纸张乱记账 — 扫描发票、记录营业额、自动算出食材成本与盈亏。',
    ctaDemo:  'See the live demo',
    ctaPrice: 'Get founding price',
    micro:    'No sign-up. No credit card. One click into a fully-loaded demo.',
    chips:    ['Works on your phone', 'English / 简体中文', 'Set up in minutes', 'No accountant needed'],
    preview:  { net: 'Net Profit', today: 'Today', food: 'Food Cost', month: 'This Month', scanned: 'Invoice scanned' },
  },
  trust: {
    kicker: 'Made for Malaysian F&B',
    items: ['Cafes', 'Kopitiam', 'Restaurants', 'Bakeries', 'Cloud kitchens', 'Catering'],
  },
  agitate: {
    eyebrow: 'Sound familiar?',
    title:   "You're working harder than ever — but flying blind on profit",
    sub:     'You can see your sales. But the number that actually keeps your shop alive — profit — stays a mystery until it is too late.',
    items: [
      { title: 'Invoices everywhere',       desc: 'Stuffed in a drawer, a shoebox, and a WhatsApp folder you will never sort.' },
      { title: 'No time for Excel',          desc: 'After 12 hours on your feet, updating a spreadsheet is the last thing you will do.' },
      { title: 'Food cost is a guess',       desc: '30%? 45%? Without the number, every month is a shrug.' },
      { title: 'Delivery commission bites',  desc: 'GrabFood and Foodpanda take their cut — and you never see the real net.' },
      { title: 'Profit is a mystery',        desc: 'Busy month, empty bank account. Where did the money actually go?' },
      { title: 'Your accountant is too late',desc: 'By the time the books are checked, the month — and the chance to fix it — is gone.' },
    ],
  },
  cost: {
    eyebrow: 'The hidden leak',
    title:   'Every month you guess, money quietly leaks out',
    points: [
      'A 3% food-cost creep you cannot see — thousands of ringgit a year, gone.',
      'Delivery commissions you never tracked, eating your best-looking sales.',
      'Hours every week typing invoices by hand instead of serving customers.',
      'Finding out you lost money — a full month too late to do anything.',
    ],
    kicker: 'You can’t fix what you can’t see.',
  },
  solution: {
    eyebrow: 'The fix',
    title:   'One simple dashboard shows you everything',
    sub:     'Stop chasing paper. Start seeing your real numbers — clearly, in plain language, in English or Chinese.',
    items: [
      'AI scans your supplier invoices — no manual typing',
      'Log daily sales in under a minute, split by channel',
      'Every expense linked to the right supplier',
      'Food cost % calculated for you, automatically',
      'A clean monthly P&L, generated on its own',
      'Export PDF & CSV for your bank or accountant',
    ],
  },
  how: {
    eyebrow: 'Dead simple',
    title:   'Up and running in 3 steps',
    sub:     'A minute a day. No training, no accountant, no jargon.',
    steps: [
      { title: 'Log your sales',  desc: "Tap in today's takings by channel — dine-in, takeaway, delivery. Under 60 seconds." },
      { title: 'Snap your invoices', desc: 'Photograph any supplier invoice. The AI reads it and files it for you.' },
      { title: 'See your profit', desc: 'Open the dashboard or P&L and watch your real profit update — anytime.' },
    ],
  },
  features: {
    eyebrow: 'Everything inside',
    title:   "Built around the money decisions you actually make",
    sub:     'Not a bloated accounting suite. Just the tools that tell you if your shop is making money.',
    items: [
      { title: 'AI Invoice Scanner',          desc: 'Snap a photo — AI pulls out supplier, items and totals.' },
      { title: 'Daily Sales Tracker',         desc: 'Log takings by channel in under 60 seconds.' },
      { title: 'Food Cost Dashboard',         desc: 'Your real food cost %, against healthy benchmarks.' },
      { title: 'Supplier Spending Analytics', desc: 'See your top suppliers and where the money goes.' },
      { title: 'Monthly P&L Report',          desc: 'Automatic profit & loss, in plain language.' },
      { title: 'PDF / CSV Export',            desc: 'Professional reports for the bank or accountant.' },
      { title: 'Bilingual — EN / 中文',        desc: 'Full English & 简体中文, switch with one tap.' },
      { title: 'Free Demo Mode',              desc: 'Explore a fully-loaded shop before you commit.' },
    ],
  },
  proof: {
    eyebrow: 'Why owners switch',
    title:   'Made with Malaysian F&B owners — for the way you really work',
    sub:     'Mobile-first, bilingual, and built around the kitchen — not the accounting textbook.',
    // PLACEHOLDER quotes — replace with real founding-client testimonials before launch.
    testimonials: [
      { quote: 'I finally know my food cost without calling my accountant. Took me one evening to set up.', name: 'Cafe owner', role: 'Petaling Jaya (sample)' },
      { quote: 'Snapping invoices instead of typing them saves me hours every week.', name: 'Restaurant owner', role: 'Cheras (sample)' },
      { quote: 'Now I can see what GrabFood actually pays me after commission. Eye-opening.', name: 'Cloud kitchen', role: 'Subang (sample)' },
    ],
  },
  pricing: {
    eyebrow: 'Simple pricing',
    title:   'Pick a plan that fits your shop',
    sub:     'Start small, upgrade when you grow. No long contracts, cancel anytime.',
    note:    'All plans include English / 简体中文 and work on your phone.',
    popular: 'Most popular',
    perMonth:'/month',
    offerTitle: 'Founding-member offer — first 10 shops',
    offerSub:   'Pro at 50% off for 6 months, setup waived, and we set everything up for you. Price locked for a year.',
    offerCta:   'Claim founding price',
    tiers: [
      {
        name: 'Starter', price: 'RM39', tagline: 'Stalls, kopitiam & small cafes',
        features: ['1 outlet', 'Daily sales & expenses', 'Supplier list', 'Monthly P&L', 'CSV export', '15 AI scans / month'],
        cta: 'Contact Us',
      },
      {
        name: 'Pro', price: 'RM99', tagline: 'Active cafes & restaurants',
        features: ['Everything in Starter', 'AI invoice scanning (100/mo)', 'Food cost %', 'GrabFood / Foodpanda tracking', 'Supplier analytics', 'PDF export', 'AI business insight'],
        cta: 'Start with the demo',
      },
      {
        name: 'Premium', price: 'RM239', tagline: 'Larger & growing groups',
        features: ['Everything in Pro', 'Multi-outlet (roadmap)', 'Staff & roles (roadmap)', 'Custom reports', 'Priority support', '300 AI scans / month'],
        cta: 'Contact Us',
      },
    ],
  },
  faq: {
    eyebrow: 'Before you ask',
    title:   'Questions owners ask us',
    items: [
      { q: 'Is this accounting or tax software?', a: 'No. It is a smart ledger and profit dashboard — it shows your money clearly and saves you hours. It works alongside your accountant; it does not file SST or LHDN e-invoice.' },
      { q: 'I am not techy. Is it hard to use?', a: 'No. If you can use WhatsApp, you can use this. Log sales in a tap, snap a photo for invoices, and read your profit in plain language. We also set it up for you.' },
      { q: 'Does it work in Chinese?', a: 'Yes — full English and 简体中文, switch any time with one tap. Money is always shown in RM.' },
      { q: 'Can it handle GrabFood and Foodpanda?', a: 'Yes. Log your delivery sales and it shows your real net after commission — so you know what you actually earned.' },
      { q: 'Will AI scanning cost me extra?', a: 'Each plan includes a monthly scan quota. You will never get a surprise bill — beyond the quota you simply enter invoices manually or top up.' },
      { q: 'Can I try before paying?', a: 'Yes. Click “See the live demo” — no sign-up, no card. And founding members get setup done for them.' },
    ],
  },
  final: {
    title: 'Want to see if your F&B business is really making profit?',
    sub:   'Open the live demo now — no sign-up, no card. See your numbers in plain language.',
    micro: 'Founding price for the first 10 shops. We set it up for you.',
  },
  disclaimer: 'This is a smart business ledger and P&L visibility tool. It is not certified accounting, tax-filing, or LHDN e-Invoice software. It works alongside your accountant — not instead of one.',
  footer: {
    tagline: 'The smart ledger that shows Malaysian F&B owners their real profit.',
    login: 'Log in', demo: 'View Demo', contact: 'Contact',
    rights: 'All rights reserved.',
    mini:   'Smart ledger & P&L visibility — not certified accounting or tax software.',
  },
  sticky: { price: 'From RM39/mo', cta: 'See live demo' },
}

const zh: LandingCopy = {
  nav: { login: '登录', demo: '查看演示', offer: '创始优惠' },
  hero: {
    offer:    '前 10 家店享创始优惠价 —— 名额有限',
    badge:    'AI 智能餐饮记账系统',
    h1a:      '看清你的餐饮',
    accent:   '利润',
    h1b:      '告别杂乱的纸张账目',
    sub:      '扫描供应商发票、记录每日营业额,在一个简单的仪表板里看见真正的月利润。每天不到一分钟。',
    zhNote:   '一分钟记账,随时看见真正赚了多少钱。',
    ctaDemo:  '观看在线演示',
    ctaPrice: '获取创始价',
    micro:    '无需注册,无需信用卡。一键进入完整演示。',
    chips:    ['手机就能用', '英文 / 简体中文', '几分钟搞定设置', '不需要会计'],
    preview:  { net: '净利润', today: '今天', food: '食材成本', month: '本月', scanned: '发票已扫描' },
  },
  trust: {
    kicker: '专为马来西亚餐饮打造',
    items: ['咖啡馆', '茶餐室', '餐厅', '烘焙店', '云端厨房', '到会'],
  },
  agitate: {
    eyebrow: '这些情况是不是很熟悉?',
    title:   '你比以前更拼 —— 却看不清到底有没有赚钱',
    sub:     '营业额你看得到,但真正让店活下去的「利润」,往往要等到太迟才发现。',
    items: [
      { title: '发票到处都是',     desc: '塞在抽屉、鞋盒、WhatsApp 里,永远整理不完。' },
      { title: '没时间碰 Excel',   desc: '站了十二个小时,更新表格是你最不想做的事。' },
      { title: '食材成本靠猜',     desc: '30%?45%?没有数字,每个月都只能耸耸肩。' },
      { title: '外卖佣金难算',     desc: 'GrabFood、Foodpanda 抽完佣金,你从没看清真正的净收入。' },
      { title: '利润是个谜',       desc: '生意很忙,户口却空空。钱到底去哪了?' },
      { title: '会计总是太迟',     desc: '等账目核对好,这个月、还有补救的机会,都过去了。' },
    ],
  },
  cost: {
    eyebrow: '看不见的漏洞',
    title:   '每个月靠猜,钱就在悄悄流走',
    points: [
      '看不见的 3% 食材成本上升 —— 一年就是几千令吉,白白没了。',
      '从没追踪的外卖佣金,正在吃掉你最漂亮的那笔销售。',
      '每周花好几个小时手打发票,而不是服务顾客。',
      '等发现亏钱时 —— 已经晚了整整一个月。',
    ],
    kicker: '看不见,就修不了。',
  },
  solution: {
    eyebrow: '解决方案',
    title:   '一个简单的仪表板,全部看清',
    sub:     '不再追着纸张跑,用大白话清楚看见你的真实数字,中英文都行。',
    items: [
      'AI 扫描供应商发票 —— 不用手动输入',
      '一分钟内记录每日营业额,按渠道分类',
      '每一笔开销都对应到正确的供应商',
      '自动帮你算出食材成本率',
      '每月盈亏报表自动生成',
      '导出 PDF 与 CSV,给银行或会计',
    ],
  },
  how: {
    eyebrow: '超级简单',
    title:   '三步就上手',
    sub:     '每天一分钟,不用培训、不用会计、没有术语。',
    steps: [
      { title: '记录营业额', desc: '按渠道输入今天的收入 —— 堂食、外带、外卖,60 秒内完成。' },
      { title: '拍下发票',   desc: '拍下任何供应商发票,AI 自动读取并归档。' },
      { title: '看见利润',   desc: '打开仪表板或盈亏报表,随时看见真实利润更新。' },
    ],
  },
  features: {
    eyebrow: '全部功能',
    title:   '围绕你每天真正要做的金钱决策',
    sub:     '不是臃肿的会计软件,只有能告诉你「店有没有赚钱」的工具。',
    items: [
      { title: 'AI 发票扫描',     desc: '拍张照,AI 读出供应商、货品和总额。' },
      { title: '每日营业额记录',  desc: '按渠道记录收入,60 秒内完成。' },
      { title: '食材成本看板',    desc: '对照健康标准,看清真实食材成本率。' },
      { title: '供应商开销分析',  desc: '了解主要供应商,钱都花到哪去。' },
      { title: '每月盈亏报表',    desc: '自动生成,用大白话呈现的盈亏。' },
      { title: 'PDF / CSV 导出',  desc: '给银行或会计的专业报表。' },
      { title: '双语 —— 中 / 英', desc: '完整英文与简体中文,一键切换。' },
      { title: '免费演示模式',    desc: '正式使用前,先体验完整示范店铺。' },
    ],
  },
  proof: {
    eyebrow: '为什么老板会换',
    title:   '与马来西亚餐饮老板共同打造 —— 贴合你真实的工作方式',
    sub:     '手机优先、双语、围绕厨房而设计 —— 而不是会计教科书。',
    // 占位内容 —— 上线前请替换为真实创始客户的评价。
    testimonials: [
      { quote: '不用打电话给会计,我终于知道自己的食材成本了。一个晚上就设置好。', name: '咖啡馆老板', role: '八打灵再也(示例)' },
      { quote: '发票用拍的不用打字,每周帮我省下好几个小时。', name: '餐厅老板', role: '蕉赖(示例)' },
      { quote: '现在能看到 GrabFood 扣佣后到底付我多少,真的很震撼。', name: '云端厨房', role: '梳邦(示例)' },
    ],
  },
  pricing: {
    eyebrow: '简单价格',
    title:   '选一个适合你店的方案',
    sub:     '从小开始,做大再升级。没有长期合约,随时取消。',
    note:    '所有方案都支持英文 / 简体中文,手机就能用。',
    popular: '最受欢迎',
    perMonth:'/月',
    offerTitle: '创始会员优惠 —— 前 10 家店',
    offerSub:   '专业版半价 6 个月,免设置费,我们帮你设置好一切,价格锁定一年。',
    offerCta:   '抢创始价',
    tiers: [
      {
        name: '入门版', price: 'RM39', tagline: '摊位、茶餐室与小咖啡馆',
        features: ['1 间店铺', '每日营业额与开销', '供应商列表', '每月盈亏报表', 'CSV 导出', '每月 15 次 AI 扫描'],
        cta: '联系我们',
      },
      {
        name: '专业版', price: 'RM99', tagline: '营业活跃的咖啡馆与餐厅',
        features: ['包含入门版全部功能', 'AI 发票扫描(每月 100 次)', '食材成本率', 'GrabFood / Foodpanda 追踪', '供应商分析', 'PDF 导出', 'AI 商业洞察'],
        cta: '从演示开始',
      },
      {
        name: '高级版', price: 'RM239', tagline: '较大型与成长中的店群',
        features: ['包含专业版全部功能', '多店铺(规划中)', '员工与权限(规划中)', '定制报表', '优先支持', '每月 300 次 AI 扫描'],
        cta: '联系我们',
      },
    ],
  },
  faq: {
    eyebrow: '在你开口之前',
    title:   '老板们常问的问题',
    items: [
      { q: '这是会计或报税软件吗?', a: '不是。它是智能记账与利润看板 —— 让你清楚看见金钱、省下时间。它配合你的会计一起用,不会帮你报 SST 或 LHDN 电子发票。' },
      { q: '我不懂科技,会很难用吗?', a: '不会。会用 WhatsApp 就会用它。点一下记营业额,拍张照记发票,用大白话看利润。我们还会帮你设置好。' },
      { q: '支持中文吗?', a: '支持 —— 完整英文与简体中文,随时一键切换。金额一律用 RM 显示。' },
      { q: '能处理 GrabFood 和 Foodpanda 吗?', a: '可以。记录外卖销售后,它会显示扣佣后的真实净收入,让你知道实际赚了多少。' },
      { q: 'AI 扫描会额外收费吗?', a: '每个方案都包含每月扫描配额,绝不会有突如其来的账单。超过配额可手动输入或加购。' },
      { q: '可以先试用再付费吗?', a: '可以。点「观看在线演示」—— 无需注册、无需信用卡。创始会员还能享受我们代为设置。' },
    ],
  },
  final: {
    title: '想知道你的餐饮生意是不是真的在赚钱吗?',
    sub:   '立即打开在线演示 —— 无需注册、无需信用卡,用大白话看见你的数字。',
    micro: '前 10 家店享创始价,我们帮你设置好一切。',
  },
  disclaimer: '这是一个智能记账与盈亏可视化工具,并非正式会计、报税或 LHDN 电子发票软件。它是配合您的会计一起使用,而不是取代会计。',
  footer: {
    tagline: '让马来西亚餐饮老板看清真实利润的智能记账系统。',
    login: '登录', demo: '查看演示', contact: '联系我们',
    rights: '版权所有。',
    mini:   '智能记账与盈亏可视化 —— 并非正式会计或报税软件。',
  },
  sticky: { price: 'RM39/月起', cta: '观看演示' },
}

export const getLandingCopy = (isZh: boolean): LandingCopy => (isZh ? zh : en)
