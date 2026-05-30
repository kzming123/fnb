/**
 * P&L PDF Export — builds a standalone HTML document and opens it in a new
 * window, then triggers the browser's native print dialog.
 *
 * No npm package required. The user prints to PDF via the browser's
 * "Save as PDF" option in the print dialog (supported by all major browsers).
 */

// ─── Input type ───────────────────────────────────────────────────────────────

export interface PnLPrintInput {
  businessName: string
  period:       string   // e.g. "May 2026" or "2026年5月"
  generatedOn:  string   // formatted date string
  isZh:         boolean

  // Revenue
  totalRevenue: number
  dineIn:       number
  takeaway:     number
  grabFood:     number
  foodpanda:    number
  shopeeFood:   number
  catering:     number

  // COGS
  totalCogs:       number
  foodCostPercent: number
  cogsItems:       Array<{ label: string; amount: number }>

  // Gross profit
  grossProfit:        number
  grossMarginPercent: number

  // Opex
  operatingExpenses: number
  opexItems:         Array<{ label: string; amount: number }>

  // Net profit
  netProfit:        number
  netMarginPercent: number

  // Optional
  daysLogged?:  number
  aiSummary?:   string
  topSuppliers?: Array<{ name: string; totalSpend: number; pctOfCogs: number }>
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function rm(n: number): string {
  return `RM ${n.toLocaleString('en-MY', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function pct(n: number): string {
  return `${n.toFixed(1)}%`
}

function row(label: string, amount: number, rev: number, indent = false): string {
  const pctStr = rev > 0 ? pct((amount / rev) * 100) : '0.0%'
  return `
    <tr>
      <td style="padding:6px 8px;font-size:13px;color:#374151;${indent ? 'padding-left:24px;' : ''}">${label}</td>
      <td style="padding:6px 8px;text-align:right;font-size:11px;color:#9ca3af;width:60px;">${pctStr}</td>
      <td style="padding:6px 8px;text-align:right;font-size:13px;font-weight:500;color:#1f2937;width:140px;font-variant-numeric:tabular-nums;">${rm(amount)}</td>
    </tr>`
}

function boldRow(label: string, amount: number, pctStr: string, color = '#1f2937'): string {
  return `
    <tr style="border-top:2px solid #e5e7eb;">
      <td style="padding:8px;font-size:14px;font-weight:700;color:${color};">${label}</td>
      <td style="padding:8px;text-align:right;font-size:12px;color:#6b7280;width:60px;">${pctStr}</td>
      <td style="padding:8px;text-align:right;font-size:15px;font-weight:700;color:${color};width:140px;font-variant-numeric:tabular-nums;">${rm(amount)}</td>
    </tr>`
}

function sectionHead(label: string): string {
  return `
    <tr>
      <td colspan="3" style="padding:12px 8px 4px;font-size:10px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:#9ca3af;">${label}</td>
    </tr>`
}

// ─── Main HTML builder ────────────────────────────────────────────────────────

export function buildPnLHTML(d: PnLPrintInput): string {
  const L = d.isZh ? {
    title:      '盈亏报表',
    subtitle:   '月度损益报告',
    period:     d.period,
    generated:  `生成于 ${d.generatedOn}`,
    revenue:    '营业额',
    dineIn:     '堂食',
    takeaway:   '外带',
    grab:       'GrabFood',
    foodpanda:  'Foodpanda',
    shopee:     'ShopeeFood',
    catering:   '宴席销售',
    cogs:       '食材成本（COGS）',
    grossProfit:'毛利润',
    grossMargin:'毛利率',
    opex:       '运营费用',
    netProfit:  '净利润',
    netMargin:  '净利率',
    foodCost:   '食材成本率',
    summary:    '财务摘要',
    aiInsight:  'AI 商业洞察',
    topSuppliers: '主要供应商',
    ofCogs:     '占食材成本',
    daysLogged: '已记录天数',
    printBtn:   '打印 / 保存为 PDF',
    liveData:   '实时数据',
  } : {
    title:      'Profit & Loss Report',
    subtitle:   'Monthly P&L Statement',
    period:     d.period,
    generated:  `Generated on ${d.generatedOn}`,
    revenue:    'Revenue',
    dineIn:     'Dine-in',
    takeaway:   'Takeaway',
    grab:       'GrabFood',
    foodpanda:  'Foodpanda',
    shopee:     'ShopeeFood',
    catering:   'Catering',
    cogs:       'Cost of Goods Sold (COGS)',
    grossProfit:'Gross Profit',
    grossMargin:'Gross Margin',
    opex:       'Operating Expenses',
    netProfit:  'Net Profit',
    netMargin:  'Net Margin',
    foodCost:   'Food Cost %',
    summary:    'Financial Summary',
    aiInsight:  'Business Insight',
    topSuppliers: 'Top Suppliers',
    ofCogs:     'of food cost',
    daysLogged: 'Days with sales',
    printBtn:   'Print / Save as PDF',
    liveData:   'Live Data',
  }

  const rev = d.totalRevenue

  // Build revenue rows (skip zero-value channels)
  const revenueRows = [
    [L.dineIn,    d.dineIn],
    [L.takeaway,  d.takeaway],
    [L.grab,      d.grabFood],
    [L.foodpanda, d.foodpanda],
    [L.shopee,    d.shopeeFood],
    [L.catering,  d.catering],
  ].filter(([, v]) => (v as number) > 0)
    .map(([label, amount]) => row(label as string, amount as number, rev, true))
    .join('')

  // Build COGS rows
  const cogsRows = d.cogsItems
    .filter(c => c.amount > 0)
    .map(c => row(c.label, c.amount, rev, true))
    .join('')

  // Build opex rows
  const opexRows = d.opexItems
    .filter(o => o.amount > 0)
    .map(o => row(o.label, o.amount, rev, true))
    .join('')

  // Summary pills
  const pills = [
    [L.foodCost,   pct(d.foodCostPercent),   d.foodCostPercent < 35 ? '#d1fae5' : d.foodCostPercent < 40 ? '#fef3c7' : '#fee2e2'],
    [L.grossMargin, pct(d.grossMarginPercent), '#dbeafe'],
    [L.netMargin,   pct(d.netMarginPercent),   d.netProfit >= 0 ? '#d1fae5' : '#fee2e2'],
  ].map(([label, value, bg]) => `
    <div style="display:inline-block;background:${bg};border-radius:8px;padding:10px 14px;margin:4px;min-width:100px;text-align:center;">
      <div style="font-size:11px;color:#6b7280;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;">${label}</div>
      <div style="font-size:18px;font-weight:700;color:#1f2937;margin-top:2px;">${value}</div>
    </div>`).join('')

  // Top suppliers section
  const suppliersSection = d.topSuppliers && d.topSuppliers.length > 0 ? `
    <div style="margin-top:24px;">
      <div style="font-size:10px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:#9ca3af;margin-bottom:10px;">${L.topSuppliers}</div>
      ${d.topSuppliers.map((s, i) => `
        <div style="display:flex;align-items:center;gap:12px;padding:8px 0;border-bottom:1px solid #f3f4f6;">
          <div style="width:20px;height:20px;background:#e0e7ff;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:700;color:#4f46e5;">${i + 1}</div>
          <div style="flex:1;font-size:13px;color:#374151;">${s.name}</div>
          <div style="font-size:11px;color:#9ca3af;">${s.pctOfCogs.toFixed(1)}% ${L.ofCogs}</div>
          <div style="font-size:13px;font-weight:600;color:#1f2937;">${rm(s.totalSpend)}</div>
        </div>`).join('')}
    </div>` : ''

  // AI insight section
  const insightSection = d.aiSummary ? `
    <div style="margin-top:24px;background:#f0f0ff;border-radius:10px;padding:14px 16px;">
      <div style="font-size:10px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:#6366f1;margin-bottom:8px;">${L.aiInsight}</div>
      <p style="font-size:13px;color:#374151;line-height:1.6;margin:0;">${d.aiSummary}</p>
    </div>` : ''

  return `<!DOCTYPE html>
<html lang="${d.isZh ? 'zh-CN' : 'en'}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${L.title} — ${d.businessName}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, 'Inter', 'PingFang SC', system-ui, sans-serif;
      background: #fff;
      color: #1f2937;
      padding: 32px;
      max-width: 800px;
      margin: 0 auto;
    }
    table { width: 100%; border-collapse: collapse; }
    @media print {
      body { padding: 12px; }
      .no-print { display: none !important; }
      @page { margin: 1.5cm; }
    }
  </style>
</head>
<body>
  <!-- Print button (hidden during actual print) -->
  <div class="no-print" style="display:flex;justify-content:flex-end;margin-bottom:16px;">
    <button onclick="window.print()" style="
      background:#4f46e5;color:#fff;border:none;border-radius:8px;
      padding:9px 20px;font-size:13px;font-weight:600;cursor:pointer;
      display:flex;align-items:center;gap:6px;">
      🖨 ${L.printBtn}
    </button>
  </div>

