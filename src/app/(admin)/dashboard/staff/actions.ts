'use server'

import { revalidatePath } from 'next/cache'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireModule } from '@/lib/auth'
import type { Role } from '@/lib/permissions'

export type ActionState = { error: string } | { success: true } | undefined

const ASSIGNABLE_ROLES: Role[] = [
  'manager', 'reception', 'housekeeping', 'maintenance', 'finance', 'staff', 'admin', 'super_admin',
]

function str(formData: FormData, key: string): string {
  return ((formData.get(key) as string) ?? '').trim()
}

function isAssignableRole(value: string): value is Role {
  return (ASSIGNABLE_ROLES as readonly string[]).includes(value)
}

// ── Create staff user ─────────────────────────────────────────────────────────
// Two-step: create the auth.users row via the Supabase Auth admin API, then
// insert the matching admin_users row (id must equal auth.users.id). If the
// admin_users insert fails we roll back the auth user so we don't leave an
// orphaned login with no role/permissions.

export async function createStaffAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const admin = await requireModule('staff')

  const fullName = str(formData, 'full_name')
  const email = str(formData, 'email').toLowerCase()
  const password = str(formData, 'password')
  const role = str(formData, 'role')
  const isActive = formData.get('is_active') === 'on'

  if (!fullName) return { error: 'Informe o nome completo.' }
  if (!email) return { error: 'Informe o e-mail.' }
  if (password.length < 8) return { error: 'A senha temporária deve ter pelo menos 8 caracteres.' }
  if (!isAssignableRole(role)) return { error: 'Selecione um cargo válido.' }
  if (role === 'super_admin' && admin.role !== 'super_admin') {
    return { error: 'Apenas um Super Admin pode criar contas de Super Admin.' }
  }

  const db = createAdminClient()

  const { data: created, error: createError } = await db.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  })

  if (createError || !created.user) {
    if (createError?.code === 'email_exists') {
      return { error: 'Já existe uma conta com este e-mail.' }
    }
    return { error: 'Erro ao criar a conta de acesso. Tente novamente.' }
  }

  const { error: insertError } = await db.from('admin_users').insert({
    id: created.user.id,
    email,
    full_name: fullName,
    role,
    is_active: isActive,
  })

  if (insertError) {
    await db.auth.admin.deleteUser(created.user.id)
    return { error: 'Erro ao salvar os dados da equipe. Tente novamente.' }
  }

  revalidatePath('/dashboard/staff')
  return { success: true }
}

// ── Edit staff user ───────────────────────────────────────────────────────────
// Only full_name, role and is_active can change here. Self-deactivation and
// non-super_admin elevation/edit of super_admin accounts are blocked.

export async function updateStaffAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const admin = await requireModule('staff')

  const id = str(formData, 'id')
  const fullName = str(formData, 'full_name')
  const role = str(formData, 'role')
  const isActive = formData.get('is_active') === 'on'

  if (!id) return { error: 'Usuário inválido.' }
  if (!fullName) return { error: 'Informe o nome completo.' }
  if (!isAssignableRole(role)) return { error: 'Selecione um cargo válido.' }

  const db = createAdminClient()
  const { data: target } = await db
    .from('admin_users')
    .select('id, role')
    .eq('id', id)
    .maybeSingle()

  if (!target) return { error: 'Usuário não encontrado.' }

  if (id === admin.id && !isActive) {
    return { error: 'Você não pode desativar a sua própria conta.' }
  }
  if (admin.role !== 'super_admin' && (target.role === 'super_admin' || role === 'super_admin')) {
    return { error: 'Apenas um Super Admin pode editar ou conceder o cargo de Super Admin.' }
  }

  const { error } = await db
    .from('admin_users')
    .update({ full_name: fullName, role, is_active: isActive })
    .eq('id', id)

  if (error) return { error: 'Erro ao atualizar o usuário. Tente novamente.' }

  revalidatePath('/dashboard/staff')
  return { success: true }
}

// ── Set temporary password ────────────────────────────────────────────────────
// Sets the user's password directly via the Supabase Auth admin API — no email
// step required (Resend/transactional email isn't wired up yet, Phase 3).

export async function resetStaffPasswordAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const admin = await requireModule('staff')

  const id = str(formData, 'id')
  const password = str(formData, 'password')

  if (!id) return { error: 'Usuário inválido.' }
  if (password.length < 8) return { error: 'A nova senha deve ter pelo menos 8 caracteres.' }

  const db = createAdminClient()
  const { data: target } = await db
    .from('admin_users')
    .select('id, role')
    .eq('id', id)
    .maybeSingle()

  if (!target) return { error: 'Usuário não encontrado.' }
  if (admin.role !== 'super_admin' && target.role === 'super_admin') {
    return { error: 'Apenas um Super Admin pode redefinir a senha de outro Super Admin.' }
  }

  const { error } = await db.auth.admin.updateUserById(id, { password })
  if (error) return { error: 'Erro ao redefinir a senha. Tente novamente.' }

  return { success: true }
}
