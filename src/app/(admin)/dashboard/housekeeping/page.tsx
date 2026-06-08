import type { Metadata } from 'next'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireModule } from '@/lib/auth'
import { AdminPageHeader, AdminStatCard } from '@/components/admin/AdminUI'
import { RoomActionBar } from './_components/RoomActionBar'
import { HandoffRequestCard, type HandoffRow } from '@/components/admin/HandoffRequestCard'

export const metadata: Metadata = { title: "Governança — Painel Sofia's" }

const CARD = 'bg-white rounded-2xl border border-admin-border shadow-sm p-5'

const STATUS_ORDER = ['dirty', 'cleaning', 'clean', 'inspected', 'ready'] as const

const COLUMN_TITLES: Record<string, string> = {
  dirty:     'Sujos',
  cleaning:  'Em limpeza',
  clean:     'Limpos',
  inspected: 'Inspecionados',
  ready:     'Prontos',
}

const STATUS_BADGE_LABELS: Record<string, string> = {
  dirty:     'Sujo',
  cleaning:  'Em limpeza',
  clean:     'Limpo',
  inspected: 'Inspecionado',
  ready:     'Pronto',
}

const STATUS_TONES: Record<string, string> = {
  dirty:     'bg-red-50 text-red-600',
  cleaning:  'bg-amber-50 text-amber-700',
  clean:     'bg-emerald-50 text-emerald-700',
  inspected: 'bg-sky-50 text-sky-700',
  ready:     'bg-sky-50 text-sky-700',
}

function todayISO(): string {
  return new Date().toISOString().slice(0, 10)
}

function formatDate(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number)
  return `${String(d).padStart(2, '0')}/${String(m).padStart(2, '0')}/${y}`
}

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleDateString('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit',
  })
}

function one<T>(rel: T | T[] | null): T | null {
  if (!rel) return null
  return Array.isArray(rel) ? (rel[0] ?? null) : rel
}

type CategoryJoin = { name: string }
type GuestJoin = { full_name: string }
type AdminJoin = { full_name: string }

