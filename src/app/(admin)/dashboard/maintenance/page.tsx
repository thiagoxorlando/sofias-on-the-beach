import type { Metadata } from 'next'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireModule } from '@/lib/auth'
import { TicketManager } from './_components/TicketManager'
import type { TicketRow, RoomOption, StaffOption } from './_components/types'

export const metadata: Metadata = { title: "Manutenção — Painel Sofia's" }

const TICKET_SELECT =
  'id, room_id, title, description, priority, status, photo_paths, blocks_room, ' +
  'blocked_start_date, blocked_end_date, assigned_to, resolved_at, created_at, ' +
  'rooms ( name ), reported_by_admin:admin_users!maintenance_tickets_reported_by_fkey ( full_name ), ' +
  'assigned_to_admin:admin_users!maintenance_tickets_assigned_to_fkey ( full_name )'

function one<T>(rel: T | T[] | null): T | null {
  if (!rel) return null
  return Array.isArray(rel) ? (rel[0] ?? null) : rel
}

type RoomJoin = { name: string }
type AdminJoin = { full_name: string }

type TicketRecord = {
  id: string
  room_id: string | null
  title: string
  description: string | null
  priority: string
  status: string
  photo_paths: string[]
  blocks_room: boolean
  blocked_start_date: string | null
  blocked_end_date: string | null
  assigned_to: string | null
  resolved_at: string | null
  created_at: string
  rooms: RoomJoin | RoomJoin[] | null
  reported_by_admin: AdminJoin | AdminJoin[] | null
  assigned_to_admin: AdminJoin | AdminJoin[] | null
}

export default async function MaintenancePage() {
  await requireModule('maintenance')

  const db = createAdminClient()

  const [{ data: ticketsData }, { data: roomsData }, { data: staffData }] = await Promise.all([
    db.from('maintenance_tickets')
      .select(TICKET_SELECT)
      .order('created_at', { ascending: false })
      .returns<TicketRecord[]>(),
    db.from('rooms')
      .select('id, name')
      .eq('is_active', true)
      .order('sort_order', { ascending: true })
      .returns<RoomOption[]>(),
    db.from('admin_users')
      .select('id, full_name')
      .eq('is_active', true)
      .in('role', ['maintenance', 'manager', 'admin', 'super_admin'])
      .order('full_name', { ascending: true })
      .returns<StaffOption[]>(),
  ])

  const tickets: TicketRow[] = (ticketsData ?? []).map((t) => ({
    id: t.id,
    room_id: t.room_id,
    roomName: one(t.rooms)?.name ?? null,
    title: t.title,
    description: t.description,
    priority: t.priority,
    status: t.status,
    photo_paths: t.photo_paths ?? [],
    blocks_room: t.blocks_room,
    blocked_start_date: t.blocked_start_date,
    blocked_end_date: t.blocked_end_date,
    reportedByName: one(t.reported_by_admin)?.full_name ?? null,
    assigned_to: t.assigned_to,
    assignedToName: one(t.assigned_to_admin)?.full_name ?? null,
    resolved_at: t.resolved_at,
    created_at: t.created_at,
  }))

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8 max-w-6xl space-y-8">

      {/* Header */}
      <div>
        <p className="text-[11px] font-bold text-ocean-600 uppercase tracking-[0.28em] mb-1.5">Operação diária</p>
        <h1 className="font-serif text-[26px] md:text-[30px] font-bold text-ocean-900">Manutenção</h1>
        <p className="text-[13px] text-ocean-500 mt-1.5">
          Reporte, acompanhe e resolva problemas de manutenção dos quartos e da propriedade.
        </p>
      </div>

      <TicketManager tickets={tickets} rooms={roomsData ?? []} staff={staffData ?? []} />

    </div>
  )
}
