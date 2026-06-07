'use server'

import { revalidatePath } from 'next/cache'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireAdmin } from '@/lib/auth'

export type ActionState = { error: string } | { success: true } | undefined

function str(formData: FormData, key: string): string {
  return ((formData.get(key) as string) ?? '').trim()
}

async function logEvent(
  db: ReturnType<typeof createAdminClient>,
  reservationId: string,
  eventType: string,
  description: string,
  adminEmail: string,
) {
  await db.from('reservation_events').insert({
    reservation_id: reservationId,
    event_type:     eventType,
    description,
    created_by:     `admin:${adminEmail}`,
  })
}

function revalidateReservation(id: string) {
  revalidatePath('/dashboard/reservations')
  revalidatePath(`/dashboard/reservations/${id}`)
}

// ── Mark as confirmed ─────────────────────────────────────────────────────────
// Manual confirmation — used when staff confirms payment received outside the
// online flow (bank transfer, in person, etc.) or overrides a stuck booking.

export async function markConfirmedAction(reservationId: string): Promise<ActionState> {
  const admin = await requireAdmin()
  const db = createAdminClient()

  const { data: reservation } = await db
    .from('reservations')
    .select('status')
    .eq('id', reservationId)
    .single()

  if (!reservation) return { error: 'Reserva não encontrada.' }
  if (reservation.status !== 'pending_payment') {
    return { error: 'Só é possível confirmar reservas que estão aguardando pagamento.' }
  }

  const { error } = await db
    .from('reservations')
    .update({ status: 'confirmed' })
    .eq('id', reservationId)

  if (error) return { error: 'Erro ao confirmar a reserva. Tente novamente.' }

  await logEvent(
    db, reservationId, 'reservation_confirmed',
    `Reserva confirmada manualmente por ${admin.full_name}.`,
    admin.email,
  )

  revalidateReservation(reservationId)
  return { success: true }
}

// ── Cancel (with reason) ──────────────────────────────────────────────────────
// Frees up the dates by removing the sparse room_availability blocks tied to
// this reservation — per the "available = row absent" model used site-wide.

export async function cancelReservationAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const admin = await requireAdmin()
  const reservationId = str(formData, 'reservation_id')
  const reason = str(formData, 'reason')

  if (!reservationId) return { error: 'Reserva inválida.' }
  if (!reason) return { error: 'Informe o motivo do cancelamento.' }

  const db = createAdminClient()
  const { data: reservation } = await db
    .from('reservations')
    .select('status')
    .eq('id', reservationId)
    .single()

  if (!reservation) return { error: 'Reserva não encontrada.' }
  if (reservation.status === 'cancelled') return { error: 'Esta reserva já está cancelada.' }
  if (reservation.status === 'checked_out') return { error: 'Não é possível cancelar uma estadia já concluída.' }

  const { error } = await db
    .from('reservations')
    .update({
      status: 'cancelled',
      cancellation_reason: reason,
      cancelled_at: new Date().toISOString(),
    })
    .eq('id', reservationId)

  if (error) return { error: 'Erro ao cancelar a reserva. Tente novamente.' }

  // Unblock the dates — delete the sparse blocked-date rows for this reservation
  await db.from('room_availability').delete().eq('reservation_id', reservationId)

  await logEvent(
    db, reservationId, 'reservation_cancelled',
    `Reserva cancelada por ${admin.full_name}. Motivo: ${reason}`,
    admin.email,
  )

  revalidateReservation(reservationId)
  revalidatePath('/dashboard/availability')
  return { success: true }
}

// ── Check-in ──────────────────────────────────────────────────────────────────

export async function markCheckedInAction(reservationId: string): Promise<ActionState> {
  const admin = await requireAdmin()
  const db = createAdminClient()

  const { data: reservation } = await db
    .from('reservations')
    .select('status')
    .eq('id', reservationId)
    .single()

  if (!reservation) return { error: 'Reserva não encontrada.' }
  if (reservation.status !== 'confirmed') {
    return { error: 'Só é possível registrar check-in de reservas confirmadas.' }
  }

  const { error } = await db
    .from('reservations')
    .update({ status: 'checked_in', checked_in_at: new Date().toISOString() })
    .eq('id', reservationId)

  if (error) return { error: 'Erro ao registrar o check-in. Tente novamente.' }

  await logEvent(
    db, reservationId, 'checked_in',
    `Check-in registrado por ${admin.full_name}.`,
    admin.email,
  )

  revalidateReservation(reservationId)
  return { success: true }
}

// ── Check-out ─────────────────────────────────────────────────────────────────

export async function markCheckedOutAction(reservationId: string): Promise<ActionState> {
  const admin = await requireAdmin()
  const db = createAdminClient()

  const { data: reservation } = await db
    .from('reservations')
    .select('status')
    .eq('id', reservationId)
    .single()

  if (!reservation) return { error: 'Reserva não encontrada.' }
  if (reservation.status !== 'checked_in') {
    return { error: 'Só é possível registrar check-out de reservas com check-in já realizado.' }
  }

  const { error } = await db
    .from('reservations')
    .update({ status: 'checked_out', checked_out_at: new Date().toISOString() })
    .eq('id', reservationId)

  if (error) return { error: 'Erro ao registrar o check-out. Tente novamente.' }

  await logEvent(
    db, reservationId, 'checked_out',
    `Check-out registrado por ${admin.full_name}.`,
    admin.email,
  )

  revalidateReservation(reservationId)
  return { success: true }
}

// ── Internal notes ────────────────────────────────────────────────────────────

export async function addReservationNoteAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const admin = await requireAdmin()
  const reservationId = str(formData, 'reservation_id')
  const note = str(formData, 'note')

  if (!reservationId) return { error: 'Reserva inválida.' }
  if (!note) return { error: 'Escreva uma nota antes de salvar.' }

  const db = createAdminClient()
  const { error } = await db.from('reservation_notes').insert({
    reservation_id: reservationId,
    admin_user_id:  admin.id,
    note,
  })

  if (error) return { error: 'Erro ao salvar a nota. Tente novamente.' }

  revalidatePath(`/dashboard/reservations/${reservationId}`)
  return { success: true }
}
