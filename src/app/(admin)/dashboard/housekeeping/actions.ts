'use server'

import { revalidatePath } from 'next/cache'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireModule } from '@/lib/auth'

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

// ── Manual status update ──────────────────────────────────────────────────────
// Used by the staff board buttons (Marcar sujo / Iniciar limpeza / Marcar limpo /
// Marcar inspecionado / Marcar pronto). Mirrors the reservation check-in/out
// action shape — direct call from a client component via useTransition, not a
// useActionState form — since multiple status buttons live on the same card.

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
