// Shared row type for the staff management UI.
// Matches the admin_users columns used here — id, email, full_name, role,
// is_active, last_login_at, created_at.

export type StaffRow = {
  id: string
  email: string
  full_name: string
  role: string
  is_active: boolean
  last_login_at: string | null
  created_at: string
}
