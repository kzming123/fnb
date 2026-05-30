// Marketing copy for the public landing page, EN + 简体中文.
// Kept out of the global i18n dictionary so long-form sales copy stays
// maintainable in one place. The landing reads `isZh` from LanguageContext.

export const CONTACT_EMAIL = 'hello@fbsmartledger.com'

export interface LandingCopy {
  nav:   { login: string; demo: string }
  hero: {
    badge:    string
    h1a:      string
    accent:   string
    h1b:      string
    sub:      string
    zhNote:   string   // a bilingual flourish shown in EN mode
    ctaDemo:  string
    ctaPrice: string
    trust:    string
    preview:  { net: string; today: string; food: string; month: string; scanned: string }
  }
  pain:     { title: string; sub: string; items: { title: string; desc: string }[] }
  solution: { title: string; sub: string; items: string[] }
  features: { title: string; sub: string; items: { title: string; desc: string }[] }
  how:      { title: string; sub: string; steps: { title: string; desc: string }[] }
  pricing: {
    title: string; sub: string; note: string; popular: string; perMonth: string
    tiers: { name: string; price: string; tagline: string; features: string[]; cta: string }[]
  }
  disclaimer: string
  final:      { title: string; sub: string }
  footer:     { tagline: string; login: string; demo: string; contact: string; rights: string; mini: string }
}

const en: LandingCopy = {
  nav: { login: 'Log in', demo: 'View Demo' },
  hero: {
    badge:    'AI-powered F&B smart ledger',
    h1a:      'Know your F&B',
    accent:   'profit',
    h1b:      'without messy paperwork',
    sub:      'Scan supplier invoices, track daily sales, monitor food cost, and generate monthly P&L reports — all in one simple dashboard.',
    zhNote:   '不用再靠 Excel 和纸张乱记账 — 扫描发票、记录营业额、自动算出食材成本与盈亏。',
    ctaDemo:  'View Demo',
    ctaPrice: 'Contact for Pricing',
    trust:    'Built for Malaysian F&B — cafe · kopitiam · restaurant · bakery · cloud kitchen · catering',
    preview:  { net: 'Net Profit', today: 'Today', food: 'Food Cost', month: 'This Month', scanned: 'Invoice scanned' },
  },
  pain: {
    title: 'Sound familiar?',
    sub:   'Most F&B owners run blind on the one number that matters — profit.',
    items: [
      { title: 'Invoices everywhere',      desc: 'Supplier invoices pile up in a drawer, a shoebox, and a WhatsApp folder.' },
      { title: 'No time for paperwork',     desc: 'After a 12-hour day on your feet, who has the energy to update Excel?' },
      { title: "Food cost is a guess",      desc: 'Is it 30% or 45%? Without the numbers, you are guessing every month.' },
      { title: 'Profit is unclear',         desc: 'Sales look busy — but did you actually keep any money this month?' },
      { title: 'Delivery commission bites', desc: 'After GrabFood and Foodpanda take their cut, what did you really earn?' },
      { title: 'Accountant tells you late', desc: 'By the time the books are checked, the month is already gone.' },
    ],
  },
  solution: {
    title: 'One simple dashboard does it all',
    sub:   'Stop chasing paper. Start seeing your real numbers — clearly, in plain language.',
    items: [
      'Scan supplier invoices with AI — no more manual typing',
      'Log daily sales in under a minute, split by channel',
      'Link every expense to the right supplier',
      'Food cost % calculated automatically',
      'Monthly P&L report generated for you',
      'Export clean PDF & CSV for your bank or accountant',
      'Works fully in English & 简体中文',
    ],
  },
  features: {
    title: 'Everything an F&B owner needs',
    sub:   'Built around the day-to-day money decisions you actually make.',
    items: [
      { title: 'AI Invoice Scanner',         desc: 'Snap a photo — AI reads supplier, items, and totals.' },
      { title: 'Daily Sales Tracker',        desc: 'Log takings by channel in under 60 seconds.' },
      { title: 'Food Cost Dashboard',        desc: 'See your real food cost % against healthy benchmarks.' },
      { title: 'Supplier Spending Analytics',desc: 'Know your top suppliers and where the money goes.' },
      { title: 'P&L Report',                 desc: 'Automatic monthly profit & loss in plain language.' },
      { title: 'PDF / CSV Export',           desc: 'Professional reports for the bank or accountant.' },
      { title: 'Bilingual Support',          desc: 'Full English / 简体中文 — switch with one tap.' },
      { title: 'Demo Mode',                  desc: 'Explore a fully-loaded shop before you sign up.' },
    ],
  },
  how: {
    title: 'How it works',
    sub:   'Four simple steps. A minute a day.',
    steps: [
      { title: 'Add daily sales',     desc: "Tap in today's takings by channel — dine-in, takeaway, delivery." },
      { title: 'Scan a supplier invoice', desc: 'Take a photo or upload a PDF. The AI reads it for you.' },
      { title: 'Save as expense',     desc: 'One tap files it into expenses and your food cost.' },
      { title: 'View dashboard & P&L',desc: 'Watch your real profit update instantly — anytime.' },
    ],
  },
  pricing: {
    title:   'Simple pricing for every shop',
    sub:     'Start small, upgrade when you grow. No long contracts.',
    note:    'Founding-member pricing available for early shops — ask us. We set everything up for you.',
    popular: 'Most popular',
    perMonth:'/month',
    tiers: [
      {
        name: 'Starter', price: 'RM39', tagline: 'For stalls, kopitiam & small cafes',
        features: ['1 outlet', 'Daily sales & expenses', 'Supplier list', 'Monthly P&L', 'CSV export', '15 AI scans / month', 'English / 简体中文'],
        cta: 'Contact Us',
      },
      {
        name: 'Pro', price: 'RM99', tagline: 'For active cafes & restaurants',
        features: ['Everything in Starter', 'AI invoice scanning (100/mo)', 'Food cost %', 'GrabFood / Foodpanda tracking', 'Supplier analytics', 'PDF export', 'AI business insight'],
        cta: 'Request Demo',
      },
      {
        name: 'Premium', price: 'RM239', tagline: 'For larger & growing groups',
        features: ['Everything in Pro', 'Multi-outlet (roadmap)', 'Staff & roles (roadmap)', 'Custom reports', 'Priority support', '300 AI scans / month'],
        cta: 'Contact Us',
      },
    ],
  },
  disclaimer: 'This is a smart business ledger and P&L visibility tool. It is not certified accounting, tax-filing, or LHDN e-Invoice software. It works alongside your accountant — not instead of one.',
  final: {
    title: 'Want to see if your F&B business is really making profit?',
    sub:   'Try the live demo — no sign-up needed.',
  },
  footer: {
    tagline: 'The smart ledger that shows Malaysian F&B owners their real profit.',
    login: 'Log in', demo: 'View Demo', contact: 'Contact',
    rights: 'All rights reserved.',
    mini:   'Smart ledger & P&L visibility — not certified accounting or tax software.',
  },
}

