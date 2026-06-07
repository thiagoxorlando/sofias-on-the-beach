'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { calculateRoomPriceForDates } from '@/lib/pricing'

export type ReservationFormState = { error: string } | undefined

function generateToken(): string {
  const year  = new Date().getFullYear()
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  const code  = Array.from({ length: 4 }, () =>
    chars[Math.floor(Math.random() * chars.length)],
  ).join('')
  return `SOF-${year}-${code}`
}

export async function createReservationAction(
  _prev: ReservationFormState,
  formData: FormData,
): Promise<ReservationFormState> {
  // ── Auth + role check ─────────────────────────────────────────────────────
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user?.email) return { error: 'Sessão expirada. Faça login novamente.' }

  const db = createAdminClient()

  // Block admin/staff accounts from booking
  const { data: adminCheck } = await db
    .from('admin_users')
    .select('id')
    .eq('id', user.id)
    .eq('is_active', true)
    .maybeSingle()
  if (adminCheck) return { error: 'Contas de funcionários não podem fazer reservas pelo site.' }

  // Verify a guest record exists for this auth user
  const { data: guestCheck } = await db
    .from('guests')
    .select('id')
    .eq('email', user.email)
    .maybeSingle()
  if (!guestCheck) return { error: 'Conta de hóspede não encontrada. Por favor, crie uma conta.' }

  // ── Parse form inputs ─────────────────────────────────────────────────────
  const roomId     = ((formData.get('room_id')          as string) ?? '').trim()
  const checkIn    = ((formData.get('check_in')         as string) ?? '').trim()
  const checkOut   = ((formData.get('check_out')        as string) ?? '').trim()
  const guestsRaw  = parseInt((formData.get('guests')   as string) ?? '1', 10)
  const guests     = isNaN(guestsRaw) ? 1 : Math.max(1, guestsRaw)
  const fullName    = ((formData.get('full_name')          as string) ?? '').trim()
  const stayingName = ((formData.get('guest_staying_name') as string) ?? '').trim()
  const phone       = ((formData.get('phone')              as string) ?? '').trim() || null
  const specialReq  = ((formData.get('special_requests')   as string) ?? '').trim() || null

  // ── Validate ──────────────────────────────────────────────────────────────
  const ISO = /^\d{4}-\d{2}-\d{2}$/
  if (!roomId)                      return { error: 'Quarto inválido.' }
  if (!checkIn  || !ISO.test(checkIn))  return { error: 'Data de check-in inválida.' }
  if (!checkOut || !ISO.test(checkOut)) return { error: 'Data de check-out inválida.' }
  if (checkOut <= checkIn)          return { error: 'A data de check-out deve ser após o check-in.' }
  if (!fullName)                    return { error: 'Nome completo é obrigatório.' }
  if (!stayingName)                 return { error: 'Informe o nome de quem ficará hospedado.' }

  // The schema has no dedicated "primary guest" column — record who is actually
  // staying inside special_requests, since that is the only free-text field available.
  const stayingNote = `Hóspede que ficará na acomodação: ${stayingName}`
  const specialRequestsValue = specialReq ? `${stayingNote}\n\n${specialReq}` : stayingNote

  const nights = Math.round(
    (new Date(checkOut + 'T00:00:00Z').getTime() - new Date(checkIn + 'T00:00:00Z').getTime()) / 86_400_000,
  )
  if (nights < 1) return { error: 'Período mínimo é de 1 noite.' }

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
    return { error: 'Quarto indisponível para as datas selecionadas. Por favor, escolha outras datas.' }
  }

  // ── Calculate price (seasonal room_rates where applicable, base price otherwise) ──
  const pricing = await calculateRoomPriceForDates(roomId, checkIn, checkOut)
  if (!pricing) return { error: 'Quarto não encontrado ou inativo.' }

  const total = pricing.total

  // ── Update guest record with latest form data ────────────────────────────
  const guestId = guestCheck.id
  await db.from('guests').update({ full_name: fullName, phone }).eq('id', guestId)

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
      special_requests: specialRequestsValue,
    })
    .select('id')
    .single()

  if (resErr || !res) return { error: 'Erro ao criar reserva. Tente novamente.' }

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
      reservation_id: res.id,
    })
    cur.setUTCDate(cur.getUTCDate() + 1)
  }
  if (datesToBlock.length > 0) {
    await db.from('room_availability').insert(datesToBlock)
  }

  // ── Audit event ───────────────────────────────────────────────────────────
  await db.from('reservation_events').insert({
    reservation_id: res.id,
    event_type:     'reservation_created',
    description:    'Pré-reserva criada pelo hóspede via site.',
    created_by:     'guest',
  })

  redirect(`/reserva/${token}`)
}
