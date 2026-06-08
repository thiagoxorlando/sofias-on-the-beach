'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import { cn } from '@/lib/utils'
import { signOutAction } from '../actions'
import { getVisibleModules, type Module } from '@/lib/permissions'

type AdminUser = {
  email: string
  full_name: string
  role: string
}

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

const NAV_LINKS: { href: string; label: string; icon: string; module: Module }[] = [
  { href: '/dashboard',               label: 'Visão geral',     icon: 'home',     module: 'overview'     },
  { href: '/dashboard/rooms',         label: 'Quartos',         icon: 'bed',      module: 'rooms'        },
  { href: '/dashboard/reservations',  label: 'Reservas',        icon: 'calendar', module: 'reservations' },
  { href: '/dashboard/reception',     label: 'Recepção',        icon: 'reception', module: 'reception'   },
  { href: '/dashboard/guests',        label: 'Hóspedes',        icon: 'users',    module: 'guests'       },
  { href: '/dashboard/availability',  label: 'Disponibilidade', icon: 'grid',     module: 'availability' },
  { href: '/dashboard/payments',      label: 'Financeiro',      icon: 'coin',     module: 'payments'     },
  { href: '/dashboard/settings',      label: 'Configurações',   icon: 'settings', module: 'settings'     },
]

export function DashboardShell({
  adminUser,
  children,
}: {
  adminUser: AdminUser
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const visibleModules = getVisibleModules(adminUser.role)
  const navLinks = NAV_LINKS.filter((link) => visibleModules.includes(link.module))

  return (
    <div className="flex h-screen overflow-hidden bg-ocean-50/30">

      {/* Mobile backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/25 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ── Sidebar ── */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 w-64 flex flex-col bg-white border-r border-ocean-100 transition-transform duration-200',
          'md:relative md:translate-x-0',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        {/* Brand */}
        <div className="px-5 py-5 border-b border-ocean-100 shrink-0">
          <Link
            href="/dashboard"
            className="flex items-center gap-3"
            onClick={() => setSidebarOpen(false)}
          >
            <SofiasMark className="w-8 h-8 text-ocean-600 shrink-0" />
            <div className="leading-none">
              <p className="font-serif text-[17px] font-bold text-ocean-900 leading-none">
                SOFIA&apos;S
              </p>
              <p className="text-[8px] font-semibold text-ocean-500 uppercase tracking-[0.16em] mt-0.5">
                painel de gestão
              </p>
            </div>
          </Link>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          {navLinks.map((link) => {
            const isActive =
              link.href === '/dashboard'
                ? pathname === '/dashboard'
                : pathname.startsWith(link.href)
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setSidebarOpen(false)}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium transition-colors',
                  isActive
                    ? 'bg-ocean-900 text-white'
                    : 'text-ocean-700 hover:bg-ocean-50 hover:text-ocean-900',
                )}
              >
                <NavIcon name={link.icon} active={isActive} />
                {link.label}
              </Link>
            )
          })}
        </nav>

        {/* User + logout */}
        <div className="px-4 py-4 border-t border-ocean-100 shrink-0">
          <div className="mb-3 px-1">
            <p className="text-[12px] font-semibold text-ocean-900 truncate">
              {adminUser.full_name}
            </p>
            <p className="text-[11px] text-ocean-500 truncate mt-0.5">
              {adminUser.email}
            </p>
            <p className="text-[10px] text-ocean-400 uppercase tracking-[0.10em] mt-0.5">
              {ROLE_LABEL[adminUser.role] ?? adminUser.role}
            </p>
          </div>
          <form action={signOutAction}>
            <button
              type="submit"
              className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-[12px] font-medium text-ocean-700 hover:bg-ocean-50 hover:text-ocean-900 transition-colors"
            >
              <LogOutIcon />
              Sair da conta
            </button>
          </form>
        </div>
      </aside>

      {/* ── Main area ── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

        {/* Mobile top bar */}
        <header className="h-14 bg-white border-b border-ocean-100 flex items-center gap-3 px-4 md:hidden shrink-0">
          <button
            onClick={() => setSidebarOpen(true)}
            className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-ocean-50 transition-colors"
            aria-label="Abrir menu"
          >
            <MenuIcon />
          </button>
          <span className="font-serif text-[16px] font-bold text-ocean-900">
            SOFIA&apos;S
          </span>
          <div className="ml-auto">
            <form action={signOutAction}>
              <button
                type="submit"
                className="text-[11px] font-semibold text-ocean-600 hover:text-ocean-900 transition-colors"
              >
                Sair
              </button>
            </form>
          </div>
        </header>

        {/* Scrollable page content */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  )
}

// ─── NavIcon dispatcher ───────────────────────────────────────────────────────

function NavIcon({ name, active }: { name: string; active: boolean }) {
  const cls = cn('w-4 h-4 shrink-0', active ? 'text-white/90' : 'text-ocean-400')
  switch (name) {
    case 'home':     return <HomeIcon     className={cls} />
    case 'bed':      return <BedIcon      className={cls} />
    case 'calendar': return <CalendarIcon className={cls} />
    case 'reception': return <BellDeskIcon className={cls} />
    case 'users':    return <UsersIcon    className={cls} />
    case 'grid':     return <GridIcon     className={cls} />
    case 'coin':     return <CoinIcon     className={cls} />
    case 'settings': return <SettingsIcon className={cls} />
    default:         return null
  }
}

// ─── Icons ────────────────────────────────────────────────────────────────────

function SofiasMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 40" fill="none" className={className} aria-hidden="true">
      <path d="M10 36 L10 20 A10 10 0 0 1 30 20 L30 36" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M4 38 Q12 34 20 38 T36 38" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  )
}

function HomeIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  )
}

function BedIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d="M2 20v-8a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v8" />
      <path d="M2 15h20M2 20h20" />
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

function BellDeskIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  )
}

function UsersIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx={9} cy={7} r={4} />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  )
}

function GridIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <rect x={3} y={3} width={7} height={7} rx={1} />
      <rect x={14} y={3} width={7} height={7} rx={1} />
      <rect x={3} y={14} width={7} height={7} rx={1} />
      <rect x={14} y={14} width={7} height={7} rx={1} />
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

function SettingsIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <circle cx={12} cy={12} r={3} />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  )
}

function LogOutIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5 shrink-0 text-ocean-400" aria-hidden="true">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1={21} y1={12} x2={9} y2={12} />
    </svg>
  )
}

function MenuIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 text-ocean-700" aria-hidden="true">
      <line x1={3} y1={6} x2={21} y2={6} />
      <line x1={3} y1={12} x2={21} y2={12} />
      <line x1={3} y1={18} x2={21} y2={18} />
    </svg>
  )
}
