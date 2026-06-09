import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireModule } from '@/lib/auth'
import { canAccessModule } from '@/lib/permissions'
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

function roomShortName(name: string): string {
  const words = name.trim().split(/\s+/)
  return words.length <= 2 ? name : words.slice(0, 2).join(' ')
}

// ── Types ─────────────────────────────────────────────────────────────────────

type GJ     = { full_name: string }
type RJ     = { id: string; name: string }
type RJFull = { id: string; name: string; housekeeping_status: string }
type PayJ   = { status: string; amount_brl: number; created_at: string }

type OpRowFull = {
  id: string; token: string; status: string; check_in: string; check_out: string
  guests:   GJ     | GJ[]     | null
  rooms:    RJFull | RJFull[] | null
  payments: PayJ[] | null
}

type UpRow = {
  id: string; token: string; status: string; check_in: string; check_out: string
  guests:   GJ | GJ[] | null
  rooms:    RJ | RJ[] | null
  payments: { status: string; created_at: string }[] | null
}

type TicketMini   = { id: string; status: string; priority: string; blocks_room: boolean }
type HandoffMini  = { id: string; target_department: string; status: string; created_at: string }
type PaidTodayRow = { id: string; amount_brl: number; manual_payment_method: string | null }
type PayMini      = { id: string; amount_brl: number; status: string }

// ── Data loading ──────────────────────────────────────────────────────────────

