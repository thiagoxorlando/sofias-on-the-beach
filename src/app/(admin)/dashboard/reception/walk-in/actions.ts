'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { requireModule } from '@/lib/auth'
import { calculateRoomPriceForDates } from '@/lib/pricing'

// ── Types ─────────────────────────────────────────────────────────────────────

export type AvailableRoom = {
  id: string
  name: string
  description: string | null
  max_guests: number
  total: number
  nights: number
  basePrice: number
}

export type AvailabilityResult =
  | { rooms: AvailableRoom[] }
  | { error: string }

export type WalkInResult =
  | { success: true; token: string; reservationId: string }
  | { error: string }

// ── Payment method labels (for event log) ────────────────────────────────────
// All walk-in payments go into the DB as method='manual', provider='manual'.
// The actual method (cash/card/pix/etc.) is stored in metadata.

const PAYMENT_METHOD_LABELS: Record<string, string> = {
  cash:          'Dinheiro',
  card_machine:  'Cartão (maquininha)',
  pix_manual:    'PIX (manual)',
  bank_transfer: 'Transferência bancária',
  pay_later:     'Pagar depois',
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function generateToken(): string {
  const year  = new Date().getFullYear()
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  const code  = Array.from({ length: 4 }, () =>
    chars[Math.floor(Math.random() * chars.length)],
  ).join('')
  return `SOF-${year}-${code}`
}

// ── Check walk-in availability ────────────────────────────────────────────────

export async function checkWalkInAvailability(
  checkIn: string,
  checkOut: string,
): Promise<AvailabilityResult> {
  await requireModule('reception')

  const ISO = /^\d{4}-\d{2}-\d{2}$/
  if (!checkIn || !ISO.test(checkIn))   return { error: 'Data de check-in inválida.' }
  if (!checkOut || !ISO.test(checkOut)) return { error: 'Data de check-out inválida.' }
  if (checkOut <= checkIn)              return { error: 'Check-out deve ser após o check-in.' }

  const nights = Math.round(
    (new Date(checkOut + 'T00:00:00Z').getTime() - new Date(checkIn + 'T00:00:00Z').getTime()) / 86_400_000,
  )
  if (nights < 1) return { error: 'Período mínimo é de 1 noite.' }

  const db = createAdminClient()

  const { data: rooms, error: roomErr } = await db
    .from('rooms')
    .select('id, name, description, max_guests')
    .eq('is_active', true)
    .order('sort_order', { ascending: true })

  if (roomErr || !rooms) {
    console.error('[walk-in:availability] rooms query failed:', roomErr)
    return { error: 'Erro ao buscar quartos.' }
  }

  // Blocked by room_availability sparse rows
  const { data: blockedRows } = await db
    .from('room_availability')
    .select('room_id')
    .gte('date', checkIn)
    .lt('date', checkOut)
    .eq('is_available', false)

  const blockedRoomIds = new Set((blockedRows ?? []).map((r) => r.room_id))

  // Also exclude rooms with overlapping active reservations
  const { data: activeRes } = await db
    .from('reservations')
    .select('room_id')
    .in('status', ['confirmed', 'pending_payment', 'checked_in'])
    .lt('check_in', checkOut)
    .gt('check_out', checkIn)

  for (const r of activeRes ?? []) {
    if (r.room_id) blockedRoomIds.add(r.room_id)
  }

  const availableRooms: AvailableRoom[] = []
  for (const room of rooms) {
    if (blockedRoomIds.has(room.id)) continue
    const pricing = await calculateRoomPriceForDates(room.id, checkIn, checkOut)
    if (!pricing) continue
    availableRooms.push({
      id:          room.id,
      name:        room.name,
      description: room.description,
      max_guests:  room.max_guests,
      total:       pricing.total,
      nights:      pricing.nights,
      basePrice:   pricing.basePrice,
    })
  }

  return { rooms: availableRooms }
}

// ── Create walk-in reservation ────────────────────────────────────────────────

export async function createWalkInReservationAction(
  formData: FormData,
): Promise<WalkInResult> {
  const admin = await requireModule('reception')

  const db = createAdminClient()

  // ── Parse inputs ──────────────────────────────────────────────────────────
  const roomId        = ((formData.get('room_id')          as string) ?? '').trim()
  const checkIn       = ((formData.get('check_in')         as string) ?? '').trim()
  const checkOut      = ((formData.get('check_out')        as string) ?? '').trim()
  const guestName     = ((formData.get('guest_name')       as string) ?? '').trim()
  const guestEmail    = ((formData.get('guest_email')      as string) ?? '').trim()
  const guestPhone    = ((formData.get('guest_phone')      as string) ?? '').trim() || null
  const guestCpf      = ((formData.get('guest_cpf')        as string) ?? '').trim() || null
  const adultsRaw     = parseInt((formData.get('adults')   as string) ?? '1', 10)
  const childrenRaw   = parseInt((formData.get('children') as string) ?? '0', 10)
  const adults        = isNaN(adultsRaw)   ? 1 : Math.max(1, adultsRaw)
  const children      = isNaN(childrenRaw) ? 0 : Math.max(0, childrenRaw)
  const specialReq    = ((formData.get('special_requests') as string) ?? '').trim() || null
  const paymentMethod = ((formData.get('payment_method')   as string) ?? '').trim()

  // ── Validate ──────────────────────────────────────────────────────────────
  const ISO = /^\d{4}-\d{2}-\d{2}$/
  if (!roomId)                                 return { error: 'Selecione um quarto.' }
  if (!checkIn  || !ISO.test(checkIn))         return { error: 'Data de check-in inválida.' }
  if (!checkOut || !ISO.test(checkOut))        return { error: 'Data de check-out inválida.' }
  if (checkOut <= checkIn)                     return { error: 'Check-out deve ser após o check-in.' }
  if (!guestName)                              return { error: 'Nome do hóspede é obrigatório.' }
  if (!guestEmail || !guestEmail.includes('@')) return { error: 'E-mail inválido.' }
  if (!paymentMethod)                          return { error: 'Selecione a forma de pagamento.' }

  const nights = Math.round(
    (new Date(checkOut + 'T00:00:00Z').getTime() - new Date(checkIn + 'T00:00:00Z').getTime()) / 86_400_000,
  )
  if (nights < 1) return { error: 'Período mínimo é de 1 noite.' }

  // ── Minimum stay rules ────────────────────────────────────────────────────
  const { data: roomForRules } = await db
    .from('rooms')
    .select('category_id')
    .eq('id', roomId)
    .maybeSingle()

  const { data: stayRules } = await db
    .from('minimum_stay_rules')
    .select('name, minimum_nights, applies_to, applies_to_ids')
    .eq('is_active', true)
    .lt('start_date', checkOut)
    .gt('end_date', checkIn)

  for (const rule of stayRules ?? []) {
    const ids = rule.applies_to_ids ?? []
    const applies =
      rule.applies_to === 'all' ||
      (rule.applies_to === 'specific_rooms' && ids.includes(roomId)) ||
      (rule.applies_to === 'specific_categories' && !!roomForRules?.category_id && ids.includes(roomForRules.category_id))

    if (applies && nights < rule.minimum_nights) {
      return {
        error: `Estadia mínima de ${rule.minimum_nights} noites para o período "${rule.name}".`,
      }
    }
  }

  // ── Re-verify availability ────────────────────────────────────────────────
  const { data: blocked } = await db
    .from('room_availability')
    .select('id')
    .eq('room_id', roomId)
    .gte('date', checkIn)
    .lt('date', checkOut)
    .eq('is_available', false)
    .limit(1)

  if (blocked && blocked.length > 0) {
    return { error: 'Quarto indisponível para as datas selecionadas.' }
  }

  // ── Calculate price ───────────────────────────────────────────────────────
  const pricing = await calculateRoomPriceForDates(roomId, checkIn, checkOut)
  if (!pricing) return { error: 'Quarto não encontrado ou inativo.' }
  const total = pricing.total

  // ── Find or create guest (no auth account required) ───────────────────────
  const { data: guestUpsert, error: guestErr } = await db
    .from('guests')
    .upsert(
      { email: guestEmail, full_name: guestName, phone: guestPhone, nationality: 'BR' },
      { onConflict: 'email' },
    )
    .select('id')
    .single()

  if (guestErr || !guestUpsert) {
    console.error('[walk-in] guest upsert failed:', guestErr)
    return { error: `Erro ao registrar hóspede: ${guestErr?.message ?? 'desconhecido'}` }
  }

  if (guestCpf) {
    await db.from('guests').update({ cpf: guestCpf }).eq('id', guestUpsert.id)
  }

  const guestId = guestUpsert.id

  // ── Generate unique token ─────────────────────────────────────────────────
  let token = generateToken()
  for (let attempt = 0; attempt < 3; attempt++) {
    const { data: dup } = await db
      .from('reservations')
      .select('token')
      .eq('token', token)
      .maybeSingle()
    if (!dup) break
    token = generateToken()
  }

  // ── Create reservation ────────────────────────────────────────────────────
  // source must be one of: 'direct', 'booking', 'airbnb', 'manual'
  // Walk-in = manual (counter sale)
  const { data: res, error: resErr } = await db
    .from('reservations')
    .insert({
      room_id:          roomId,
      guest_id:         guestId,
      check_in:         checkIn,
      check_out:        checkOut,
      adults,
      children,
      base_amount_brl:  total,
      total_brl:        total,
      discount_brl:     0,
      status:           'confirmed',
      source:           'manual',
      token,
      special_requests: specialReq,
    })
    .select('id')
    .single()

  if (resErr || !res) {
    console.error('[walk-in] reservation insert failed:', resErr)
    return { error: `Erro ao criar reserva: ${resErr?.message ?? 'desconhecido'}` }
  }

  const reservationId = res.id

  // ── Block dates ───────────────────────────────────────────────────────────
  const datesToBlock: {
    room_id: string; date: string; is_available: boolean
    blocked_reason: string; reservation_id: string
  }[] = []
  const cur = new Date(checkIn + 'T00:00:00Z')
  const end = new Date(checkOut + 'T00:00:00Z')
  while (cur < end) {
    datesToBlock.push({
      room_id:        roomId,
      date:           cur.toISOString().split('T')[0],
      is_available:   false,
      blocked_reason: 'reservation',
      reservation_id: reservationId,
    })
    cur.setUTCDate(cur.getUTCDate() + 1)
  }
  if (datesToBlock.length > 0) {
    const { error: availErr } = await db.from('room_availability').insert(datesToBlock)
    if (availErr) {
      console.error('[walk-in] room_availability insert failed:', availErr)
      // Non-fatal — reservation was created; dates may already be blocked
    }
  }

  // ── Create payment record ─────────────────────────────────────────────────
  // All walk-in payments use method='manual', provider='manual'.
  // The actual counter method is stored in metadata for reference.
  if (paymentMethod !== 'pay_later') {
    const payNow   = paymentMethod === 'cash' || paymentMethod === 'card_machine'
    const { error: payErr } = await db.from('payments').insert({
      reservation_id: reservationId,
      amount_brl:     total,
      method:         'manual',
      provider:       'manual',
      status:         payNow ? 'paid' : 'pending',
      ...(payNow ? { paid_at: new Date().toISOString() } : {}),
      metadata:       { walk_in_method: paymentMethod },
    })
    if (payErr) {
      console.error('[walk-in] payment insert failed:', payErr)
      // Non-fatal — reservation succeeded; payment can be registered manually
    }
  }

  // ── Reservation event ─────────────────────────────────────────────────────
  const methodLabel = PAYMENT_METHOD_LABELS[paymentMethod] ?? paymentMethod
  const { error: evtErr } = await db.from('reservation_events').insert({
    reservation_id: reservationId,
    event_type:     'reservation_created',
    description:    `Reserva walk-in criada pela recepção (${admin.full_name}). Pagamento: ${methodLabel}. Total: R$ ${total.toFixed(2)}.`,
    created_by:     `admin:${admin.email}`,
  })
  if (evtErr) {
    console.error('[walk-in] reservation_events insert failed:', evtErr)
  }

  return { success: true, token, reservationId }
}