const zh: LandingCopy = {
  nav: { login: '登录', demo: '查看演示' },
  hero: {
    badge:    'AI 智能餐饮记账系统',
    h1a:      '看清你的餐饮',
    accent:   '利润',
    h1b:      '告别杂乱的纸张账目',
    sub:      '扫描供应商发票、记录每日营业额、监控食材成本,并自动生成每月盈亏报表 —— 全部在一个简单的仪表板里。',
    zhNote:   '一分钟记账,随时看见真正赚了多少钱。',
    ctaDemo:  '查看演示',
    ctaPrice: '咨询价格',
    trust:    '专为马来西亚餐饮打造 —— 咖啡馆 · 茶餐室 · 餐厅 · 烘焙店 · 云端厨房 · 到会',
    preview:  { net: '净利润', today: '今天', food: '食材成本', month: '本月', scanned: '发票已扫描' },
  },
  pain: {
    title: '这些情况是不是很熟悉?',
    sub:   '大多数餐饮老板,在最重要的「利润」这个数字上其实是盲目的。',
    items: [
      { title: '发票到处都是',     desc: '供应商发票塞在抽屉、鞋盒和 WhatsApp 里,乱成一团。' },
      { title: '没时间做账',       desc: '站了十二个小时,谁还有力气去更新 Excel?' },
      { title: '食材成本靠猜',     desc: '到底是 30% 还是 45%?没有数据,每个月都在猜。' },
      { title: '利润看不清',       desc: '生意看起来很忙,但这个月到底有没有赚到钱?' },
      { title: '外卖佣金难算',     desc: 'GrabFood、Foodpanda 抽完佣金后,你到底赚了多少?' },
      { title: '会计总是事后才说', desc: '等账目核对好,这个月早就过去了。' },
    ],
  },
  solution: {
    title: '一个简单的仪表板,全部搞定',
    sub:   '不再追着纸张跑,用大白话清楚看见你的真实数字。',
    items: [
      'AI 扫描供应商发票 —— 不用再手动输入',
      '一分钟内记录每日营业额,按渠道分类',
      '每一笔开销都对应到供应商',
      '自动算出食材成本率',
      '每月盈亏报表自动生成',
      '导出干净的 PDF 与 CSV,给银行或会计',
      '完整支持英文与简体中文',
    ],
  },
  features: {
    title: '餐饮老板需要的一切',
    sub:   '围绕你每天真正要做的金钱决策而设计。',
    items: [
      { title: 'AI 发票扫描',     desc: '拍张照,AI 自动读出供应商、货品和总额。' },
      { title: '每日营业额记录',  desc: '按渠道记录收入,60 秒内完成。' },
      { title: '食材成本看板',    desc: '对照健康标准,看清真实的食材成本率。' },
      { title: '供应商开销分析',  desc: '了解主要供应商,钱都花到哪里去。' },
      { title: '盈亏报表',        desc: '每月自动生成,用大白话呈现的盈亏。' },
      { title: 'PDF / CSV 导出',  desc: '给银行或会计的专业报表。' },
      { title: '双语支持',        desc: '完整英文 / 简体中文,一键切换。' },
      { title: '演示模式',        desc: '注册前先体验一个完整的示范店铺。' },
    ],
  },
  how: {
    title: '使用流程',
    sub:   '四个简单步骤,每天一分钟。',
    steps: [
      { title: '记录每日营业额', desc: '按渠道输入今天的收入 —— 堂食、外带、外卖。' },
      { title: '扫描供应商发票', desc: '拍照或上传 PDF,AI 自动帮你读取。' },
      { title: '保存为开销',     desc: '一键归档,自动计入开销与食材成本。' },
      { title: '查看仪表板与盈亏', desc: '随时看见你的真实利润即时更新。' },
    ],
  },
  pricing: {
    title:   '适合每一家店的简单价格',
    sub:     '从小开始,生意做大再升级。没有长期合约。',
    note:    '早期店铺可享创始会员优惠 —— 欢迎咨询,我们会帮你设置好一切。',
    popular: '最受欢迎',
    perMonth:'/月',
    tiers: [
      {
        name: '入门版', price: 'RM39', tagline: '适合摊位、茶餐室与小咖啡馆',
        features: ['1 间店铺', '每日营业额与开销', '供应商列表', '每月盈亏报表', 'CSV 导出', '每月 15 次 AI 扫描', '英文 / 简体中文'],
        cta: '联系我们',
      },
      {
        name: '专业版', price: 'RM99', tagline: '适合营业活跃的咖啡馆与餐厅',
        features: ['包含入门版全部功能', 'AI 发票扫描(每月 100 次)', '食材成本率', 'GrabFood / Foodpanda 追踪', '供应商分析', 'PDF 导出', 'AI 商业洞察'],
        cta: '预约演示',
      },
      {
        name: '高级版', price: 'RM239', tagline: '适合较大型与成长中的店群',
        features: ['包含专业版全部功能', '多店铺(规划中)', '员工与权限(规划中)', '定制报表', '优先支持', '每月 300 次 AI 扫描'],
        cta: '联系我们',
      },
    ],
  },
  disclaimer: '这是一个智能记账与盈亏可视化工具,并非正式会计、报税或 LHDN 电子发票软件。它是配合您的会计一起使用,而不是取代会计。',
  final: {
    title: '想知道你的餐饮生意是不是真的在赚钱吗?',
    sub:   '立即体验在线演示 —— 无需注册。',
  },
  footer: {
    tagline: '让马来西亚餐饮老板看清真实利润的智能记账系统。',
    login: '登录', demo: '查看演示', contact: '联系我们',
    rights: '版权所有。',
    mini:   '智能记账与盈亏可视化 —— 并非正式会计或报税软件。',
  },
}

export const getLandingCopy = (isZh: boolean): LandingCopy => (isZh ? zh : en)
