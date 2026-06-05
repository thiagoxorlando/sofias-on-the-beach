'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Menu, X } from 'lucide-react'

const navLinks = [
  { href: '/',             label: 'Início' },
  { href: '/quartos',      label: 'Quartos' },
  { href: '/experiencia',  label: 'Experiência' },
  { href: '/localizacao',  label: 'Localização' },
  { href: '/contato',      label: 'Contato' },
]

export function Header() {
  const [menuOpen, setMenuOpen] = useState(false)
  const pathname = usePathname()

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-sm border-b border-border">
      <div className="max-w-6xl mx-auto px-6 md:px-10 h-16 md:h-[72px] flex items-center justify-between gap-6">

        {/* Brand */}
        <Link
          href="/"
          className="font-serif text-lg md:text-xl font-bold text-ocean-800 tracking-tight shrink-0 hover:text-ocean-700 transition-colors"
          onClick={() => setMenuOpen(false)}
        >
          Sofia&apos;s on the Beach
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-6 lg:gap-8">
          {navLinks.map((link) => {
            const active = pathname === link.href
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`text-sm font-medium transition-colors ${
                  active
                    ? 'text-primary'
                    : 'text-foreground/70 hover:text-foreground'
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
          className="hidden md:inline-flex items-center bg-primary text-primary-foreground px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-ocean-700 transition-colors shadow-sm shrink-0"
        >
          Reservar Agora
        </Link>

        {/* Mobile hamburger */}
        <button
          type="button"
          className="md:hidden p-2 -mr-2 rounded-lg text-foreground hover:bg-muted transition-colors"
          onClick={() => setMenuOpen((v) => !v)}
          aria-label={menuOpen ? 'Fechar menu' : 'Abrir menu'}
          aria-expanded={menuOpen}
        >
          {menuOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden border-t border-border bg-white">
          <nav className="max-w-6xl mx-auto px-6 py-2 flex flex-col">
            {navLinks.map((link) => {
              const active = pathname === link.href
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`py-3.5 text-sm font-medium border-b border-border/50 last:border-0 transition-colors ${
                    active ? 'text-primary' : 'text-foreground/70'
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
                className="flex items-center justify-center w-full bg-primary text-primary-foreground px-5 py-3 rounded-xl text-sm font-semibold hover:bg-ocean-700 transition-colors"
                onClick={() => setMenuOpen(false)}
              >
                Reservar Agora
              </Link>
            </div>
          </nav>
        </div>
      )}
    </header>
  )
}
