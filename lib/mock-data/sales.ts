// ─── Daily Sales mock data ────────────────────────────────────────────────────

export interface SalesEntry {
  id: string
  date: string

  // Sales by channel
  dineIn:     number
  takeaway:   number
  grabFood:   number
  foodpanda:  number
  shopeeFood: number
  totalSales: number   // auto-computed: sum of channels

  // Platform commission — null = not entered, app uses estimated rate
  grabFoodCommission?:  number | null
  foodpandaCommission?: number | null
  shopeeCommission?:    number | null

  // Payment method breakdown
  cash:          number
  card:          number
  eWallet:       number
  totalPayments: number // auto-computed: sum of payments

  notes: string
}

// ─── Generator ────────────────────────────────────────────────────────────────

function entry(
  id: string,
  date: string,
  dineIn: number,
  takeaway: number,
  grabFood: number,
  foodpanda: number,
  shopeeFood: number,
  cash: number,
  card: number,
  eWallet: number,
  notes = ''
): SalesEntry {
  return {
    id,
    date,
    dineIn, takeaway, grabFood, foodpanda, shopeeFood,
    totalSales: dineIn + takeaway + grabFood + foodpanda + shopeeFood,
    cash, card, eWallet,
    totalPayments: cash + card + eWallet,
    notes,
  }
}

// ─── 30 days of mock entries (May 2026) ──────────────────────────────────────
// Columns: id | date | dine-in | takeaway | grab | panda | shopee | cash | card | ewallet | notes

export const mockSalesData: SalesEntry[] = [
  entry('s001','2026-05-29', 1258, 658,  448, 274, 144, 1000, 980, 802, 'Payday Thursday'),
  entry('s002','2026-05-28', 1128, 590,  401, 245, 129, 890,  882, 721),
  entry('s003','2026-05-27', 1482, 775,  526, 322, 170, 1175, 1090, 1010),
  entry('s004','2026-05-26', 1575, 823,  558, 342, 180, 1248, 1158, 1072),
  entry('s005','2026-05-25', 1296, 677,  459, 281, 148, 1026, 950,  885, 'Hari Raya — high traffic'),
  entry('s006','2026-05-24', 1188, 621,  421, 258, 136, 940,  872,  812),
  entry('s007','2026-05-23', 766,  400,  272, 166,  88, 606,  562,  524, 'Low traffic — heavy rain'),
  entry('s008','2026-05-22', 1105, 578,  392, 240, 127, 875,  812,  755),
  entry('s009','2026-05-21', 987,  516,  350, 214, 113, 781,  724,  675),
  entry('s010','2026-05-20', 1257, 658,  446, 273, 144, 996,  922,  860),
  entry('s011','2026-05-19', 1323, 692,  469, 287, 151, 1048, 970,  904),
  entry('s012','2026-05-18', 1521, 795,  539, 330, 174, 1204, 1116, 1039),
  entry('s013','2026-05-17', 1408, 736,  499, 305, 161, 1114, 1033,  962),
  entry('s014','2026-05-16', 1620, 847,  574, 351, 185, 1282, 1189, 1106, 'School holiday weekend'),
  entry('s015','2026-05-15', 1188, 621,  421, 258, 136, 940,  870,  814),
  entry('s016','2026-05-14', 1071, 560,  380, 232, 122, 847,  785,  733),
  entry('s017','2026-05-13', 1215, 635,  430, 263, 139, 961,  890,  831),
  entry('s018','2026-05-12', 1350, 706,  478, 293, 154, 1069, 990,  922),
  entry('s019','2026-05-11', 1485, 776,  526, 322, 170, 1175, 1088, 1016),
  entry('s020','2026-05-10', 1125, 588,  398, 244, 129, 890,  824,  770),
  entry('s021','2026-05-09', 788,  412,  279, 171,  90, 624,  578,  538, 'Slow day'),
  entry('s022','2026-05-08', 1048, 548,  371, 227, 120, 829,  768,  717),
  entry('s023','2026-05-07', 1188, 621,  421, 258, 136, 940,  870,  814),
  entry('s024','2026-05-06', 1296, 677,  459, 281, 148, 1026, 950,  885),
  entry('s025','2026-05-05', 1404, 734,  497, 304, 161, 1112, 1030,  958, 'Labour Day long weekend'),
  entry('s026','2026-05-04', 1512, 790,  536, 328, 173, 1198, 1110, 1031),
  entry('s027','2026-05-03', 1188, 621,  421, 258, 136, 940,  870,  814),
  entry('s028','2026-05-02', 1071, 560,  380, 232, 122, 847,  785,  733),
  entry('s029','2026-05-01', 972,  508,  345, 211, 111, 769,  712,  666, 'Labour Day — closed lunch'),
  entry('s030','2026-04-30', 1350, 706,  478, 293, 154, 1070, 990,  921),
]

