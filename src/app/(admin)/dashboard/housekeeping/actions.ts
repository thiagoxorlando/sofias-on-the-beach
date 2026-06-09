'use server'

import { revalidatePath } from 'next/cache'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireModule } from '@/lib/auth'
import { isHousekeepingSupervisor } from '@/lib/permissions'

export type ActionState = { error: string } | { success: true } | undefined

const HOUSEKEEPING_STATUSES = ['dirty', 'cleaning', 'clean', 'inspected', 'ready'] as const
type HousekeepingStatus = typeof HOUSEKEEPING_STATUSES[number]

const STATUS_LABELS: Record<HousekeepingStatus, string> = {
  dirty:     'sujo',
  cleaning:  'em limpeza',
  clean:     'limpo',
  inspected: 'inspecionado',
  ready:     'pronto',
}

function isHousekeepingStatus(value: string): value is HousekeepingStatus {
  return (HOUSEKEEPING_STATUSES as readonly string[]).includes(value)
}

// Transitions cleaning staff (role === 'housekeeping') are permitted to make.
// Supervisors (housekeeping_supervisor, admin, manager, etc.) can make any valid transition.
const STAFF_ALLOWED_TRANSITIONS: Partial<Record<HousekeepingStatus, HousekeepingStatus[]>> = {
  dirty:    ['cleaning'],
  cleaning: ['clean'],
}

// ── Manual status update ──────────────────────────────────────────────────────

export async function updateHousekeepingStatusAction(
  roomId: string,
  status: string,
  note?: string,
): Promise<ActionState> {
  const admin = await requireModule('housekeeping')

  if (!roomId) return { error: 'Quarto inválido.' }
  if (!isHousekeepingStatus(status)) return { error: 'Status de limpeza inválido.' }

  const db = createAdminClient()
  const { data: room } = await db
    .from('rooms')
    .select('housekeeping_status')
    .eq('id', roomId)
    .single()

  if (!room) return { error: 'Quarto não encontrado.' }
  if (room.housekeeping_status === status) {
    return { error: `Este quarto já está marcado como ${STATUS_LABELS[status]}.` }
  }

  // Cleaning staff may only advance: dirty → cleaning → clean.
  // Supervisors (housekeeping_supervisor, admin, manager, etc.) can make any transition.
  if (!isHousekeepingSupervisor(admin.role)) {
    const fromStatus = room.housekeeping_status as HousekeepingStatus
    const allowed = STAFF_ALLOWED_TRANSITIONS[fromStatus] ?? []
    if (!(allowed as string[]).includes(status)) {
      return { error: 'Sua função não permite esta transição. Aguarde a supervisão.' }
    }
  }

  const { error } = await db
    .from('rooms')
    .update({ housekeeping_status: status })
    .eq('id', roomId)

  if (error) return { error: 'Erro ao atualizar o status de limpeza. Tente novamente.' }

  await db.from('housekeeping_logs').insert({
    room_id:        roomId,
    from_status:    room.housekeeping_status,
    to_status:      status,
    note:           note?.trim() || null,
    admin_user_id:  admin.id,
  })

  revalidatePath('/dashboard/housekeeping')
  return { success: true }
}

// ── Self-assign: staff picks up an unassigned dirty room ─────────────────────
// Combined action: creates an assignment AND moves room to cleaning in one step.

