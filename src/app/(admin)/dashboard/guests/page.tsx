import type { Metadata } from 'next'
import Link from 'next/link'
import { createAdminClient } from '@/lib/supabase/admin'
import { GuestsSearch } from './_components/GuestsSearch'

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
    <div className="px-4 sm:px-6 lg:px-8 py-8 max-w-7xl">
      <div className="mb-6">
        <h1 className="font-serif text-[28px] font-bold text-ocean-900">Hóspedes</h1>
        <p className="text-[14px] text-ocean-500 mt-1">
          {filtered.length} hóspede{filtered.length !== 1 ? 's' : ''} encontrado{filtered.length !== 1 ? 's' : ''}
          {filtered.length !== all.length ? ` de ${all.length} no total` : ''}
        </p>
      </div>

      <GuestsSearch />

      {pageRows.length === 0 ? (
        <div className="bg-white rounded-[18px] border border-ocean-100 py-14 text-center text-[13px] text-ocean-400">
          Nenhum hóspede encontrado com os filtros atuais.
        </div>
      ) : (
        <div className="bg-white rounded-[18px] border border-ocean-100 overflow-hidden">
          <div className="divide-y divide-ocean-50">
            {pageRows.map((row) => (
              <div key={row.id} className="px-4 sm:px-5 py-4 hover:bg-ocean-50/30 transition-colors">

                {/* Row 1 — identity */}
                <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                  <span className="font-semibold text-ocean-900 text-[14px]">{row.fullName}</span>
                  <span className="text-[12px] text-ocean-400">{row.email}</span>
                  {row.phone && <span className="text-[12px] text-ocean-400">{row.phone}</span>}
                  {row.cpf && <span className="text-[12px] text-ocean-400">CPF {row.cpf}</span>}
                  <span className="sm:ml-auto text-[11px] text-ocean-400">cadastrado em {formatDateTime(row.createdAt)}</span>
                </div>

                {/* Row 2 — stats */}
                <div className="flex flex-wrap items-center gap-x-6 gap-y-3 mt-3 pt-3 border-t border-ocean-50">
                  <div>
                    <p className="text-[10px] font-bold text-ocean-400 uppercase tracking-[0.10em] mb-0.5">Reservas</p>
                    <p className="text-[13px] font-medium text-ocean-900">{row.reservationCount}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-ocean-400 uppercase tracking-[0.10em] mb-0.5">Total gasto</p>
                    <p className="text-[13px] font-bold text-ocean-900 whitespace-nowrap">{formatBRL(row.totalSpent)}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-ocean-400 uppercase tracking-[0.10em] mb-0.5">Última estadia</p>
                    <p className="text-[13px] font-medium text-ocean-700 whitespace-nowrap">
                      {row.lastStay ? formatDate(row.lastStay) : '—'}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-ocean-400 uppercase tracking-[0.10em] mb-0.5">Próxima estadia</p>
                    <p className={`text-[13px] font-medium whitespace-nowrap ${row.nextStay ? 'text-emerald-700' : 'text-ocean-400'}`}>
                      {row.nextStay ? formatDate(row.nextStay) : '—'}
                    </p>
                  </div>
                  <Link
                    href={`/dashboard/guests/${row.id}`}
                    className="sm:ml-auto text-ocean-600 hover:text-ocean-900 text-[12px] font-semibold transition-colors whitespace-nowrap"
                  >
                    Ver detalhes →
                  </Link>
                </div>

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
