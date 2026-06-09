-- Adds housekeeping_supervisor as a distinct role for the Governança department lead.
-- This role gets the HousekeepingShell (dedicated workstation, no full admin menu)
-- and has full supervisor control over the housekeeping board (assign tasks, approve
-- rooms, manage reception requests). The existing 'housekeeping' role becomes
-- the cleaning staff role with a simplified task-focused screen.
-- Purely additive — no existing rows are modified.

ALTER TABLE admin_users DROP CONSTRAINT admin_users_role_check;

ALTER TABLE admin_users ADD CONSTRAINT admin_users_role_check CHECK (
  role IN (
    'super_admin', 'admin', 'staff',
    'manager', 'reception',
    'housekeeping', 'housekeeping_supervisor',
    'maintenance', 'finance'
  )
);

COMMENT ON COLUMN admin_users.role IS
  'super_admin/admin: full panel access. manager: full operational access (no staff management). '
  'reception/maintenance/finance: scoped to their department. '
  'housekeeping_supervisor: Governança department lead — full housekeeping controls, dedicated shell. '
  'housekeeping: cleaning staff — simplified task screen, cleaning actions only. '
  'staff: legacy generic role, overview only. '
  'See src/lib/permissions.ts for the role→module map.';
