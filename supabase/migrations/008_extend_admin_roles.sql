-- Foundation for staff/role-based admin tools (hotel operations sprint).
-- Extends the admin_users role enum with operational department roles.
-- Existing roles (super_admin, admin, staff) and existing rows are untouched —
-- this is purely additive so current admins keep working exactly as before.
-- Module-level enforcement of these roles lives in src/lib/permissions.ts.
ALTER TABLE admin_users DROP CONSTRAINT admin_users_role_check;

ALTER TABLE admin_users ADD CONSTRAINT admin_users_role_check CHECK (
  role IN (
    'super_admin', 'admin', 'staff',
    'manager', 'reception', 'housekeeping', 'maintenance', 'finance'
  )
);

COMMENT ON COLUMN admin_users.role IS
  'super_admin/admin: full panel access. manager: full operational access (no staff management). reception/housekeeping/maintenance/finance: scoped to their department module(s) — see src/lib/permissions.ts for the role→module map. staff: legacy generic role, overview only.';