  <!-- Header -->
  <div style="background:#0f172a;color:#fff;border-radius:12px;padding:24px 28px;margin-bottom:24px;">
    <div style="font-size:11px;font-weight:600;letter-spacing:0.15em;text-transform:uppercase;color:#64748b;margin-bottom:4px;">
      ${d.businessName}
    </div>
    <h1 style="font-size:20px;font-weight:700;color:#fff;margin-bottom:2px;">${L.title}</h1>
    <p style="font-size:14px;color:#94a3b8;">${L.period}</p>
    <p style="font-size:11px;color:#475569;margin-top:8px;">${L.generated}${d.daysLogged ? ` · ${d.daysLogged} ${L.daysLogged}` : ''}</p>
  </div>

  <!-- Summary pills -->
  <div style="text-align:center;margin-bottom:24px;">
    ${pills}
  </div>

  <!-- P&L Statement -->
  <div style="border:1px solid #e5e7eb;border-radius:12px;overflow:hidden;margin-bottom:24px;">
    <table>
      <tbody>
        ${sectionHead(L.revenue)}
        ${revenueRows}
        ${boldRow(L.revenue, d.totalRevenue, '100%', '#1d4ed8')}

        ${sectionHead(L.cogs)}
        ${cogsRows || `<tr><td colspan="3" style="padding:8px 8px 8px 24px;font-size:12px;color:#9ca3af;">${d.isZh ? '暂无已确认发票' : 'No confirmed invoices'}</td></tr>`}
        ${boldRow(L.cogs, d.totalCogs, pct(d.foodCostPercent), '#b91c1c')}

