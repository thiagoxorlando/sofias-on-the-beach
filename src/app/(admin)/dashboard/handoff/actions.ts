'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireAdmin } from '@/lib/auth'
import { canAccessModule } from '@/lib/permissions'

export type ActionState = { error: string } | { success: true } | undefined

function str(formData: FormData, key: string): string {
  return ((formData.get(key) as string) ?? '').trim()
}

function revalidateAll(reservationId?: string | null) {
  revalidatePath('/dashboard/reception')
  revalidatePath('/dashboard/housekeeping')
  revalidatePath('/dashboard/maintenance')
  if (reservationId) revalidatePath(`/dashboard/reservations/${reservationId}`)
}

// Create: reception module covers reception / manager / admin / super_admin.
async function requireCreateAccess() {
  const admin = await requireAdmin()
  if (!canAccessModule(admin.role, 'reception')) redirect('/dashboard')
  return admin
}

// Update: target dept staff + manager/admin/super_admin.
// reception access implies manager/admin/super_admin (they hold all modules),
// so checking reception OR the target dept's module covers all allowed roles.
async function requireUpdateAccess(targetDepartment: string) {
  const admin = await requireAdmin()
  const ok =
    canAccessModule(admin.role, 'reception') ||
    (targetDepartment === 'housekeeping' && canAccessModule(admin.role, 'housekeeping')) ||
    (targetDepartment === 'maintenance'  && canAccessModule(admin.role, 'maintenance'))
  if (!ok) redirect('/dashboard')
  return admin
}

const DEPARTMENTS = ['housekeeping', 'maintenance'] as const
const PRIORITIES  = ['low', 'normal', 'high', 'urgent'] as const

export async function createHandoffRequestAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const admin = await requireCreateAccess()

  const targetDept    = str(formData, 'target_department')
  const title         = str(formData, 'title')
  const description   = str(formData, 'description') || null
  const priority      = str(formData, 'priority') || 'normal'
  const reservationId = str(formData, 'reservation_id') || null
  const roomId        = str(formData, 'room_id') || null

  if (!DEPARTMENTS.includes(targetDept as (typeof DEPARTMENTS)[number])) {
    return { error: 'Selecione um departamento válido.' }
  }
  if (!title) return { error: 'Informe um título para a solicitação.' }
  if (!PRIORITIES.includes(priority as (typeof PRIORITIES)[number])) {
    return { error: 'Prioridade inválida.' }
  }

  const db = createAdminClient()
  const { error } = await db.from('handoff_requests').insert({
    reservation_id:    reservationId,
    room_id:           roomId,
    target_department: targetDept,
    title,
    description,
    priority,
    status:            'open',
    requested_by:      admin.id,
  })

  if (error) {
    console.error('[handoff] create failed:', error)
    return { error: 'Erro ao criar a solicitação. Tente novamente.' }
  }

  revalidateAll(reservationId)
  return { success: true }
}

export async function updateHandoffStatusAction(
  requestId: string,
  newStatus: 'in_progress' | 'done' | 'cancelled',
): Promise<ActionState> {
  const db = createAdminClient()

  const { data: req } = await db
    .from('handoff_requests')
    .select('id, status, target_department, reservation_id')
    .eq('id', requestId)
    .maybeSingle()

  if (!req) return { error: 'Solicitação não encontrada.' }
  if (req.status === 'done' || req.status === 'cancelled') {
    return { error: 'Esta solicitação já foi concluída ou cancelada.' }
  }

  await requireUpdateAccess(req.target_department)

  const update: Record<string, unknown> = { status: newStatus }
  if (newStatus === 'done') {
    const admin = await requireAdmin()
    update.completed_by = admin.id
    update.completed_at = new Date().toISOString()
  }

  const { error } = await db
    .from('handoff_requests')
    .update(update)
    .eq('id', requestId)

  if (error) {
    console.error('[handoff] status update failed:', error)
    return { error: 'Erro ao atualizar a solicitação.' }
  }

  revalidateAll(req.reservation_id)
  return { success: true }
}
