import type { Metadata } from 'next'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireModule } from '@/lib/auth'
import { RoomActionBar } from './_components/RoomActionBar'

export const metadata: Metadata = { title: "Governança — Painel Sofia's" }

const CARD = 'bg-white rounded-[18px] border border-ocean-100 p-5'

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
  inspected: 'bg-ocean-100 text-ocean-700',
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

  const [{ data: roomsData }, { data: checkoutsData }, { data: arrivalsData }, { data: logsData }] = await Promise.all([
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

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8 max-w-6xl space-y-8">

      {/* Header */}
      <div>
        <p className="text-[11px] font-bold text-ocean-600 uppercase tracking-[0.28em] mb-1.5">Operação diária</p>
        <h1 className="font-serif text-[26px] md:text-[30px] font-bold text-ocean-900">Governança</h1>
        <p className="text-[13px] text-ocean-500 mt-1.5">
          Status de limpeza dos quartos — hoje, {formatDate(today)}.
        </p>
      </div>

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
        <span className="text-[12px] font-semibold text-ocean-400">{rooms.length}</span>
      </div>
      {rooms.length === 0 ? (
        <div className={`${CARD} text-center text-[13px] text-ocean-400 py-6`}>
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
          <p className="font-semibold text-ocean-900 text-[14px] truncate">{room.name}</p>
          <p className="text-[12px] text-ocean-400 truncate">{room.categoryName}</p>
        </div>
        <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold whitespace-nowrap ${STATUS_TONES[room.status] ?? 'bg-slate-100 text-slate-500'}`}>
          {STATUS_BADGE_LABELS[room.status] ?? room.status}
        </span>
      </div>

      {/* Movements + latest log */}
      <div className="mt-3.5 pt-3.5 border-t border-ocean-50 space-y-1.5">
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
          <p className="text-[12px] text-ocean-400">Sem movimentações recentes.</p>
        )}
      </div>

      {/* Actions */}
      <div className="mt-3.5 pt-3.5 border-t border-ocean-50">
        <RoomActionBar roomId={room.id} currentStatus={room.status} />
      </div>
    </div>
  )
}

function InfoLine({ label, value }: { label: string; value: string }) {
  return (
    <p className="text-[12px] text-ocean-600 leading-relaxed">
      <span className="font-semibold text-ocean-900">{label}:</span> {value}
    </p>
  )
}
