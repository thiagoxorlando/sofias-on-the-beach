import { createAdminClient } from '@/lib/supabase/admin'
import { nextDay, resolveNightlyRate, type RoomRate } from '@/lib/pricing'

export type CalendarDayStatus = 'available' | 'reservation' | 'manual_block'

export type CalendarDay = {
  date: string
  status: CalendarDayStatus
  price: number
  isCustomPrice: boolean
  rateName: string | null
  blockedReason: string | null
  reservationId: string | null
  reservationToken: string | null
}

export type RoomCalendarMonth = {
  year: number
  month: number // 1–12
  monthStart: string
  monthEnd: string // exclusive
  days: CalendarDay[]
}

function one<T>(rel: T | T[] | null): T | null {
  if (!rel) return null
  return Array.isArray(rel) ? (rel[0] ?? null) : rel
}

function pad(n: number): string {
  return String(n).padStart(2, '0')
}

function monthBounds(year: number, month: number): { monthStart: string; monthEnd: string } {
  const monthStart = `${year}-${pad(month)}-01`
  const nextYear  = month === 12 ? year + 1 : year
  const nextMonth = month === 12 ? 1 : month + 1
  return { monthStart, monthEnd: `${nextYear}-${pad(nextMonth)}-01` }
}

// Builds a day-by-day view of one room's calendar for a given month: status
// (available / reservation / manual block), the resolved nightly price, and —
// for blocked days — the reason or the linked reservation token.
export async function getRoomCalendarData(roomId: string, year: number, month: number): Promise<RoomCalendarMonth | null> {
  const db = createAdminClient()
  const { monthStart, monthEnd } = monthBounds(year, month)

  const { data: room } = await db
    .from('rooms')
    .select('id, base_price_brl')
    .eq('id', roomId)
    .single()

  if (!room) return null

  const [{ data: blockedRows }, { data: ratesData }] = await Promise.all([
    db
      .from('room_availability')
      .select('id, date, blocked_reason, reservation_id, reservations ( token )')
      .eq('room_id', roomId)
      .gte('date', monthStart)
      .lt('date', monthEnd)
      .order('date', { ascending: true }),
    db
      .from('room_rates')
      .select('id, name, start_date, end_date, price_per_night, min_nights')
      .eq('room_id', roomId)
      .eq('is_active', true)
      .lt('start_date', monthEnd)
      .gt('end_date', monthStart),
  ])

  type BlockedRow = {
    id: string
    date: string
    blocked_reason: string
    reservation_id: string | null
    reservations: { token: string } | { token: string }[] | null
  }

  const blockedByDate = new Map<string, BlockedRow>()
  for (const row of (blockedRows ?? []) as BlockedRow[]) {
    blockedByDate.set(row.date, row)
  }

  const rates = (ratesData ?? []) as RoomRate[]

  const days: CalendarDay[] = []
  let cur = monthStart
  while (cur < monthEnd) {
    const blocked = blockedByDate.get(cur) ?? null
    const rate = resolveNightlyRate(cur, rates)

    days.push({
      date:             cur,
      status:           blocked ? (blocked.reservation_id ? 'reservation' : 'manual_block') : 'available',
      price:            rate ? rate.price_per_night : room.base_price_brl,
      isCustomPrice:    !!rate,
      rateName:         rate?.name ?? null,
      blockedReason:    blocked?.blocked_reason ?? null,
      reservationId:    blocked?.reservation_id ?? null,
      reservationToken: blocked ? (one(blocked.reservations)?.token ?? null) : null,
    })
    cur = nextDay(cur)
  }

  return { year, month, monthStart, monthEnd, days }
}
