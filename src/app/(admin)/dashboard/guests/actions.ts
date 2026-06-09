'use server'

import { revalidatePath } from 'next/cache'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireModule } from '@/lib/auth'

export type ActionState = { error: string } | { success: true } | undefined
export type DeleteResult = { error: string } | { success: true; count: number } | undefined

function str(formData: FormData, key: string): string {
  return ((formData.get(key) as string) ?? '').trim()
}

// ── Internal notes ────────────────────────────────────────────────────────────
// guests.notes is a single free-text field — "internal admin notes, never
// shown to guest" — so this overwrites it rather than appending entries
// (unlike reservation_notes, which is a list).

export async function updateGuestNotesAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireModule('guests')
  const guestId = str(formData, 'guest_id')
  const notes = str(formData, 'notes')

  if (!guestId) return { error: 'Hóspede inválido.' }

  const db = createAdminClient()
  const { error } = await db
    .from('guests')
    .update({ notes: notes || null })
    .eq('id', guestId)

  if (error) {
    console.error('[guests] failed to update notes:', error)
    return { error: 'Erro ao salvar as notas. Tente novamente.' }
  }

  revalidatePath(`/dashboard/guests/${guestId}`)
  return { success: true }
}

// ── Force delete guests (admin/super_admin only) ───────────────────────────────
// Cascades through all FK-dependent rows in the correct order before removing
// the guest records. Never deletes Supabase Auth users — only app-level data.

export async function forceDeleteGuestsAction(
  guestIds: string[],
): Promise<DeleteResult> {
  const admin = await requireModule('guests')
  if (admin.role !== 'super_admin' && admin.role !== 'admin') {
    return { error: 'Apenas administradores podem excluir hóspedes permanentemente.' }
  }
  if (!guestIds || guestIds.length === 0) {
    return { error: 'Nenhum hóspede selecionado.' }
  }

  const db = createAdminClient()

  // 1. Collect all reservation IDs belonging to these guests
  const { data: reservationRows, error: resLookupErr } = await db
    .from('reservations')
    .select('id')
    .in('guest_id', guestIds)

  if (resLookupErr) {
    console.error('[force-delete-guests] failed to look up reservations:', resLookupErr)
    return { error: 'Erro ao buscar reservas do hóspede. Tente novamente.' }
  }

  const reservationIds = (reservationRows ?? []).map((r) => r.id)

  if (reservationIds.length > 0) {
    // FK-safe order — mirrors forceDeleteReservationsAction in reservations/actions.ts
    await db.from('promotion_uses').delete().in('reservation_id', reservationIds)
    await db.from('payments').delete().in('reservation_id', reservationIds)
    await db.from('reservation_events').delete().in('reservation_id', reservationIds)
    await db.from('reservation_notes').delete().in('reservation_id', reservationIds)
    await db.from('reservation_charges').delete().in('reservation_id', reservationIds)
    await db.from('handoff_requests').delete().in('reservation_id', reservationIds)
    await db.from('housekeeping_logs').delete().in('reservation_id', reservationIds)
    await db.from('room_availability').delete().in('reservation_id', reservationIds)
    await db
      .from('leads')
      .update({ converted_reservation_id: null })
      .in('converted_reservation_id', reservationIds)

    const { error: resDeleteErr } = await db
      .from('reservations')
      .delete()
      .in('id', reservationIds)

    if (resDeleteErr) {
      console.error('[force-delete-guests] failed to delete reservations:', resDeleteErr)
      return { error: 'Erro ao excluir reservas do hóspede. Tente novamente.' }
    }
  }

  // 2. Guest-level cleanup (promotion uses linked by guest_id)
  await db.from('promotion_uses').delete().in('guest_id', guestIds)

  // 3. Delete the guests themselves
  const { error: guestDeleteErr } = await db
    .from('guests')
    .delete()
    .in('id', guestIds)

  if (guestDeleteErr) {
    console.error('[force-delete-guests] failed to delete guests:', guestDeleteErr)
    return { error: 'Erro ao excluir hóspede(s). Tente novamente.' }
  }

  revalidatePath('/dashboard/guests')
  revalidatePath('/dashboard/reservations')
  revalidatePath('/dashboard/reception')
  revalidatePath('/dashboard/availability')
  revalidatePath('/dashboard/payments')

  return { success: true, count: guestIds.length }
}
