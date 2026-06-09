import type { Metadata } from 'next'
import Link from 'next/link'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireModule } from '@/lib/auth'
import { AdminPageHeader, AdminStatCard } from '@/components/admin/AdminUI'
import { PaymentsFilters } from './_components/PaymentsFilters'
import { PaymentRowActions } from './_components/PaymentRowActions'
import { ReceiptLink } from './_components/ReceiptLink'
import { PaymentStatusBadge } from '../reservations/_components/badges'

export const metadata: Metadata = { title: "Financeiro — Painel Sofia's" }

const PAGE_SIZE = 20
const CARD = 'bg-white rounded-2xl border border-admin-border shadow-sm'

const STATUS_ROW_ACCENT: Record<string, string> = {
  paid:      'border-l-[3px] border-l-emerald-400',
  pending:   'border-l-[3px] border-l-amber-400',
  overdue:   'border-l-[3px] border-l-red-500',
  failed:    'border-l-[3px] border-l-slate-300',
  cancelled: 'border-l-[3px] border-l-slate-300',
  refunded:  'border-l-[3px] border-l-slate-300',
}

const METHOD_LABELS: Record<string, string> = {
  pix:         'PIX',
  credit_card: 'Cartão de crédito',
  boleto:      'Boleto',
  manual:      'Manual',
}

const MANUAL_METHOD_LABELS: Record<string, string> = {
  pix_manual:    'PIX manual',
  cash:          'Dinheiro',
  bank_transfer: 'Transferência bancária',
  card_machine:  'Máquina de cartão',
  other:         'Outro',
}

type GuestJoin = { full_name: string; email: string; phone: string | null }
type RoomJoin  = { name: string }
type ReservationJoin = {
  id: string
  token: string
  check_in: string
  check_out: string
  guests: GuestJoin | GuestJoin[] | null
  rooms: RoomJoin | RoomJoin[] | null
}
type PaymentRecord = {
  id: string
  reservation_id: string
  amount_brl: number
  method: string
  asaas_payment_id: string | null
  asaas_invoice_url: string | null
  status: string
  paid_at: string | null
  created_at: string
  manual_payment_method: string | null
  manual_payment_note: string | null
  manual_receipt_path: string | null
  reservations: ReservationJoin | ReservationJoin[] | null
}

type Row = {
  id: string
  reservationId: string
  token: string
  checkIn: string
  checkOut: string
  guestName: string
  guestEmail: string
  guestPhone: string | null
  roomName: string
  amount: number
  method: string
  asaasPaymentId: string | null
  invoiceUrl: string | null
  status: string
  paidAt: string | null
  createdAt: string
  manualMethod: string | null
  manualNote: string | null
  receiptPath: string | null
}

function one<T>(rel: T | T[] | null): T | null {
  if (!rel) return null
  return Array.isArray(rel) ? (rel[0] ?? null) : rel
}

function todayISO(): string {
  return new Date().toISOString().slice(0, 10)
}

function formatDate(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number)
  return `${String(d).padStart(2, '0')}/${String(m).padStart(2, '0')}/${y}`
}

function formatDateTime(iso: string | null): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit',
  })
}

function formatBRL(value: number): string {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
}

// "Total recebido" / receita figures only ever count payments.status === 'paid' —
// per spec, that's the sole source of truth for actual received revenue.
function summarize(rows: Row[]) {
  const today = todayISO()
  const month = today.slice(0, 7)
  const paid = rows.filter((r) => r.status === 'paid')
  return {
    totalReceived:  paid.reduce((sum, r) => sum + r.amount, 0),
    monthRevenue:   paid.filter((r) => (r.paidAt ?? '').slice(0, 7) === month).reduce((sum, r) => sum + r.amount, 0),
    todayRevenue:   paid.filter((r) => (r.paidAt ?? '').slice(0, 10) === today).reduce((sum, r) => sum + r.amount, 0),
    pendingCount:   rows.filter((r) => r.status === 'pending' || r.status === 'overdue').length,
    paidCount:      paid.length,
    failedCount:    rows.filter((r) => r.status === 'failed' || r.status === 'cancelled' || r.status === 'refunded').length,
    manualCount:    rows.filter((r) => r.method === 'manual').length,
  }
}

