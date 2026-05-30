/**
 * App-level role and permission definitions.
 * UI uses these to show/hide buttons and redirect restricted pages.
 * These are NOT a substitute for Supabase RLS — RLS enforces data isolation
 * at the DB layer; permissions enforce what actions are visible in the UI.
 */

export const USER_ROLES = ['owner', 'manager', 'staff', 'accountant'] as const
export type UserRole = (typeof USER_ROLES)[number]

// ─── Permission map ───────────────────────────────────────────────────────────
// Each key maps to the roles that are allowed to perform that action.

const PERMISSION_MAP = {
  // Dashboard
  view_dashboard:     ['owner', 'manager', 'staff', 'accountant'],
  view_net_profit:    ['owner', 'manager', 'accountant'],

  // Daily Sales
  add_sales:          ['owner', 'manager', 'staff'],
  edit_sales:         ['owner', 'manager'],
  delete_sales:       ['owner'],

  // Expenses
  add_expenses:       ['owner', 'manager', 'staff'],
  edit_expenses:      ['owner', 'manager'],
  delete_expenses:    ['owner'],

  // Suppliers
  add_suppliers:      ['owner', 'manager'],
  edit_suppliers:     ['owner', 'manager'],
  delete_suppliers:   ['owner'],

  // Invoice Scanner
  scan_invoices:      ['owner', 'manager', 'staff'],

  // Reports
  view_pnl:           ['owner', 'manager', 'accountant'],
  export_reports:     ['owner', 'manager', 'accountant'],

  // Settings — owner only
  access_settings:    ['owner'],
} as const satisfies Record<string, UserRole[]>

export type Permission = keyof typeof PERMISSION_MAP

// ─── Public helpers ───────────────────────────────────────────────────────────

/**
 * Returns true when `role` is allowed to perform `permission`.
 * Unknown roles and empty strings default to 'owner' so real users
 * are never accidentally blocked while role is still loading.
 */
export function can(role: UserRole | string, permission: Permission): boolean {
  const r: UserRole = USER_ROLES.includes(role as UserRole) ? (role as UserRole) : 'owner'
  return (PERMISSION_MAP[permission] as readonly string[]).includes(r)
}

export const ROLE_LABELS: Record<UserRole, { en: string; zh: string }> = {
  owner:      { en: 'Owner',      zh: '业主' },
  manager:    { en: 'Manager',    zh: '经理' },
  staff:      { en: 'Staff',      zh: '员工' },
  accountant: { en: 'Accountant', zh: '会计' },
}
