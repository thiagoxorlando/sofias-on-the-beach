'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { Menu, X, User } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

const navLinks = [
  { href: '/',             label: 'Início' },
  { href: '/quartos',      label: 'Suítes' },
  { href: '/experiencia',  label: 'Experiências' },
  { href: '/localizacao',  label: 'Localização' },
  { href: '/contato',      label: 'Contato' },
]

export function Header() {
  const [menuOpen, setMenuOpen]   = useState(false)
  const [loggedIn, setLoggedIn]   = useState(false)
  const [fullName, setFullName]   = useState<string | null>(null)
  const pathname = usePathname()

  useEffect(() => {
    const supabase = createClient()
    function syncSession(session: { user?: { user_metadata?: Record<string, unknown> } } | null) {
      setLoggedIn(!!session)
      const name = session?.user?.user_metadata?.full_name
      setFullName(typeof name === 'string' && name.trim() ? name : null)
    }
    supabase.auth.getSession().then(({ data: { session } }) => syncSession(session))
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      syncSession(session)
    })
    return () => subscription.unsubscribe()
  }, [])

  const firstName = fullName?.trim().split(/\s+/)[0] ?? null
  const accountLabel = firstName ?? 'Minha conta'

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-ocean-100">
      <div className="max-w-7xl mx-auto px-6 md:px-10 h-[64px] md:h-[92px] flex items-center justify-between gap-6">

        {/* Brand mark + wordmark */}
        <Link
          href="/"
          className="flex items-center gap-3 shrink-0 group"
          onClick={() => setMenuOpen(false)}
        >
          <Image
            src="/images/experience/sofias_icon_transparent.png"
            alt="Sofia's on the Beach"
            width={48}
            height={48}
            className="w-9 h-9 md:w-12 md:h-12 object-contain"
          />
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

        {/* Desktop CTAs */}
        <div className="hidden md:flex items-center gap-3 shrink-0">
          {loggedIn ? (
            <Link
              href="/minha-conta"
              className="flex items-center gap-1.5 text-[13px] font-semibold text-ocean-700 hover:text-ocean-900 transition-colors"
            >
              <User size={15} className="text-ocean-500" />
              {accountLabel}
            </Link>
          ) : (
            <Link
              href="/entrar"
              className="text-[13px] font-semibold text-ocean-700 hover:text-ocean-900 transition-colors"
            >
              Acessar
            </Link>
          )}
          <Link
            href="/quartos"
            className="inline-flex items-center bg-ocean-900 text-white px-7 py-3 rounded-xl text-[14px] font-bold uppercase tracking-wide hover:bg-ocean-800 transition-colors shadow-sm"
          >
            Reservar agora
          </Link>
        </div>

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
                  className={`py-3.5 text-sm font-medium border-b border-ocean-50 transition-colors ${
                    active ? 'text-primary' : 'text-foreground/60'
                  }`}
                  onClick={() => setMenuOpen(false)}
                >
                  {link.label}
                </Link>
              )
            })}
            <Link
              href={loggedIn ? '/minha-conta' : '/entrar'}
              className="py-3.5 text-sm font-semibold text-ocean-700 border-b border-ocean-50 flex items-center gap-2"
              onClick={() => setMenuOpen(false)}
            >
              <User size={14} className="text-ocean-500" />
              {loggedIn ? accountLabel : 'Acessar'}
            </Link>
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

