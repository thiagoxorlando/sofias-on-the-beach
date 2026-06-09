'use server'

import { revalidatePath } from 'next/cache'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireModule } from '@/lib/auth'

export type ActionState = { error: string } | { success: true } | undefined

// ── Mark special request as attended ─────────────────────────────────────────

export async function markSpecialRequestHandledAction(
  reservationId: string,
): Promise<ActionState> {
  const admin = await requireModule('reception')

  if (!reservationId) return { error: 'Reserva inválida.' }

  const db = createAdminClient()

  const { data: res } = await db
    .from('reservations')
    .select('id, special_requests, special_request_status')
    .eq('id', reservationId)
    .maybeSingle()

  if (!res)                              return { error: 'Reserva não encontrada.' }
  if (!res.special_requests)             return { error: 'Esta reserva não tem pedido especial.' }
  if (res.special_request_status === 'done') return { error: 'Pedido já foi marcado como atendido.' }

  const { error } = await db
    .from('reservations')
    .update({
      special_request_status:    'done',
      special_request_handled_at: new Date().toISOString(),
      special_request_handled_by: admin.id,
    })
    .eq('id', reservationId)

  if (error) {
    console.error('[reception] mark special request handled failed:', error)
    return { error: 'Erro ao atualizar o pedido. Tente novamente.' }
  }

  await db.from('reservation_events').insert({
    reservation_id: reservationId,
    event_type:     'reservation_confirmed',
    description:    `Pedido especial do hóspede marcado como atendido por ${admin.full_name}.`,
    created_by:     `admin:${admin.email}`,
  })

  revalidatePath('/dashboard/reception')
  revalidatePath(`/dashboard/reservations/${reservationId}`)
  return { success: true }
}

// ── Request room inspection (creates housekeeping handoff) ────────────────────

export async function requestRoomInspectionAction(
  reservationId: string,
  roomId: string,
  roomName: string,
  guestName: string,
): Promise<ActionState> {
  const admin = await requireModule('reception')

  if (!reservationId || !roomId) return { error: 'Reserva ou quarto inválidos.' }

  const db = createAdminClient()

  // Prevent duplicate open requests
  const { data: existing } = await db
    .from('handoff_requests')
    .select('id')
    .eq('reservation_id', reservationId)
    .eq('room_id', roomId)
    .eq('target_department', 'housekeeping')
    .in('status', ['open', 'in_progress'])
    .limit(1)

  if (existing && existing.length > 0) {
    return { error: 'Já existe uma solicitação de inspeção em aberto para este quarto.' }
  }

  const { error } = await db.from('handoff_requests').insert({
    reservation_id:    reservationId,
    room_id:           roomId,
    target_department: 'housekeeping',
    title:             `Inspecionar/liberar quarto para check-in — ${roomName}`,
    description:       `Hóspede ${guestName} aguarda check-in. Quarto está limpo mas precisa de inspeção final para ser liberado pela governança.`,
    priority:          'high',
    status:            'open',
    requested_by:      admin.id,
  })

  if (error) {
    console.error('[reception] inspection request failed:', error)
    return { error: 'Erro ao criar solicitação. Tente novamente.' }
  }

  revalidatePath('/dashboard/reception')
  revalidatePath('/dashboard/housekeeping')
  revalidatePath(`/dashboard/reservations/${reservationId}`)
  return { success: true }
}
