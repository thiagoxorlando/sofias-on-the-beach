import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { signOutAction } from './actions'

export const metadata = { title: "Painel — Sofia's on the Beach" }

const ROLE_LABEL: Record<string, string> = {
  super_admin: 'Super Admin',
  admin:       'Administrador',
  staff:       'Equipe',
}

export default async function DashboardPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  // Use service role to bypass RLS — server-only, never reaches the browser
  const adminDb = createAdminClient()
  const { data: adminUser } = await adminDb
    .from('admin_users')
    .select('email, full_name, role, is_active')
    .eq('id', user.id)
    .single()

  // Three distinct states
  const notInTable = adminUser === null
  const isDeactivated = adminUser !== null && adminUser.is_active === false
  const hasAccess = adminUser !== null && adminUser.is_active === true

  return (
    <div className="min-h-screen bg-ocean-50/40">

      {/* ── Top bar — always visible ── */}
      <header className="bg-white border-b border-ocean-100 px-6 md:px-10 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <SofiasMark className="w-7 h-7 text-ocean-600 shrink-0" />
          <div className="leading-none">
            <p className="font-serif text-[16px] font-bold text-ocean-900 leading-none">
              SOFIA&apos;S
            </p>
            <p className="text-[8px] font-semibold text-ocean-500 uppercase tracking-[0.18em] mt-0.5">
              painel de gestão
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {hasAccess && (
            <div className="hidden sm:flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-ocean-100 flex items-center justify-center shrink-0">
                <UserIcon className="w-3.5 h-3.5 text-ocean-600" />
              </div>
              <div className="leading-none">
                <p className="text-[12px] font-semibold text-ocean-900">
                  {adminUser.full_name}
                </p>
                <p className="text-[10px] text-ocean-500 mt-0.5">
                  {adminUser.email} · {ROLE_LABEL[adminUser.role] ?? adminUser.role}
                </p>
              </div>
            </div>
          )}
          <form action={signOutAction}>
            <button
              type="submit"
              className="text-[12px] font-semibold text-ocean-700 hover:text-ocean-900 border border-ocean-200 hover:border-ocean-400 px-4 py-2 rounded-xl transition-colors"
            >
              Sair
            </button>
          </form>
        </div>
      </header>

      {/* ── Not in admin_users ── */}
      {notInTable && (
        <AccessDenied
          icon="lock"
          title="Acesso não encontrado"
          message="Sua conta ainda não tem acesso ao painel."
          detail={user.email ?? ''}
        />
      )}

      {/* ── In admin_users but deactivated ── */}
      {isDeactivated && (
        <AccessDenied
          icon="ban"
          title="Conta desativada"
          message="Sua conta está desativada. Entre em contato com o administrador."
          detail={adminUser.email}
        />
      )}

      {/* ── Dashboard content ── */}
      {hasAccess && (
        <main className="max-w-7xl mx-auto px-6 md:px-10 py-10">

          <div className="mb-10">
            <p className="text-[11px] font-bold text-ocean-600 uppercase tracking-[0.28em] mb-2">
              Bem-vindo, {adminUser.full_name}
            </p>
            <h1 className="font-serif text-[28px] md:text-[34px] font-bold text-ocean-900 leading-tight">
              Painel Sofia&apos;s on the Beach
            </h1>
            <p className="text-[14px] text-foreground/55 mt-1.5">
              Gestão da pousada, reservas e quartos
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            {PLACEHOLDER_CARDS.map((card) => (
              <div
                key={card.label}
                className="bg-white rounded-2xl border border-ocean-100 p-6 shadow-sm"
              >
                <div className="w-9 h-9 rounded-xl bg-ocean-50 flex items-center justify-center mb-4">
                  <card.Icon className="w-4.5 h-4.5 text-ocean-600" />
                </div>
                <p className="text-[13px] font-semibold text-ocean-900 leading-snug">
                  {card.label}
                </p>
                <p className="text-[11px] text-ocean-400 mt-1 uppercase tracking-[0.08em]">
                  {card.sublabel}
                </p>
              </div>
            ))}
          </div>

          <p className="text-[11px] text-foreground/35 mt-10 text-center uppercase tracking-[0.12em]">
            Funcionalidades completas em breve
          </p>
        </main>
      )}
    </div>
  )
}

// ─── Access denied helper ─────────────────────────────────────────────────────

function AccessDenied({
  icon,
  title,
  message,
  detail,
}: {
  icon: 'lock' | 'ban'
  title: string
  message: string
  detail: string
}) {
  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-64px)] px-6">
      <div className="text-center max-w-sm">
        <div className="w-14 h-14 rounded-2xl bg-ocean-100 flex items-center justify-center mx-auto mb-5">
          {icon === 'lock' ? (
            <LockIcon className="w-6 h-6 text-ocean-600" />
          ) : (
            <BanIcon className="w-6 h-6 text-ocean-600" />
          )}
        </div>
        <h1 className="font-serif text-[22px] font-bold text-ocean-900 mb-2">{title}</h1>
        <p className="text-[14px] text-foreground/60 leading-relaxed">{message}</p>
        <p className="text-[12px] text-ocean-500 mt-4">{detail}</p>
      </div>
    </div>
  )
}

// ─── Placeholder cards ────────────────────────────────────────────────────────

const PLACEHOLDER_CARDS = [
  { label: 'Quartos',    sublabel: 'Gestão de acomodações',  Icon: BedIcon      },
  { label: 'Reservas',  sublabel: 'Calendário e bookings',   Icon: CalendarIcon },
  { label: 'Hóspedes',  sublabel: 'Cadastro e histórico',    Icon: UsersIcon    },
  { label: 'Financeiro', sublabel: 'Pagamentos e receita',   Icon: CoinIcon     },
]

// ─── Icons ────────────────────────────────────────────────────────────────────

function SofiasMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 40" fill="none" className={className} aria-hidden="true">
      <path d="M10 36 L10 20 A10 10 0 0 1 30 20 L30 36" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M4 38 Q12 34 20 38 T36 38" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  )
}

function UserIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <circle cx={12} cy={8} r={4} />
      <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
    </svg>
  )
}

function LockIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <rect x={3} y={11} width={18} height={11} rx={2} />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  )
}

function BanIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <circle cx={12} cy={12} r={9} />
      <line x1={4.9} y1={4.9} x2={19.1} y2={19.1} />
    </svg>
  )
}

function BedIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d="M2 20v-8a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v8" />
      <path d="M2 15h20" />
      <path d="M2 20h20" />
      <path d="M6 10V6a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v4" />
    </svg>
  )
}

function CalendarIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <rect x={3} y={4} width={18} height={18} rx={2} />
      <line x1={16} y1={2} x2={16} y2={6} />
      <line x1={8} y1={2} x2={8} y2={6} />
      <line x1={3} y1={10} x2={21} y2={10} />
    </svg>
  )
}

function UsersIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx={9} cy={7} r={4} />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  )
}

function CoinIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <circle cx={12} cy={12} r={9} />
      <path d="M14.5 9a3 3 0 0 0-5 2.2c0 2.4 5 3.8 5 6a3 3 0 0 1-5 2.1" />
      <line x1={12} y1={6} x2={12} y2={8} />
      <line x1={12} y1={19} x2={12} y2={21} />
    </svg>
  )
}
