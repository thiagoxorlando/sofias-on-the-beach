'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Menu, X } from 'lucide-react'

const navLinks = [
  { href: '/',             label: 'Início' },
  { href: '/quartos',      label: 'Suítes' },
  { href: '/experiencia',  label: 'Experiências' },
  { href: '/localizacao',  label: 'Localização' },
  { href: '/contato',      label: 'Contato' },
]

export function Header() {
  const [menuOpen, setMenuOpen] = useState(false)
  const pathname = usePathname()

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-ocean-100">
      <div className="max-w-7xl mx-auto px-6 md:px-10 h-[64px] md:h-[92px] flex items-center justify-between gap-6">

        {/* Brand mark + wordmark */}
        <Link
          href="/"
          className="flex items-center gap-3 shrink-0 group"
          onClick={() => setMenuOpen(false)}
        >
          <SofiasMark className="w-9 h-9 md:w-12 md:h-12 text-ocean-600 group-hover:text-ocean-500 transition-colors" />
          <div className="flex flex-col leading-none">
            <span className="font-serif text-[17px] md:text-[20px] font-bold text-foreground tracking-tight leading-none">
              Sofia&apos;s
            </span>
            <span className="text-[9px] md:text-[10px] font-bold text-ocean-500 uppercase tracking-[0.18em] mt-0.5">
              on the Beach
            </span>
          </div>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-7 lg:gap-9">
          {navLinks.map((link) => {
            const active = pathname === link.href
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`text-[14px] font-medium transition-colors pb-0.5 border-b-2 ${
                  active
                    ? 'text-ocean-600 border-ocean-600'
                    : 'text-foreground/60 hover:text-foreground border-transparent'
                }`}
              >
                {link.label}
              </Link>
            )
          })}
        </nav>

        {/* Desktop CTA */}
        <Link
          href="/quartos"
          className="hidden md:inline-flex items-center bg-ocean-900 text-white px-7 py-3 rounded-xl text-[14px] font-bold uppercase tracking-wide hover:bg-ocean-800 transition-colors shadow-sm shrink-0"
        >
          Reservar agora
        </Link>

        {/* Mobile hamburger */}
        <button
          type="button"
          className="md:hidden p-2 -mr-2 rounded-lg text-foreground hover:bg-ocean-50 transition-colors"
          onClick={() => setMenuOpen((v) => !v)}
          aria-label={menuOpen ? 'Fechar menu' : 'Abrir menu'}
          aria-expanded={menuOpen}
        >
          {menuOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden border-t border-ocean-100 bg-white">
          <nav className="max-w-7xl mx-auto px-6 py-2 flex flex-col">
            {navLinks.map((link) => {
              const active = pathname === link.href
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`py-3.5 text-sm font-medium border-b border-ocean-50 last:border-0 transition-colors ${
                    active ? 'text-primary' : 'text-foreground/60'
                  }`}
                  onClick={() => setMenuOpen(false)}
                >
                  {link.label}
                </Link>
              )
            })}
            <div className="py-4">
              <Link
                href="/quartos"
                className="flex items-center justify-center w-full bg-ocean-900 text-white px-5 py-3 rounded-xl text-sm font-semibold uppercase tracking-wide hover:bg-ocean-800 transition-colors"
                onClick={() => setMenuOpen(false)}
              >
                Reservar agora
              </Link>
            </div>
          </nav>
        </div>
      )}
    </header>
  )
}

function SofiasMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 40" fill="none" className={className} aria-hidden="true">
      <path
        d="M10 36 L10 20 A10 10 0 0 1 30 20 L30 36"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M4 38 Q12 34 20 38 T36 38"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  )
}
