import type { Metadata } from 'next'
import Link from 'next/link'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireModule } from '@/lib/auth'
import { QuickCheckBtn } from './_components/QuickCheckBtn'
import { InspectionRequestBtn } from './_components/InspectionRequestBtn'
import { ReceptionTools } from './_components/ReceptionTools'
import { NotificationBell } from './_components/NotificationBell'

export const metadata: Metadata = { title: "Recepção — Sofia's" }

// ── Helpers ───────────────────────────────────────────────────────────────────

// sv-SE locale always produces YYYY-MM-DD — use it to get local BRT date
function todayISO(): string {
  return new Date().toLocaleDateString('sv-SE', { timeZone: 'America/Sao_Paulo' })
}

function addDaysISO(dateStr: string, days: number): string {
  const d = new Date(dateStr + 'T00:00:00Z')
  d.setUTCDate(d.getUTCDate() + days)
  return d.toISOString().slice(0, 10)
}

function formatDate(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number)
  return `${String(d).padStart(2, '0')}/${String(m).padStart(2, '0')}/${y}`
}

function formatBRL(value: number): string {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(value)
}

function getGreeting(): string {
  // Brazil Standard Time = UTC − 3
  const brHour = (new Date().getUTCHours() - 3 + 24) % 24
  if (brHour >= 5 && brHour < 12) return 'Bom dia'
  if (brHour >= 12 && brHour < 18) return 'Boa tarde'
  return 'Boa noite'
}

function getFullDate(): string {
  return new Date().toLocaleDateString('pt-BR', {
    weekday: 'long', day: '2-digit', month: 'long', year: 'numeric',
    timeZone: 'America/Sao_Paulo',
  })
}

// ── Types ─────────────────────────────────────────────────────────────────────

type GuestJoin = { full_name: string; phone: string | null }
type RoomJoin  = { id: string; name: string; housekeeping_status: string; room_number: string | null }
type PayJoin   = { status: string; created_at: string }

type ResRow = {
  id: string; token: string; status: string
  check_in: string; check_out: string
  adults: number; children: number; total_brl: number
  special_requests: string | null
  special_request_status: string
  guests: GuestJoin | GuestJoin[] | null
  rooms:  RoomJoin  | RoomJoin[]  | null
  payments: PayJoin[] | null
}

type SlimResRow = {
  id: string; token: string; status: string
  check_in: string; check_out: string; adults: number; children: number
  guests: GuestJoin | GuestJoin[] | null
  rooms:  { name: string } | { name: string }[] | null
  payments: { status: string; created_at: string }[] | null
}

type RoomRow = { id: string; name: string; sort_order: number; housekeeping_status: string; room_number: string | null }

function one<T>(rel: T | T[] | null): T | null {
  if (!rel) return null
  return Array.isArray(rel) ? (rel[0] ?? null) : rel
}

function latestPayStatus(payments: PayJoin[] | null): string | null {
  if (!payments || payments.length === 0) return null
  // If any payment is paid, the reservation is considered paid
  if (payments.some((p) => p.status === 'paid')) return 'paid'
  const sorted = [...payments].sort((a, b) => b.created_at.localeCompare(a.created_at))
  return (sorted.find((p) => p.status !== 'failed') ?? sorted[0]).status
}

// Extract a short room identifier: DB room_number → trailing number in name → sort_order → initials
function roomNumber(dbRoomNumber: string | null | undefined, name: string, sortOrder?: number): string {
  if (dbRoomNumber) return dbRoomNumber
  const m = name.match(/(\d+[A-Za-z]?)\s*$/)
  if (m) return m[1]
  if (sortOrder !== undefined) return String(sortOrder)
  return name.trim().split(/\s+/).slice(0, 2).map((w) => w[0].toUpperCase()).join('')
}

// Short label without trailing number ("Suite Vista Mar 2" → "Suite Vista Mar")
function roomShortName(name: string): string {
  return name.replace(/\s*\d+[A-Za-z]?\s*$/, '').trim() || name
}

// ── Data selection strings ────────────────────────────────────────────────────

const SELECT = `
  id, token, status, check_in, check_out, adults, children, total_brl,
  special_requests, special_request_status,
  guests ( full_name, phone ),
  rooms  ( id, name, housekeeping_status, room_number ),
  payments ( status, created_at )
`

