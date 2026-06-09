import type { Metadata } from 'next'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireModule } from '@/lib/auth'
import { HousekeepingBoard } from './_components/HousekeepingBoard'
import type { RoomBoardItem } from './_components/HousekeepingBoard'
import type { HandoffRow } from '@/components/admin/HandoffRequestCard'
import type { StaffMember, AssignmentItem, AssignableRoom } from './_components/AssignmentPanel'

export const metadata: Metadata = { title: "Governança — Painel Sofia's" }

function todayBRT(): string {
  return new Date().toLocaleDateString('sv-SE', { timeZone: 'America/Sao_Paulo' })
}

function formatDate(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number)
  return `${String(d).padStart(2, '0')}/${String(m).padStart(2, '0')}/${y}`
}

function one<T>(rel: T | T[] | null): T | null {
  if (!rel) return null
  return Array.isArray(rel) ? (rel[0] ?? null) : rel
}

// ── DB record shapes ──────────────────────────────────────────────────────────

type CategoryJoin = { name: string }
type GuestJoin    = { full_name: string }
type AdminJoin    = { full_name: string }

type RoomRecord = {
  id: string
  name: string
  housekeeping_status: string
  room_number: string | null
  room_categories: CategoryJoin | CategoryJoin[] | null
}

type ReservationRecord = {
  room_id: string
  token: string
  check_in: string
  check_out: string
  guests: GuestJoin | GuestJoin[] | null
}

type LogRecord = {
  room_id: string
  to_status: string
  note: string | null
  created_at: string
  admin_users: AdminJoin | AdminJoin[] | null
}

type HandoffRecord = {
  id: string
  title: string
  description: string | null
  priority: string
  status: string
  target_department: string
  created_at: string
  completed_at: string | null
  rooms: { name: string } | { name: string }[] | null
  reservations: { token: string; guests: GuestJoin | GuestJoin[] | null } | null
  requested_by_admin: AdminJoin | AdminJoin[] | null
}

type StaffRecord = {
  id: string
  full_name: string
}

type AssignmentRecord = {
  id: string
  room_id: string
  assigned_to: string
  status: string
  priority: string
}

// ── Page ──────────────────────────────────────────────────────────────────────

const ROOM_SELECT        = 'id, name, housekeeping_status, room_number, room_categories ( name )'
const RESERVATION_SELECT = 'room_id, token, check_in, check_out, guests ( full_name )'
const LOG_SELECT         = 'room_id, to_status, note, created_at, admin_users ( full_name )'

