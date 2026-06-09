import type { Metadata } from 'next'
import Link from 'next/link'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireModule } from '@/lib/auth'
import { GuestsSearch } from './_components/GuestsSearch'
import { GuestListManager } from './_components/GuestListManager'
import {
  AdminPageHeader,
  AdminStatCard,
  AdminEmptyState,
} from '@/components/admin/AdminUI'

export const metadata: Metadata = { title: "Hóspedes — Painel Sofia's" }

const PAGE_SIZE = 20

type PaymentJoin = { amount_brl: number; status: string }
type ReservationJoin = {
  id: string
  status: string
  check_in: string
  check_out: string
  total_brl: number
  payments: PaymentJoin[] | null
}

type GuestRow = {
  id: string
  full_name: string
  email: string
  phone: string | null
  cpf: string | null
  created_at: string
  reservations: ReservationJoin[] | null
}

type Row = {
  id: string
  fullName: string
  email: string
  phone: string | null
  cpf: string | null
  createdAt: string
  reservationCount: number
  totalSpent: number
  lastStay: string | null
  nextStay: string | null
}

function todayISO(): string {
  return new Date().toISOString().slice(0, 10)
}

function formatBRL(value: number): string {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(value)
}

// Reservation count and money figures count every booking ever made;
// "last"/"next" stay are derived from check-out vs. today, excluding
// cancelled reservations (which never represent an actual stay).
function summarize(reservations: ReservationJoin[] | null): {
  reservationCount: number
  totalSpent: number
  lastStay: string | null
  nextStay: string | null
} {
  const all = reservations ?? []
  const today = todayISO()

  const totalSpent = all.reduce((sum, r) => {
    const paid = (r.payments ?? [])
      .filter((p) => p.status === 'paid')
      .reduce((s, p) => s + p.amount_brl, 0)
    return sum + paid
  }, 0)

  const real = all.filter((r) => r.status !== 'cancelled')
  const past = real.filter((r) => r.check_out <= today).sort((a, b) => b.check_out.localeCompare(a.check_out))
  const upcoming = real.filter((r) => r.check_out > today).sort((a, b) => a.check_in.localeCompare(b.check_in))

  return {
    reservationCount: all.length,
    totalSpent,
    lastStay: past[0]?.check_out ?? null,
    nextStay: upcoming[0]?.check_in ?? null,
  }
}

type SP = Promise<{ q?: string; page?: string }>

export default async function GuestsPage({ searchParams }: { searchParams: SP }) {
  const admin = await requireModule('guests')
  const isAdmin = admin.role === 'admin' || admin.role === 'super_admin'

  const sp = await searchParams
  const q = (sp.q ?? '').trim().toLowerCase()
  const page = Math.max(1, parseInt(sp.page ?? '1', 10) || 1)

  const db = createAdminClient()
  const { data } = await db
    .from('guests')
    .select(`
      id, full_name, email, phone, cpf, created_at,
      reservations ( id, status, check_in, check_out, total_brl, payments ( amount_brl, status ) )
    `)
    .order('created_at', { ascending: false })
    .returns<GuestRow[]>()

  const all: Row[] = (data ?? []).map((g) => {
    const stats = summarize(g.reservations)
    return {
      id:        g.id,
      fullName:  g.full_name,
      email:     g.email,
      phone:     g.phone,
      cpf:       g.cpf,
      createdAt: g.created_at,
      ...stats,
    }
  })

  const filtered = q
    ? all.filter((row) => {
        const haystack = `${row.fullName} ${row.email} ${row.phone ?? ''} ${row.cpf ?? ''}`.toLowerCase()
        return haystack.includes(q)
      })
    : all

  const now = new Date()
  const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  const summary = {
    total:        all.length,
    withNextStay: all.filter((row) => row.nextStay !== null).length,
    totalSpent:   all.reduce((sum, row) => sum + row.totalSpent, 0),
    newThisMonth: all.filter((row) => row.createdAt.slice(0, 7) === monthStart).length,
  }

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const safePage = Math.min(page, totalPages)
  const pageRows = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE)

  function pageHref(p: number): string {
    const params = new URLSearchParams()
    if (q)     params.set('q', sp.q ?? '')
    if (p > 1) params.set('page', String(p))
    const qs = params.toString()
    return qs ? `/dashboard/guests?${qs}` : '/dashboard/guests'
  }

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8 max-w-7xl space-y-6">

      <AdminPageHeader
        eyebrow="Relacionamento"
        title="Hóspedes"
        subtitle={`${filtered.length} hóspede${filtered.length !== 1 ? 's' : ''} encontrado${filtered.length !== 1 ? 's' : ''}${filtered.length !== all.length ? ` de ${all.length} no total` : ''}.`}
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <AdminStatCard label="Total de hóspedes" value={summary.total} tone="navy"
          icon={<svg viewBox="0 0 24 24" fill="none" stroke="#061A2A" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5" aria-hidden="true"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx={9} cy={7} r={4} /><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" /></svg>}
        />
        <AdminStatCard label="Com próxima estadia" value={summary.withNextStay} tone="success"
          icon={<svg viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5" aria-hidden="true"><rect x={3} y={4} width={18} height={18} rx={2} /><line x1={16} y1={2} x2={16} y2={6} /><line x1={8} y1={2} x2={8} y2={6} /><line x1={3} y1={10} x2={21} y2={10} /></svg>}
        />
        <AdminStatCard label="Total gasto registrado" value={formatBRL(summary.totalSpent)} tone="info"
          icon={<svg viewBox="0 0 24 24" fill="none" stroke="#0284C7" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5" aria-hidden="true"><circle cx={12} cy={12} r={9} /><path d="M14.5 9a3 3 0 0 0-5 2.2c0 2.4 5 3.8 5 6a3 3 0 0 1-5 2.1" /><line x1={12} y1={6} x2={12} y2={8} /><line x1={12} y1={19} x2={12} y2={21} /></svg>}
        />
        <AdminStatCard label="Novos este mês" value={summary.newThisMonth} tone="neutral"
          icon={<svg viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5" aria-hidden="true"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx={9} cy={7} r={4} /><line x1={19} y1={8} x2={19} y2={14} /><line x1={22} y1={11} x2={16} y2={11} /></svg>}
        />
      </div>

      <GuestsSearch />

      {pageRows.length === 0 ? (
        <AdminEmptyState>Nenhum hóspede encontrado com os filtros atuais.</AdminEmptyState>
      ) : (
        <>
          <GuestListManager
            rows={pageRows.map((r) => ({ ...r, totalSpent: formatBRL(r.totalSpent) }))}
            isAdmin={isAdmin}
          />

          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3.5 rounded-[18px] border border-admin-border bg-white">
              <p className="text-[12px] text-slate-500">
                Página {safePage} de {totalPages}
              </p>
              <div className="flex items-center gap-2">
                <PageLink href={pageHref(safePage - 1)} disabled={safePage <= 1}>← Anterior</PageLink>
                <PageLink href={pageHref(safePage + 1)} disabled={safePage >= totalPages}>Próxima →</PageLink>
              </div>
            </div>
          )}
        </>
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
    <Link href={href} className="text-[12px] font-semibold text-admin-sidebar-act hover:text-admin-sidebar px-3 py-1.5 rounded-lg hover:bg-slate-50 transition-colors">
      {children}
    </Link>
  )
}