const SELECT_SLIM = `
  id, token, status, check_in, check_out, adults, children,
  guests ( full_name, phone ),
  rooms  ( name ),
  payments ( status, created_at )
`

// ── Status configs ────────────────────────────────────────────────────────────

const ROOM_STATUS_CFG: Record<string, { label: string; dot: string; bg: string; border: string; text: string }> = {
  occupied:  { label: 'Ocupado',      dot: 'bg-sky-500',     bg: 'bg-sky-50',      border: 'border-sky-200',     text: 'text-sky-700'     },
  ready:     { label: 'Pronto',       dot: 'bg-emerald-500', bg: 'bg-emerald-50',  border: 'border-emerald-200', text: 'text-emerald-700' },
  inspected: { label: 'Inspecionado', dot: 'bg-blue-400',    bg: 'bg-blue-50',     border: 'border-blue-200',    text: 'text-blue-700'    },
  clean:     { label: 'Limpo',        dot: 'bg-teal-400',    bg: 'bg-teal-50',     border: 'border-teal-200',    text: 'text-teal-700'    },
  cleaning:  { label: 'Em limpeza',   dot: 'bg-amber-500',   bg: 'bg-amber-50',    border: 'border-amber-200',   text: 'text-amber-700'   },
  dirty:     { label: 'Sujo',         dot: 'bg-red-500',     bg: 'bg-red-50',      border: 'border-red-200',     text: 'text-red-700'     },
}

const RES_STATUS_LABEL: Record<string, string> = {
  confirmed:       'Confirmado',
  pending_payment: 'Aguardando pag.',
  checked_in:      'Hospedado',
  checked_out:     'Check-out feito',
  cancelled:       'Cancelado',
}

