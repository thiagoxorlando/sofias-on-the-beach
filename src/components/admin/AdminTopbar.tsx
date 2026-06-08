'use client'

import { usePathname } from 'next/navigation'

const ROLE_LABEL: Record<string, string> = {
  super_admin:  'Super Admin',
  admin:        'Administrador',
  manager:      'Gerente',
  reception:    'Recepção',
  housekeeping: 'Governança',
  maintenance:  'Manutenção',
  finance:      'Financeiro',
  staff:        'Equipe',
}

const PAGE_TITLES: Record<string, string> = {
  '/dashboard/reception':    'Recepção',
  '/dashboard/reservations': 'Reservas',
  '/dashboard/guests':       'Hóspedes',
  '/dashboard/housekeeping': 'Governança',
  '/dashboard/maintenance':  'Manutenção',
  '/dashboard/rooms':        'Quartos',
  '/dashboard/availability': 'Disponibilidade',
  '/dashboard/payments':     'Financeiro',
  '/dashboard/staff':        'Equipe',
  '/dashboard/settings':     'Configurações',
}

function getInitials(name: string): string {
  return name.split(' ').filter(Boolean).slice(0, 2).map((n) => n[0]).join('').toUpperCase()
}

function getPageTitle(pathname: string): string {
  if (pathname === '/dashboard') return 'Visão geral'
  const match = Object.keys(PAGE_TITLES).find((k) => pathname.startsWith(k))
  return match ? PAGE_TITLES[match] : 'Painel'
}

export function AdminTopbar({
  adminUser,
  onMenuOpen,
}: {
  adminUser: { email: string; full_name: string; role: string }
  onMenuOpen: () => void
}) {
  const pathname = usePathname()
  const initials = getInitials(adminUser.full_name)
  const roleName = ROLE_LABEL[adminUser.role] ?? adminUser.role
  const firstName = adminUser.full_name.split(' ')[0]
  const pageTitle = getPageTitle(pathname)

  return (
    <header className="h-14 bg-white border-b border-admin-border flex items-center gap-3 px-4 sm:px-6 shrink-0 print:hidden">

      {/* Hamburger */}
      <button
        onClick={onMenuOpen}
        className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 transition-colors shrink-0 md:hidden"
        aria-label="Abrir menu"
      >
        <MenuIcon />
      </button>

      {/* Mobile: hamburger also on md+ for visual parity — desktop sidebar always open */}
      <button
        onClick={onMenuOpen}
        className="hidden md:flex w-8 h-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 transition-colors shrink-0"
        aria-label="Menu"
      >
        <MenuIcon />
      </button>

      {/* Page title */}
      <h2 className="hidden sm:block text-[14px] font-semibold text-slate-700 shrink-0">
        {pageTitle}
      </h2>

      {/* Mobile brand */}
      <span className="text-[15px] font-bold text-admin-sidebar sm:hidden">
        SOFIA&apos;S
      </span>

      {/* Search */}
      <div className="hidden md:flex flex-1 max-w-[340px] ml-4">
        <div className="relative w-full">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Buscar hóspedes, reservas, quartos..."
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-admin-border bg-admin-page text-[13px] text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-admin-sidebar-act/20 focus:border-admin-sidebar-act/40"
          />
        </div>
      </div>

      <div className="flex-1 md:hidden" />

      {/* Right cluster */}
      <div className="flex items-center gap-1.5 sm:gap-2.5 ml-auto md:ml-0">

        {/* Notifications */}
        <button
          className="relative w-9 h-9 flex items-center justify-center rounded-lg hover:bg-slate-100 transition-colors"
          aria-label="Notificações"
          type="button"
        >
          <BellIcon className="w-[17px] h-[17px] text-slate-500" />
          <span className="absolute top-1.5 right-1.5 w-[7px] h-[7px] rounded-full bg-red-500 ring-2 ring-white" />
        </button>

        <div className="hidden sm:block w-px h-5 bg-slate-200" />

        {/* User */}
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-admin-sidebar-act flex items-center justify-center shrink-0">
            <span className="text-[11px] font-bold text-white">{initials}</span>
          </div>
          <div className="hidden sm:block leading-none">
            <p className="text-[13px] font-semibold text-slate-700 leading-tight">{firstName}</p>
            <p className="text-[11px] text-slate-400 mt-0.5">{roleName}</p>
          </div>
          <ChevronIcon className="hidden sm:block w-3.5 h-3.5 text-slate-400 shrink-0" />
        </div>
      </div>
    </header>
  )
}

function MenuIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5" aria-hidden="true">
      <line x1={3} y1={6} x2={21} y2={6} />
      <line x1={3} y1={12} x2={21} y2={12} />
      <line x1={3} y1={18} x2={21} y2={18} />
    </svg>
  )
}

function SearchIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <circle cx={11} cy={11} r={8} />
      <path d="m21 21-4.35-4.35" />
    </svg>
  )
}

function BellIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  )
}

function ChevronIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <polyline points="6 9 12 15 18 9" />
    </svg>
  )
}
