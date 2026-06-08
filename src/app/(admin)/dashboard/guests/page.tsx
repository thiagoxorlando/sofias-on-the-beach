import type { Metadata } from 'next'
import Link from 'next/link'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireModule } from '@/lib/auth'
import { GuestsSearch } from './_components/GuestsSearch'
import {
  AdminPageHeader,
  AdminStatCard,
  AdminListCard,
  AdminEmptyState,
  AdminActionButton,
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

function formatDate(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number)
  return `${String(d).padStart(2, '0')}/${String(m).padStart(2, '0')}/${y}`
}

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })
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
  await requireModule('guests')

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
        <AdminStatCard label="Total de hóspedes" value={summary.total} tone="navy" />
        <AdminStatCard label="Com próxima estadia" value={summary.withNextStay} tone="success" />
        <AdminStatCard label="Total gasto registrado" value={formatBRL(summary.totalSpent)} tone="info" />
        <AdminStatCard label="Novos este mês" value={summary.newThisMonth} tone="neutral" />
      </div>

      <GuestsSearch />

      {pageRows.length === 0 ? (
        <AdminEmptyState>Nenhum hóspede encontrado com os filtros atuais.</AdminEmptyState>
      ) : (
        <>
          <div className="space-y-3">
            {pageRows.map((row) => (
              <AdminListCard
                key={row.id}
                title={row.fullName}
                titleMeta={`${row.email}${row.phone ? ` · ${row.phone}` : ''}${row.cpf ? ` · CPF ${row.cpf}` : ''} · cadastrado em ${formatDateTime(row.createdAt)}`}
                fields={[
                  { label: 'Reservas', value: String(row.reservationCount) },
                  { label: 'Total gasto', value: formatBRL(row.totalSpent) },
                  { label: 'Última estadia', value: row.lastStay ? formatDate(row.lastStay) : '—' },
                  {
                    label: 'Próxima estadia',
                    value: (
                      <span className={row.nextStay ? 'text-emerald-700' : 'text-ocean-400'}>
                        {row.nextStay ? formatDate(row.nextStay) : '—'}
                      </span>
                    ),
                  },
                ]}
                actions={
                  <div className="flex items-center justify-end">
                    <AdminActionButton href={`/dashboard/guests/${row.id}`} variant="link">
                      Ver detalhes →
                    </AdminActionButton>
                  </div>
                }
              />
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3.5 rounded-[18px] border border-ocean-100 bg-white">
              <p className="text-[12px] text-ocean-500">
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
