import Link from 'next/link'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireModule } from '@/lib/auth'

export const metadata = { title: "Visão geral — Painel Sofia's" }

function todayISO(): string {
  return new Date().toISOString().slice(0, 10)
}

async function loadCounts() {
  const db = createAdminClient()
  const today = todayISO()

  const [rooms, upcoming, guests, pendingPayments, manualBlocks] = await Promise.all([
    db.from('rooms').select('id', { count: 'exact', head: true }).eq('is_active', true),
    db.from('reservations').select('id', { count: 'exact', head: true })
      .gte('check_out', today).neq('status', 'cancelled'),
    db.from('guests').select('id', { count: 'exact', head: true }),
    db.from('payments').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
    db.from('room_availability').select('id', { count: 'exact', head: true })
      .gte('date', today).is('reservation_id', null),
  ])

  return {
    rooms:           rooms.count ?? 0,
    upcoming:        upcoming.count ?? 0,
    guests:          guests.count ?? 0,
    pendingPayments: pendingPayments.count ?? 0,
    manualBlocks:    manualBlocks.count ?? 0,
  }
}

export default async function DashboardOverviewPage() {
  await requireModule('overview')

  const counts = await loadCounts()

  const OVERVIEW_CARDS = [
    {
      href:     '/dashboard/rooms',
      label:    'Quartos',
      desc:     `${counts.rooms} acomodaç${counts.rooms === 1 ? 'ão ativa' : 'ões ativas'}`,
      color:    'bg-ocean-50 text-ocean-600',
      icon:     'bed',
    },
    {
      href:     '/dashboard/reservations',
      label:    'Reservas',
      desc:     `${counts.upcoming} próxima${counts.upcoming === 1 ? '' : 's'} ou em andamento`,
      color:    'bg-blue-50 text-blue-600',
      icon:     'calendar',
    },
    {
      href:     '/dashboard/guests',
      label:    'Hóspedes',
      desc:     `${counts.guests} cadastrado${counts.guests === 1 ? '' : 's'}`,
      color:    'bg-indigo-50 text-indigo-600',
      icon:     'users',
    },
    {
      href:     '/dashboard/availability',
      label:    'Disponibilidade',
      desc:     `${counts.manualBlocks} data${counts.manualBlocks === 1 ? '' : 's'} bloqueada${counts.manualBlocks === 1 ? '' : 's'} manualmente`,
      color:    'bg-sky-50 text-sky-600',
      icon:     'grid',
    },
    {
      href:     '/dashboard/payments',
      label:    'Financeiro',
      desc:     `${counts.pendingPayments} pagamento${counts.pendingPayments === 1 ? '' : 's'} pendente${counts.pendingPayments === 1 ? '' : 's'}`,
      color:    'bg-emerald-50 text-emerald-600',
      icon:     'coin',
    },
    {
      href:     '/dashboard/settings',
      label:    'Configurações',
      desc:     'Pousada, canais e geral',
      color:    'bg-slate-50 text-slate-600',
      icon:     'settings',
    },
  ]

  return (
    <div className="p-6 md:p-10">

      {/* Heading */}
      <div className="mb-8">
        <p className="text-[11px] font-bold text-ocean-600 uppercase tracking-[0.28em] mb-1.5">
          Painel Sofia&apos;s on the Beach
        </p>
        <h1 className="font-serif text-[26px] md:text-[32px] font-bold text-ocean-900 leading-tight">
          Visão geral
        </h1>
        <p className="text-[14px] text-foreground/50 mt-1.5">
          Gestão completa da pousada, reservas e hóspedes.
        </p>
      </div>

      {/* Section cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-5 max-w-3xl">
        {OVERVIEW_CARDS.map((card) => (
          <Link
            key={card.href}
            href={card.href}
            className="group bg-white rounded-2xl border border-ocean-100 p-5 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
          >
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-4 ${card.color}`}>
              <OverviewIcon name={card.icon} />
            </div>
            <p className="text-[14px] font-semibold text-ocean-900 leading-snug">
              {card.label}
            </p>
            <p className="text-[12px] text-foreground/45 mt-0.5">
              {card.desc}
            </p>
          </Link>
        ))}
      </div>

    </div>
  )
}

// ─── Icons ────────────────────────────────────────────────────────────────────

function OverviewIcon({ name }: { name: string }) {
  const cls = 'w-5 h-5'
  switch (name) {
    case 'bed':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" className={cls} aria-hidden="true">
          <path d="M2 20v-8a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v8" />
          <path d="M2 15h20M2 20h20" />
          <path d="M6 10V6a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v4" />
        </svg>
      )
    case 'calendar':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" className={cls} aria-hidden="true">
          <rect x={3} y={4} width={18} height={18} rx={2} />
          <line x1={16} y1={2} x2={16} y2={6} />
          <line x1={8} y1={2} x2={8} y2={6} />
          <line x1={3} y1={10} x2={21} y2={10} />
        </svg>
      )
    case 'users':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" className={cls} aria-hidden="true">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
          <circle cx={9} cy={7} r={4} />
          <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
      )
    case 'grid':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" className={cls} aria-hidden="true">
          <rect x={3} y={3} width={7} height={7} rx={1} />
          <rect x={14} y={3} width={7} height={7} rx={1} />
          <rect x={3} y={14} width={7} height={7} rx={1} />
          <rect x={14} y={14} width={7} height={7} rx={1} />
        </svg>
      )
    case 'coin':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" className={cls} aria-hidden="true">
          <circle cx={12} cy={12} r={9} />
          <path d="M14.5 9a3 3 0 0 0-5 2.2c0 2.4 5 3.8 5 6a3 3 0 0 1-5 2.1" />
          <line x1={12} y1={6} x2={12} y2={8} />
          <line x1={12} y1={19} x2={12} y2={21} />
        </svg>
      )
    case 'settings':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" className={cls} aria-hidden="true">
          <circle cx={12} cy={12} r={3} />
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
        </svg>
      )
    default:
      return null
  }
}