export default async function HousekeepingPage() {
  const admin = await requireModule('housekeeping')
  const isSupervisor = admin.role !== 'housekeeping'

  const db    = createAdminClient()
  const today = todayBRT()

  const [
    { data: roomsData },
    { data: checkoutsData },
    { data: arrivalsData },
    { data: logsData },
    { data: handoffData },
    { data: staffData },
    { data: assignmentsData },
  ] = await Promise.all([
    db.from('rooms')
      .select(ROOM_SELECT)
      .eq('is_active', true)
      .order('sort_order', { ascending: true })
      .returns<RoomRecord[]>(),

    db.from('reservations')
      .select(RESERVATION_SELECT)
      .eq('status', 'checked_out')
      .order('check_out', { ascending: false })
      .returns<ReservationRecord[]>(),

    db.from('reservations')
      .select(RESERVATION_SELECT)
      .in('status', ['confirmed', 'pending_payment'])
      .gte('check_in', today)
      .order('check_in', { ascending: true })
      .returns<ReservationRecord[]>(),

    db.from('housekeeping_logs')
      .select(LOG_SELECT)
      .order('created_at', { ascending: false })
      .returns<LogRecord[]>(),

    db.from('handoff_requests')
      .select('id, title, description, priority, status, target_department, created_at, completed_at, rooms ( name ), reservations ( token, guests ( full_name ) ), requested_by_admin:admin_users!handoff_requests_requested_by_fkey ( full_name )')
      .eq('target_department', 'housekeeping')
      .in('status', ['open', 'in_progress'])
      .order('created_at', { ascending: false })
      .returns<HandoffRecord[]>(),

    db.from('admin_users')
      .select('id, full_name')
      .eq('role', 'housekeeping')
      .eq('is_active', true)
      .order('full_name')
      .returns<StaffRecord[]>(),

    db.from('housekeeping_assignments')
      .select('id, room_id, assigned_to, status, priority')
      .in('status', ['pending', 'in_progress'])
      .order('created_at', { ascending: false })
      .returns<AssignmentRecord[]>(),
  ])

  // Build lookup maps
  const lastCheckoutByRoom = new Map<string, RoomBoardItem['lastCheckout']>()
  for (const r of checkoutsData ?? []) {
    if (!lastCheckoutByRoom.has(r.room_id)) {
      lastCheckoutByRoom.set(r.room_id, {
        token:     r.token,
        guestName: one(r.guests)?.full_name ?? '—',
        date:      r.check_out,
      })
    }
  }

  const nextArrivalByRoom = new Map<string, RoomBoardItem['nextArrival']>()
  for (const r of arrivalsData ?? []) {
    if (!nextArrivalByRoom.has(r.room_id)) {
      nextArrivalByRoom.set(r.room_id, {
        token:     r.token,
        guestName: one(r.guests)?.full_name ?? '—',
        date:      r.check_in,
      })
    }
  }

  const latestLogByRoom = new Map<string, RoomBoardItem['latestLog']>()
  for (const l of logsData ?? []) {
    if (!latestLogByRoom.has(l.room_id)) {
      latestLogByRoom.set(l.room_id, {
        toStatus:   l.to_status,
        note:       l.note,
        authorName: one(l.admin_users)?.full_name ?? null,
        createdAt:  l.created_at,
      })
    }
  }

  // Build staff name lookup for enriching assignments
  const staffById = new Map<string, string>()
  for (const s of staffData ?? []) {
    staffById.set(s.id, s.full_name)
  }

  // Build assignment lookup: one active assignment per room
  const assignmentByRoom = new Map<string, {
    id: string; assignedToId: string; assignedToName: string; status: string
  }>()
  for (const a of assignmentsData ?? []) {
    if (!assignmentByRoom.has(a.room_id)) {
      assignmentByRoom.set(a.room_id, {
        id:             a.id,
        assignedToId:   a.assigned_to,
        assignedToName: staffById.get(a.assigned_to) ?? '—',
        status:         a.status,
      })
    }
  }

  // Map DB rows → board items
  const rooms: RoomBoardItem[] = (roomsData ?? []).map((r) => ({
    id:           r.id,
    name:         r.name,
    roomNumber:   r.room_number,
    categoryName: one(r.room_categories)?.name ?? '—',
    status:       r.housekeeping_status,
    lastCheckout: lastCheckoutByRoom.get(r.id) ?? null,
    nextArrival:  nextArrivalByRoom.get(r.id)  ?? null,
    latestLog:    latestLogByRoom.get(r.id)    ?? null,
    assignment:   assignmentByRoom.get(r.id)   ?? null,
  }))

  // Group into 4 Kanban columns
  const kanban = {
    dirty:    rooms.filter((r) => r.status === 'dirty'),
    cleaning: rooms.filter((r) => r.status === 'cleaning'),
    awaiting: rooms.filter((r) => r.status === 'clean' || r.status === 'inspected'),
    ready:    rooms.filter((r) => r.status === 'ready'),
  }

  // Map handoff records → HandoffRow shape
  const handoffRequests: HandoffRow[] = (handoffData ?? []).map((h) => ({
    id:               h.id,
    title:            h.title,
    description:      h.description,
    priority:         h.priority,
    status:           h.status,
    targetDepartment: h.target_department,
    roomName:         one(h.rooms)?.name ?? null,
    guestName:        h.reservations ? one(h.reservations.guests)?.full_name ?? null : null,
    token:            h.reservations?.token ?? null,
    requestedByName:  one(h.requested_by_admin)?.full_name ?? null,
    createdAt:        h.created_at,
    completedAt:      h.completed_at,
  }))

  // Build staff and assignment props for the panel
  const staff: StaffMember[] = (staffData ?? []).map((s) => ({ id: s.id, full_name: s.full_name }))

  const activeAssignments: AssignmentItem[] = (assignmentsData ?? []).map((a) => {
    const room = rooms.find((r) => r.id === a.room_id)
    const roomLabel = room
      ? room.roomNumber ? `#${room.roomNumber} ${room.name}` : room.name
      : '—'
    return {
      id:           a.id,
      roomId:       a.room_id,
      roomName:     roomLabel,
      assignedToId: a.assigned_to,
      status:       a.status,
    }
  })

  // Rooms available for assignment (dirty or cleaning, not yet assigned)
  const availableRooms: AssignableRoom[] = kanban.dirty
    .concat(kanban.cleaning)
    .map((r) => ({
      id:         r.id,
      name:       r.name,
      roomNumber: r.roomNumber,
      status:     r.status,
    }))

  return (
    <HousekeepingBoard
      dirty={kanban.dirty}
      cleaning={kanban.cleaning}
      awaiting={kanban.awaiting}
      ready={kanban.ready}
      handoffRequests={handoffRequests}
      isSupervisor={isSupervisor}
      today={formatDate(today)}
      currentAdminId={admin.id}
      staff={staff}
      activeAssignments={activeAssignments}
      availableRooms={availableRooms}
    />
  )
}