// ─── Derived stats ────────────────────────────────────────────────────────────

export function getMay2026Entries() {
  return mockSalesData.filter((e) => e.date.startsWith('2026-05'))
}

const mayEntries = getMay2026Entries()

export const salesStats = {
  todaySales:  mockSalesData[0].totalSales,
  todayDelta:  ((mockSalesData[0].totalSales - mockSalesData[1].totalSales) / mockSalesData[1].totalSales) * 100,

  weekSales:   mockSalesData.slice(0, 7).reduce((s, e) => s + e.totalSales, 0),
  weekDelta:   3.8,

  monthSales:  mayEntries.reduce((s, e) => s + e.totalSales, 0),
  monthDelta:  8.2,

  avgDaily:    mayEntries.reduce((s, e) => s + e.totalSales, 0) / mayEntries.length,

  // Payment method totals (May)
  totalCash:    mayEntries.reduce((s, e) => s + e.cash,    0),
  totalCard:    mayEntries.reduce((s, e) => s + e.card,    0),
  totalEWallet: mayEntries.reduce((s, e) => s + e.eWallet, 0),

  // Channel totals (May)
  totalDineIn:   mayEntries.reduce((s, e) => s + e.dineIn,    0),
  totalTakeaway: mayEntries.reduce((s, e) => s + e.takeaway,  0),
  totalGrab:     mayEntries.reduce((s, e) => s + e.grabFood,  0),
  totalFoodpanda:mayEntries.reduce((s, e) => s + e.foodpanda, 0),
  totalShopee:   mayEntries.reduce((s, e) => s + e.shopeeFood,0),
}

// ─── Blank form state (export for form reset) ─────────────────────────────────

export interface SalesFormState {
  date:       string
  dineIn:     string
  takeaway:   string
  grabFood:   string
  foodpanda:  string
  shopeeFood: string
  // Commission — empty string means "not entered, use estimated"
  grabFoodCommission:  string
  foodpandaCommission: string
  shopeeCommission:    string
  cash:    string
  card:    string
  eWallet: string
  notes:   string
}

export const blankForm: SalesFormState = {
  date: (() => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}` })(),
  dineIn: '', takeaway: '', grabFood: '', foodpanda: '', shopeeFood: '',
  grabFoodCommission: '', foodpandaCommission: '', shopeeCommission: '',
  cash: '', card: '', eWallet: '',
  notes: '',
}

// null = not entered (app estimates from rate), number = user-confirmed
function commOrNull(v: string): number | null {
  const trimmed = v.trim()
  if (trimmed === '') return null
  const parsed = parseFloat(trimmed)
  return isNaN(parsed) ? null : parsed
}

export function formToEntry(form: SalesFormState, id: string): SalesEntry {
  const n = (v: string) => parseFloat(v) || 0
  const dineIn = n(form.dineIn), takeaway = n(form.takeaway)
  const grabFood = n(form.grabFood), foodpanda = n(form.foodpanda), shopeeFood = n(form.shopeeFood)
  const cash = n(form.cash), card = n(form.card), eWallet = n(form.eWallet)
  return {
    id, date: form.date,
    dineIn, takeaway, grabFood, foodpanda, shopeeFood,
    totalSales: dineIn + takeaway + grabFood + foodpanda + shopeeFood,
    grabFoodCommission:  commOrNull(form.grabFoodCommission),
    foodpandaCommission: commOrNull(form.foodpandaCommission),
    shopeeCommission:    commOrNull(form.shopeeCommission),
    cash, card, eWallet,
    totalPayments: cash + card + eWallet,
    notes: form.notes,
  }
}
