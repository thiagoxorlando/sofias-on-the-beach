import { createClient } from '@/lib/supabase/server'

// Returns the set of room IDs that have at least one blocked date in [checkIn, checkOut).
// Sparse model: a room_availability row with is_available=false means the date is blocked.
// checkOut is exclusive — the guest checks out that morning, so it doesn't need to be free.
export async function getBlockedRoomIds(
  roomIds: string[],
  checkIn: string,  // YYYY-MM-DD inclusive
  checkOut: string, // YYYY-MM-DD exclusive
): Promise<Set<string>> {
  if (roomIds.length === 0) return new Set()
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('room_availability')
      .select('room_id')
      .in('room_id', roomIds)
      .gte('date', checkIn)
      .lt('date', checkOut)
      .eq('is_available', false)

    if (error || !data) return new Set()
    return new Set(data.map((r) => r.room_id))
  } catch {
    return new Set()
  }
}
