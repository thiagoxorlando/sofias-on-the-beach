import type { Metadata } from 'next'
import { notFound, redirect } from 'next/navigation'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireAdmin } from '@/lib/auth'
import { canAccessModule } from '@/lib/permissions'
import { getSiteSettings } from '@/lib/settings'
import { PAYMENT_LABELS, STATUS_LABELS } from '../../_components/badges'
import { PrintButton } from './_components/PrintButton'

export const metadata: Metadata = { title: "Ficha de hóspede — Painel Sofia's" }

function formatDate(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number)
  return `${String(d).padStart(2, '0')}/${String(m).padStart(2, '0')}/${y}`
}

function formatBRL(value: number): string {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(value)
}

type GuestJoin = { full_name: string; email: string; phone: string | null; cpf: string | null; nationality: string }
type CategoryJoin = { name: string }
type RoomJoin = { name: string; room_categories: CategoryJoin | CategoryJoin[] | null }

function one<T>(rel: T | T[] | null): T | null {
  if (!rel) return null
  return Array.isArray(rel) ? (rel[0] ?? null) : rel
}

export default async function ReservationPrintPage({ params }: { params: Promise<{ id: string }> }) {
  // Mirrors the dual-module guard on the reservation detail page: reception
  // needs to print guest forms (their core front-desk task) without holding
  // the full 'reservations' module, and reservations staff need it too.
  const admin = await requireAdmin()
  if (!canAccessModule(admin.role, 'reservations') && !canAccessModule(admin.role, 'reception')) {
    redirect('/dashboard')
  }

  const { id } = await params
  const db = createAdminClient()

  const [{ data: reservation }, settings] = await Promise.all([
    db
      .from('reservations')
      .select(`
        id, token, status, check_in, check_out, adults, children,
        total_brl, special_requests, created_at,
        guests ( full_name, email, phone, cpf, nationality ),
        rooms ( name, room_categories ( name ) )
      `)
      .eq('id', id)
      .maybeSingle(),
    getSiteSettings(),
  ])

  if (!reservation) notFound()

  const guest = one(reservation.guests as GuestJoin | GuestJoin[] | null)
  const room = one(reservation.rooms as RoomJoin | RoomJoin[] | null)
  const category = room ? one(room.room_categories) : null

  const { data: relevantPayment } = await db
    .from('payments')
    .select('status')
    .eq('reservation_id', id)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8 max-w-3xl print:max-w-none print:px-0 print:py-0">

      <div className="mb-6 flex items-center justify-between print:hidden">
        <p className="text-[13px] text-slate-500">
          Ficha de registro do hóspede — pronta para impressão (A4).
        </p>
        <PrintButton />
      </div>

      {/* ── Printable sheet ──────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-admin-border shadow-sm p-8 print:rounded-none print:border-0 print:p-0 print:text-black">

        {/* Brand header */}
        <div className="flex items-center justify-between gap-4 pb-5 border-b-2 border-admin-sidebar print:border-black">
          <div className="flex items-center gap-3">
            <SofiasMark className="w-10 h-10 text-admin-sidebar print:text-black shrink-0" />
            <div className="leading-none">
              <p className="text-[22px] font-bold text-slate-800 print:text-black leading-none">
                {settings.businessName}
              </p>
              <p className="text-[10px] font-semibold text-slate-500 print:text-neutral-600 uppercase tracking-[0.18em] mt-1">
                Ficha de registro do hóspede
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-[10px] font-bold text-slate-400 print:text-neutral-500 uppercase tracking-[0.12em]">Reserva</p>
            <p className="font-mono text-[16px] font-bold text-slate-800 print:text-black">{reservation.token}</p>
          </div>
        </div>

        {/* Guest */}
        <Section title="Dados do hóspede">
          <Grid>
            <PField label="Nome completo" value={guest?.full_name ?? '—'} />
            <PField label="Nacionalidade" value={guest?.nationality ?? '—'} />
            <PField label="E-mail" value={guest?.email ?? '—'} />
            <PField label="Telefone" value={guest?.phone ?? '—'} />
            <PField label="CPF / Passaporte" value={guest?.cpf ?? '—'} />
          </Grid>
        </Section>

        {/* Stay */}
        <Section title="Estadia">
          <Grid>
            <PField label="Quarto" value={room ? `${room.name}${category ? ` — ${category.name}` : ''}` : '—'} />
            <PField label="Check-in" value={formatDate(reservation.check_in)} />
            <PField label="Check-out" value={formatDate(reservation.check_out)} />
            <PField label="Hóspedes" value={`${reservation.adults} adulto${reservation.adults !== 1 ? 's' : ''}${reservation.children > 0 ? ` + ${reservation.children} criança${reservation.children !== 1 ? 's' : ''}` : ''}`} />
            <PField label="Status da reserva" value={STATUS_LABELS[reservation.status] ?? reservation.status} />
          </Grid>
        </Section>

        {/* Payment */}
        <Section title="Pagamento">
          <Grid>
            <PField label="Valor total da reserva" value={formatBRL(reservation.total_brl)} />
            <PField label="Status do pagamento" value={relevantPayment ? (PAYMENT_LABELS[relevantPayment.status] ?? relevantPayment.status) : 'Sem pagamento registrado'} />
          </Grid>
        </Section>

        {/* Special requests */}
        {reservation.special_requests && (
          <Section title="Pedidos especiais">
            <p className="text-[13px] text-slate-700 print:text-black leading-relaxed">{reservation.special_requests}</p>
          </Section>
        )}

        {/* House rules / cancellation policy */}
        {(settings.cancellationPolicy || settings.checkInTime || settings.checkOutTime) && (
          <Section title="Política da casa">
            <div className="text-[12px] text-slate-600 print:text-neutral-700 leading-relaxed space-y-1.5">
              <p>Check-in a partir das {settings.checkInTime} · Check-out até às {settings.checkOutTime}</p>
              {settings.cancellationPolicy && <p>{settings.cancellationPolicy}</p>}
            </div>
          </Section>
        )}

        {/* Reception notes (handwritten) */}
        <Section title="Notas da recepção">
          <div className="space-y-3 pt-1">
            <div className="border-b border-slate-200 print:border-neutral-400 h-7" />
            <div className="border-b border-slate-200 print:border-neutral-400 h-7" />
            <div className="border-b border-slate-200 print:border-neutral-400 h-7" />
          </div>
        </Section>

        {/* Signature */}
        <div className="grid grid-cols-2 gap-10 mt-10 pt-6">
          <div>
            <div className="border-b border-slate-300 print:border-black h-12" />
            <p className="text-[11px] text-slate-500 print:text-neutral-600 mt-1.5">Assinatura do hóspede</p>
          </div>
          <div>
            <div className="border-b border-slate-300 print:border-black h-12" />
            <p className="text-[11px] text-slate-500 print:text-neutral-600 mt-1.5">Data</p>
          </div>
        </div>

        <p className="text-[10px] text-slate-400 print:text-neutral-500 text-center mt-10 pt-4 border-t border-slate-100 print:border-neutral-300">
          {settings.businessName} · Ficha gerada em {formatDate(new Date().toISOString().slice(0, 10))} · Reserva {reservation.token}
        </p>
      </div>
    </div>
  )
}

// ─── Layout helpers ───────────────────────────────────────────────────────────

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-6 print:mt-5 print:break-inside-avoid">
      <h2 className="text-[11px] font-bold text-slate-500 print:text-neutral-600 uppercase tracking-[0.14em] mb-3 pb-1.5 border-b border-slate-100 print:border-neutral-300">
        {title}
      </h2>
      {children}
    </section>
  )
}

function Grid({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-3.5">{children}</div>
}

function PField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[9px] font-bold text-slate-400 print:text-neutral-500 uppercase tracking-[0.10em] mb-1">{label}</p>
      <p className="text-[13px] font-medium text-slate-800 print:text-black">{value}</p>
    </div>
  )
}

function SofiasMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 40" fill="none" className={className} aria-hidden="true">
      <path d="M10 36 L10 20 A10 10 0 0 1 30 20 L30 36" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M4 38 Q12 34 20 38 T36 38" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  )
}
