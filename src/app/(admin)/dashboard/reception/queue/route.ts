import { type NextRequest, NextResponse } from 'next/server'
import { getCurrentAdmin } from '@/lib/auth'
import { canAccessModule } from '@/lib/permissions'
import { createAdminClient } from '@/lib/supabase/admin'

type QueueResRow = {
  id: string
  token: string
  status: string
  check_in: string
  check_out: string
  guests: { full_name: string; phone: string | null } | { full_name: string; phone: string | null }[] | null
  rooms:
    | { id: string; name: string; room_number: string | null; housekeeping_status: string }
    | { id: string; name: string; room_number: string | null; housekeeping_status: string }[]
    | null
  payments: { status: string; created_at: string }[] | null
}

function one<T>(rel: T | T[] | null): T | null {
  if (!rel) return null
  return Array.isArray(rel) ? (rel[0] ?? null) : rel
}

function latestPayStatus(payments: { status: string; created_at: string }[] | null): string | null {
  if (!payments || payments.length === 0) return null
  if (payments.some((p) => p.status === 'paid')) return 'paid'
  const sorted = [...payments].sort((a, b) => b.created_at.localeCompare(a.created_at))
  return (sorted.find((p) => p.status !== 'failed') ?? sorted[0]).status
}

export async function GET(request: NextRequest) {
  const admin = await getCurrentAdmin()
  if (!admin || !canAccessModule(admin.role, 'reception')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const dateParam = request.nextUrl.searchParams.get('date')
  const date =
    dateParam && /^\d{4}-\d{2}-\d{2}$/.test(dateParam)
      ? dateParam
      : new Date().toLocaleDateString('sv-SE', { timeZone: 'America/Sao_Paulo' })

  const db = createAdminClient()

  const { data: settings } = await db
    .from('settings')
    .select('key, value')
    .in('key', ['check_in_time', 'check_out_time'])

  const settingsMap = new Map((settings ?? []).map((s) => [s.key, s.value as string]))
  const checkInTime  = settingsMap.get('check_in_time')  ?? '14:00'
  const checkOutTime = settingsMap.get('check_out_time') ?? '12:00'

  const SELECT = `id, token, status, check_in, check_out,
    guests ( full_name, phone ),
    rooms  ( id, name, room_number, housekeeping_status ),
    payments ( status, created_at )`

  const [{ data: checkInsData }, { data: checkOutsData }] = await Promise.all([
    db.from('reservations')
      .select(SELECT)
      .eq('check_in', date)
      .in('status', ['confirmed', 'pending_payment', 'checked_in'])
      .order('created_at', { ascending: true })
      .returns<QueueResRow[]>(),
    db.from('reservations')
      .select(SELECT)
      .eq('check_out', date)
      .in('status', ['checked_in', 'confirmed', 'checked_out'])
      .order('created_at', { ascending: true })
      .returns<QueueResRow[]>(),
  ])

  function mapRow(r: QueueResRow, type: 'checkin' | 'checkout') {
    const guest = one(r.guests)
    const room  = one(r.rooms)
    return {
      id:           r.id,
      type,
      token:        r.token,
      status:       r.status,
      guestName:    guest?.full_name ?? '—',
      guestPhone:   guest?.phone ?? null,
      roomId:       room?.id ?? null,
      roomName:     room?.name ?? '—',
      roomNumber:   room?.room_number ?? null,
      roomHkStatus: room?.housekeeping_status ?? null,
      payStatus:    latestPayStatus(r.payments),
      time:         type === 'checkin' ? checkInTime : checkOutTime,
    }
  }

  return NextResponse.json({
    date,
    checkIns:  (checkInsData  ?? []).map((r) => mapRow(r, 'checkin')),
    checkOuts: (checkOutsData ?? []).map((r) => mapRow(r, 'checkout')),
  })
}
