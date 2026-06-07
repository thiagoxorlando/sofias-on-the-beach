'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export type GuestSignUpState = { error: string } | { emailSent: true } | undefined

function safeNext(raw: unknown): string {
  if (typeof raw !== 'string') return '/minha-conta'
  const url = raw.trim()
  if (!url.startsWith('/') || url.startsWith('//')) return '/minha-conta'
  return url
}

export async function guestSignUpAction(
  _prev: GuestSignUpState,
  formData: FormData,
): Promise<GuestSignUpState> {
  const fullName = ((formData.get('full_name') as string) ?? '').trim()
  const email    = ((formData.get('email')     as string) ?? '').trim().toLowerCase()
  const password =  (formData.get('password')  as string) ?? ''
  const phone    = ((formData.get('phone')     as string) ?? '').trim() || null
  const next     = safeNext(formData.get('next'))

  if (!fullName) return { error: 'Nome completo é obrigatório.' }
  if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return { error: 'E-mail inválido.' }
  if (password.length < 6) return { error: 'A senha deve ter pelo menos 6 caracteres.' }

  const supabase = await createClient()
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { full_name: fullName } },
  })

  if (error) {
    if (error.message.toLowerCase().includes('already registered')) {
      return { error: 'Este e-mail já possui uma conta. Faça login.' }
    }
    return { error: 'Erro ao criar conta. Tente novamente.' }
  }

  // Keep guests table in sync — upsert preserves total_stays and other existing data
  const adminDb = createAdminClient()
  await adminDb.from('guests').upsert(
    { email, full_name: fullName, phone, nationality: 'BR' },
    { onConflict: 'email' },
  )

  // If Supabase returned a session, the user is immediately logged in
  if (data.session) {
    redirect(next)
  }

  // Email confirmation required
  return { emailSent: true }
}