type SP = Promise<{
  q?: string
  status?: string
  method?: string
  from?: string
  to?: string
  page?: string
}>

export default async function PaymentsPage({ searchParams }: { searchParams: SP }) {
  await requireModule('payments')

  const sp = await searchParams
  const q             = (sp.q ?? '').trim().toLowerCase()
  const statusFilter  = sp.status ?? ''
  const methodFilter  = sp.method ?? ''
  const fromFilter    = sp.from ?? ''
  const toFilter      = sp.to ?? ''
  const page          = Math.max(1, parseInt(sp.page ?? '1', 10) || 1)

  const db = createAdminClient()
  const { data } = await db
    .from('payments')
    .select(`
      id, reservation_id, amount_brl, method, asaas_payment_id, asaas_invoice_url,
      status, paid_at, created_at,
      manual_payment_method, manual_payment_note, manual_receipt_path,
      reservations (
        id, token, check_in, check_out,
        guests ( full_name, email, phone ),
        rooms ( name )
      )
    `)
    .order('created_at', { ascending: false })
    .returns<PaymentRecord[]>()

  const all: Row[] = (data ?? []).map((p) => {
    const reservation = one(p.reservations)
    const guest = reservation ? one(reservation.guests) : null
    const room  = reservation ? one(reservation.rooms) : null
    return {
      id:             p.id,
      reservationId:  p.reservation_id,
      token:          reservation?.token ?? '—',
      checkIn:        reservation?.check_in ?? '',
      checkOut:       reservation?.check_out ?? '',
      guestName:      guest?.full_name ?? '—',
      guestEmail:     guest?.email ?? '—',
      guestPhone:     guest?.phone ?? null,
      roomName:       room?.name ?? '—',
      amount:         p.amount_brl,
      method:         p.method,
      asaasPaymentId: p.asaas_payment_id,
      invoiceUrl:     p.asaas_invoice_url,
      status:         p.status,
      paidAt:         p.paid_at,
      createdAt:      p.created_at,
      manualMethod:   p.manual_payment_method,
      manualNote:     p.manual_payment_note,
      receiptPath:    p.manual_receipt_path,
    }
  })

  const stats = summarize(all)
  const asaasConfigured = !!process.env.ASAAS_API_KEY?.trim()

  const filtered = all.filter((row) => {
    if (statusFilter && row.status !== statusFilter) return false
    if (methodFilter && row.method !== methodFilter) return false
    if (fromFilter && row.createdAt.slice(0, 10) < fromFilter) return false
    if (toFilter && row.createdAt.slice(0, 10) > toFilter) return false
    if (q) {
      const haystack = `${row.guestName} ${row.guestEmail} ${row.token} ${row.asaasPaymentId ?? ''}`.toLowerCase()
      if (!haystack.includes(q)) return false
    }
    return true
  })

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const safePage = Math.min(page, totalPages)
  const pageRows = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE)

  function pageHref(p: number): string {
    const params = new URLSearchParams()
    if (q)             params.set('q', sp.q ?? '')
    if (statusFilter)  params.set('status', statusFilter)
    if (methodFilter)  params.set('method', methodFilter)
    if (fromFilter)    params.set('from', fromFilter)
    if (toFilter)      params.set('to', toFilter)
    if (p > 1)         params.set('page', String(p))
    const qs = params.toString()
    return qs ? `/dashboard/payments?${qs}` : '/dashboard/payments'
  }

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-7 max-w-7xl space-y-6">

      <AdminPageHeader
        eyebrow="Gestão"
        title="Financeiro"
        subtitle={`${filtered.length} pagamento${filtered.length !== 1 ? 's' : ''} encontrado${filtered.length !== 1 ? 's' : ''}${filtered.length !== all.length ? ` de ${all.length} no total` : ''}.`}
      />

      {!asaasConfigured && (
        <p className="text-[12px] text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 leading-relaxed">
          Asaas não configurado — usando pagamentos manuais/WhatsApp. Confirme os recebimentos manualmente
          abaixo conforme o pagamento chega (PIX direto, dinheiro, transferência, máquina de cartão).
        </p>
      )}

      {/* Overview */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-3">
        <AdminStatCard label="Total recebido" value={formatBRL(stats.totalReceived)} tone="success"
          icon={<svg viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5" aria-hidden="true"><circle cx={12} cy={12} r={9} /><path d="M14.5 9a3 3 0 0 0-5 2.2c0 2.4 5 3.8 5 6a3 3 0 0 1-5 2.1" /><line x1={12} y1={6} x2={12} y2={8} /><line x1={12} y1={19} x2={12} y2={21} /></svg>}
        />
        <AdminStatCard label="Recebido este mês" value={formatBRL(stats.monthRevenue)} tone="info"
          icon={<svg viewBox="0 0 24 24" fill="none" stroke="#0284C7" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5" aria-hidden="true"><rect x={3} y={4} width={18} height={18} rx={2} /><line x1={16} y1={2} x2={16} y2={6} /><line x1={8} y1={2} x2={8} y2={6} /><line x1={3} y1={10} x2={21} y2={10} /></svg>}
        />
        <AdminStatCard label="Recebido hoje" value={formatBRL(stats.todayRevenue)} tone="info"
          icon={<svg viewBox="0 0 24 24" fill="none" stroke="#0284C7" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5" aria-hidden="true"><circle cx={12} cy={12} r={9} /><polyline points="12 7 12 12 15 15" /></svg>}
        />
        <AdminStatCard label="Pendente / vencido" value={String(stats.pendingCount)} tone={stats.pendingCount > 0 ? 'warning' : 'neutral'}
          icon={<svg viewBox="0 0 24 24" fill="none" stroke={stats.pendingCount > 0 ? '#D97706' : '#94A3B8'} strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5" aria-hidden="true"><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><line x1={12} y1={9} x2={12} y2={13} /><line x1={12} y1={17} x2={12.01} y2={17} /></svg>}
        />
        <AdminStatCard label="Pagamentos pagos" value={String(stats.paidCount)} tone="success"
          icon={<svg viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5" aria-hidden="true"><polyline points="20 6 9 17 4 12" /></svg>}
        />
        <AdminStatCard label="Falhos / estornados" value={String(stats.failedCount)} tone="neutral"
          icon={<svg viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5" aria-hidden="true"><circle cx={12} cy={12} r={9} /><line x1={15} y1={9} x2={9} y2={15} /><line x1={9} y1={9} x2={15} y2={15} /></svg>}
        />
        <AdminStatCard label="Pagamentos manuais" value={String(stats.manualCount)} tone="neutral"
          icon={<svg viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5" aria-hidden="true"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>}
        />
      </div>

      <PaymentsFilters />

      {pageRows.length === 0 ? (
        <div className={`${CARD} py-14 text-center text-[13px] text-slate-400`}>
          Nenhum pagamento encontrado com os filtros atuais.
        </div>
      ) : (
        <div className={`${CARD} overflow-hidden`}>
          <div className="divide-y divide-slate-100">
            {pageRows.map((row) => (
              <div key={row.id} className={`px-4 sm:px-5 py-4 hover:bg-slate-50/60 transition-colors ${STATUS_ROW_ACCENT[row.status] ?? ''}`}>

                {/* Top line — guest + reservation + status */}
                <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                  <span className="font-semibold text-slate-800 text-[14px]">{row.guestName}</span>
                  <span className="text-[12px] text-slate-400">{row.guestEmail}</span>
                  {row.guestPhone && <span className="text-[12px] text-slate-400">{row.guestPhone}</span>}
                  <span className="font-mono text-[11px] text-slate-400">{row.token}</span>
                  <PaymentStatusBadge status={row.status} className="sm:ml-auto" />
                </div>

                {/* Second line — room, dates, method, amount */}
                <div className="flex flex-wrap items-center gap-x-6 gap-y-3 mt-3 pt-3 border-t border-slate-100">
                  <div className="min-w-0">
                    <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-[0.10em] mb-0.5">Quarto</p>
                    <p className="text-[13px] font-medium text-slate-800 truncate">{row.roomName}</p>
                  </div>
                  {row.checkIn && row.checkOut && (
                    <div>
                      <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-[0.10em] mb-0.5">Check-in / Check-out</p>
                      <p className="text-[13px] font-medium text-slate-700 whitespace-nowrap">
                        {formatDate(row.checkIn)} <span className="text-slate-400">→</span> {formatDate(row.checkOut)}
                      </p>
                    </div>
                  )}
                  <div>
                    <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-[0.10em] mb-0.5">Método</p>
                    <p className="text-[13px] font-medium text-slate-700">{METHOD_LABELS[row.method] ?? row.method}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-[0.10em] mb-0.5">Valor</p>
                    <p className="text-[13px] font-bold text-slate-800 whitespace-nowrap">{formatBRL(row.amount)}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-[0.10em] mb-0.5">Criado / Pago</p>
                    <p className="text-[13px] font-medium text-slate-700 whitespace-nowrap">
                      {formatDateTime(row.createdAt)}
                      {row.paidAt && <span className="text-emerald-600"> · pago {formatDateTime(row.paidAt)}</span>}
                    </p>
                  </div>
                  {row.asaasPaymentId && (
                    <div className="min-w-0">
                      <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-[0.10em] mb-0.5">Asaas</p>
                      <p className="font-mono text-[11px] text-slate-500 truncate">{row.asaasPaymentId}</p>
                    </div>
                  )}
                  <Link
                    href={`/dashboard/reservations/${row.reservationId}`}
                    className="sm:ml-auto text-admin-sidebar-act hover:text-admin-sidebar text-[12px] font-semibold transition-colors whitespace-nowrap"
                  >
                    Ver reserva →
                  </Link>
                </div>

                {/* Actions */}
                {(row.invoiceUrl || row.status === 'pending' || row.status === 'overdue') && (
                  <div className="flex flex-wrap items-center gap-3 mt-3 pt-3 border-t border-slate-100">
                    {row.invoiceUrl && (
                      <a
                        href={row.invoiceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[12px] font-semibold text-admin-sidebar-act hover:text-admin-sidebar transition-colors whitespace-nowrap"
                      >
                        Ver cobrança no Asaas →
                      </a>
                    )}
                    <PaymentRowActions paymentId={row.id} amount={row.amount} status={row.status} />
                  </div>
                )}

                {/* Manual payment confirmation info */}
                {row.manualMethod && (
                  <div className="flex flex-wrap items-center gap-x-6 gap-y-2 mt-3 pt-3 border-t border-slate-100">
                    <div>
                      <p className="text-[10px] font-semibold text-emerald-600 uppercase tracking-[0.10em] mb-0.5">Pago manualmente</p>
                      <p className="text-[13px] font-medium text-slate-800 whitespace-nowrap">
                        {MANUAL_METHOD_LABELS[row.manualMethod] ?? row.manualMethod}
                        {row.paidAt && <span className="text-slate-500"> · {formatDateTime(row.paidAt)}</span>}
                        <span className="text-slate-500"> · {formatBRL(row.amount)}</span>
                      </p>
                    </div>
                    {row.manualNote && (
                      <div className="min-w-0">
                        <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-[0.10em] mb-0.5">Observação interna</p>
                        <p className="text-[13px] text-slate-700 truncate max-w-[420px]">{row.manualNote}</p>
                      </div>
                    )}
                    {row.receiptPath && <ReceiptLink receiptPath={row.receiptPath} />}
                  </div>
                )}

              </div>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3.5 border-t border-admin-border bg-slate-50/30">
              <p className="text-[12px] text-slate-500">
                Página {safePage} de {totalPages}
              </p>
              <div className="flex items-center gap-2">
                <PageLink href={pageHref(safePage - 1)} disabled={safePage <= 1}>← Anterior</PageLink>
                <PageLink href={pageHref(safePage + 1)} disabled={safePage >= totalPages}>Próxima →</PageLink>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function PageLink({ href, disabled, children }: { href: string; disabled: boolean; children: React.ReactNode }) {
  if (disabled) {
    return (
      <span className="text-[12px] font-semibold text-slate-300 px-3 py-1.5 cursor-not-allowed">
        {children}
      </span>
    )
  }
  return (
    <Link href={href} className="text-[12px] font-semibold text-admin-sidebar-act hover:text-admin-sidebar px-3 py-1.5 rounded-lg hover:bg-white transition-colors">
      {children}
    </Link>
  )
}
