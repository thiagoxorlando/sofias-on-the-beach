'use server'

import { redirect } from 'next/navigation'
import { createAdminClient } from '@/lib/supabase/admin'

export type ReservationFormState = { error: string } | undefined

function generateToken(): string {
  const year = new Date().getFullYear()
  // Unambiguous chars: no I/O/0/1 confusion
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  const code = Array.from({ length: 4 }, () =>
    chars[Math.floor(Math.random() * chars.length)],
  ).join('')
  return `SOF-${year}-${code}`
}

export async function createReservationAction(
  _prev: ReservationFormState,
  formData: FormData,
): Promise<ReservationFormState> {
  const roomId     = ((formData.get('room_id')          as string) ?? '').trim()
  const checkIn    = ((formData.get('check_in')         as string) ?? '').trim()
  const checkOut   = ((formData.get('check_out')        as string) ?? '').trim()
  const guestsRaw  = parseInt((formData.get('guests')   as string) ?? '1', 10)
  const guests     = isNaN(guestsRaw) ? 1 : Math.max(1, guestsRaw)
  const fullName   = ((formData.get('full_name')        as string) ?? '').trim()
  const email      = ((formData.get('email')            as string) ?? '').trim().toLowerCase()
  const phone      = ((formData.get('phone')            as string) ?? '').trim() || null
  const specialReq = ((formData.get('special_requests') as string) ?? '').trim() || null

  const ISO = /^\d{4}-\d{2}-\d{2}$/
  if (!roomId)                                               return { error: 'Quarto inválido.' }
  if (!checkIn  || !ISO.test(checkIn))                      return { error: 'Data de check-in inválida.' }
  if (!checkOut || !ISO.test(checkOut))                     return { error: 'Data de check-out inválida.' }
  if (checkOut <= checkIn)                                  return { error: 'A data de check-out deve ser após o check-in.' }
  if (!fullName)                                            return { error: 'Nome completo é obrigatório.' }
  if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return { error: 'E-mail inválido.' }

  const nights = Math.round(
    (new Date(checkOut + 'T00:00:00Z').getTime() - new Date(checkIn + 'T00:00:00Z').getTime()) / 86_400_000,
  )
  if (nights < 1) return { error: 'Período mínimo é de 1 noite.' }

  const db = createAdminClient()

  // Re-verify the room is still free for these dates
  const { data: blocked } = await db
    .from('room_availability')
    .select('id')
    .eq('room_id', roomId)
    .gte('date', checkIn)
    .lt('date', checkOut)
    .eq('is_available', false)
    .limit(1)

  if (blocked && blocked.length > 0) {
    return { error: 'Quarto indisponível para as datas selecionadas. Por favor, escolha outras datas.' }
  }

  // Fetch room to get the current price
  const { data: room } = await db
    .from('rooms')
    .select('id, base_price_brl')
    .eq('id', roomId)
    .eq('is_active', true)
    .single()

  if (!room) return { error: 'Quarto não encontrado ou inativo.' }

  const total = nights * room.base_price_brl

  // Find or create guest record by email
  const { data: existing } = await db
    .from('guests')
    .select('id')
    .eq('email', email)
    .maybeSingle()

  let guestId: string
  if (existing) {
    await db.from('guests').update({ full_name: fullName, phone }).eq('id', existing.id)
    guestId = existing.id
  } else {
    const { data: created, error: guestErr } = await db
      .from('guests')
      .insert({ email, full_name: fullName, phone, nationality: 'BR' })
      .select('id')
      .single()
    if (guestErr || !created) return { error: 'Erro ao registrar hóspede. Tente novamente.' }
    guestId = created.id
  }

  // Generate token with collision retry
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

  // Create reservation
  const { data: res, error: resErr } = await db
    .from('reservations')
    .insert({
      room_id:          roomId,
      guest_id:         guestId,
      check_in:         checkIn,
      check_out:        checkOut,
      adults:           guests,
      children:         0,
      base_amount_brl:  total,
      total_brl:        total,
      discount_brl:     0,
      status:           'pending_payment',
      source:           'direct',
      token,
      special_requests: specialReq,
    })
    .select('id')
    .single()

  if (resErr || !res) return { error: 'Erro ao criar reserva. Tente novamente.' }

  // Block each date from check-in up to (but not including) check-out
  const datesToBlock: {
    room_id: string
    date: string
    is_available: boolean
    blocked_reason: string
    reservation_id: string
  }[] = []
  const cur = new Date(checkIn + 'T00:00:00Z')
  const end = new Date(checkOut + 'T00:00:00Z')
  while (cur < end) {
    datesToBlock.push({
      room_id:        roomId,
      date:           cur.toISOString().split('T')[0],
      is_available:   false,
      blocked_reason: 'reservation',
      reservation_id: res.id,
    })
    cur.setUTCDate(cur.getUTCDate() + 1)
  }
  if (datesToBlock.length > 0) {
    await db.from('room_availability').insert(datesToBlock)
  }

  // Audit event
  await db.from('reservation_events').insert({
    reservation_id: res.id,
    event_type:     'reservation_created',
    description:    'Pré-reserva criada pelo hóspede via site.',
    created_by:     'guest',
  })

  redirect(`/reserva/${token}`)
}