export async function selfAssignRoomAction(roomId: string): Promise<ActionState> {
  const admin = await requireModule('housekeeping')

  if (!roomId) return { error: 'Quarto inválido.' }

  const db = createAdminClient()

  const { data: room } = await db
    .from('rooms')
    .select('housekeeping_status')
    .eq('id', roomId)
    .single()

  if (!room) return { error: 'Quarto não encontrado.' }
  if (room.housekeeping_status !== 'dirty') {
    return { error: 'Apenas quartos sujos podem ser assumidos.' }
  }

  // Check no active assignment by another staff member
  const { data: existing } = await db
    .from('housekeeping_assignments')
    .select('id, assigned_to')
    .eq('room_id', roomId)
    .in('status', ['pending', 'in_progress'])
    .maybeSingle()

  if (existing && existing.assigned_to !== admin.id) {
    return { error: 'Este quarto já está atribuído a outro colaborador.' }
  }

  // Cancel existing self-assignment if any, then create fresh one as in_progress
  if (existing) {
    await db
      .from('housekeeping_assignments')
      .update({ status: 'cancelled', updated_at: new Date().toISOString() })
      .eq('id', existing.id)
  }

  const now = new Date().toISOString()

  const { error: assignError } = await db.from('housekeeping_assignments').insert({
    room_id:     roomId,
    assigned_to: admin.id,
    assigned_by: admin.id,
    status:      'in_progress',
    priority:    'normal',
    created_at:  now,
    updated_at:  now,
  })

  if (assignError) return { error: 'Erro ao assumir limpeza. Tente novamente.' }

  // Move room status to cleaning
  const { error: roomError } = await db
    .from('rooms')
    .update({ housekeeping_status: 'cleaning' })
    .eq('id', roomId)

  if (roomError) return { error: 'Erro ao iniciar limpeza. Tente novamente.' }

  await db.from('housekeeping_logs').insert({
    room_id:       roomId,
    from_status:   'dirty',
    to_status:     'cleaning',
    note:          'Limpeza assumida pelo colaborador.',
    admin_user_id: admin.id,
  })

  revalidatePath('/dashboard/housekeeping')
  return { success: true }
}

// ── Assign room to housekeeping staff (supervisor only) ─────────────────────

export async function assignRoomAction(
  roomId: string,
  assignedToId: string,
  note?: string,
): Promise<ActionState> {
  const admin = await requireModule('housekeeping')

  if (!isHousekeepingSupervisor(admin.role)) {
    return { error: 'Apenas supervisores podem atribuir quartos.' }
  }
  if (!roomId)        return { error: 'Quarto inválido.' }
  if (!assignedToId)  return { error: 'Colaborador inválido.' }

  const db = createAdminClient()

  // Cancel any existing active assignment for this room before creating a new one
  await db
    .from('housekeeping_assignments')
    .update({ status: 'cancelled', updated_at: new Date().toISOString() })
    .eq('room_id', roomId)
    .in('status', ['pending', 'in_progress'])

  const { error } = await db.from('housekeeping_assignments').insert({
    room_id:     roomId,
    assigned_to: assignedToId,
    assigned_by: admin.id,
    notes:       note?.trim() || null,
    status:      'pending',
    priority:    'normal',
  })

  if (error) return { error: 'Erro ao criar atribuição. Tente novamente.' }

  revalidatePath('/dashboard/housekeeping')
  return { success: true }
}

// ── Update assignment status ──────────────────────────────────────────────────

export async function updateAssignmentStatusAction(
  assignmentId: string,
  status: string,
): Promise<ActionState> {
  const admin = await requireModule('housekeeping')

  const VALID_STATUSES = ['pending', 'in_progress', 'completed', 'cancelled']
  if (!VALID_STATUSES.includes(status)) return { error: 'Status de atribuição inválido.' }

  const db = createAdminClient()

  const { data: assignment } = await db
    .from('housekeeping_assignments')
    .select('assigned_to')
    .eq('id', assignmentId)
    .single()

  if (!assignment) return { error: 'Atribuição não encontrada.' }

  // Staff can only update their own assignments
  if (!isHousekeepingSupervisor(admin.role) && assignment.assigned_to !== admin.id) {
    return { error: 'Você só pode atualizar suas próprias atribuições.' }
  }

  const now = new Date().toISOString()
  const { error } = await db
    .from('housekeeping_assignments')
    .update({
      status,
      updated_at:   now,
      completed_at: status === 'completed' ? now : null,
    })
    .eq('id', assignmentId)

  if (error) return { error: 'Erro ao atualizar atribuição. Tente novamente.' }

  revalidatePath('/dashboard/housekeeping')
  return { success: true }
}
