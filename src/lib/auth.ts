import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'

export type GuestSession = {
  id: string
  email: string
  full_name: string
  phone: string | null
  cpf: string | null
  authUserId: string
}

export type AdminSession = {
  id: string
  email: string
  full_name: string
  role: string
}

export async function getCurrentUser() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

export async function isAdminUser(userId: string): Promise<boolean> {
  const db = createAdminClient()
  const { data } = await db
    .from('admin_users')
    .select('id')
    .eq('id', userId)
    .eq('is_active', true)
    .maybeSingle()
  return !!data
}

export async function getCurrentAdmin(): Promise<AdminSession | null> {
  const user = await getCurrentUser()
  if (!user) return null
  const db = createAdminClient()
  const { data } = await db
    .from('admin_users')
    .select('id, email, full_name, role')
    .eq('id', user.id)
    .eq('is_active', true)
    .maybeSingle()
  return data ?? null
}

export async function getCurrentGuest(): Promise<GuestSession | null> {
  const user = await getCurrentUser()
  if (!user?.email) return null
  if (await isAdminUser(user.id)) return null
  const db = createAdminClient()
  const { data: guest } = await db
    .from('guests')
    .select('id, email, full_name, phone, cpf')
    .eq('email', user.email)
    .maybeSingle()
  if (!guest) return null
  return { ...guest, authUserId: user.id }
}

export async function requireAdmin(): Promise<AdminSession> {
  const admin = await getCurrentAdmin()
  if (!admin) redirect('/login')
  return admin
}

export async function requireGuest(nextPath?: string): Promise<GuestSession> {
  const user = await getCurrentUser()
  if (!user) {
    const dest = nextPath ?? '/minha-conta'
    redirect(`/entrar?next=${encodeURIComponent(dest)}`)
  }
  if (await isAdminUser(user.id)) {
    redirect('/entrar?msg=admin_account')
  }
  const db = createAdminClient()
  const { data: guest } = await db
    .from('guests')
    .select('id, email, full_name, phone, cpf')
    .eq('email', user.email!)
    .maybeSingle()
  if (!guest) redirect('/criar-conta')
  return { ...guest, authUserId: user.id }
}