async function loadData(role: string) {
  const db = createAdminClient()
  const today    = todayISO()
  const tomorrow = addDaysISO(today, 1)
  const week     = addDaysISO(today, 7)

  const canRec  = canAccessModule(role, 'reception')
  const canHk   = canAccessModule(role, 'housekeeping')
  const canMt   = canAccessModule(role, 'maintenance')
  const canPay  = canAccessModule(role, 'payments')
  const canHdof = canRec || canHk || canMt

  const [
    cIn, cOut, staying, pendingPayQ, roomsQ, occupiedQ,
    todayInsQ, todayOutsQ, upcomingQ,
    ticketsQ, handoffsQ, paidTodayQ, overdueQ, extraCharQ,
  ] = await Promise.all([
    db.from('reservations').select('id', { count: 'exact', head: true })
      .eq('check_in', today).in('status', ['confirmed', 'pending_payment']),

    db.from('reservations').select('id', { count: 'exact', head: true })
      .eq('check_out', today).in('status', ['checked_in', 'confirmed']),

    db.from('reservations').select('id', { count: 'exact', head: true })
      .eq('status', 'checked_in'),

    db.from('payments').select('id, amount_brl, status').eq('status', 'pending'),

    db.from('rooms').select('id, name, housekeeping_status')
      .eq('is_active', true).order('name').returns<RJFull[]>(),

    db.from('reservations').select('room_id, guests ( full_name )')
      .eq('status', 'checked_in')
      .returns<{ room_id: string; guests: GJ | GJ[] | null }[]>(),

    db.from('reservations')
      .select('id, token, status, check_in, check_out, guests ( full_name ), rooms ( id, name, housekeeping_status ), payments ( status, amount_brl, created_at )')
      .eq('check_in', today).neq('status', 'cancelled')
      .order('created_at', { ascending: true }).returns<OpRowFull[]>(),

    db.from('reservations')
      .select('id, token, status, check_in, check_out, guests ( full_name ), rooms ( id, name, housekeeping_status ), payments ( status, amount_brl, created_at )')
      .eq('check_out', today).neq('status', 'cancelled')
      .order('created_at', { ascending: true }).returns<OpRowFull[]>(),

    db.from('reservations')
      .select('id, token, status, check_in, check_out, guests ( full_name ), rooms ( id, name ), payments ( status, created_at )')
      .gt('check_in', today).lte('check_in', week)
      .neq('status', 'cancelled').order('check_in', { ascending: true }).limit(12)
      .returns<UpRow[]>(),

    canMt
      ? db.from('maintenance_tickets')
          .select('id, status, priority, blocks_room')
          .neq('status', 'fixed').returns<TicketMini[]>()
      : Promise.resolve({ data: [] as TicketMini[], error: null }),

    canHdof
      ? db.from('handoff_requests')
          .select('id, target_department, status, created_at')
          .in('status', ['open', 'in_progress']).returns<HandoffMini[]>()
      : Promise.resolve({ data: [] as HandoffMini[], error: null }),

    canPay
      ? db.from('payments')
          .select('id, amount_brl, manual_payment_method')
          .eq('status', 'paid')
          .gte('paid_at', today + 'T00:00:00')
          .lt('paid_at', tomorrow + 'T00:00:00')
          .returns<PaidTodayRow[]>()
      : Promise.resolve({ data: [] as PaidTodayRow[], error: null }),

    canPay
      ? db.from('payments').select('id', { count: 'exact', head: true }).eq('status', 'overdue')
      : Promise.resolve({ data: null as null, count: 0 as number | null, error: null }),

    canPay
      ? db.from('reservation_charges').select('id', { count: 'exact', head: true }).eq('status', 'pending')
      : Promise.resolve({ data: null as null, count: 0 as number | null, error: null }),
  ])

  // Occupancy map: room_id → short guest name
  const occupiedMap = new Map<string, string>()
  for (const r of (occupiedQ.data ?? []) as { room_id: string; guests: GJ | GJ[] | null }[]) {
    const g = one(r.guests)
    if (r.room_id && g) {
      const parts = g.full_name.trim().split(/\s+/)
      occupiedMap.set(r.room_id, parts[0] + (parts[1] ? ' ' + parts[1][0] + '.' : ''))
    }
  }

  // Rooms with 6-state granular display status
  const rooms = (roomsQ.data ?? []).map((r) => ({
    id:   r.id,
    name: r.name,
    displayStatus: (occupiedMap.has(r.id) ? 'occupied' : r.housekeeping_status) as
      'dirty' | 'cleaning' | 'clean' | 'inspected' | 'ready' | 'occupied',
    guestShort: occupiedMap.get(r.id) ?? null,
  }))

  // Map arrival/departure enriched row
  const mapOp = (r: OpRowFull) => {
    const roomJ = one(r.rooms)
    const pays  = r.payments ?? []
    const sorted = [...pays].sort((a, b) => b.created_at.localeCompare(a.created_at))
    const latestPay = sorted.find((p) => p.status !== 'failed') ?? sorted[0]
    return {
      id: r.id, token: r.token, status: r.status,
      guestName:     one(r.guests)?.full_name ?? '—',
      roomName:      roomJ?.name ?? '—',
      roomHkStatus:  roomJ?.housekeeping_status ?? null,
      paymentStatus: latestPay?.status ?? null,
    }
  }

  const arrivals   = (todayInsQ.data ?? []).map(mapOp)
  const departures = (todayOutsQ.data ?? []).map(mapOp)

  // Upcoming arrivals (next 7 days)
  const upcoming = (upcomingQ.data ?? []).map((r) => {
    const pays   = r.payments ?? []
    const sorted = [...pays].sort((a, b) => b.created_at.localeCompare(a.created_at))
    const payStatus = (sorted.find((p) => p.status !== 'failed') ?? sorted[0])?.status ?? null
    return {
      id: r.id, token: r.token, status: r.status,
      checkIn: r.check_in, checkOut: r.check_out,
      nights:     nightsBetween(r.check_in, r.check_out),
      guestName:  one(r.guests)?.full_name ?? '—',
      roomName:   one(r.rooms as RJ | RJ[] | null)?.name ?? '—',
      paymentStatus: payStatus,
    }
  })

  // Pending payments
  const pendingRows  = (pendingPayQ.data ?? []) as PayMini[]
  const pendingAmount = pendingRows.reduce((s, p) => s + (p.amount_brl ?? 0), 0)
  const pendingCount  = pendingRows.length

  // Maintenance counts
  const tickets   = (ticketsQ.data ?? []) as TicketMini[]
  const mtUrgent  = tickets.filter((t) => t.priority === 'urgent').length
  const mtOpen    = tickets.filter((t) => t.status === 'open').length
  const mtInProg  = tickets.filter((t) => t.status === 'in_progress').length
  const mtBlocked = tickets.filter((t) => t.blocks_room).length

  // Handoff counts
  const handoffs      = (handoffsQ.data ?? []) as HandoffMini[]
  const hkHandoffs    = handoffs.filter((h) => h.target_department === 'housekeeping').length
  const mtHandoffs    = handoffs.filter((h) => h.target_department === 'maintenance').length
  const staleHandoffs = handoffs.filter((h) =>
    new Date(h.created_at).getTime() < Date.now() - 24 * 60 * 60 * 1000,
  ).length

  // Room status counts
  const hkDirty     = rooms.filter((r) => r.displayStatus === 'dirty').length
  const hkCleaning  = rooms.filter((r) => r.displayStatus === 'cleaning').length
  const hkClean     = rooms.filter((r) => r.displayStatus === 'clean').length
  const hkInspected = rooms.filter((r) => r.displayStatus === 'inspected').length
  const hkReady     = rooms.filter((r) => r.displayStatus === 'ready').length

  // Finance
  const paidToday     = (paidTodayQ.data ?? []) as PaidTodayRow[]
  const paidTodayAmt  = paidToday.reduce((s, p) => s + (p.amount_brl ?? 0), 0)
  const paidTodayCt   = paidToday.length
  const manualTodayCt = paidToday.filter((p) => p.manual_payment_method).length
  const overdueCount  = (overdueQ as { count: number | null }).count ?? 0
  const extraCharCount = (extraCharQ as { count: number | null }).count ?? 0

  // Alerts
  type Alert = { message: string; severity: 'warning' | 'danger' | 'info'; href?: string }
  const alerts: Alert[] = []

  const unreadyArrivals = arrivals.filter((a) => ['dirty', 'cleaning'].includes(a.roomHkStatus ?? ''))
  if (unreadyArrivals.length > 0)
    alerts.push({ message: `${unreadyArrivals.length} chegada${unreadyArrivals.length !== 1 ? 's' : ''} hoje com quarto não pronto`, severity: 'danger', href: canHk ? '/dashboard/housekeeping' : '/dashboard/reception' })

  const pendingPayArrivals = arrivals.filter((a) => a.status === 'pending_payment')
  if (pendingPayArrivals.length > 0)
    alerts.push({ message: `${pendingPayArrivals.length} chegada${pendingPayArrivals.length !== 1 ? 's' : ''} hoje com pagamento pendente`, severity: 'danger', href: '/dashboard/payments' })

  if (overdueCount > 0)
    alerts.push({ message: `${overdueCount} pagamento${overdueCount !== 1 ? 's' : ''} em atraso`, severity: 'danger', href: '/dashboard/payments' })

  if (canMt && mtUrgent > 0)
    alerts.push({ message: `${mtUrgent} chamado${mtUrgent !== 1 ? 's' : ''} urgente${mtUrgent !== 1 ? 's' : ''} de manutenção`, severity: 'danger', href: '/dashboard/maintenance' })

  if (staleHandoffs > 0)
    alerts.push({ message: `${staleHandoffs} solicitação${staleHandoffs !== 1 ? 'ões' : ''} interna${staleHandoffs !== 1 ? 's' : ''} aberta${staleHandoffs !== 1 ? 's' : ''} há mais de 24h`, severity: 'warning' })

  if (canPay && pendingCount > 0)
    alerts.push({ message: `${pendingCount} pagamento${pendingCount !== 1 ? 's' : ''} pendente${pendingCount !== 1 ? 's' : ''} · ${formatBRL(pendingAmount)}`, severity: 'warning', href: '/dashboard/payments' })

  if (canPay && extraCharCount > 0)
    alerts.push({ message: `${extraCharCount} cobrança${extraCharCount !== 1 ? 's' : ''} extra pendente${extraCharCount !== 1 ? 's' : ''}`, severity: 'warning', href: '/dashboard/payments' })

  if (canHk && hkDirty > 0)
    alerts.push({ message: `${hkDirty} quarto${hkDirty !== 1 ? 's' : ''} para limpar`, severity: 'info', href: '/dashboard/housekeeping' })

  return {
    checkInsToday:  cIn.count  ?? 0,
    checkOutsToday: cOut.count ?? 0,
    stayingCount:   staying.count ?? 0,
    pendingAmount, pendingCount,
    rooms, arrivals, departures, upcoming, alerts,
    hkDirty, hkCleaning, hkClean, hkInspected, hkReady,
    mtUrgent, mtOpen, mtInProg, mtBlocked, mtHandoffs,
    hkHandoffs, staleHandoffs,
    paidTodayAmt, paidTodayCt, manualTodayCt, overdueCount, extraCharCount,
    canRec, canHk, canMt, canPay,
  }
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function DashboardOverviewPage() {
  const admin = await requireModule('overview')
  if (admin.role === 'reception') redirect('/dashboard/reception')
  if (admin.role === 'housekeeping' || admin.role === 'housekeeping_supervisor') redirect('/dashboard/housekeeping')
  const data  = await loadData(admin.role)

  const dateLabel = new Date().toLocaleDateString('pt-BR', {
    weekday: 'long', day: '2-digit', month: 'long', year: 'numeric',
  })

  const hasSnapshots = data.canPay || data.canMt || data.canHk

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-7 max-w-[1400px] space-y-6">

      {/* ── Header ── */}
      <div>
        <h1 className="text-[22px] md:text-[26px] font-bold text-slate-900 tracking-tight">
          {getGreeting()}, {admin.full_name.split(' ')[0]}
        </h1>
        <p className="text-[13px] text-slate-500 mt-1 capitalize">
          Visão geral das operações — {dateLabel}
        </p>
      </div>

      {/* ── Metric cards ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-3">
        <MetricCard
          label="Check-ins hoje"
          value={data.checkInsToday}
          hint="Confirmados"
          tone="info"
          icon={<CheckInIcon />}
          href="/dashboard/reception"
        />
        <MetricCard
          label="Check-outs hoje"
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
          value={data.hkReady}
          hint="Disponíveis"
          tone={data.hkReady > 0 ? 'success' : 'neutral'}
          icon={<BedIcon />}
          href={data.canHk ? '/dashboard/housekeeping' : undefined}
        />
        <MetricCard
          label="Em limpeza / sujos"
          value={data.hkCleaning + data.hkDirty}
          hint="Aguardando preparo"
          tone={data.hkCleaning + data.hkDirty > 0 ? 'warning' : 'neutral'}
          icon={<CleanIcon />}
          href={data.canHk ? '/dashboard/housekeeping' : undefined}
        />
        {data.canPay ? (
          <MetricCard
            label="Pagamentos pendentes"
            value={formatBRL(data.pendingAmount)}
            hint={`${data.pendingCount} em aberto`}
            tone={data.pendingCount > 0 ? 'warning' : 'neutral'}
            icon={<CoinIcon />}
            href="/dashboard/payments"
          />
        ) : (
          <MetricCard
            label="Alertas críticos"
            value={data.alerts.filter((a) => a.severity === 'danger').length}
            hint="Requerem atenção"
            tone={data.alerts.some((a) => a.severity === 'danger') ? 'danger' : 'neutral'}
            icon={<AlertTriangleIcon color={data.alerts.some((a) => a.severity === 'danger') ? '#EF4444' : '#94A3B8'} />}
          />
        )}
      </div>

      {/* ── Today: arrivals + departures ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <TodayPanel
          title="Chegadas hoje"
          emptyMessage="Nenhuma chegada prevista para hoje."
          items={data.arrivals}
          showRoomStatus={data.canHk || data.canRec}
          showPayStatus={data.canPay || data.canRec}
        />
        <TodayPanel
          title="Saídas hoje"
          emptyMessage="Nenhuma saída prevista para hoje."
          items={data.departures}
          showRoomStatus={false}
          showPayStatus={data.canPay || data.canRec}
        />
      </div>

      {/* ── Room map ── */}
      <div className="bg-white rounded-2xl border border-admin-border shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-admin-border flex items-center justify-between">
          <div>
            <h2 className="text-[14px] font-semibold text-slate-800">Mapa de quartos</h2>
            <p className="text-[12px] text-slate-400 mt-0.5">Status operacional em tempo real</p>
          </div>
          {data.canHk && (
            <Link href="/dashboard/housekeeping" className="text-[12px] font-semibold text-admin-sidebar-act hover:text-admin-sidebar transition-colors">
              Ver governança →
            </Link>
          )}
        </div>
        <div className="px-5 pt-4 flex flex-wrap gap-3">
          {ROOM_STATUS_CFG.map((s) => (
            <div key={s.key} className="flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${s.dot}`} />
              <span className="text-[11px] text-slate-500">{s.label}</span>
            </div>
          ))}
        </div>
        {data.rooms.length === 0 ? (
          <div className="px-5 py-12 text-center text-[13px] text-slate-400">
            Nenhum quarto cadastrado.
          </div>
        ) : (
          <div className="p-4 grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2">
            {data.rooms.map((room) => {
              const cfg = ROOM_STATUS_CFG.find((s) => s.key === room.displayStatus) ?? ROOM_STATUS_CFG[ROOM_STATUS_CFG.length - 1]
              return (
                <div key={room.id} className={`rounded-xl border p-2.5 text-center ${cfg.cardBorder} ${cfg.cardBg}`}>
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

      {/* ── Snapshots row ── */}
      {hasSnapshots && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {data.canPay && (
            <SnapshotCard
              title="Financeiro"
              href="/dashboard/payments"
              items={[
                { label: 'Recebido hoje', value: formatBRL(data.paidTodayAmt), tone: data.paidTodayCt > 0 ? 'success' : 'neutral' },
                { label: 'Pendentes', value: `${data.pendingCount} · ${formatBRL(data.pendingAmount)}`, tone: data.pendingCount > 0 ? 'warning' : 'neutral' },
                { label: 'Em atraso', value: String(data.overdueCount), tone: data.overdueCount > 0 ? 'danger' : 'neutral' },
                { label: 'Manual hoje', value: String(data.manualTodayCt), tone: 'neutral' },
                { label: 'Cobranças extras pendentes', value: String(data.extraCharCount), tone: data.extraCharCount > 0 ? 'warning' : 'neutral' },
              ]}
            />
          )}
          {data.canMt && (
            <SnapshotCard
              title="Manutenção"
              href="/dashboard/maintenance"
              items={[
                { label: 'Urgentes', value: String(data.mtUrgent), tone: data.mtUrgent > 0 ? 'danger' : 'neutral' },
                { label: 'Abertos', value: String(data.mtOpen), tone: data.mtOpen > 0 ? 'warning' : 'neutral' },
                { label: 'Em andamento', value: String(data.mtInProg), tone: 'neutral' },
                { label: 'Quartos bloqueados', value: String(data.mtBlocked), tone: data.mtBlocked > 0 ? 'danger' : 'neutral' },
                { label: 'Solicitações da recepção', value: String(data.mtHandoffs), tone: data.mtHandoffs > 0 ? 'warning' : 'neutral' },
              ]}
            />
          )}
          {data.canHk && (
            <SnapshotCard
              title="Governança"
              href="/dashboard/housekeeping"
              items={[
                { label: 'Para limpar', value: String(data.hkDirty), tone: data.hkDirty > 0 ? 'danger' : 'neutral' },
                { label: 'Em limpeza', value: String(data.hkCleaning), tone: data.hkCleaning > 0 ? 'warning' : 'neutral' },
                { label: 'Limpas / prontas', value: String(data.hkClean + data.hkInspected + data.hkReady), tone: 'success' },
                { label: 'Solicitações da recepção', value: String(data.hkHandoffs), tone: data.hkHandoffs > 0 ? 'warning' : 'neutral' },
              ]}
            />
          )}
        </div>
      )}

      {/* ── Alerts + Quick actions ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* Alerts */}
        <div className="lg:col-span-1 bg-white rounded-2xl border border-admin-border shadow-sm">
          <div className="px-5 py-4 border-b border-admin-border">
            <h2 className="text-[14px] font-semibold text-slate-800">Alertas importantes</h2>
          </div>
          <div className="px-5 py-4">
            {data.alerts.length === 0 ? (
              <p className="text-[13px] text-slate-400 py-4 text-center">Nenhum alerta no momento.</p>
            ) : (
              <div className="space-y-3">
                {data.alerts.map((alert, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                      alert.severity === 'danger'  ? 'bg-red-50' :
                      alert.severity === 'warning' ? 'bg-amber-50' : 'bg-sky-50'
                    }`}>
                      <AlertDotIcon severity={alert.severity} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[12px] text-slate-600 leading-relaxed">{alert.message}</p>
                      {alert.href && (
                        <Link href={alert.href} className="text-[11px] font-semibold text-admin-sidebar-act hover:text-admin-sidebar transition-colors">
                          Ver →
                        </Link>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Quick actions */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-admin-border shadow-sm">
          <div className="px-5 py-4 border-b border-admin-border">
            <h2 className="text-[14px] font-semibold text-slate-800">Ações rápidas</h2>
          </div>
          <div className="p-4 grid grid-cols-3 sm:grid-cols-4 md:grid-cols-7 gap-3">
            {QUICK_ACTIONS.filter((qa) => !('requiresHk' in qa) || data.canHk).map((qa) => (
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
      </div>

      {/* ── Upcoming arrivals table ── */}
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
            <div className="hidden md:grid grid-cols-[90px_1fr_1fr_60px_140px_90px] gap-4 px-5 py-2.5 bg-slate-50 border-b border-admin-border">
              {['Data', 'Hóspede', 'Quarto', 'Noites', 'Status', ''].map((h) => (
                <p key={h} className="text-[11px] font-semibold text-slate-400 uppercase tracking-[0.10em]">{h}</p>
              ))}
            </div>
            <div className="divide-y divide-[#F0F4F8]">
              {data.upcoming.map((row) => (
                <div key={row.id} className="px-5 py-3.5 hover:bg-slate-50/60 transition-colors">
                  <div className="hidden md:grid grid-cols-[90px_1fr_1fr_60px_140px_90px] gap-4 items-center">
                    <span className="text-[12px] font-medium text-slate-700">{formatDate(row.checkIn)}</span>
                    <span className="text-[13px] font-medium text-slate-800 truncate">{row.guestName}</span>
                    <span className="text-[12px] text-slate-500 truncate">{row.roomName}</span>
                    <span className="text-[12px] text-slate-500">{row.nights}n</span>
                    <ReservationStatusBadge status={row.status} />
                    <Link
                      href={`/dashboard/reservations/${row.id}`}
                      className="text-[12px] font-semibold text-admin-sidebar-act hover:text-admin-sidebar transition-colors text-right"
                    >
                      Ver →
                    </Link>
                  </div>
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

// ── TodayPanel ────────────────────────────────────────────────────────────────

type TodayOp = {
  id: string; token: string; status: string
  guestName: string; roomName: string
  roomHkStatus: string | null; paymentStatus: string | null
}

function TodayPanel({ title, emptyMessage, items, showRoomStatus, showPayStatus }: {
  title: string
  emptyMessage: string
  items: TodayOp[]
  showRoomStatus: boolean
  showPayStatus: boolean
}) {
  return (
    <div className="bg-white rounded-2xl border border-admin-border shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-admin-border flex items-center justify-between">
        <div>
          <h2 className="text-[14px] font-semibold text-slate-800">{title}</h2>
          <p className="text-[12px] text-slate-400 mt-0.5">
            {items.length} operaç{items.length !== 1 ? 'ões' : 'ão'} hoje
          </p>
        </div>
        <Link href="/dashboard/reception" className="text-[12px] font-semibold text-admin-sidebar-act hover:text-admin-sidebar transition-colors">
          Recepção →
        </Link>
      </div>
      {items.length === 0 ? (
        <div className="px-5 py-10 text-center text-[13px] text-slate-400">
          {emptyMessage}
        </div>
      ) : (
        <div className="divide-y divide-[#F0F4F8]">
          {items.map((op) => (
            <div key={op.id} className="px-5 py-3.5 flex items-center gap-3 hover:bg-slate-50/60 transition-colors">
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-semibold text-slate-800 truncate">{op.guestName}</p>
                <p className="text-[11px] text-slate-400 mt-0.5 truncate">{op.roomName}</p>
              </div>
              <div className="flex items-center gap-1.5 shrink-0 flex-wrap justify-end">
                {showRoomStatus && op.roomHkStatus && (
                  <RoomHkBadge status={op.roomHkStatus} />
                )}
                {showPayStatus && op.paymentStatus && (
                  <PayStatusBadge status={op.paymentStatus} />
                )}
                <ReservationStatusBadge status={op.status} />
              </div>
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
  )
}

// ── SnapshotCard ──────────────────────────────────────────────────────────────

type SnapshotTone = 'success' | 'warning' | 'danger' | 'neutral'
type SnapshotItem = { label: string; value: string; tone: SnapshotTone }

const SNAP_VALUE_COLOR: Record<SnapshotTone, string> = {
  success: 'text-emerald-700',
  warning: 'text-amber-700',
  danger:  'text-red-600',
  neutral: 'text-slate-700',
}

function SnapshotCard({ title, href, items }: { title: string; href: string; items: SnapshotItem[] }) {
  return (
    <div className="bg-white rounded-2xl border border-admin-border shadow-sm">
      <div className="px-5 py-4 border-b border-admin-border flex items-center justify-between">
        <h2 className="text-[14px] font-semibold text-slate-800">{title}</h2>
        <Link href={href} className="text-[12px] font-semibold text-admin-sidebar-act hover:text-admin-sidebar transition-colors">
          Ver tudo →
        </Link>
      </div>
      <div className="p-5 space-y-3">
        {items.map((item) => (
          <div key={item.label} className="flex items-center justify-between gap-3">
            <span className="text-[12px] text-slate-500">{item.label}</span>
            <span className={`text-[13px] font-bold tabular-nums ${SNAP_VALUE_COLOR[item.tone]}`}>
              {item.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Inline badges ─────────────────────────────────────────────────────────────

const HK_BADGE_COLOR: Record<string, string> = {
  dirty:     'bg-red-100 text-red-700',
  cleaning:  'bg-amber-100 text-amber-700',
  clean:     'bg-teal-100 text-teal-700',
  inspected: 'bg-sky-100 text-sky-700',
  ready:     'bg-emerald-100 text-emerald-700',
  occupied:  'bg-slate-100 text-slate-600',
}
const HK_BADGE_LABEL: Record<string, string> = {
  dirty:     'Suja',
  cleaning:  'Limpeza',
  clean:     'Limpa',
  inspected: 'Inspecionada',
  ready:     'Pronta',
  occupied:  'Ocupada',
}

function RoomHkBadge({ status }: { status: string }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ${HK_BADGE_COLOR[status] ?? 'bg-slate-100 text-slate-600'}`}>
      {HK_BADGE_LABEL[status] ?? status}
    </span>
  )
}

const PAY_BADGE_COLOR: Record<string, string> = {
  paid:            'bg-emerald-100 text-emerald-700',
  pending:         'bg-amber-100 text-amber-700',
  pending_payment: 'bg-amber-100 text-amber-700',
  overdue:         'bg-red-100 text-red-700',
  failed:          'bg-slate-100 text-slate-500',
  cancelled:       'bg-slate-100 text-slate-500',
}
const PAY_BADGE_LABEL: Record<string, string> = {
  paid:            'Pago',
  pending:         'Pendente',
  pending_payment: 'Pendente',
  overdue:         'Atrasado',
  failed:          'Falhou',
  cancelled:       'Cancelado',
}

function PayStatusBadge({ status }: { status: string }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ${PAY_BADGE_COLOR[status] ?? 'bg-slate-100 text-slate-600'}`}>
      {PAY_BADGE_LABEL[status] ?? status}
    </span>
  )
}

// ── MetricCard ────────────────────────────────────────────────────────────────

type MetricTone = 'info' | 'success' | 'warning' | 'danger' | 'neutral'

const METRIC_VALUE_COLOR: Record<MetricTone, string> = {
  info:    'text-sky-700',
  success: 'text-emerald-700',
  warning: 'text-amber-700',
  danger:  'text-red-600',
  neutral: 'text-slate-500',
}

const METRIC_ICON_BG: Record<MetricTone, string> = {
  info:    'bg-sky-50',
  success: 'bg-emerald-50',
  warning: 'bg-amber-50',
  danger:  'bg-red-50',
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

// ── Room map config (6 states) ────────────────────────────────────────────────

const ROOM_STATUS_CFG = [
  { key: 'occupied',  label: 'Ocupado',      dot: 'bg-sky-500',     cardBg: 'bg-sky-50/50',     cardBorder: 'border-sky-100',     textColor: 'text-sky-700',     hintColor: 'text-sky-600' },
  { key: 'ready',     label: 'Pronto',        dot: 'bg-emerald-500', cardBg: 'bg-emerald-50/40', cardBorder: 'border-emerald-100', textColor: 'text-emerald-700', hintColor: 'text-emerald-600' },
  { key: 'inspected', label: 'Inspecionado',  dot: 'bg-blue-400',    cardBg: 'bg-blue-50/40',    cardBorder: 'border-blue-100',    textColor: 'text-blue-700',    hintColor: 'text-blue-600' },
  { key: 'clean',     label: 'Limpo',         dot: 'bg-teal-400',    cardBg: 'bg-teal-50/40',    cardBorder: 'border-teal-100',    textColor: 'text-teal-700',    hintColor: 'text-teal-600' },
  { key: 'cleaning',  label: 'Em limpeza',    dot: 'bg-amber-500',   cardBg: 'bg-amber-50/40',   cardBorder: 'border-amber-100',   textColor: 'text-amber-700',   hintColor: 'text-amber-600' },
  { key: 'dirty',     label: 'Sujo',          dot: 'bg-red-500',     cardBg: 'bg-red-50/40',     cardBorder: 'border-red-100',     textColor: 'text-red-700',     hintColor: 'text-red-600' },
] as const

// ── Quick actions ─────────────────────────────────────────────────────────────

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
    requiresHk: true,
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

function AlertTriangleIcon({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5" aria-hidden="true">
      <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
      <line x1={12} y1={9} x2={12} y2={13} />
      <line x1={12} y1={17} x2={12.01} y2={17} />
    </svg>
  )
}

function AlertDotIcon({ severity }: { severity: 'warning' | 'danger' | 'info' }) {
  const color = severity === 'danger' ? '#EF4444' : severity === 'warning' ? '#F59E0B' : '#0EA5E9'
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5" aria-hidden="true">
      {severity === 'danger' || severity === 'info' ? (
        <><circle cx={12} cy={12} r={9} /><line x1={12} y1={8} x2={12} y2={12} /><line x1={12} y1={16} x2={12.01} y2={16} /></>
      ) : (
        <><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><line x1={12} y1={9} x2={12} y2={13} /><line x1={12} y1={17} x2={12.01} y2={17} /></>
      )}
    </svg>
  )
}
