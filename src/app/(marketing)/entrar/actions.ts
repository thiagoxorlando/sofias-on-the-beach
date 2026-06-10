'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export type GuestLoginState = { error: string } | undefined

function safeNext(raw: unknown): string {
  if (typeof raw !== 'string') return '/minha-conta'
  const url = raw.trim()
  if (!url.startsWith('/') || url.startsWith('//')) return '/minha-conta'
  return url
}

export async function guestSignInAction(
  _prev: GuestLoginState,
  formData: FormData,
): Promise<GuestLoginState> {
  const email    = ((formData.get('email')    as string) ?? '').trim().toLowerCase()
  const password =  (formData.get('password') as string) ?? ''
  const next     = safeNext(formData.get('next'))

  if (!email || !password) return { error: 'Preencha o e-mail e a senha.' }

  const db = createAdminClient()

  // Check if this is a staff / admin account
  const { data: adminRecord } = await db
    .from('admin_users')
    .select('id, role, is_active')
    .eq('email', email)
    .maybeSingle()

  if (adminRecord) {
    if (!adminRecord.is_active) {
      return {
        error:
          'Seu usuário ainda não tem permissão de acesso ao painel. Fale com a administração.',
      }
    }

    // Active staff — authenticate
    const supabase = await createClient()
    const { error: authErr } = await supabase.auth.signInWithPassword({ email, password })
    if (authErr) return { error: 'E-mail ou senha inválidos.' }

    // Record login time
    await db
      .from('admin_users')
      .update({ last_login_at: new Date().toISOString() })
      .eq('id', adminRecord.id)

    // Role-based redirect
    const dest = adminRecord.role === 'reception' ? '/dashboard/reception' : '/dashboard'
    redirect(dest)
  }

  // Guest / regular user flow
  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) return { error: 'E-mail ou senha inválidos.' }

  redirect(next)
}
