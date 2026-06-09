import type { Metadata } from 'next'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireModule } from '@/lib/auth'
import { AdminPageHeader, AdminStatCard } from '@/components/admin/AdminUI'
import { TicketManager } from './_components/TicketManager'
import type { TicketRow, RoomOption, StaffOption } from './_components/types'
import { HandoffRequestCard, type HandoffRow } from '@/components/admin/HandoffRequestCard'

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

  type HandoffRecord = {
    id: string; title: string; description: string | null; priority: string; status: string
    target_department: string; created_at: string; completed_at: string | null
    rooms: { name: string } | { name: string }[] | null
    reservations: { token: string; guests: { full_name: string } | { full_name: string }[] | null } | null
    requested_by_admin: { full_name: string } | { full_name: string }[] | null
  }

  const [{ data: ticketsData }, { data: roomsData }, { data: staffData }, { data: handoffData }] = await Promise.all([
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
    db.from('handoff_requests')
      .select('id, title, description, priority, status, target_department, created_at, completed_at, rooms ( name ), reservations ( token, guests ( full_name ) ), requested_by_admin:admin_users!handoff_requests_requested_by_fkey ( full_name )')
      .eq('target_department', 'maintenance')
      .in('status', ['open', 'in_progress'])
      .order('created_at', { ascending: false })
      .returns<HandoffRecord[]>(),
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

  const handoffRequests: HandoffRow[] = (handoffData ?? []).map((h) => ({
    id: h.id,
    title: h.title,
    description: h.description,
    priority: h.priority,
    status: h.status,
    targetDepartment: h.target_department,
    roomName: one(h.rooms)?.name ?? null,
    guestName: h.reservations ? one(h.reservations.guests)?.full_name ?? null : null,
    token: h.reservations?.token ?? null,
    requestedByName: one(h.requested_by_admin)?.full_name ?? null,
    createdAt: h.created_at,
    completedAt: h.completed_at,
  }))

  const open       = tickets.filter((t) => t.status === 'open').length
  const inProgress = tickets.filter((t) => t.status === 'in_progress').length
  const urgent     = tickets.filter((t) => t.priority === 'urgent' && t.status !== 'fixed').length
  const fixed      = tickets.filter((t) => t.status === 'fixed').length

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-7 max-w-6xl space-y-6">

      <AdminPageHeader
        eyebrow="Operação diária"
        title="Manutenção"
        subtitle="Reporte, acompanhe e resolva problemas de manutenção dos quartos e da propriedade."
      />

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <AdminStatCard label="Abertos" value={open} tone={open > 0 ? 'danger' : 'neutral'}
          icon={<svg viewBox="0 0 24 24" fill="none" stroke={open > 0 ? '#DC2626' : '#94A3B8'} strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5" aria-hidden="true"><circle cx={12} cy={12} r={9} /><line x1={12} y1={8} x2={12} y2={12} /><line x1={12} y1={16} x2={12.01} y2={16} /></svg>}
        />
        <AdminStatCard label="Em andamento" value={inProgress} tone={inProgress > 0 ? 'warning' : 'neutral'}
          icon={<svg viewBox="0 0 24 24" fill="none" stroke={inProgress > 0 ? '#D97706' : '#94A3B8'} strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5" aria-hidden="true"><path d="M12 3v4M12 17v4M3 12h4M17 12h4M5.6 5.6l2.8 2.8M15.6 15.6l2.8 2.8M18.4 5.6l-2.8 2.8M8.4 15.6l-2.8 2.8" /></svg>}
        />
        <AdminStatCard label="Urgentes" value={urgent} tone={urgent > 0 ? 'danger' : 'neutral'}
          icon={<svg viewBox="0 0 24 24" fill="none" stroke={urgent > 0 ? '#DC2626' : '#94A3B8'} strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5" aria-hidden="true"><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><line x1={12} y1={9} x2={12} y2={13} /><line x1={12} y1={17} x2={12.01} y2={17} /></svg>}
        />
        <AdminStatCard label="Resolvidos" value={fixed} tone={fixed > 0 ? 'success' : 'neutral'}
          icon={<svg viewBox="0 0 24 24" fill="none" stroke={fixed > 0 ? '#059669' : '#94A3B8'} strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5" aria-hidden="true"><polyline points="20 6 9 17 4 12" /></svg>}
        />
      </div>

      {handoffRequests.length > 0 && (
        <>
          <div className="flex items-center gap-3">
            <div className="flex-1 border-t border-admin-border" />
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.14em] px-1 shrink-0">Solicitações da recepção</span>
            <div className="flex-1 border-t border-admin-border" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {handoffRequests.map((req) => (
              <HandoffRequestCard key={req.id} request={req} />
            ))}
          </div>
        </>
      )}

      <div className="flex items-center gap-3 pt-2">
        <div className="flex-1 border-t border-admin-border" />
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.14em] px-1 shrink-0">Chamados de manutenção</span>
        <div className="flex-1 border-t border-admin-border" />
      </div>

      <TicketManager tickets={tickets} rooms={roomsData ?? []} staff={staffData ?? []} />

    </div>
  )
}
