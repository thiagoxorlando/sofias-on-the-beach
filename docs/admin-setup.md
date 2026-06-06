# Admin Setup Guide — Sofia's on the Beach

This document explains how to create and manage admin users for the backoffice panel at `/dashboard`.

---

## How admin access works

The system uses two separate layers:

1. **Supabase Auth** (`auth.users`) — handles email/password authentication
2. **`public.admin_users`** — controls access to the panel and defines the role

A user must exist in **both** tables to access the dashboard.  
If they are in `auth.users` but not in `admin_users`, the dashboard shows "Acesso não encontrado."  
If they are in `admin_users` but `is_active = false`, the dashboard shows "Conta desativada."

---

## Step 1 — Create the Supabase Auth user

1. Go to [supabase.com](https://supabase.com) and open your project
2. Click **Authentication** in the left menu
3. Click **Users** → **Add user** → **Create new user**
4. Enter the email and password
5. Click **Create user**
6. The new user appears in the list — **copy their UUID** (shown in the `id` column)

---

## Step 2 — Find the auth user UUID

If the user already exists:
1. Go to **Authentication → Users**
2. Find the user by email
3. Copy the UUID from the `id` column (format: `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`)

---

## Step 3 — Insert the admin_users row

### Required columns

| Column | Type | Required | Notes |
|---|---|---|---|
| `id` | uuid | YES | Must match `auth.users.id` exactly |
| `email` | text | YES | Should match the auth user email |
| `full_name` | text | YES | Display name in the panel |
| `role` | text | YES | One of: `super_admin`, `admin`, `staff` |
| `is_active` | boolean | NO | Defaults to `true` |

> **NEVER use `name`.** The column is `full_name`.

### Run the insert in Supabase SQL Editor

Go to **SQL Editor** in your Supabase project and run:

```sql
INSERT INTO public.admin_users (id, email, full_name, role, is_active)
VALUES (
  'paste-the-uuid-here',
  'user@email.com',
  'Full Name',
  'admin',       -- or 'super_admin' or 'staff'
  true
)
ON CONFLICT (id) DO UPDATE SET
  email     = EXCLUDED.email,
  full_name = EXCLUDED.full_name,
  role      = EXCLUDED.role,
  is_active = EXCLUDED.is_active;
```

### Or use the Node.js seed script

If you need to run it programmatically:

```bash
node --env-file=.env.local scripts/seed-admin.mjs
```

> The seed script is only for initial setup. Delete it after use.

---

## Role reference

| Role | Label in panel | Access |
|---|---|---|
| `super_admin` | Super Admin | Full access + can manage other admins |
| `admin` | Administrador | Full access to reservations, rooms, guests |
| `staff` | Equipe | Operational access (check-in/out, notes) |

---

## How to deactivate an admin user

```sql
UPDATE public.admin_users
SET is_active = false
WHERE email = 'user@email.com';
```

The user will still be able to log in via Supabase Auth, but the dashboard will show "Conta desativada" and they cannot see any content.

To reactivate:

```sql
UPDATE public.admin_users
SET is_active = true
WHERE email = 'user@email.com';
```

---

## How to test /login and /dashboard

1. Start the dev server: `npm run dev`
2. Go to `http://localhost:3000/login`
3. Enter the email and password for a user in both `auth.users` and `admin_users`
4. The form submits → redirects to `/dashboard`
5. The dashboard shows the user's `full_name`, `email`, and `role` in the top bar

### To test the "no access" state:
- Sign in with an email that exists in `auth.users` but NOT in `admin_users`
- Dashboard shows: "Sua conta ainda não tem acesso ao painel."

### To test the "deactivated" state:
- Set `is_active = false` in `admin_users` for a user
- Sign in — dashboard shows: "Sua conta está desativada."

---

## What happens on login

1. `signInAction` calls `supabase.auth.signInWithPassword`
2. On success, it updates `admin_users.last_login_at = now()` (silently skipped if user is not in admin_users)
3. Redirects to `/dashboard`
4. The dashboard page queries `admin_users` using the service role (bypasses RLS)
5. Renders the correct state based on whether the row exists and `is_active`

---

## Security notes

- `SUPABASE_SERVICE_ROLE_KEY` is used **only in server files** — never in browser code
- All database writes go through Server Actions, never client-side
- The proxy (`src/proxy.ts`) redirects unauthenticated requests away from `/dashboard/*` before the page renders
- Role validation happens via RLS policies in addition to the application-level check
