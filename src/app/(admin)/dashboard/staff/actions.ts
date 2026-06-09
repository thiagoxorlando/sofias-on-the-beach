'use server'

import { revalidatePath } from 'next/cache'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireModule } from '@/lib/auth'
import type { Role } from '@/lib/permissions'

export type ActionState = { error: string } | { success: true } | undefined

export type DeleteStaffResult =
  | { error: string }
  | { archived: true }
  | { deleted: true }

const ASSIGNABLE_ROLES: Role[] = [
  'manager', 'reception',
  'housekeeping', 'housekeeping_supervisor',
  'maintenance', 'finance', 'staff', 'admin', 'super_admin',
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
    if (insertError.code === '23514') {
      return { error: 'Esse cargo ainda não existe no banco. Rode a migration 016_add_housekeeping_supervisor_role.sql no Supabase.' }
    }
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

  if (error) {
    if (error.code === '23514') {
      return { error: 'Esse cargo ainda não existe no banco. Rode a migration 016_add_housekeeping_supervisor_role.sql no Supabase.' }
    }
    return { error: 'Erro ao atualizar o usuário. Tente novamente.' }
  }

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

// ── Delete staff user ─────────────────────────────────────────────────────────
// "Deactivate" (via updateStaffAction) stays the recommended path — this is the
// dangerous, permanent alternative. Only super_admin may use it; self-delete and
// non-super_admin deletion of super_admin accounts are blocked the same way
// updateStaffAction blocks self-deactivation and cross-role super_admin edits.
//
// Hard delete is only safe when the account has NO linked history. FK reality
// (checked against supabase/migrations — see 001_initial_schema.sql,
// 005_add_manual_payment_confirmation.sql, 009_add_housekeeping.sql,
// 010_add_maintenance.sql):
//   - admin_users.id            → auth.users(id)        ON DELETE CASCADE
//   - reservation_notes.admin_user_id  → admin_users(id) ON DELETE SET NULL
//   - settings.updated_by              → admin_users(id) ON DELETE SET NULL
//   - audit_logs.admin_user_id         → admin_users(id) ON DELETE SET NULL
//   - housekeeping_logs.admin_user_id  → admin_users(id) ON DELETE SET NULL
//   - maintenance_tickets.reported_by  → admin_users(id) ON DELETE SET NULL
//   - maintenance_tickets.assigned_to  → admin_users(id) ON DELETE SET NULL
//   - payments.manual_paid_by          → admin_users(id) — NO action clause,
//     i.e. ON DELETE NO ACTION/RESTRICT. This is the one FK that would make a
//     hard delete fail outright with a foreign-key violation.
// Even where the FK would merely SET NULL, doing so would sever a real audit
// trail (who confirmed a payment, who logged a cleaning, who reported a ticket).
// So: ANY linked row in any of these tables → archive instead of deleting.
// reservation_events.created_by is plain text ("admin:<email>", no FK), but the
// spec calls it out as meaningful history too, so it's included in the check.
async function hasLinkedHistory(db: ReturnType<typeof createAdminClient>, userId: string, email: string): Promise<boolean> {
  const counts = await Promise.all([
    db.from('payments').select('id', { count: 'exact', head: true }).eq('manual_paid_by', userId),
    db.from('reservation_notes').select('id', { count: 'exact', head: true }).eq('admin_user_id', userId),
    db.from('housekeeping_logs').select('id', { count: 'exact', head: true }).eq('admin_user_id', userId),
    db.from('maintenance_tickets').select('id', { count: 'exact', head: true }).eq('reported_by', userId),
    db.from('maintenance_tickets').select('id', { count: 'exact', head: true }).eq('assigned_to', userId),
    db.from('audit_logs').select('id', { count: 'exact', head: true }).eq('admin_user_id', userId),
    db.from('reservation_events').select('id', { count: 'exact', head: true }).eq('created_by', `admin:${email}`),
  ])

  return counts.some(({ count }) => (count ?? 0) > 0)
}

export async function deleteStaffAction(userId: string, confirmationEmail: string): Promise<DeleteStaffResult> {
  const admin = await requireModule('staff')

  if (!userId) return { error: 'Usuário inválido.' }
  if (admin.role !== 'super_admin') {
    return { error: 'Apenas um Super Admin pode excluir contas permanentemente.' }
  }
  if (userId === admin.id) {
    return { error: 'Você não pode excluir a sua própria conta.' }
  }

  const db = createAdminClient()
  const { data: target } = await db
    .from('admin_users')
    .select('id, email')
    .eq('id', userId)
    .maybeSingle()

  if (!target) return { error: 'Usuário não encontrado.' }

  if (confirmationEmail.trim().toLowerCase() !== target.email.toLowerCase()) {
    return { error: 'O e-mail de confirmação não corresponde ao da conta.' }
  }

  if (await hasLinkedHistory(db, target.id, target.email)) {
    const { error } = await db.from('admin_users').update({ is_active: false }).eq('id', target.id)
    if (error) return { error: 'Erro ao arquivar o usuário. Tente novamente.' }

    revalidatePath('/dashboard/staff')
    return { archived: true }
  }

  // No linked history — hard delete is safe. Remove admin_users first (mirrors
  // the rollback-on-failure ordering in createStaffAction): if this fails,
  // nothing else has changed yet. Then remove the auth user explicitly so no
  // orphaned login remains — admin_users.id → auth.users(id) ON DELETE CASCADE
  // would also clean it up the other way around, but the spec's order (admin_users
  // then auth user) keeps the role/permissions record gone first either way.
  const { error: deleteError } = await db.from('admin_users').delete().eq('id', target.id)
  if (deleteError) return { error: 'Erro ao excluir o usuário. Tente novamente.' }

  const { error: authError } = await db.auth.admin.deleteUser(target.id)
  if (authError) {
    console.error('[staff] admin_users row removed but auth user deletion failed:', authError)
    return { error: 'A conta foi removida do painel, mas houve um erro ao remover o acesso. Contate o suporte técnico.' }
  }

  revalidatePath('/dashboard/staff')
  return { deleted: true }
}
