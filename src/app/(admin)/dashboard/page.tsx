import Link from 'next/link'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireModule } from '@/lib/auth'
import { ReservationStatusBadge } from './reservations/_components/badges'

export const metadata = { title: "Visão geral — Painel Sofia's" }

// ── Utilities ─────────────────────────────────────────────────────────────────

function todayISO() { return new Date().toISOString().slice(0, 10) }

function addDaysISO(d: string, days: number): string {
  const dt = new Date(d + 'T00:00:00Z')
  dt.setUTCDate(dt.getUTCDate() + days)
  return dt.toISOString().slice(0, 10)
}

function formatDate(s: string): string {
  const [y, m, d] = s.split('-').map(Number)
  return `${String(d).padStart(2, '0')}/${String(m).padStart(2, '0')}/${y}`
}

function formatBRL(v: number): string {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(v)
}

function getGreeting(): string {
  const h = new Date().getHours()
  return h < 12 ? 'Bom dia' : h < 18 ? 'Boa tarde' : 'Boa noite'
}

function one<T>(rel: T | T[] | null): T | null {
  if (!rel) return null
  return Array.isArray(rel) ? (rel[0] ?? null) : rel
}

function nightsBetween(ci: string, co: string): number {
  return Math.round(
    (new Date(co + 'T00:00:00Z').getTime() - new Date(ci + 'T00:00:00Z').getTime()) / 86_400_000,
  )
}

// ── Types ─────────────────────────────────────────────────────────────────────

type GJ = { full_name: string }
type RJ = { id: string; name: string }

// ── Data loading ──────────────────────────────────────────────────────────────

