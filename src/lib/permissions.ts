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
  | 'housekeeping_supervisor'
  | 'maintenance'
  | 'finance'

const ALL_MODULES: Module[] = [
  'overview', 'reception', 'housekeeping', 'maintenance', 'finance',
  'reservations', 'rooms', 'guests', 'availability', 'settings', 'payments', 'staff',
]

// '*' means unrestricted — used by super_admin/admin for full legacy-compatible access.
const ROLE_MODULES: Record<Role, '*' | Module[]> = {
  super_admin:             '*',
  admin:                   '*',
  manager:                 ['overview', 'reception', 'housekeeping', 'maintenance', 'finance', 'reservations', 'rooms', 'guests', 'availability', 'settings', 'payments'],
  reception:               ['reception', 'reservations', 'guests'],
  housekeeping:            ['housekeeping'],
  housekeeping_supervisor: ['housekeeping'],
  maintenance:             ['maintenance'],
  finance:                 ['finance', 'payments'],
  staff:                   ['overview'],
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

// True when the role should be treated as a housekeeping supervisor (full
// operational control over the board — assign tasks, approve rooms, mark ready).
// Both the dedicated housekeeping_supervisor role AND full-access roles qualify.
export function isHousekeepingSupervisor(role: string): boolean {
  return role !== 'housekeeping'
}
