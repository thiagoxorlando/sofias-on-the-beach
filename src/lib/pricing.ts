import { createAdminClient } from '@/lib/supabase/admin'

// Shared nightly-rate resolution — used by both the public booking flow and the
// admin pricing calendar so the guest price always matches what staff configured.

export type RoomRate = {
  id?: string
  name: string
  start_date: string
  end_date: string
  price_per_night: number
  min_nights: number
}

export function nextDay(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00Z')
  d.setUTCDate(d.getUTCDate() + 1)
  return d.toISOString().split('T')[0]
}

// A custom rate applies to a night when its range [start_date, end_date) covers
// that night's date — same checkout-style convention as reservations.
export function resolveNightlyRate(date: string, rates: RoomRate[]): RoomRate | null {
  return rates.find((r) => r.start_date <= date && date < r.end_date) ?? null
}

export type NightlyPrice = {
  date: string
  price: number
  isCustom: boolean
  rateName: string | null
}

export type PriceCalculation = {
  total: number
  nights: number
  basePrice: number
  nightlyPrices: NightlyPrice[]
}

// Calculates the total for [checkIn, checkOut) using applicable seasonal rates
// from room_rates where they exist, falling back to rooms.base_price_brl.
// Returns null when the room can't be found / is inactive.
export async function calculateRoomPriceForDates(
  roomId: string,
  checkIn: string,
  checkOut: string,
): Promise<PriceCalculation | null> {
  const db = createAdminClient()

  const { data: room } = await db
    .from('rooms')
    .select('id, base_price_brl')
    .eq('id', roomId)
    .eq('is_active', true)
    .single()

  if (!room) return null

  const { data: rates } = await db
    .from('room_rates')
    .select('id, name, start_date, end_date, price_per_night, min_nights')
    .eq('room_id', roomId)
    .eq('is_active', true)
    .lt('start_date', checkOut)
    .gt('end_date', checkIn)

  const nightlyPrices: NightlyPrice[] = []
  let cur = checkIn
  while (cur < checkOut) {
    const rate = resolveNightlyRate(cur, rates ?? [])
    nightlyPrices.push({
      date:     cur,
      price:    rate ? rate.price_per_night : room.base_price_brl,
      isCustom: !!rate,
      rateName: rate?.name ?? null,
    })
    cur = nextDay(cur)
  }

  return {
    total:     nightlyPrices.reduce((sum, n) => sum + n.price, 0),
    nights:    nightlyPrices.length,
    basePrice: room.base_price_brl,
    nightlyPrices,
  }
}