const PAY_STATUS_LABEL: Record<string, string> = {
  paid:      'Pago',
  pending:   'Pendente',
  overdue:   'Vencido',
  failed:    'Falhou',
  cancelled: 'Cancelado',
  refunded:  'Estornado',
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function ReceptionPage() {
  await requireModule('reception')

  const db      = createAdminClient()
  const today   = todayISO()
  const in7Days = addDaysISO(today, 7)
  const greeting = getGreeting()
  const fullDate  = getFullDate()

  // ── Parallel data fetch ───────────────────────────────────────────────────
  const [
    { data: checkInsData },
    { data: checkOutsData },
    { data: stayingData },
    { data: upcoming7Data },
    { data: roomsData },
    { data: pendingPayData },
    { data: settingsData },
  ] = await Promise.all([
    db.from('reservations').select(SELECT)
      .eq('check_in', today).in('status', ['confirmed', 'pending_payment'])
      .order('created_at', { ascending: true })
      .returns<ResRow[]>(),
    db.from('reservations').select(SELECT)
      .eq('check_out', today).in('status', ['checked_in', 'confirmed'])
      .order('created_at', { ascending: true })
      .returns<ResRow[]>(),
    db.from('reservations').select(SELECT)
      .eq('status', 'checked_in')
      .order('check_out', { ascending: true })
      .returns<ResRow[]>(),
    db.from('reservations').select(SELECT_SLIM)
      .gt('check_in', today).lte('check_in', in7Days)
      .in('status', ['confirmed', 'pending_payment'])
      .order('check_in', { ascending: true })
      .limit(20)
      .returns<SlimResRow[]>(),
    db.from('rooms').select('id, name, sort_order, housekeeping_status, room_number')
      .eq('is_active', true).order('sort_order', { ascending: true })
      .returns<RoomRow[]>(),
    db.from('payments').select('id, amount_brl')
      .in('status', ['pending', 'overdue'])
      .returns<{ id: string; amount_brl: number }[]>(),
    db.from('settings').select('key, value')
      .in('key', ['check_in_time', 'check_out_time']),
  ])

  // ── Secondary: pending charges for today's ops ────────────────────────────
  const todayIds = [
    ...(checkInsData ?? []).map((r) => r.id),
    ...(checkOutsData ?? []).map((r) => r.id),
  ]
  const pendingChargesMap = new Map<string, number>()
  if (todayIds.length > 0) {
    const { data: chargesData } = await db
      .from('reservation_charges')
      .select('reservation_id')
      .in('reservation_id', todayIds)
      .eq('status', 'pending')
    for (const c of chargesData ?? []) {
      pendingChargesMap.set(c.reservation_id, (pendingChargesMap.get(c.reservation_id) ?? 0) + 1)
    }
  }

  // ── Settings ──────────────────────────────────────────────────────────────
  const settingsMap = new Map((settingsData ?? []).map((s) => [s.key, s.value as string]))
  const checkInTime  = settingsMap.get('check_in_time')  ?? '14:00'
  const checkOutTime = settingsMap.get('check_out_time') ?? '12:00'

  // ── Stats ─────────────────────────────────────────────────────────────────
  const hkCounts = { ready: 0, inspected: 0, clean: 0, cleaning: 0, dirty: 0 }
  const checkedInRoomMap = new Map<string, string>() // roomId → guestFirstName
  for (const r of stayingData ?? []) {
    const roomId = one(r.rooms)?.id
    const guestName = one(r.guests)?.full_name ?? null
    if (roomId) checkedInRoomMap.set(roomId, guestName ? guestName.split(' ')[0] : 'Hóspede')
  }
  for (const room of roomsData ?? []) {
    if (!checkedInRoomMap.has(room.id)) {
      const s = room.housekeeping_status as keyof typeof hkCounts
      if (s in hkCounts) hkCounts[s]++
    }
  }

  const pendingPayTotal = (pendingPayData ?? []).reduce((sum, p) => sum + p.amount_brl, 0)
  const pendingPayCount = (pendingPayData ?? []).length

  // ── Room map ──────────────────────────────────────────────────────────────
  type RoomMapEntry = {
    id: string; name: string; sortOrder: number
    hkStatus: string; isOccupied: boolean; guestName: string | null
    roomNumber: string | null
  }
  const roomMap: RoomMapEntry[] = (roomsData ?? []).map((r) => ({
    id: r.id, name: r.name, sortOrder: r.sort_order,
    hkStatus: r.housekeeping_status,
    isOccupied: checkedInRoomMap.has(r.id),
    guestName: checkedInRoomMap.get(r.id) ?? null,
    roomNumber: r.room_number,
  }))

  // ── Operational queue ─────────────────────────────────────────────────────
  type QueueEntry = {
    id: string; type: 'checkout' | 'checkin'; token: string
    guestName: string; guestPhone: string | null; roomId: string | null; roomName: string; roomNumber: string | null
    status: string; payStatus: string | null; roomHkStatus: string | null
    pendingCharges: number; hasIssue: boolean
    checkInTime: string; checkOutTime: string
  }

  function toQueue(r: ResRow, type: 'checkin' | 'checkout'): QueueEntry {
    const guest = one(r.guests)
    const room  = one(r.rooms)
    const payStatus = latestPayStatus(r.payments)
    const charges = pendingChargesMap.get(r.id) ?? 0
    const hasIssue =
      type === 'checkin'
        ? (payStatus !== 'paid' || (room?.housekeeping_status ?? 'ready') !== 'ready')
        : (charges > 0 || payStatus !== 'paid')
    return {
      id: r.id, type, token: r.token,
      guestName: guest?.full_name ?? '—',
      guestPhone: guest?.phone ?? null,
      roomId: room?.id ?? null, roomName: room?.name ?? '—', roomNumber: room?.room_number ?? null,
      status: r.status, payStatus,
      roomHkStatus: room?.housekeeping_status ?? null,
      pendingCharges: charges,
      hasIssue,
      checkInTime, checkOutTime,
    }
  }

  // Check-outs shown first (earlier in the day)
  const queue: QueueEntry[] = [
    ...(checkOutsData ?? []).map((r) => toQueue(r, 'checkout')),
    ...(checkInsData  ?? []).map((r) => toQueue(r, 'checkin')),
  ]

  // ── Alerts ────────────────────────────────────────────────────────────────
  type AlertItem = { severity: 'critical' | 'warning' | 'info'; text: string; href: string }
  const alerts: AlertItem[] = []

  // Unpaid arrivals — one alert row per reservation
  const unpaidArrivals = (checkInsData ?? []).filter((r) => latestPayStatus(r.payments) !== 'paid')
  for (const r of unpaidArrivals) {
    alerts.push({ severity: 'critical', text: `Chegada de ${one(r.guests)?.full_name ?? 'hóspede'} com pagamento não confirmado`, href: `/dashboard/reservations/${r.id}` })
  }

  // Rooms not ready — alert for anything that isn't fully ready (one row per arrival)
  const roomsNotReady = (checkInsData ?? []).filter((r) => {
    const hk = one(r.rooms)?.housekeeping_status
    return hk != null && hk !== 'ready'
  })
  for (const r of roomsNotReady) {
    const guestName = one(r.guests)?.full_name ?? 'hóspede'
    const roomName  = one(r.rooms)?.name ?? 'quarto'
    alerts.push({ severity: 'critical', text: `${roomName} não pronto para chegada de ${guestName}`, href: `/dashboard/reservations/${r.id}` })
  }

  // Departures with pending extra charges — one alert row per reservation
  const departuresWithCharges = (checkOutsData ?? []).filter((r) => (pendingChargesMap.get(r.id) ?? 0) > 0)
  for (const r of departuresWithCharges) {
    const guestName = one(r.guests)?.full_name ?? 'hóspede'
    alerts.push({ severity: 'warning', text: `Saída de ${guestName} com cobranças extras pendentes`, href: `/dashboard/reservations/${r.id}` })
  }

  // Guests with special requests that haven't been attended yet — one row each
  const specialReqs = (stayingData ?? []).filter((r) => r.special_requests && r.special_request_status !== 'done')
  for (const r of specialReqs) {
    const guestName = one(r.guests)?.full_name ?? 'hóspede'
    alerts.push({ severity: 'info', text: `Pedido especial de ${guestName} em aberto`, href: `/dashboard/reservations/${r.id}` })
  }

  if (pendingPayCount > 0) {
    alerts.push({ severity: 'warning', text: `${pendingPayCount} pagamento${pendingPayCount > 1 ? 's' : ''} pendente${pendingPayCount > 1 ? 's' : ''} — ${formatBRL(pendingPayTotal)}`, href: '/dashboard/reservations' })
  }

  // ── 7-day upcoming table ──────────────────────────────────────────────────
  type UpcomingEntry = {
    id: string; date: string; type: 'checkin' | 'checkout'
    guestName: string; roomName: string; nights: number; status: string; payStatus: string | null
  }

  function nightsBetween(ci: string, co: string): number {
    return Math.round((new Date(co + 'T00:00:00Z').getTime() - new Date(ci + 'T00:00:00Z').getTime()) / 86_400_000)
  }

  const upcoming7: UpcomingEntry[] = [
    ...(upcoming7Data ?? []).map((r): UpcomingEntry => ({
      id: r.id, date: r.check_in, type: 'checkin',
      guestName: one(r.guests)?.full_name ?? '—',
      roomName: one(r.rooms)?.name ?? '—',
      nights: nightsBetween(r.check_in, r.check_out),
      status: r.status,
      payStatus: latestPayStatus(r.payments),
    })),
    ...(stayingData ?? [])
      .filter((r) => r.check_out > today && r.check_out <= in7Days)
      .map((r): UpcomingEntry => ({
        id: r.id, date: r.check_out, type: 'checkout',
        guestName: one(r.guests)?.full_name ?? '—',
        roomName: one(r.rooms)?.name ?? '—',
        nights: nightsBetween(r.check_in, r.check_out),
        status: r.status,
        payStatus: latestPayStatus(r.payments),
      })),
  ].sort((a, b) => a.date.localeCompare(b.date))

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-full bg-admin-page">

      {/* ── Command header ── */}
      <div className="bg-white border-b border-admin-border px-5 sm:px-7 py-5 print:hidden">
        <div className="max-w-[1400px] mx-auto flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-[20px] sm:text-[22px] font-bold text-slate-800 leading-tight">
              {greeting}, Recepção
            </h1>
            <p className="text-[12px] sm:text-[13px] text-slate-400 mt-0.5 capitalize">{fullDate}</p>
          </div>
          <div className="flex items-center gap-3">
            <NotificationBell alerts={alerts} />
          </div>
        </div>
      </div>

      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-7 py-5 space-y-5">

        {/* ── Stats row ── */}
        <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-3">
          <StatCard
            label="Check-ins hoje"
            value={checkInsData?.length ?? 0}
            color="blue"
            icon={<CheckInIcon />}
            sub={checkInsData?.length === 0 ? 'Nenhuma chegada' : `às ${checkInTime}`}
          />
          <StatCard
            label="Check-outs hoje"
            value={checkOutsData?.length ?? 0}
            color="amber"
            icon={<CheckOutIcon />}
            sub={checkOutsData?.length === 0 ? 'Nenhuma saída' : `até ${checkOutTime}`}
          />
          <StatCard
            label="Na pousada agora"
            value={stayingData?.length ?? 0}
            color="emerald"
            icon={<HouseIcon />}
            sub="hóspedes"
          />
          <StatCard
            label="Quartos prontos"
            value={hkCounts.ready + hkCounts.inspected}
            color={hkCounts.ready + hkCounts.inspected > 0 ? 'emerald' : 'neutral'}
            icon={<BedIcon />}
            sub="disponíveis"
          />
          <StatCard
            label="Em limpeza / sujos"
            value={hkCounts.cleaning + hkCounts.dirty}
            color={hkCounts.cleaning + hkCounts.dirty > 0 ? 'amber' : 'neutral'}
            icon={<SparkleIcon />}
            sub="aguardando governança"
          />
          <StatCard
            label="Pag. pendentes"
            value={pendingPayCount}
            color={pendingPayCount > 0 ? 'red' : 'neutral'}
            icon={<CoinIcon />}
            sub={pendingPayCount > 0 ? formatBRL(pendingPayTotal) : 'em dia'}
          />
        </div>

        {/* ── Main grid ── */}
        <div className="grid grid-cols-1 xl:grid-cols-[1fr_360px] gap-5">

          {/* Left column */}
          <div className="space-y-5">

            {/* Operational queue */}
            <div id="fila" className="bg-white rounded-2xl border border-admin-border shadow-sm overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
                <div>
                  <h2 className="text-[15px] font-bold text-slate-800">Fila de hoje</h2>
                  <p className="text-[12px] text-slate-400 mt-0.5">
                    {queue.length === 0 ? 'Nenhuma operação para hoje' : `${queue.length} operação${queue.length > 1 ? 'ões' : ''}`}
                  </p>
                </div>
                <Link href="/dashboard/reservations" className="text-[12px] font-semibold text-admin-sidebar-act hover:text-admin-sidebar transition-colors">
                  Ver todas →
                </Link>
              </div>

              {queue.length === 0 ? (
                <div className="py-12 text-center text-[13px] text-slate-400">
                  Nenhum check-in ou check-out previsto para hoje.
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {queue.map((entry) => (
                    <QueueRow key={entry.id} entry={entry} />
                  ))}
                </div>
              )}
            </div>

            {/* Quick actions */}
            <ReceptionTools />

          </div>

          {/* Right column */}
          <div className="space-y-5">

            {/* Room mini-map */}
            <div className="bg-white rounded-2xl border border-admin-border shadow-sm overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
                <h2 className="text-[15px] font-bold text-slate-800">Mapa de quartos</h2>
                <Link href="/dashboard/housekeeping" className="text-[12px] font-semibold text-admin-sidebar-act hover:text-admin-sidebar transition-colors">
                  Governança →
                </Link>
              </div>

              {/* Legend */}
              <div className="flex flex-wrap gap-x-4 gap-y-1.5 px-5 pt-3 pb-1">
                {[
                  { key: 'occupied', label: 'Ocupado', dot: 'bg-sky-500' },
                  { key: 'ready',    label: 'Pronto',  dot: 'bg-emerald-500' },
                  { key: 'cleaning', label: 'Limpeza', dot: 'bg-amber-500' },
                  { key: 'dirty',    label: 'Sujo',    dot: 'bg-red-500' },
                ].map((s) => (
                  <div key={s.key} className="flex items-center gap-1.5">
                    <div className={`w-2 h-2 rounded-full ${s.dot} shrink-0`} />
                    <span className="text-[11px] text-slate-500">{s.label}</span>
                  </div>
                ))}
              </div>

              <div className="px-4 pb-4 pt-2 grid grid-cols-4 sm:grid-cols-5 gap-2">
                {roomMap.map((room) => {
                  const statusKey = room.isOccupied ? 'occupied' : room.hkStatus
                  const cfg = ROOM_STATUS_CFG[statusKey] ?? ROOM_STATUS_CFG.dirty
                  const num   = roomNumber(room.roomNumber, room.name, room.sortOrder)
                  const short = roomShortName(room.name)
                  return (
                    <div
                      key={room.id}
                      title={room.name}
                      className={`rounded-xl border p-2 text-center ${cfg.bg} ${cfg.border}`}
                    >
                      <div className="flex items-center justify-center gap-1 mb-0.5">
                        <div className={`w-1.5 h-1.5 rounded-full ${cfg.dot} shrink-0`} />
                        <p className={`text-[16px] font-black leading-none ${cfg.text}`}>{num}</p>
                      </div>
                      <p className={`text-[9px] font-medium ${cfg.text} opacity-70 leading-tight truncate`}>
                        {room.isOccupied ? (room.guestName ?? 'Ocupado') : short}
                      </p>
                    </div>
                  )
                })}
              </div>

              {roomMap.length === 0 && (
                <p className="px-5 pb-5 text-[12px] text-slate-400">Nenhum quarto ativo cadastrado.</p>
              )}
            </div>

            {/* Alerts panel */}
            <div id="alertas" className="bg-white rounded-2xl border border-admin-border shadow-sm overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
                <h2 className="text-[15px] font-bold text-slate-800">Alertas</h2>
                {alerts.length > 0 && (
                  <span className="text-[11px] font-bold text-white bg-red-500 rounded-full px-2 py-0.5">
                    {alerts.length}
                  </span>
                )}
              </div>

              {alerts.length === 0 ? (
                <div className="px-5 py-10 text-center text-[13px] text-slate-400">
                  Tudo em ordem. Nenhum alerta no momento.
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {alerts.map((alert, i) => (
                    <AlertRow key={i} alert={alert} />
                  ))}
                </div>
              )}
            </div>

          </div>
        </div>

        {/* ── 7-day arrivals & departures ── */}
        {upcoming7.length > 0 && (
          <div className="bg-white rounded-2xl border border-admin-border shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
              <div>
                <h2 className="text-[15px] font-bold text-slate-800">Chegadas e partidas</h2>
                <p className="text-[12px] text-slate-400 mt-0.5">Próximos 7 dias</p>
              </div>
              <Link href="/dashboard/reservations" className="text-[12px] font-semibold text-admin-sidebar-act hover:text-admin-sidebar transition-colors">
                Ver todas →
              </Link>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/60">
                    {['Data', 'Tipo', 'Hóspede', 'Quarto', 'Noites', 'Status', ''].map((h) => (
                      <th key={h} className="px-4 py-2.5 text-[10px] font-semibold text-slate-400 uppercase tracking-[0.10em] whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {upcoming7.map((entry) => (
                    <tr key={`${entry.id}-${entry.type}`} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-4 py-3 text-[13px] text-slate-700 whitespace-nowrap font-medium">{formatDate(entry.date)}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                          entry.type === 'checkin'
                            ? 'bg-sky-50 text-sky-700'
                            : 'bg-amber-50 text-amber-700'
                        }`}>
                          {entry.type === 'checkin' ? 'Check-in' : 'Check-out'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-[13px] text-slate-800 font-medium max-w-[160px] truncate">{entry.guestName}</td>
                      <td className="px-4 py-3 text-[13px] text-slate-600 whitespace-nowrap">{entry.roomName}</td>
                      <td className="px-4 py-3 text-[13px] text-slate-500">{entry.nights}n</td>
                      <td className="px-4 py-3">
                        <ResStatusBadge status={entry.status} />
                      </td>
                      <td className="px-4 py-3">
                        <Link
                          href={`/dashboard/reservations/${entry.id}`}
                          className="text-[12px] font-semibold text-admin-sidebar-act hover:text-admin-sidebar transition-colors whitespace-nowrap"
                        >
                          Ver →
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}

// ── Sub-components ────────────────────────────────────────────────────────────

function StatCard({
  label, value, color, icon, sub,
}: {
  label: string
  value: number
  color: 'blue' | 'amber' | 'emerald' | 'red' | 'neutral'
  icon: React.ReactNode
  sub?: string
}) {
  const accent: Record<string, string> = {
    blue:    'border-l-sky-400    bg-sky-50/40',
    amber:   'border-l-amber-400  bg-amber-50/40',
    emerald: 'border-l-emerald-400 bg-emerald-50/40',
    red:     'border-l-red-400    bg-red-50/40',
    neutral: 'border-l-slate-200  bg-white',
  }
  const iconColor: Record<string, string> = {
    blue:    'text-sky-500',
    amber:   'text-amber-500',
    emerald: 'text-emerald-500',
    red:     'text-red-500',
    neutral: 'text-slate-400',
  }
  return (
    <div className={`rounded-2xl border border-admin-border border-l-[3px] ${accent[color]} shadow-sm p-4`}>
      <div className={`w-8 h-8 flex items-center justify-center rounded-xl bg-white/80 mb-3 ${iconColor[color]}`}>
        {icon}
      </div>
      <p className="text-[24px] font-bold text-slate-800 leading-none">{value}</p>
      <p className="text-[11px] font-semibold text-slate-600 mt-1 leading-snug">{label}</p>
      {sub && <p className="text-[10px] text-slate-400 mt-0.5 truncate">{sub}</p>}
    </div>
  )
}

function QueueRow({ entry }: {
  entry: {
    id: string; type: 'checkout' | 'checkin'; token: string
    guestName: string; guestPhone: string | null
    roomId: string | null; roomName: string; roomNumber: string | null
    status: string; payStatus: string | null; roomHkStatus: string | null
    pendingCharges: number; hasIssue: boolean; checkInTime: string; checkOutTime: string
  }
}) {
  const isIn = entry.type === 'checkin'
  const time = isIn ? entry.checkInTime : entry.checkOutTime

  return (
    <div className={`px-5 py-3.5 flex flex-wrap items-center gap-x-4 gap-y-2 ${entry.hasIssue ? 'bg-amber-50/40' : ''}`}>

      {/* Time + type */}
      <div className="flex items-center gap-2.5 shrink-0 w-[110px]">
        <span className="text-[12px] font-semibold text-slate-400 tabular-nums w-10 shrink-0">{time}</span>
        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-bold whitespace-nowrap ${
          isIn ? 'bg-sky-100 text-sky-700' : 'bg-amber-100 text-amber-700'
        }`}>
          {isIn ? 'Entrada' : 'Saída'}
        </span>
      </div>

      {/* Guest + room */}
      <div className="flex-1 min-w-[140px]">
        <p className="text-[13px] font-semibold text-slate-800 truncate">{entry.guestName}</p>
        <p className="text-[11px] text-slate-400 truncate">
          {entry.roomNumber ? `#${entry.roomNumber} · ` : ''}{entry.roomName} · {entry.token}
        </p>
      </div>

      {/* Status flags */}
      <div className="flex items-center gap-2 flex-wrap">
        {entry.payStatus && entry.payStatus !== 'paid' && (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-2 py-0.5">
            <WarnIcon />
            Pag. {PAY_STATUS_LABEL[entry.payStatus] ?? entry.payStatus}
          </span>
        )}
        {isIn && entry.roomHkStatus && (() => {
          const s = entry.roomHkStatus
          if (s === 'ready') return (
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg px-2 py-0.5">
              <OkIcon /> Pronto para check-in
            </span>
          )
          if (s === 'inspected') return (
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-700 bg-blue-50 border border-blue-200 rounded-lg px-2 py-0.5">
              <WarnIcon /> Inspecionado — aguarda liberação
            </span>
          )
          if (s === 'clean') return (
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-2 py-0.5">
                <WarnIcon /> Limpo — falta inspeção
              </span>
              {entry.roomId && (
                <InspectionRequestBtn
                  reservationId={entry.id}
                  roomId={entry.roomId}
                  roomName={entry.roomName}
                  guestName={entry.guestName}
                />
              )}
            </div>
          )
          if (s === 'cleaning') return (
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-red-700 bg-red-50 border border-red-200 rounded-lg px-2 py-0.5">
              <WarnIcon /> Em limpeza
            </span>
          )
          return (
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-red-700 bg-red-50 border border-red-200 rounded-lg px-2 py-0.5">
              <WarnIcon /> Sujo
            </span>
          )
        })()}
        {entry.pendingCharges > 0 && (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-600 bg-slate-100 border border-slate-200 rounded-lg px-2 py-0.5">
            {entry.pendingCharges} cobrança{entry.pendingCharges > 1 ? 's' : ''}
          </span>
        )}
      </div>

      {/* Action buttons */}
      <div className="flex items-center gap-2 shrink-0 ml-auto">
        {(isIn ? entry.status === 'confirmed' : entry.status === 'checked_in') && (
          <QuickCheckBtn reservationId={entry.id} type={isIn ? 'in' : 'out'} />
        )}
        <Link
          href={`/dashboard/reservations/${entry.id}`}
          className="text-[12px] font-semibold text-admin-sidebar-act hover:text-admin-sidebar transition-colors whitespace-nowrap"
        >
          Ver reserva →
        </Link>
      </div>

    </div>
  )
}


function AlertRow({ alert }: { alert: { severity: 'critical' | 'warning' | 'info'; text: string; href: string } }) {
  const cfg = {
    critical: { border: 'border-l-red-400',    bg: '',              dot: 'bg-red-500',    text: 'text-red-700'    },
    warning:  { border: 'border-l-amber-400',  bg: 'bg-amber-50/30', dot: 'bg-amber-500',  text: 'text-amber-700'  },
    info:     { border: 'border-l-sky-300',    bg: '',              dot: 'bg-sky-400',    text: 'text-slate-700'  },
  }[alert.severity]

  return (
    <div className={`flex items-center gap-3 px-5 py-3 border-l-[3px] ${cfg.border} ${cfg.bg}`}>
      <div className={`w-2 h-2 rounded-full ${cfg.dot} shrink-0`} />
      <p className={`text-[12px] font-medium ${cfg.text} flex-1`}>{alert.text}</p>
      <Link href={alert.href} className="text-[11px] font-semibold text-admin-sidebar-act hover:text-admin-sidebar transition-colors shrink-0">
        Ver →
      </Link>
    </div>
  )
}

function ResStatusBadge({ status }: { status: string }) {
  const cfg: Record<string, string> = {
    confirmed:       'bg-emerald-50 text-emerald-700',
    pending_payment: 'bg-amber-50   text-amber-700',
    checked_in:      'bg-sky-50     text-sky-700',
    checked_out:     'bg-slate-100  text-slate-500',
    cancelled:       'bg-red-50     text-red-600',
  }
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold ${cfg[status] ?? 'bg-slate-100 text-slate-500'}`}>
      {RES_STATUS_LABEL[status] ?? status}
    </span>
  )
}

// ── Icons ─────────────────────────────────────────────────────────────────────

function CheckInIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5" aria-hidden="true">
      <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" /><polyline points="10 17 15 12 10 7" /><line x1={15} y1={12} x2={3} y2={12} />
    </svg>
  )
}

function CheckOutIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5" aria-hidden="true">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1={21} y1={12} x2={9} y2={12} />
    </svg>
  )
}

function HouseIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5" aria-hidden="true">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  )
}

function BedIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5" aria-hidden="true">
      <path d="M2 20v-8a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v8" /><path d="M2 15h20M2 20h20" /><path d="M6 10V6a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v4" />
    </svg>
  )
}

function SparkleIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5" aria-hidden="true">
      <path d="M12 3v4M12 17v4M3 12h4M17 12h4M5.6 5.6l2.8 2.8M15.6 15.6l2.8 2.8M18.4 5.6l-2.8 2.8M8.4 15.6l-2.8 2.8" />
    </svg>
  )
}

function CoinIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5" aria-hidden="true">
      <circle cx={12} cy={12} r={9} /><path d="M14.5 9a3 3 0 0 0-5 2.2c0 2.4 5 3.8 5 6a3 3 0 0 1-5 2.1" /><line x1={12} y1={6} x2={12} y2={8} /><line x1={12} y1={19} x2={12} y2={21} />
    </svg>
  )
}

function OkIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" className="w-3 h-3 shrink-0" aria-hidden="true">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  )
}

function WarnIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-3 h-3 shrink-0" aria-hidden="true">
      <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
      <line x1={12} y1={9} x2={12} y2={13} /><line x1={12} y1={17} x2={12.01} y2={17} />
    </svg>
  )
}

