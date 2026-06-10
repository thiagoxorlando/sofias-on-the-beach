'use server'

import { revalidatePath } from 'next/cache'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireAdmin } from '@/lib/auth'

// ── Demo constants ────────────────────────────────────────────────────────────
// These are used to identify the demo reservation for duplicate prevention
// and for safe deletion (only the demo record is ever removed).

const DEMO_EMAIL = 'maria.demo@exemplo.com'
const DEMO_NOTE  = 'Reserva demonstrativa criada para o guia de uso.'

function generateToken(): string {
  const year  = new Date().getFullYear()
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  const code  = Array.from({ length: 4 }, () =>
    chars[Math.floor(Math.random() * chars.length)],
  ).join('')
  return `SOF-${year}-${code}`
}

// ── Create demo reservation ───────────────────────────────────────────────────
// Idempotent: if a reservation for DEMO_EMAIL with DEMO_NOTE already exists,
// returns its ID without creating a duplicate.

export async function createDemoReservationAction(): Promise<
  { id: string } | { error: string }
> {
  const admin = await requireAdmin()
  if (admin.role !== 'admin' && admin.role !== 'super_admin') {
    return { error: 'Acesso negado.' }
  }

  const db = createAdminClient()

  // ── Duplicate check ───────────────────────────────────────────────────────
  const { data: existingGuest } = await db
    .from('guests')
    .select('id')
    .eq('email', DEMO_EMAIL)
    .maybeSingle()

  if (existingGuest) {
    const { data: existingRes } = await db
      .from('reservations')
      .select('id')
      .eq('guest_id', existingGuest.id)
      .eq('special_requests', DEMO_NOTE)
      .maybeSingle()

    if (existingRes) {
      return { id: existingRes.id }
    }
  }

  // ── Find first active room ────────────────────────────────────────────────
  const { data: rooms } = await db
    .from('rooms')
    .select('id, name, base_price_brl')
    .eq('is_active', true)
    .order('sort_order', { ascending: true })
    .limit(1)

  const room = rooms?.[0]
  if (!room) {
    return {
      error:
        'Nenhum quarto ativo encontrado. Cadastre ao menos um quarto antes de criar a reserva demo.',
    }
  }

  // ── Dates: tomorrow + 2 nights ────────────────────────────────────────────
  const now      = new Date()
  const tomorrow = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1))
  const checkIn  = tomorrow.toISOString().slice(0, 10)
  const checkOut = new Date(tomorrow.getTime() + 2 * 86_400_000).toISOString().slice(0, 10)
  const total    = room.base_price_brl * 2

  // ── Upsert guest ──────────────────────────────────────────────────────────
  const { data: guestRow, error: guestErr } = await db
    .from('guests')
    .upsert(
      {
        email:       DEMO_EMAIL,
        full_name:   'Maria Oliveira',
        phone:       '+5522999990000',
        nationality: 'BR',
      },
      { onConflict: 'email' },
    )
    .select('id')
    .single()

  if (guestErr || !guestRow) {
    return { error: `Erro ao criar hóspede demo: ${guestErr?.message ?? 'desconhecido'}` }
  }

  // ── Generate unique token ─────────────────────────────────────────────────
  let token = generateToken()
  for (let i = 0; i < 3; i++) {
    const { data: dup } = await db
      .from('reservations')
      .select('token')
      .eq('token', token)
      .maybeSingle()
    if (!dup) break
    token = generateToken()
  }

  // ── Create reservation ────────────────────────────────────────────────────
  const { data: res, error: resErr } = await db
    .from('reservations')
    .insert({
      room_id:          room.id,
      guest_id:         guestRow.id,
      check_in:         checkIn,
      check_out:        checkOut,
      adults:           2,
      children:         0,
      base_amount_brl:  total,
      total_brl:        total,
      discount_brl:     0,
      status:           'confirmed',
      source:           'manual',
      token,
      special_requests: DEMO_NOTE,
    })
    .select('id')
    .single()

  if (resErr || !res) {
    return { error: `Erro ao criar reserva demo: ${resErr?.message ?? 'desconhecido'}` }
  }

  // ── Block dates in room_availability ─────────────────────────────────────
  const datesToBlock: {
    room_id: string; date: string; is_available: boolean
    blocked_reason: string; reservation_id: string
  }[] = []
  const cur = new Date(checkIn + 'T00:00:00Z')
  const end = new Date(checkOut + 'T00:00:00Z')
  while (cur < end) {
    datesToBlock.push({
      room_id:        room.id,
      date:           cur.toISOString().slice(0, 10),
      is_available:   false,
      blocked_reason: 'reservation',
      reservation_id: res.id,
    })
    cur.setUTCDate(cur.getUTCDate() + 1)
  }
  if (datesToBlock.length > 0) {
    await db.from('room_availability').insert(datesToBlock)
  }

  // ── Log event ─────────────────────────────────────────────────────────────
  await db.from('reservation_events').insert({
    reservation_id: res.id,
    event_type:     'reservation_created',
    description:    `Reserva demonstrativa criada por ${admin.full_name} para o guia de uso do sistema.`,
    created_by:     `admin:${admin.email}`,
  })

  revalidatePath('/dashboard/reservations')
  return { id: res.id }
}

// ── Delete demo reservation ───────────────────────────────────────────────────
// Only ever removes the demo guest and their reservations — identified by
// DEMO_EMAIL. Safe to run multiple times (no-op if demo doesn't exist).

export async function deleteDemoReservationAction(): Promise<
  { success: true } | { error: string }
> {
  const admin = await requireAdmin()
  if (admin.role !== 'admin' && admin.role !== 'super_admin') {
    return { error: 'Acesso negado.' }
  }

  const db = createAdminClient()

  const { data: guest } = await db
    .from('guests')
    .select('id')
    .eq('email', DEMO_EMAIL)
    .maybeSingle()

  if (!guest) {
    return { error: 'Reserva demo não encontrada.' }
  }

  const { data: reservations } = await db
    .from('reservations')
    .select('id')
    .eq('guest_id', guest.id)

  const reservationIds = (reservations ?? []).map((r) => r.id)

  // FK-safe cascade in the same order used by forceDeleteGuestsAction
  if (reservationIds.length > 0) {
    await db.from('promotion_uses').delete().in('reservation_id', reservationIds)
    await db.from('payments').delete().in('reservation_id', reservationIds)
    await db.from('reservation_events').delete().in('reservation_id', reservationIds)
    await db.from('reservation_notes').delete().in('reservation_id', reservationIds)
    await db.from('reservation_charges').delete().in('reservation_id', reservationIds)
    await db.from('handoff_requests').delete().in('reservation_id', reservationIds)
    await db.from('housekeeping_logs').delete().in('reservation_id', reservationIds)
    await db.from('room_availability').delete().in('reservation_id', reservationIds)
    await db.from('reservations').delete().in('id', reservationIds)
  }

  await db.from('leads').update({ guest_id: null }).eq('guest_id', guest.id)
  await db.from('promotion_uses').delete().eq('guest_id', guest.id)
  await db.from('guests').delete().eq('id', guest.id)

  revalidatePath('/dashboard/reservations')
  return { success: true }
}