async function loadDashboardData() {
  const db = createAdminClient()
  const today = todayISO()
  const week = addDaysISO(today, 7)

  type OpRow = {
    id: string; token: string; status: string; check_in: string; check_out: string
    guests: GJ | GJ[] | null; rooms: RJ | RJ[] | null
  }
  type UpRow = OpRow & { payments: { status: string; created_at: string }[] | null }
  type RoomRow = { id: string; name: string; housekeeping_status: string }
  type CIRow = { room_id: string; guests: GJ | GJ[] | null }

  const [cIn, cOut, staying, pendingPay, roomsQ, occupiedQ, todayInsQ, todayOutsQ, upcomingQ] = await Promise.all([
    db.from('reservations').select('id', { count: 'exact', head: true })
      .eq('check_in', today).in('status', ['confirmed', 'pending_payment']),

    db.from('reservations').select('id', { count: 'exact', head: true })
      .eq('check_out', today).in('status', ['checked_in', 'confirmed']),

    db.from('reservations').select('id', { count: 'exact', head: true })
      .eq('status', 'checked_in'),

    db.from('payments').select('id, amount_brl').eq('status', 'pending'),

    db.from('rooms').select('id, name, housekeeping_status')
      .eq('is_active', true).order('name').returns<RoomRow[]>(),

    db.from('reservations').select('room_id, guests ( full_name )')
      .eq('status', 'checked_in').returns<CIRow[]>(),

    db.from('reservations')
      .select('id, token, status, check_in, check_out, guests ( full_name ), rooms ( id, name )')
      .eq('check_in', today).neq('status', 'cancelled')
      .order('created_at', { ascending: true }).returns<OpRow[]>(),

    db.from('reservations')
      .select('id, token, status, check_in, check_out, guests ( full_name ), rooms ( id, name )')
      .eq('check_out', today).neq('status', 'cancelled')
      .order('created_at', { ascending: true }).returns<OpRow[]>(),

    db.from('reservations')
      .select('id, token, status, check_in, check_out, guests ( full_name ), rooms ( id, name ), payments ( status, created_at )')
      .gt('check_in', today).lte('check_in', week)
      .neq('status', 'cancelled').order('check_in', { ascending: true }).limit(12)
      .returns<UpRow[]>(),
  ])

  // Build occupancy map: room_id → short guest name
  const occupiedMap = new Map<string, string>()
  for (const r of occupiedQ.data ?? []) {
    const g = one(r.guests as GJ | GJ[] | null)
    if (r.room_id && g) {
      const parts = g.full_name.trim().split(/\s+/)
      occupiedMap.set(r.room_id, parts[0] + (parts[1] ? ' ' + parts[1][0] + '.' : ''))
    }
  }

  // Enrich rooms
  const rooms = (roomsQ.data ?? []).map((r) => {
    const occupied = occupiedMap.has(r.id)
    const hs = r.housekeeping_status
    return {
      id: r.id, name: r.name, hs,
      status: occupied ? 'occupied' as const
        : hs === 'cleaning' ? 'cleaning' as const
        : ['dirty', 'clean'].includes(hs) ? 'preparing' as const
        : 'available' as const,
      guestShort: occupiedMap.get(r.id) ?? null,
    }
  })

  const pendingAmount = (pendingPay.data ?? []).reduce((s, p) => s + (p.amount_brl ?? 0), 0)
  const pendingCount  = pendingPay.data?.length ?? 0

  // Today ops — check-outs first (morning), check-ins after (afternoon)
  const mapOp = (r: OpRow, type: 'check_in' | 'check_out') => ({
    id: r.id, token: r.token, type,
    guestName: one(r.guests as GJ | GJ[] | null)?.full_name ?? '—',
    roomName:  one(r.rooms as RJ | RJ[] | null)?.name ?? '—',
    status: r.status,
  })
  const todayOps = [
    ...(todayOutsQ.data ?? []).map((r) => mapOp(r, 'check_out')),
    ...(todayInsQ.data  ?? []).map((r) => mapOp(r, 'check_in')),
  ]

  // Upcoming arrivals
  const upcoming = (upcomingQ.data ?? []).map((r) => {
    const payments = r.payments ?? []
    const sorted = [...payments].sort((a, b) => b.created_at.localeCompare(a.created_at))
    const payStatus = (sorted.find((p) => p.status !== 'failed') ?? sorted[0])?.status ?? null
    return {
      id: r.id, token: r.token, status: r.status,
      checkIn: r.check_in, checkOut: r.check_out,
      nights: nightsBetween(r.check_in, r.check_out),
      guestName:     one(r.guests as GJ | GJ[] | null)?.full_name ?? '—',
      roomName:      one(r.rooms  as RJ | RJ[] | null)?.name ?? '—',
      paymentStatus: payStatus,
    }
  })

  // Alerts
  type Alert = { message: string; severity: 'warning' | 'danger' | 'info' }
  const alerts: Alert[] = []
  if (pendingCount > 0)
    alerts.push({ message: `${pendingCount} pagamento${pendingCount !== 1 ? 's' : ''} pendente${pendingCount !== 1 ? 's' : ''}`, severity: 'warning' })
  const arrivalsWithPendingPay = (todayInsQ.data ?? []).filter((r) => r.status === 'pending_payment').length
  if (arrivalsWithPendingPay > 0)
    alerts.push({ message: `${arrivalsWithPendingPay} chegada${arrivalsWithPendingPay !== 1 ? 's' : ''} hoje com pagamento pendente`, severity: 'danger' })
  const roomsNotReady = rooms.filter((r) => !['available', 'occupied'].includes(r.status)).length
  if (roomsNotReady > 0)
    alerts.push({ message: `${roomsNotReady} quarto${roomsNotReady !== 1 ? 's' : ''} aguardando limpeza ou preparo`, severity: 'info' })

  return {
    checkInsToday:  cIn.count     ?? 0,
    checkOutsToday: cOut.count    ?? 0,
    stayingCount:   staying.count ?? 0,
    roomsReady:   rooms.filter((r) => r.status === 'available').length,
    roomsCleaning: rooms.filter((r) => r.status === 'cleaning' || r.status === 'preparing').length,
    pendingAmount, pendingCount,
    rooms, todayOps, upcoming, alerts,
  }
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function DashboardOverviewPage() {
  const admin = await requireModule('overview')
  const data  = await loadDashboardData()

  const dateLabel = new Date().toLocaleDateString('pt-BR', {
    weekday: 'long', day: '2-digit', month: 'long', year: 'numeric',
  })

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-7 max-w-[1400px] space-y-6">

      {/* ── Header ── */}
      <div>
        <h1 className="text-[22px] md:text-[26px] font-bold text-slate-900 tracking-tight">
          {getGreeting()}, {admin.full_name.split(' ')[0]} 👋
        </h1>
        <p className="text-[13px] text-slate-500 mt-1 capitalize">
          Visão geral das operações — {dateLabel}
        </p>
      </div>

      {/* ── 6 Metric cards ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-3">

        <MetricCard
          label="Check-ins de hoje"
          value={data.checkInsToday}
          hint="Confirmados"
          tone="info"
          icon={<CheckInIcon />}
          href="/dashboard/reception"
        />
        <MetricCard
          label="Check-outs de hoje"
          value={data.checkOutsToday}
          hint="Programados"
          tone="info"
          icon={<CheckOutIcon />}
          href="/dashboard/reception"
        />
        <MetricCard
          label="Hóspedes na pousada"
          value={data.stayingCount}
          hint="Presentes"
          tone="success"
          icon={<GuestsIcon />}
          href="/dashboard/reception"
        />
        <MetricCard
          label="Quartos prontos"
          value={data.roomsReady}
          hint="Disponíveis"
          tone="success"
          icon={<BedIcon />}
          href="/dashboard/housekeeping"
        />
        <MetricCard
          label="Quartos em limpeza"
          value={data.roomsCleaning}
          hint="Em andamento"
          tone="warning"
          icon={<CleanIcon />}
          href="/dashboard/housekeeping"
        />
        <MetricCard
          label="Pagamentos pendentes"
          value={formatBRL(data.pendingAmount)}
          hint={`${data.pendingCount} em aberto`}
          tone={data.pendingCount > 0 ? 'warning' : 'neutral'}
          icon={<CoinIcon />}
          href="/dashboard/payments"
        />
      </div>

      {/* ── Main grid: operation queue + room map ── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">

        {/* Operation queue */}
        <div className="lg:col-span-3">
          <div className="bg-white rounded-2xl border border-admin-border shadow-sm overflow-hidden h-full">
            <div className="px-5 py-4 border-b border-admin-border flex items-center justify-between">
              <div>
                <h2 className="text-[14px] font-semibold text-slate-800">Fila de operações</h2>
                <p className="text-[12px] text-slate-400 mt-0.5">Hoje</p>
              </div>
              <Link href="/dashboard/reception" className="text-[12px] font-semibold text-admin-sidebar-act hover:text-admin-sidebar transition-colors">
                Ver agenda completa →
              </Link>
            </div>

            {data.todayOps.length === 0 ? (
              <div className="px-5 py-12 text-center text-[13px] text-slate-400">
                Nenhuma operação prevista para hoje.
              </div>
            ) : (
              <div className="divide-y divide-[#F0F4F8]">
                {data.todayOps.map((op) => (
                  <div key={op.id} className="px-5 py-3.5 flex items-center gap-4 hover:bg-slate-50/60 transition-colors">
                    {/* Type icon */}
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${op.type === 'check_in' ? 'bg-sky-50' : 'bg-emerald-50'}`}>
                      {op.type === 'check_in' ? <ArrowInIcon /> : <ArrowOutIcon />}
                    </div>
                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-semibold text-slate-800 truncate">{op.guestName}</p>
                      <p className="text-[11px] text-slate-400 truncate mt-0.5">
                        {op.type === 'check_in' ? 'Check-in' : 'Check-out'} · {op.roomName}
                      </p>
                    </div>
                    {/* Status */}
                    <div className="shrink-0">
                      <ReservationStatusBadge status={op.status} />
                    </div>
                    {/* Link */}
                    <Link
                      href={`/dashboard/reservations/${op.id}`}
                      className="text-[12px] font-semibold text-admin-sidebar-act hover:text-admin-sidebar transition-colors shrink-0"
                    >
                      Ver →
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Room map */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl border border-admin-border shadow-sm overflow-hidden h-full">
            <div className="px-5 py-4 border-b border-admin-border">
              <h2 className="text-[14px] font-semibold text-slate-800 mb-3">Mapa de quartos</h2>
              {/* Legend */}
              <div className="flex flex-wrap items-center gap-3">
                {ROOM_STATUS_CONFIG.map((s) => (
                  <div key={s.key} className="flex items-center gap-1.5">
                    <span className={`w-2 h-2 rounded-full ${s.dot}`} />
                    <span className="text-[11px] text-slate-500">{s.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {data.rooms.length === 0 ? (
              <div className="px-5 py-12 text-center text-[13px] text-slate-400">
                Nenhum quarto cadastrado.
              </div>
            ) : (
              <div className="p-4 grid grid-cols-3 gap-2 max-h-[340px] overflow-y-auto">
                {data.rooms.map((room) => {
                  const cfg = ROOM_STATUS_CONFIG.find((s) => s.key === room.status) ?? ROOM_STATUS_CONFIG[0]
                  return (
                    <div
                      key={room.id}
                      className={`rounded-xl border p-2.5 text-center ${cfg.cardBorder} ${cfg.cardBg}`}
                    >
                      <p className={`text-[13px] font-bold leading-tight truncate ${cfg.textColor}`}>
                        {roomShortName(room.name)}
                      </p>
                      <div className="flex items-center justify-center gap-1 mt-1">
                        <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${cfg.dot}`} />
                        <span className={`text-[10px] font-medium ${cfg.hintColor}`}>{cfg.label}</span>
                      </div>
                      {room.guestShort && (
                        <p className="text-[10px] text-slate-500 mt-0.5 truncate">{room.guestShort}</p>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Quick actions + alerts ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* Quick actions */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-admin-border shadow-sm">
          <div className="px-5 py-4 border-b border-admin-border">
            <h2 className="text-[14px] font-semibold text-slate-800">Ações rápidas</h2>
          </div>
          <div className="p-4 grid grid-cols-3 sm:grid-cols-4 md:grid-cols-7 gap-3">
            {QUICK_ACTIONS.map((qa) => (
              qa.href ? (
                <Link
                  key={qa.label}
                  href={qa.href}
                  className="flex flex-col items-center gap-2 p-3 rounded-xl hover:bg-slate-50 transition-colors group"
                >
                  <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${qa.iconBg}`}>
                    <qa.Icon />
                  </div>
                  <span className="text-[11px] font-medium text-slate-600 text-center leading-tight group-hover:text-slate-900">
                    {qa.label}
                  </span>
                </Link>
              ) : (
                <div
                  key={qa.label}
                  className="flex flex-col items-center gap-2 p-3 rounded-xl opacity-50 cursor-not-allowed"
                  title="Em breve"
                >
                  <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${qa.iconBg}`}>
                    <qa.Icon />
                  </div>
                  <span className="text-[11px] font-medium text-slate-500 text-center leading-tight">
                    {qa.label}
                  </span>
                </div>
              )
            ))}
          </div>
        </div>

        {/* Alerts */}
        <div className="lg:col-span-1 bg-white rounded-2xl border border-admin-border shadow-sm">
          <div className="px-5 py-4 border-b border-admin-border flex items-center justify-between">
            <h2 className="text-[14px] font-semibold text-slate-800">Alertas importantes</h2>
            <Link href="/dashboard/payments" className="text-[12px] font-semibold text-admin-sidebar-act hover:text-admin-sidebar transition-colors">
              Ver todos
            </Link>
          </div>
          <div className="px-5 py-4">
            {data.alerts.length === 0 ? (
              <p className="text-[13px] text-slate-400 py-4 text-center">Nenhum alerta no momento.</p>
            ) : (
              <div className="space-y-3">
                {data.alerts.map((alert, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                      alert.severity === 'danger' ? 'bg-red-50' :
                      alert.severity === 'warning' ? 'bg-amber-50' : 'bg-sky-50'
                    }`}>
                      <AlertDotIcon severity={alert.severity} />
                    </div>
                    <p className="text-[12px] text-slate-600 leading-relaxed">{alert.message}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Arrivals table ── */}
      <div className="bg-white rounded-2xl border border-admin-border shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-admin-border flex items-center justify-between">
          <div>
            <h2 className="text-[14px] font-semibold text-slate-800">Chegadas e partidas</h2>
            <p className="text-[12px] text-slate-400 mt-0.5">Próximos 7 dias</p>
          </div>
          <Link href="/dashboard/reservations" className="text-[12px] font-semibold text-admin-sidebar-act hover:text-admin-sidebar transition-colors">
            Ver todos →
          </Link>
        </div>

        {data.upcoming.length === 0 ? (
          <div className="px-5 py-12 text-center text-[13px] text-slate-400">
            Nenhuma chegada prevista para os próximos 7 dias.
          </div>
        ) : (
          <>
            {/* Table header */}
            <div className="hidden md:grid grid-cols-[90px_80px_1fr_1fr_60px_120px_90px] gap-4 px-5 py-2.5 bg-slate-50 border-b border-admin-border">
              {['Data', 'Tipo', 'Hóspede', 'Quarto', 'Noites', 'Status', ''].map((h) => (
                <p key={h} className="text-[11px] font-semibold text-slate-400 uppercase tracking-[0.10em]">{h}</p>
              ))}
            </div>
            <div className="divide-y divide-[#F0F4F8]">
              {data.upcoming.map((row) => (
                <div key={row.id} className="px-5 py-3.5 hover:bg-slate-50/60 transition-colors">
                  {/* Desktop row */}
                  <div className="hidden md:grid grid-cols-[90px_80px_1fr_1fr_60px_120px_90px] gap-4 items-center">
                    <span className="text-[12px] font-medium text-slate-700">{formatDate(row.checkIn)}</span>
                    <span className={`inline-flex items-center gap-1.5 text-[11px] font-semibold ${row.status === 'checked_out' ? 'text-slate-500' : 'text-sky-700'}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${row.status === 'checked_out' ? 'bg-slate-400' : 'bg-sky-500'}`} />
                      Check-in
                    </span>
                    <span className="text-[13px] font-medium text-slate-800 truncate">{row.guestName}</span>
                    <span className="text-[12px] text-slate-500 truncate">{row.roomName}</span>
                    <span className="text-[12px] text-slate-500">{row.nights}n</span>
                    <ReservationStatusBadge status={row.status} />
                    <Link href={`/dashboard/reservations/${row.id}`} className="text-[12px] font-semibold text-admin-sidebar-act hover:text-admin-sidebar transition-colors text-right">
                      Ver →
                    </Link>
                  </div>
                  {/* Mobile row */}
                  <div className="md:hidden flex items-center gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-semibold text-slate-800 truncate">{row.guestName}</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">{row.roomName} · {formatDate(row.checkIn)} · {row.nights}n</p>
                    </div>
                    <ReservationStatusBadge status={row.status} />
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

// ── Sub-components ────────────────────────────────────────────────────────────

type MetricTone = 'info' | 'success' | 'warning' | 'neutral'

const METRIC_VALUE_COLOR: Record<MetricTone, string> = {
  info:    'text-sky-700',
  success: 'text-emerald-700',
  warning: 'text-amber-700',
  neutral: 'text-slate-500',
}

const METRIC_ICON_BG: Record<MetricTone, string> = {
  info:    'bg-sky-50',
  success: 'bg-emerald-50',
  warning: 'bg-amber-50',
  neutral: 'bg-slate-100',
}

function MetricCard({
  label, value, hint, tone = 'neutral', icon, href,
}: {
  label: string; value: string | number; hint?: string; tone?: MetricTone
  icon?: React.ReactNode; href?: string
}) {
  const inner = (
    <div className="bg-white rounded-2xl border border-admin-border shadow-sm p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-medium text-slate-500 leading-none">{label}</p>
          <p className={`text-[28px] md:text-[30px] font-bold mt-2 leading-none tabular-nums ${METRIC_VALUE_COLOR[tone]}`}>
            {value}
          </p>
          {hint && <p className="text-[11px] text-slate-400 mt-2">{hint}</p>}
        </div>
        {icon && (
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${METRIC_ICON_BG[tone]}`}>
            {icon}
          </div>
        )}
      </div>
    </div>
  )
  return href ? <Link href={href}>{inner}</Link> : inner
}

// ── Room map config ───────────────────────────────────────────────────────────

const ROOM_STATUS_CONFIG = [
  {
    key: 'available',
    label: 'Disponível',
    dot: 'bg-emerald-500',
    cardBg: 'bg-emerald-50/40',
    cardBorder: 'border-emerald-100',
    textColor: 'text-emerald-700',
    hintColor: 'text-emerald-600',
  },
  {
    key: 'occupied',
    label: 'Ocupado',
    dot: 'bg-sky-500',
    cardBg: 'bg-sky-50/40',
    cardBorder: 'border-sky-100',
    textColor: 'text-sky-700',
    hintColor: 'text-sky-600',
  },
  {
    key: 'cleaning',
    label: 'Limpeza',
    dot: 'bg-amber-500',
    cardBg: 'bg-amber-50/40',
    cardBorder: 'border-amber-100',
    textColor: 'text-amber-700',
    hintColor: 'text-amber-600',
  },
  {
    key: 'preparing',
    label: 'Preparando',
    dot: 'bg-slate-400',
    cardBg: 'bg-slate-50',
    cardBorder: 'border-slate-100',
    textColor: 'text-slate-600',
    hintColor: 'text-slate-500',
  },
] as const

function roomShortName(name: string): string {
  const words = name.trim().split(/\s+/)
  if (words.length <= 2) return name
  // e.g. "Suite Vista Mar 2" → "Suite V.M. 2"
  return words.slice(0, 2).join(' ')
}

// ── Quick actions config ──────────────────────────────────────────────────────

const QUICK_ACTIONS = [
  {
    label: 'Check-in',
    href: '/dashboard/reception',
    iconBg: 'bg-sky-50',
    Icon: () => (
      <svg viewBox="0 0 24 24" fill="none" stroke="#0284C7" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5" aria-hidden="true">
        <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
        <polyline points="10 17 15 12 10 7" />
        <line x1={15} y1={12} x2={3} y2={12} />
      </svg>
    ),
  },
  {
    label: 'Check-out',
    href: '/dashboard/reception',
    iconBg: 'bg-emerald-50',
    Icon: () => (
      <svg viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5" aria-hidden="true">
        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
        <polyline points="16 17 21 12 16 7" />
        <line x1={21} y1={12} x2={9} y2={12} />
      </svg>
    ),
  },
  {
    label: 'Reservas',
    href: '/dashboard/reservations',
    iconBg: 'bg-indigo-50',
    Icon: () => (
      <svg viewBox="0 0 24 24" fill="none" stroke="#4F46E5" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5" aria-hidden="true">
        <rect x={3} y={4} width={18} height={18} rx={2} />
        <line x1={16} y1={2} x2={16} y2={6} />
        <line x1={8} y1={2} x2={8} y2={6} />
        <line x1={3} y1={10} x2={21} y2={10} />
      </svg>
    ),
  },
  {
    label: 'Hóspedes',
    href: '/dashboard/guests',
    iconBg: 'bg-violet-50',
    Icon: () => (
      <svg viewBox="0 0 24 24" fill="none" stroke="#7C3AED" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5" aria-hidden="true">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx={9} cy={7} r={4} />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
  },
  {
    label: 'Governança',
    href: '/dashboard/housekeeping',
    iconBg: 'bg-emerald-50',
    Icon: () => (
      <svg viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5" aria-hidden="true">
        <path d="M12 3v4M12 17v4M3 12h4M17 12h4M5.6 5.6l2.8 2.8M15.6 15.6l2.8 2.8M18.4 5.6l-2.8 2.8M8.4 15.6l-2.8 2.8" />
      </svg>
    ),
  },
  {
    label: 'Financeiro',
    href: '/dashboard/payments',
    iconBg: 'bg-amber-50',
    Icon: () => (
      <svg viewBox="0 0 24 24" fill="none" stroke="#D97706" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5" aria-hidden="true">
        <circle cx={12} cy={12} r={9} />
        <path d="M14.5 9a3 3 0 0 0-5 2.2c0 2.4 5 3.8 5 6a3 3 0 0 1-5 2.1" />
        <line x1={12} y1={6} x2={12} y2={8} />
        <line x1={12} y1={19} x2={12} y2={21} />
      </svg>
    ),
  },
  {
    label: 'Quartos',
    href: '/dashboard/rooms',
    iconBg: 'bg-slate-100',
    Icon: () => (
      <svg viewBox="0 0 24 24" fill="none" stroke="#475569" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5" aria-hidden="true">
        <path d="M2 20v-8a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v8" />
        <path d="M2 15h20M2 20h20" />
        <path d="M6 10V6a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v4" />
      </svg>
    ),
  },
]

// ── Inline icons ──────────────────────────────────────────────────────────────

function CheckInIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="#0284C7" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5" aria-hidden="true">
      <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
      <polyline points="10 17 15 12 10 7" />
      <line x1={15} y1={12} x2={3} y2={12} />
    </svg>
  )
}

function CheckOutIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="#0284C7" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5" aria-hidden="true">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1={21} y1={12} x2={9} y2={12} />
    </svg>
  )
}

function GuestsIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5" aria-hidden="true">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx={9} cy={7} r={4} />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  )
}

function BedIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5" aria-hidden="true">
      <path d="M2 20v-8a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v8" />
      <path d="M2 15h20M2 20h20" />
      <path d="M6 10V6a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v4" />
    </svg>
  )
}

function CleanIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="#D97706" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5" aria-hidden="true">
      <path d="M12 3v4M12 17v4M3 12h4M17 12h4M5.6 5.6l2.8 2.8M15.6 15.6l2.8 2.8M18.4 5.6l-2.8 2.8M8.4 15.6l-2.8 2.8" />
    </svg>
  )
}

function CoinIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="#D97706" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5" aria-hidden="true">
      <circle cx={12} cy={12} r={9} />
      <path d="M14.5 9a3 3 0 0 0-5 2.2c0 2.4 5 3.8 5 6a3 3 0 0 1-5 2.1" />
      <line x1={12} y1={6} x2={12} y2={8} />
      <line x1={12} y1={19} x2={12} y2={21} />
    </svg>
  )
}

function ArrowInIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="#0284C7" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4" aria-hidden="true">
      <polyline points="10 17 15 12 10 7" />
      <line x1={15} y1={12} x2={3} y2={12} />
    </svg>
  )
}

function ArrowOutIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4" aria-hidden="true">
      <polyline points="16 17 21 12 16 7" />
      <line x1={21} y1={12} x2={9} y2={12} />
    </svg>
  )
}

function AlertDotIcon({ severity }: { severity: 'warning' | 'danger' | 'info' }) {
  const color = severity === 'danger' ? '#EF4444' : severity === 'warning' ? '#F59E0B' : '#0EA5E9'
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5" aria-hidden="true">
      {severity === 'danger'
        ? <><circle cx={12} cy={12} r={9} /><line x1={12} y1={8} x2={12} y2={12} /><line x1={12} y1={16} x2={12.01} y2={16} /></>
        : severity === 'warning'
        ? <><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><line x1={12} y1={9} x2={12} y2={13} /><line x1={12} y1={17} x2={12.01} y2={17} /></>
        : <><circle cx={12} cy={12} r={9} /><line x1={12} y1={8} x2={12} y2={12} /><line x1={12} y1={16} x2={12.01} y2={16} /></>
      }
    </svg>
  )
}
