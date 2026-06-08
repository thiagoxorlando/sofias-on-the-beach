# Auth Architecture — Sofia's on the Beach

## Account Types

Two distinct account types share the same Supabase Auth project:

| Type | Table | Auth method | Access |
|------|-------|-------------|--------|
| Guest | `guests` | Email + password via `/entrar` | Booking flow, `/minha-conta` |
| Admin/Staff | `admin_users` | Email + password via `/login` | Dashboard (`/dashboard/*`) |

**Core rule**: A user in `admin_users` is staff. A user in `guests` is a booking customer. These must never overlap.

## How Account Type is Determined

1. **Supabase Auth** holds the session for both types.
2. After `auth.getUser()`, check `admin_users.id = user.id` (with `is_active = true`).
   - Match found → **admin/staff** account
   - No match → check `guests.email = user.email`
     - Match found → **guest** account
     - No match → unknown (shouldn't exist in normal flow)

## Auth Helpers (`src/lib/auth.ts`)

| Function | Returns | Description |
|----------|---------|-------------|
| `getCurrentUser()` | `User \| null` | Raw Supabase auth user from session |
| `isAdminUser(userId)` | `boolean` | True if userId is in active admin_users |
| `getCurrentAdmin()` | `AdminSession \| null` | Admin record or null |
| `getCurrentGuest()` | `GuestSession \| null` | Guest record or null (null if admin) |
| `requireAdmin()` | `AdminSession` | Redirects to `/login` if not admin |
| `requireModule(module)` | `AdminSession` | Like `requireAdmin()`, plus redirects to `/dashboard` if the role can't access that module (see below) |
| `requireGuest(nextPath?)` | `GuestSession` | Redirects to `/entrar` if not valid guest |

## Staff Roles & Module Permissions (`src/lib/permissions.ts`)

The dashboard has grown from a single admin tool into a staff operations system.
Every `admin_users` row has a `role`, and each role maps to the set of dashboard
**modules** it may access. A module roughly corresponds to one sidebar section /
route group (`reception`, `housekeeping`, `staff`, `payments`, etc.).

| Role | Label (PT-BR) | Module access |
|------|---------------|---------------|
| `super_admin` | Super Admin | `*` — every module, including Equipe (`staff`) |
| `admin` | Administrador | `*` — every module, including Equipe (`staff`) |
| `manager` | Gerente | All operational modules (reception, housekeeping, maintenance, finance, reservations, rooms, guests, availability, settings, payments) — **not** `staff` |
| `reception` | Recepção | `reception`, `reservations`, `guests` |
| `housekeeping` | Governança | `housekeeping` |
| `maintenance` | Manutenção | `maintenance` |
| `finance` | Financeiro | `finance`, `payments` |
| `staff` | Equipe (genérico) | `overview` only — legacy generic role |

Two helpers enforce this:
- `canAccessModule(role, module)` — used by `requireModule()` to guard pages, and
- `getVisibleModules(role)` — used by `DashboardShell` to filter the sidebar links

so a logged-in user only ever sees and reaches the sections their role covers.
The `staff` **module** (Equipe / `/dashboard/staff`) is intentionally left out of
every role's list except the `'*'` (super_admin/admin) sentinel — this is what
keeps staff-account management restricted to super_admin/admin without a
separate guard helper.

## Route Separation

| Area | Route prefix | Login | Table |
|------|--------------|-------|-------|
| Guest accounts & booking | `/entrar`, `/minha-conta`, `/reservar` | `/entrar` | `guests` |
| Staff & admin dashboard | `/dashboard/*` | `/login` | `admin_users` |
| Staff management (super_admin/admin only) | `/dashboard/staff` | `/login` | `admin_users` (+ `auth.users` via Admin API) |

`/login` is exclusively for staff/admin accounts; `/entrar` is exclusively for
guest accounts. Each flow blocks the other account type before creating a
session (see "Login Flows" below).

## Route Protection

### Proxy (`src/proxy.ts`)
Handles **unauthenticated** redirects:
- `/dashboard/*` → `/login` (no auth session)
- `/reservar` → `/entrar?next=...` (no auth session)
- `/minha-conta*` → `/entrar?next=...` (no auth session)

### Pages and Server Actions
Handle **account type** checks:
- Guest pages call `requireGuest()` → redirects admin to `/entrar?msg=admin_account`
- Admin pages call `requireAdmin()` → redirects guests to `/login`
- `createReservationAction` explicitly checks `admin_users` and blocks staff

## Login Flows

### Guest Login (`/entrar`)
1. Page: if admin is already logged in, shows "account is for staff" message
2. Action (`guestSignInAction`): checks `admin_users` by email **before** authenticating
   - If email is in `admin_users` → returns error (never creates session)
   - Otherwise → authenticates normally, redirects to `next` or `/minha-conta`

### Admin Login (`/login`)
- Separate page and action
- No cross-contamination with guest flow

## Staff Account Management (`/dashboard/staff`)

Only `super_admin`/`admin` can reach this route (`requireModule('staff')` denies
every other role — see "Staff Roles & Module Permissions"). It replaces the old
fully-manual process described in `docs/admin-setup.md` for day-to-day staff
account creation.

**Creating a staff user** (`createStaffAction`):
1. Validates full name, e-mail, temporary password (≥ 8 chars) and role
2. Calls `createAdminClient().auth.admin.createUser()` — creates the
   `auth.users` row with the temporary password and `email_confirm: true`
   (no confirmation e-mail step needed; Resend isn't wired up yet — Phase 3)
3. Inserts the matching `admin_users` row with the **same id**
4. If the `admin_users` insert fails, the just-created auth user is deleted —
   no orphaned logins without a role

**Editing a staff user** (`updateStaffAction`): only `full_name`, `role` and
`is_active` can change. Email and password are immutable here by design.

**Role isolation rules** enforced server-side on both create and edit:
- Only `super_admin` may assign, edit, or otherwise touch `super_admin` accounts
  — `admin` cannot create or elevate anyone to `super_admin`, nor edit an
  existing `super_admin`'s role/status
- A user can never deactivate their own account (`id === admin.id && !is_active`
  is rejected)
- Deleting accounts is not supported — deactivate (`is_active = false`) instead;
  a deactivated `admin_users` row fails the `is_active = true` check in
  `getCurrentAdmin()` / `isAdminUser()`, so the person is immediately locked out
  of `/dashboard` even with a valid Supabase session

**Resetting a password** (`resetStaffPasswordAction`): sets a new temporary
password directly via `auth.admin.updateUserById(id, { password })`. No email
is sent (same Phase 3 dependency as account creation) — the admin communicates
the new temporary password to the staff member directly (e.g. via WhatsApp) and
asks them to change it after logging in. Only `super_admin` can reset another
`super_admin`'s password.

## Booking Flow

```
A. Guest searches dates/guests
B. Guest chooses room on /quartos
C. Clicks "Reservar agora"
D. /reservar requires valid guest → calls requireGuest(currentUrl)
E. Not a valid guest → redirect to /entrar?next=/reservar?...
F. Guest logs in or creates account
G. Return to /reservar with same params
H. Guest confirms reservation details
I. createReservationAction runs:
   - Verifies auth session
   - Blocks admin accounts explicitly
   - Verifies guest record exists
   - Creates reservation (status: pending_payment)
   - Blocks dates in room_availability
   - Logs reservation_events row
J. Redirect to /reserva/[token]
K. Guest chooses PIX or card
L. Payment generated via Asaas
M. Webhook confirms → status: confirmed
N. Guest sees reservation in /minha-conta/reservas
```

## Security Notes

- `SUPABASE_SERVICE_ROLE_KEY` is used only server-side via `createAdminClient()`
- All database writes go through Server Actions or Route Handlers
- The `safeNext()` helper prevents open redirects (only allows relative paths starting with `/`)
- Admin accounts that try the guest login form (`/entrar`) are blocked before a session is created