type RoomRecord = {
  id: string
  name: string
  housekeeping_status: string
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

type MovementInfo = { token: string; guestName: string; date: string }
type LogInfo = { toStatus: string; note: string | null; authorName: string | null; createdAt: string }

type RoomBoardItem = {
  id: string
  name: string
  categoryName: string
  status: string
  lastCheckout: MovementInfo | null
  nextArrival: MovementInfo | null
  latestLog: LogInfo | null
}

const ROOM_SELECT = 'id, name, housekeeping_status, room_categories ( name )'
const RESERVATION_SELECT = 'room_id, token, check_in, check_out, guests ( full_name )'
const LOG_SELECT = 'room_id, to_status, note, created_at, admin_users ( full_name )'

export default async function HousekeepingPage() {
  await requireModule('housekeeping')

  const db = createAdminClient()
  const today = todayISO()

  type HandoffRecord = {
    id: string; title: string; description: string | null; priority: string; status: string
    target_department: string; created_at: string; completed_at: string | null
    rooms: { name: string } | { name: string }[] | null
    reservations: { token: string; guests: { full_name: string } | { full_name: string }[] | null } | null
    requested_by_admin: { full_name: string } | { full_name: string }[] | null
  }

  const [{ data: roomsData }, { data: checkoutsData }, { data: arrivalsData }, { data: logsData }, { data: handoffData }] = await Promise.all([
    db.from('rooms').select(ROOM_SELECT)
      .eq('is_active', true)
      .order('sort_order', { ascending: true })
      .returns<RoomRecord[]>(),
    db.from('reservations').select(RESERVATION_SELECT)
      .eq('status', 'checked_out')
      .order('check_out', { ascending: false })
      .returns<ReservationRecord[]>(),
    db.from('reservations').select(RESERVATION_SELECT)
      .in('status', ['confirmed', 'pending_payment'])
      .gte('check_in', today)
      .order('check_in', { ascending: true })
      .returns<ReservationRecord[]>(),
    db.from('housekeeping_logs').select(LOG_SELECT)
      .order('created_at', { ascending: false })
      .returns<LogRecord[]>(),
    db.from('handoff_requests')
      .select('id, title, description, priority, status, target_department, created_at, completed_at, rooms ( name ), reservations ( token, guests ( full_name ) ), requested_by_admin:admin_users!handoff_requests_requested_by_fkey ( full_name )')
      .eq('target_department', 'housekeeping')
      .in('status', ['open', 'in_progress'])
      .order('created_at', { ascending: false })
      .returns<HandoffRecord[]>(),
  ])

  const lastCheckoutByRoom = new Map<string, MovementInfo>()
  for (const r of checkoutsData ?? []) {
    if (!lastCheckoutByRoom.has(r.room_id)) {
      lastCheckoutByRoom.set(r.room_id, { token: r.token, guestName: one(r.guests)?.full_name ?? '—', date: r.check_out })
    }
  }

  const nextArrivalByRoom = new Map<string, MovementInfo>()
  for (const r of arrivalsData ?? []) {
    if (!nextArrivalByRoom.has(r.room_id)) {
      nextArrivalByRoom.set(r.room_id, { token: r.token, guestName: one(r.guests)?.full_name ?? '—', date: r.check_in })
    }
  }

  const latestLogByRoom = new Map<string, LogInfo>()
  for (const l of logsData ?? []) {
    if (!latestLogByRoom.has(l.room_id)) {
      latestLogByRoom.set(l.room_id, {
        toStatus: l.to_status,
        note: l.note,
        authorName: one(l.admin_users)?.full_name ?? null,
        createdAt: l.created_at,
      })
    }
  }

  const rooms: RoomBoardItem[] = (roomsData ?? []).map((r) => ({
    id: r.id,
    name: r.name,
    categoryName: one(r.room_categories)?.name ?? '—',
    status: r.housekeeping_status,
    lastCheckout: lastCheckoutByRoom.get(r.id) ?? null,
    nextArrival: nextArrivalByRoom.get(r.id) ?? null,
    latestLog: latestLogByRoom.get(r.id) ?? null,
  }))

  const byStatus = new Map<string, RoomBoardItem[]>()
  for (const status of STATUS_ORDER) byStatus.set(status, [])
  for (const room of rooms) {
    const bucket = byStatus.get(room.status)
    if (bucket) bucket.push(room)
    else byStatus.set(room.status, [room])
  }

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

  const dirty     = byStatus.get('dirty')?.length     ?? 0
  const cleaning  = byStatus.get('cleaning')?.length  ?? 0
  const clean     = byStatus.get('clean')?.length     ?? 0
  const inspected = byStatus.get('inspected')?.length ?? 0
  const ready     = byStatus.get('ready')?.length     ?? 0

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-7 max-w-6xl space-y-6">

      <AdminPageHeader
        eyebrow="Operação diária"
        title="Governança"
        subtitle={`Status de limpeza dos quartos — hoje, ${formatDate(today)}.`}
      />

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <AdminStatCard label="Sujos" value={dirty} tone={dirty > 0 ? 'danger' : 'neutral'}
          icon={<svg viewBox="0 0 24 24" fill="none" stroke={dirty > 0 ? '#DC2626' : '#94A3B8'} strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5" aria-hidden="true"><circle cx={12} cy={12} r={9} /><line x1={12} y1={8} x2={12} y2={12} /><line x1={12} y1={16} x2={12.01} y2={16} /></svg>}
        />
        <AdminStatCard label="Em limpeza" value={cleaning} tone={cleaning > 0 ? 'warning' : 'neutral'}
          icon={<svg viewBox="0 0 24 24" fill="none" stroke={cleaning > 0 ? '#D97706' : '#94A3B8'} strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5" aria-hidden="true"><path d="M12 3v4M12 17v4M3 12h4M17 12h4M5.6 5.6l2.8 2.8M15.6 15.6l2.8 2.8M18.4 5.6l-2.8 2.8M8.4 15.6l-2.8 2.8" /></svg>}
        />
        <AdminStatCard label="Limpos" value={clean} tone={clean > 0 ? 'success' : 'neutral'}
          icon={<svg viewBox="0 0 24 24" fill="none" stroke={clean > 0 ? '#059669' : '#94A3B8'} strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5" aria-hidden="true"><polyline points="20 6 9 17 4 12" /></svg>}
        />
        <AdminStatCard label="Inspecionados" value={inspected} tone={inspected > 0 ? 'info' : 'neutral'}
          icon={<svg viewBox="0 0 24 24" fill="none" stroke={inspected > 0 ? '#0284C7' : '#94A3B8'} strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5" aria-hidden="true"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx={12} cy={12} r={3} /></svg>}
        />
        <AdminStatCard label="Prontos" value={ready} tone={ready > 0 ? 'success' : 'neutral'}
          icon={<svg viewBox="0 0 24 24" fill="none" stroke={ready > 0 ? '#059669' : '#94A3B8'} strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5" aria-hidden="true"><path d="M2 20v-8a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v8" /><path d="M2 15h20" /></svg>}
        />
      </div>

      {handoffRequests.length > 0 && (
        <section>
          <div className="flex items-center gap-2.5 mb-3">
            <span className="inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold bg-amber-50 text-amber-700">
              Solicitações da recepção
            </span>
            <span className="text-[12px] font-semibold text-slate-400">{handoffRequests.length}</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {handoffRequests.map((req) => (
              <HandoffRequestCard key={req.id} request={req} />
            ))}
          </div>
        </section>
      )}

      {STATUS_ORDER.map((status) => (
        <HousekeepingColumn
          key={status}
          status={status}
          title={COLUMN_TITLES[status]}
          rooms={byStatus.get(status) ?? []}
        />
      ))}

    </div>
  )
}

// ─── Section & cards ──────────────────────────────────────────────────────────

function HousekeepingColumn({ status, title, rooms }: { status: string; title: string; rooms: RoomBoardItem[] }) {
  return (
    <section>
      <div className="flex items-center gap-2.5 mb-3">
        <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold ${STATUS_TONES[status] ?? 'bg-slate-100 text-slate-500'}`}>
          {title}
        </span>
        <span className="text-[12px] font-semibold text-slate-400">{rooms.length}</span>
      </div>
      {rooms.length === 0 ? (
        <div className={`${CARD} text-center text-[13px] text-slate-400 py-6`}>
          Nenhum quarto neste status no momento.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {rooms.map((room) => <RoomCard key={room.id} room={room} />)}
        </div>
      )}
    </section>
  )
}

function RoomCard({ room }: { room: RoomBoardItem }) {
  return (
    <div className={CARD}>

      {/* Room + status */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-semibold text-slate-800 text-[14px] truncate">{room.name}</p>
          <p className="text-[12px] text-slate-400 truncate">{room.categoryName}</p>
        </div>
        <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold whitespace-nowrap ${STATUS_TONES[room.status] ?? 'bg-slate-100 text-slate-500'}`}>
          {STATUS_BADGE_LABELS[room.status] ?? room.status}
        </span>
      </div>

      {/* Movements + latest log */}
      <div className="mt-3.5 pt-3.5 border-t border-slate-100 space-y-1.5">
        {room.lastCheckout && (
          <InfoLine label="Última saída" value={`${room.lastCheckout.guestName} · ${formatDate(room.lastCheckout.date)} · ${room.lastCheckout.token}`} />
        )}
        {room.nextArrival && (
          <InfoLine label="Próxima chegada" value={`${room.nextArrival.guestName} · ${formatDate(room.nextArrival.date)} · ${room.nextArrival.token}`} />
        )}
        {room.latestLog && (
          <InfoLine
            label="Último registro"
            value={`${STATUS_BADGE_LABELS[room.latestLog.toStatus] ?? room.latestLog.toStatus}${room.latestLog.note ? ` — ${room.latestLog.note}` : ''} · ${room.latestLog.authorName ?? 'Equipe'} · ${formatDateTime(room.latestLog.createdAt)}`}
          />
        )}
        {!room.lastCheckout && !room.nextArrival && !room.latestLog && (
          <p className="text-[12px] text-slate-400">Sem movimentações recentes.</p>
        )}
      </div>

      {/* Actions */}
      <div className="mt-3.5 pt-3.5 border-t border-slate-100">
        <RoomActionBar roomId={room.id} currentStatus={room.status} />
      </div>
    </div>
  )
}

function InfoLine({ label, value }: { label: string; value: string }) {
  return (
    <p className="text-[12px] text-slate-600 leading-relaxed">
      <span className="font-semibold text-slate-700">{label}:</span> {value}
    </p>
  )
}
