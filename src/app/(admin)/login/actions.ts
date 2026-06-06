'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export type LoginState = { error: string } | null

export async function signInAction(
  _prev: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const email = ((formData.get('email') as string) ?? '').trim()
  const password = (formData.get('password') as string) ?? ''

  if (!email || !password) {
    return { error: 'Preencha o e-mail e a senha.' }
  }

  const supabase = await createClient()
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })

  if (error || !data.user) {
    return { error: 'E-mail ou senha incorretos.' }
  }

  // Record the login time. Silently ignored if user is not in admin_users.
  const adminDb = createAdminClient()
  await adminDb
    .from('admin_users')
    .update({ last_login_at: new Date().toISOString() })
    .eq('id', data.user.id)

  redirect('/dashboard')
}