        <tr style="background:#f0fdf4;">
          <td colspan="3" style="padding:10px 8px;">
            <div style="display:flex;align-items:center;justify-content:space-between;">
              <div>
                <div style="font-size:14px;font-weight:700;color:#065f46;">${L.grossProfit}</div>
                <div style="font-size:11px;color:#059669;margin-top:1px;">${L.grossMargin}: ${pct(d.grossMarginPercent)}</div>
              </div>
              <div style="font-size:18px;font-weight:700;color:#065f46;font-variant-numeric:tabular-nums;">${rm(d.grossProfit)}</div>
            </div>
          </td>
        </tr>

        ${sectionHead(L.opex)}
        ${opexRows || `<tr><td colspan="3" style="padding:8px 8px 8px 24px;font-size:12px;color:#9ca3af;">${d.isZh ? '暂无运营费用记录' : 'No operating expenses'}</td></tr>`}
        ${boldRow(L.opex, d.operatingExpenses, pct(rev > 0 ? (d.operatingExpenses / rev) * 100 : 0), '#c2410c')}

        <tr style="background:${d.netProfit >= 0 ? '#f0fdf4' : '#fef2f2'};">
          <td colspan="3" style="padding:14px 8px;">
            <div style="display:flex;align-items:center;justify-content:space-between;">
              <div>
                <div style="font-size:14px;font-weight:700;text-transform:uppercase;letter-spacing:0.05em;color:${d.netProfit >= 0 ? '#065f46' : '#991b1b'};">${L.netProfit}</div>
                <div style="font-size:11px;color:${d.netProfit >= 0 ? '#059669' : '#dc2626'};margin-top:1px;">${L.netMargin}: ${pct(d.netMarginPercent)}</div>
              </div>
              <div style="font-size:22px;font-weight:700;color:${d.netProfit >= 0 ? '#065f46' : '#991b1b'};font-variant-numeric:tabular-nums;">${rm(d.netProfit)}</div>
            </div>
          </td>
        </tr>
      </tbody>
    </table>
  </div>

  ${suppliersSection}
  ${insightSection}

  <!-- Footer -->
  <div style="margin-top:28px;border-top:1px solid #f3f4f6;padding-top:12px;display:flex;justify-content:space-between;align-items:center;">
    <p style="font-size:11px;color:#9ca3af;">${d.businessName} · ${L.generated}</p>
    <p style="font-size:10px;color:#d1d5db;">F&amp;B Smart Ledger</p>
  </div>
</body>
</html>`
}

// ─── Print window launcher ────────────────────────────────────────────────────

/**
 * Opens a new browser window containing the P&L HTML and triggers print.
 * The user saves to PDF via the browser's native "Save as PDF" print option.
 */
export function printPnL(html: string): void {
  const w = window.open('', '_blank', 'width=900,height=720,scrollbars=yes')
  if (!w) {
    // Popup blocked — fall back to current window print
    const blob = new Blob([html], { type: 'text/html;charset=utf-8' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href     = url
    a.download = 'pnl-report.html'
    a.click()
    setTimeout(() => URL.revokeObjectURL(url), 200)
    return
  }
  w.document.write(html)
  w.document.close()
  w.focus()
  // Small delay to let styles render before the print dialog opens
  setTimeout(() => w.print(), 600)
}
