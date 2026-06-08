// Foundation for staff/role-based admin tools — maps each admin_users.role to
// the dashboard modules it may access. Dashboards for reception/housekeeping/
// maintenance/finance don't exist yet (later sprints); this only governs
// access to modules whose routes already exist today.

export type Module =
  | 'overview'
  | 'reception'
  | 'housekeeping'
  | 'maintenance'
  | 'finance'
  | 'reservations'
  | 'rooms'
  | 'guests'
  | 'availability'
  | 'settings'
  | 'payments'
  | 'staff'

export type Role =
  | 'super_admin'
  | 'admin'
  | 'staff'
  | 'manager'
  | 'reception'
  | 'housekeeping'
  | 'maintenance'
  | 'finance'

const ALL_MODULES: Module[] = [
  'overview', 'reception', 'housekeeping', 'maintenance', 'finance',
  'reservations', 'rooms', 'guests', 'availability', 'settings', 'payments', 'staff',
]

// '*' means unrestricted — used by super_admin/admin for full legacy-compatible access.
const ROLE_MODULES: Record<Role, '*' | Module[]> = {
  super_admin:  '*',
  admin:        '*',
  manager:      ['overview', 'reception', 'housekeeping', 'maintenance', 'finance', 'reservations', 'rooms', 'guests', 'availability', 'settings', 'payments'],
  reception:    ['reception', 'reservations', 'guests'],
  housekeeping: ['housekeeping'],
  maintenance:  ['maintenance'],
  finance:      ['finance', 'payments'],
  staff:        ['overview'],
}

function modulesFor(role: string): '*' | Module[] {
  return ROLE_MODULES[role as Role] ?? []
}

export function canAccessModule(role: string, module: Module): boolean {
  const modules = modulesFor(role)
  return modules === '*' || modules.includes(module)
}

export function getVisibleModules(role: string): Module[] {
  const modules = modulesFor(role)
  return modules === '*' ? ALL_MODULES : modules
}
