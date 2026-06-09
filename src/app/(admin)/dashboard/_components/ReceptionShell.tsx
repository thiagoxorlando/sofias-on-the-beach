'use client'

import Link from 'next/link'
import Image from 'next/image'
import { signOutAction } from '../actions'

type AdminUser = {
  email: string
  full_name: string
  role: string
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0])
    .join('')
    .toUpperCase()
}

export function ReceptionShell({
  adminUser,
  children,
}: {
  adminUser: AdminUser
  children: React.ReactNode
}) {
  return (
    <div className="flex h-screen overflow-hidden bg-admin-page print:block print:h-auto print:overflow-visible print:bg-white">

      {/* ── Sidebar — logo + user + logout only, no navigation ── */}
      <aside className="hidden md:flex w-[200px] shrink-0 flex-col bg-admin-sidebar border-r border-[#0F3250] print:hidden">

        {/* Brand */}
        <Link
          href="/dashboard/reception"
          className="flex items-center gap-3 px-5 py-5 border-b border-[#0F3250] shrink-0 hover:opacity-80 transition-opacity"
        >
          <Image src="/images/experience/sofias_icon_transparent.png" alt="Sofia's on the Beach" width={28} height={28} className="w-7 h-7 object-contain shrink-0" />
          <div className="leading-none">
            <p className="text-[14px] font-bold text-white leading-none tracking-wide">SOFIA&apos;S</p>
            <p className="text-[10px] text-white/40 mt-1 tracking-wide">ON THE BEACH</p>
          </div>
        </Link>

        {/* Role label — also a back-link to the command center */}
        <Link
          href="/dashboard/reception"
          className="px-5 py-4 border-b border-[#0F3250] shrink-0 hover:bg-white/5 transition-colors"
        >
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
            <p className="text-[11px] font-semibold text-white/60 uppercase tracking-[0.18em]">Recepção</p>
          </div>
        </Link>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Ver site */}
        <div className="px-4 pb-3 shrink-0">
          <a
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-[12px] font-medium text-white/40 hover:bg-white/5 hover:text-white/70 transition-colors"
          >
            <ExternalLinkIcon />
            Ver site público
          </a>
        </div>

        {/* User + logout */}
        <div className="px-4 py-4 border-t border-[#0F3250] shrink-0">
          <div className="mb-2 px-2.5 py-2.5 rounded-xl bg-white/5 flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-[#0B3A75] flex items-center justify-center shrink-0">
              <span className="text-[11px] font-bold text-white">{getInitials(adminUser.full_name)}</span>
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[12px] font-semibold text-white truncate">{adminUser.full_name}</p>
              <p className="text-[11px] text-white/40 mt-0.5 truncate">Recepção</p>
            </div>
          </div>
          <form action={signOutAction}>
            <button
              type="submit"
              className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-[12px] font-medium text-white/40 hover:bg-white/5 hover:text-white/70 transition-colors"
            >
              <LogOutIcon />
              Sair da conta
            </button>
          </form>
        </div>
      </aside>

      {/* ── Main ── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden print:overflow-visible print:block">

        {/* Mobile topbar — minimal, no nav */}
        <div className="md:hidden h-12 bg-admin-sidebar flex items-center justify-between px-4 shrink-0 print:hidden border-b border-[#0F3250]">
          <div className="flex items-center gap-2.5">
            <Image src="/images/experience/sofias_icon_transparent.png" alt="" width={20} height={20} className="w-5 h-5 object-contain" />
            <span className="text-[13px] font-bold text-white tracking-wide">SOFIA&apos;S</span>
            <span className="text-[10px] text-white/40 ml-1">· Recepção</span>
          </div>
          <form action={signOutAction}>
            <button type="submit" className="flex items-center gap-1.5 text-[11px] text-white/40 hover:text-white/70 transition-colors">
              <LogOutIcon />
            </button>
          </form>
        </div>

        <main className="flex-1 overflow-y-auto print:overflow-visible">
          {children}
        </main>
      </div>
    </div>
  )
}

// ── Icons ─────────────────────────────────────────────────────────────────────

function ExternalLinkIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5 shrink-0" aria-hidden="true">
      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
      <polyline points="15 3 21 3 21 9" />
      <line x1={10} y1={14} x2={21} y2={3} />
    </svg>
  )
}

function LogOutIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5 shrink-0" aria-hidden="true">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1={21} y1={12} x2={9} y2={12} />
    </svg>
  )
}
