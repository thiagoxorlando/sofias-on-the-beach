import { type NextRequest, NextResponse } from 'next/server'
import { getCurrentAdmin } from '@/lib/auth'
import { canAccessModule } from '@/lib/permissions'
import { createAdminClient } from '@/lib/supabase/admin'

type ResRow = {
  id: string
  token: string
  status: string
  check_in: string
  check_out: string
  guests: { full_name: string; phone: string | null } | { full_name: string; phone: string | null }[] | null
  rooms:  { name: string } | { name: string }[] | null
}

function one<T>(rel: T | T[] | null): T | null {
  if (!rel) return null
  return Array.isArray(rel) ? (rel[0] ?? null) : rel
}

export async function GET(request: NextRequest) {
  const admin = await getCurrentAdmin()
  if (!admin || !canAccessModule(admin.role, 'reception')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const q = (request.nextUrl.searchParams.get('q') ?? '').trim()
  if (q.length < 2) {
    return NextResponse.json({ results: [] })
  }

  const db = createAdminClient()

  // Step 1: find guest IDs matching by name or phone
  const { data: guestMatches } = await db
    .from('guests')
    .select('id')
    .or(`full_name.ilike.%${q}%,phone.ilike.%${q}%`)
    .limit(15)

  const guestIds = (guestMatches ?? []).map((g) => g.id as string)

  // Step 2: query reservations by token OR matching guest_id
  const orParts = [`token.ilike.%${q}%`]
  if (guestIds.length > 0) {
    orParts.push(`guest_id.in.(${guestIds.join(',')})`)
  }

  const { data } = await db
    .from('reservations')
    .select('id, token, status, check_in, check_out, guests(full_name, phone), rooms(name)')
    .or(orParts.join(','))
    .neq('status', 'cancelled')
    .order('check_in', { ascending: false })
    .limit(8)
    .returns<ResRow[]>()

  const results = (data ?? []).map((r) => {
    const guest = one(r.guests)
    const room  = one(r.rooms)
    return {
      id:         r.id,
      token:      r.token,
      status:     r.status,
      check_in:   r.check_in,
      check_out:  r.check_out,
      guestName:  guest?.full_name ?? '—',
      guestPhone: guest?.phone ?? null,
      roomName:   room?.name ?? '—',
    }
  })

  return NextResponse.json({ results })
}
