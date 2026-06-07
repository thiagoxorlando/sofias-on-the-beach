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
| `requireGuest(nextPath?)` | `GuestSession` | Redirects to `/entrar` if not valid guest |

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
