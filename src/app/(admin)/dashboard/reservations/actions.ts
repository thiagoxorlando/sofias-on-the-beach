'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireAdmin, requireModule } from '@/lib/auth'
import { canAccessModule } from '@/lib/permissions'

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

// Mirrors the dual-module check on the reservation detail page guard: finance
// staff can reach that page (and its NotesPanel) for payment context without
// holding the full 'reservations' module, so the note action must accept the
// same two module sets — otherwise finance would see the form but get redirected
// on submit. Reservation status changes (cancel/check-in/check-out) stay
// strictly 'reservations'-gated below.
async function requireReservationOrPaymentAccess() {
  const admin = await requireAdmin()
  if (!canAccessModule(admin.role, 'reservations') && !canAccessModule(admin.role, 'payments')) {
    redirect('/dashboard')
  }
  return admin
}

// ── Cancel (with reason) ──────────────────────────────────────────────────────
// Frees up the dates by removing the sparse room_availability blocks tied to
// this reservation — per the "available = row absent" model used site-wide.

export async function cancelReservationAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const admin = await requireModule('reservations')
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
  const admin = await requireModule('reservations')
  const db = createAdminClient()

  const { data: reservation } = await db
    .from('reservations')
    .select('status, room_id, rooms ( housekeeping_status )')
    .eq('id', reservationId)
    .single()

  if (!reservation) return { error: 'Reserva não encontrada.' }
  if (reservation.status !== 'confirmed') {
    return { error: 'Só é possível registrar check-in de reservas confirmadas.' }
  }

  // Front desk shouldn't hand over a dirty room. Roles that manage operations
  // (super_admin/admin/manager) can override with a deliberate confirmation;
  // reception/staff are blocked outright and must wait for housekeeping.
  const room = Array.isArray(reservation.rooms) ? reservation.rooms[0] : reservation.rooms
  const canOverrideRoomReadiness = ['super_admin', 'admin', 'manager'].includes(admin.role)
  if (room && room.housekeeping_status !== 'ready' && !canOverrideRoomReadiness) {
    return { error: 'O quarto ainda não está pronto (governança precisa concluir a limpeza/inspeção) antes do check-in.' }
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
  const admin = await requireModule('reservations')
  const db = createAdminClient()

  const { data: reservation } = await db
    .from('reservations')
    .select('status, room_id')
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

  // Housekeeping: a room always needs cleaning once the guest leaves —
  // flip it to "dirty" and record the transition, mirroring reservation_events.
  const { data: room } = await db
    .from('rooms')
    .select('housekeeping_status')
    .eq('id', reservation.room_id)
    .single()

  if (room) {
    await db.from('rooms').update({ housekeeping_status: 'dirty' }).eq('id', reservation.room_id)
    await db.from('housekeeping_logs').insert({
      room_id:        reservation.room_id,
      reservation_id: reservationId,
      from_status:    room.housekeeping_status,
      to_status:      'dirty',
      note:           'Check-out realizado.',
      admin_user_id:  admin.id,
    })
    revalidatePath('/dashboard/housekeeping')
  }

  revalidateReservation(reservationId)
  return { success: true }
}

// ── Delete reservation ────────────────────────────────────────────────────────
// Permanently removes a reservation and its non-financial related rows.
// Guards: only super_admin/admin/manager — reception cannot delete.
// Safety: blocked if any paid/refunded payment, any paid charge, or status
// is checked_in/checked_out (operational history must be preserved).
// FK order: payments (RESTRICT) + promotion_uses (RESTRICT) deleted first;
// then the reservation DELETE cascades notes/events/charges and SET NULLs
// room_availability (freeing dates), housekeeping_logs, price_requests.
// Audit: trg_audit_reservations DB trigger fires automatically — no manual log.

export async function deleteReservationAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const admin = await requireModule('reservations')

  if (!['super_admin', 'admin', 'manager'].includes(admin.role)) {
    return { error: 'Apenas administradores e gerentes podem excluir reservas.' }
  }

  const reservationId = str(formData, 'reservation_id')
  const confirmToken  = str(formData, 'confirm_token')

  if (!reservationId) return { error: 'Reserva inválida.' }
  if (!confirmToken)  return { error: 'Digite o código da reserva para confirmar.' }

  const db = createAdminClient()

  const { data: reservation } = await db
    .from('reservations')
    .select('id, token, status')
    .eq('id', reservationId)
    .maybeSingle()

  if (!reservation) return { error: 'Reserva não encontrada.' }

  if (confirmToken.toUpperCase() !== reservation.token.toUpperCase()) {
    return { error: 'Código incorreto. Digite o código da reserva exatamente como exibido.' }
  }

  // super_admin bypasses all safety checks — admin/manager are still blocked
  // when financial or operational history exists.
  const isSuperAdmin = admin.role === 'super_admin'

  const { data: payments } = await db
    .from('payments')
    .select('id, status')
    .eq('reservation_id', reservationId)

  if (!isSuperAdmin) {
    if (['checked_in', 'checked_out'].includes(reservation.status)) {
      return {
        error:
          'Esta reserva possui histórico financeiro ou operacional. ' +
          'Para preservar os registros, cancele a reserva em vez de excluir.',
      }
    }

    const hasPaidPayment = (payments ?? []).some(
      (p) => p.status === 'paid' || p.status === 'refunded',
    )
    if (hasPaidPayment) {
      return {
        error:
          'Esta reserva possui histórico financeiro ou operacional. ' +
          'Para preservar os registros, cancele a reserva em vez de excluir.',
      }
    }

    const { data: charges } = await db
      .from('reservation_charges')
      .select('id, status')
      .eq('reservation_id', reservationId)

    const hasPaidCharge = (charges ?? []).some((c) => c.status === 'paid')
    if (hasPaidCharge) {
      return {
        error:
          'Esta reserva possui histórico financeiro ou operacional. ' +
          'Para preservar os registros, cancele a reserva em vez de excluir.',
      }
    }
  }

  // Remove FK-RESTRICT children before the reservation row
  if ((payments ?? []).length > 0) {
    const { error: payErr } = await db
      .from('payments')
      .delete()
      .eq('reservation_id', reservationId)
    if (payErr) {
      console.error('[delete-reservation] payments delete failed:', payErr)
      return { error: 'Erro ao remover pagamentos associados. Tente novamente.' }
    }
  }

  // promotion_uses is RESTRICT — delete silently (may be empty)
  await db.from('promotion_uses').delete().eq('reservation_id', reservationId)

  const { error: delErr } = await db
    .from('reservations')
    .delete()
    .eq('id', reservationId)

  if (delErr) {
    console.error('[delete-reservation] reservation delete failed:', delErr)
    return { error: 'Erro ao excluir a reserva. Tente novamente.' }
  }

  revalidatePath('/dashboard/reservations')
  revalidatePath(`/dashboard/reservations/${reservationId}`)
  revalidatePath('/dashboard/availability')
  revalidatePath('/dashboard/reception')
  revalidatePath('/dashboard/guests')

  return { success: true }
}

// ── Internal notes ────────────────────────────────────────────────────────────

export async function addReservationNoteAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const admin = await requireReservationOrPaymentAccess()
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
