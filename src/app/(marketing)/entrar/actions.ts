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

  // Block admin/staff accounts from the guest login form
  const db = createAdminClient()
  const { data: adminRecord } = await db
    .from('admin_users')
    .select('id')
    .eq('email', email)
    .eq('is_active', true)
    .maybeSingle()
  if (adminRecord) {
    return { error: 'Esta conta é de funcionário da pousada. Use o acesso administrativo no rodapé do site para entrar no painel.' }
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) return { error: 'E-mail ou senha incorretos, ou sua conta ainda não foi confirmada.' }

  redirect(next)
}
