import type { Metadata } from 'next'
import Link from 'next/link'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireModule } from '@/lib/auth'
import { PaymentsFilters } from './_components/PaymentsFilters'
import { PaymentRowActions } from './_components/PaymentRowActions'
import { ReceiptLink } from './_components/ReceiptLink'
import { PaymentStatusBadge } from '../reservations/_components/badges'

export const metadata: Metadata = { title: "Financeiro — Painel Sofia's" }

const PAGE_SIZE = 20
const CARD = 'bg-white rounded-[18px] border border-ocean-100'

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
// per spec, that's the sole source of truth for actual received revenue. Pending
// and overdue are grouped together in the "pendentes" card since both represent
// money staff still needs to follow up on; failed/cancelled/refunded are grouped
// as charges that did not (or no longer) result in revenue.
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

  // Server-only env check, mirrors src/app/(admin)/dashboard/settings/page.tsx —
  // never expose the key itself, only whether it's set.
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
    <div className="px-4 sm:px-6 lg:px-8 py-8 max-w-7xl">
      <div className="mb-6">
        <h1 className="font-serif text-[28px] font-bold text-ocean-900">Financeiro</h1>
        <p className="text-[14px] text-ocean-500 mt-1">
          {filtered.length} pagamento{filtered.length !== 1 ? 's' : ''} encontrado{filtered.length !== 1 ? 's' : ''}
          {filtered.length !== all.length ? ` de ${all.length} no total` : ''}
        </p>
      </div>

      {!asaasConfigured && (
        <p className="text-[12px] text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 mb-6 leading-relaxed">
          Asaas não configurado — usando pagamentos manuais/WhatsApp. Confirme os recebimentos manualmente
          abaixo conforme o pagamento chega (PIX direto, dinheiro, transferência, máquina de cartão).
        </p>
      )}

      {/* Overview */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 mb-6">
        <StatCard label="Total recebido" value={formatBRL(stats.totalReceived)} tone="emerald" />
        <StatCard label="Recebido este mês" value={formatBRL(stats.monthRevenue)} tone="ocean" />
        <StatCard label="Recebido hoje" value={formatBRL(stats.todayRevenue)} tone="ocean" />
        <StatCard label="Pendente / vencido" value={String(stats.pendingCount)} tone="amber" />
        <StatCard label="Pagamentos pagos" value={String(stats.paidCount)} tone="emerald" />
        <StatCard label="Falhos / cancelados / estornados" value={String(stats.failedCount)} tone="slate" />
        <StatCard label="Pagamentos manuais" value={String(stats.manualCount)} tone="ocean" />
      </div>

      <PaymentsFilters />

      {pageRows.length === 0 ? (
        <div className={`${CARD} py-14 text-center text-[13px] text-ocean-400`}>
          Nenhum pagamento encontrado com os filtros atuais.
        </div>
      ) : (
        <div className={`${CARD} overflow-hidden`}>
          <div className="divide-y divide-ocean-50">
            {pageRows.map((row) => (
              <div key={row.id} className="px-4 sm:px-5 py-4 hover:bg-ocean-50/30 transition-colors">

                {/* Top line — guest + reservation + status */}
                <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                  <span className="font-semibold text-ocean-900 text-[14px]">{row.guestName}</span>
                  <span className="text-[12px] text-ocean-400">{row.guestEmail}</span>
                  {row.guestPhone && <span className="text-[12px] text-ocean-400">{row.guestPhone}</span>}
                  <span className="font-mono text-[11px] text-ocean-500">{row.token}</span>
                  <PaymentStatusBadge status={row.status} className="sm:ml-auto" />
                </div>

                {/* Second line — room, dates, method, amount, dates */}
                <div className="flex flex-wrap items-center gap-x-6 gap-y-3 mt-3 pt-3 border-t border-ocean-50">
                  <div className="min-w-0">
                    <p className="text-[10px] font-bold text-ocean-400 uppercase tracking-[0.10em] mb-0.5">Quarto</p>
                    <p className="text-[13px] font-medium text-ocean-900 truncate">{row.roomName}</p>
                  </div>
                  {row.checkIn && row.checkOut && (
                    <div>
                      <p className="text-[10px] font-bold text-ocean-400 uppercase tracking-[0.10em] mb-0.5">Check-in / Check-out</p>
                      <p className="text-[13px] font-medium text-ocean-700 whitespace-nowrap">
                        {formatDate(row.checkIn)} <span className="text-ocean-300">→</span> {formatDate(row.checkOut)}
                      </p>
                    </div>
                  )}
                  <div>
                    <p className="text-[10px] font-bold text-ocean-400 uppercase tracking-[0.10em] mb-0.5">Método</p>
                    <p className="text-[13px] font-medium text-ocean-700">{METHOD_LABELS[row.method] ?? row.method}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-ocean-400 uppercase tracking-[0.10em] mb-0.5">Valor</p>
                    <p className="text-[13px] font-bold text-ocean-900 whitespace-nowrap">{formatBRL(row.amount)}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-ocean-400 uppercase tracking-[0.10em] mb-0.5">Criado / Pago</p>
                    <p className="text-[13px] font-medium text-ocean-700 whitespace-nowrap">
                      {formatDateTime(row.createdAt)}
                      {row.paidAt && <span className="text-emerald-600"> · pago {formatDateTime(row.paidAt)}</span>}
                    </p>
                  </div>
                  {row.asaasPaymentId && (
                    <div className="min-w-0">
                      <p className="text-[10px] font-bold text-ocean-400 uppercase tracking-[0.10em] mb-0.5">Asaas</p>
                      <p className="font-mono text-[11px] text-ocean-500 truncate">{row.asaasPaymentId}</p>
                    </div>
                  )}
                  <Link
                    href={`/dashboard/reservations/${row.reservationId}`}
                    className="sm:ml-auto text-ocean-600 hover:text-ocean-900 text-[12px] font-semibold transition-colors whitespace-nowrap"
                  >
                    Ver reserva →
                  </Link>
                </div>

                {/* Actions — Asaas link + manual status corrections */}
                {(row.invoiceUrl || row.status === 'pending' || row.status === 'overdue') && (
                  <div className="flex flex-wrap items-center gap-3 mt-3 pt-3 border-t border-ocean-50">
                    {row.invoiceUrl && (
                      <a
                        href={row.invoiceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[12px] font-semibold text-ocean-600 hover:text-ocean-900 transition-colors whitespace-nowrap"
                      >
                        Ver cobrança no Asaas →
                      </a>
                    )}
                    <PaymentRowActions paymentId={row.id} amount={row.amount} status={row.status} />
                  </div>
                )}

                {/* Manual payment confirmation info */}
                {row.manualMethod && (
                  <div className="flex flex-wrap items-center gap-x-6 gap-y-2 mt-3 pt-3 border-t border-ocean-50">
                    <div>
                      <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-[0.10em] mb-0.5">Pago manualmente</p>
                      <p className="text-[13px] font-medium text-ocean-900 whitespace-nowrap">
                        {MANUAL_METHOD_LABELS[row.manualMethod] ?? row.manualMethod}
                        {row.paidAt && <span className="text-ocean-500"> · {formatDateTime(row.paidAt)}</span>}
                        <span className="text-ocean-500"> · {formatBRL(row.amount)}</span>
                      </p>
                    </div>
                    {row.manualNote && (
                      <div className="min-w-0">
                        <p className="text-[10px] font-bold text-ocean-400 uppercase tracking-[0.10em] mb-0.5">Observação interna</p>
                        <p className="text-[13px] text-ocean-700 truncate max-w-[420px]">{row.manualNote}</p>
                      </div>
                    )}
                    {row.receiptPath && <ReceiptLink receiptPath={row.receiptPath} />}
                  </div>
                )}

              </div>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3.5 border-t border-ocean-100 bg-ocean-50/30">
              <p className="text-[12px] text-ocean-500">
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

const STAT_TONES: Record<string, string> = {
  emerald: 'text-emerald-700',
  ocean:   'text-ocean-900',
  amber:   'text-amber-700',
  slate:   'text-slate-500',
}

function StatCard({ label, value, tone }: { label: string; value: string; tone: keyof typeof STAT_TONES }) {
  return (
    <div className={`${CARD} p-4 md:p-5`}>
      <p className="text-[10px] font-bold text-ocean-400 uppercase tracking-[0.10em] mb-1.5">{label}</p>
      <p className={`font-serif text-[20px] md:text-[22px] font-bold whitespace-nowrap ${STAT_TONES[tone]}`}>{value}</p>
    </div>
  )
}

function PageLink({ href, disabled, children }: { href: string; disabled: boolean; children: React.ReactNode }) {
  if (disabled) {
    return (
      <span className="text-[12px] font-semibold text-ocean-300 px-3 py-1.5 cursor-not-allowed">
        {children}
      </span>
    )
  }
  return (
    <Link href={href} className="text-[12px] font-semibold text-ocean-600 hover:text-ocean-900 px-3 py-1.5 rounded-lg hover:bg-white transition-colors">
      {children}
    </Link>
  )
}
