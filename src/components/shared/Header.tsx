'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { Menu, X, User } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

const navLinks = [
  { href: '/',        label: 'Início' },
  { href: '/quartos', label: 'Suítes' },
]

const WA_MSG = encodeURIComponent(
  "Olá! Gostaria de saber sobre disponibilidade na pousada Sofia's on the Beach.",
)

export function Header({ onlineBookingEnabled = true, whatsapp = '5522999999999' }: {
  onlineBookingEnabled?: boolean
  whatsapp?: string
}) {
  const [menuOpen, setMenuOpen]   = useState(false)
  const [loggedIn, setLoggedIn]   = useState(false)
  const [fullName, setFullName]   = useState<string | null>(null)
  const pathname = usePathname()
  const waHref = `https://wa.me/${whatsapp}?text=${WA_MSG}`

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
          {onlineBookingEnabled ? (
            <Link
              href="/quartos"
              className="inline-flex items-center bg-ocean-900 text-white px-7 py-3 rounded-xl text-[14px] font-bold uppercase tracking-wide hover:bg-ocean-800 transition-colors shadow-sm"
            >
              Reservar agora
            </Link>
          ) : (
            <a
              href={waHref}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-ocean-900 text-white px-7 py-3 rounded-xl text-[14px] font-bold uppercase tracking-wide hover:bg-ocean-800 transition-colors shadow-sm"
            >
              <WAIcon />
              Falar no WhatsApp
            </a>
          )}
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
              {onlineBookingEnabled ? (
                <Link
                  href="/quartos"
                  className="flex items-center justify-center w-full bg-ocean-900 text-white px-5 py-3 rounded-xl text-sm font-semibold uppercase tracking-wide hover:bg-ocean-800 transition-colors"
                  onClick={() => setMenuOpen(false)}
                >
                  Reservar agora
                </Link>
              ) : (
                <a
                  href={waHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 w-full bg-ocean-900 text-white px-5 py-3 rounded-xl text-sm font-semibold uppercase tracking-wide hover:bg-ocean-800 transition-colors"
                  onClick={() => setMenuOpen(false)}
                >
                  <WAIcon />
                  Falar no WhatsApp
                </a>
              )}
            </div>
          </nav>
        </div>
      )}
    </header>
  )
}

function WAIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5 shrink-0 text-[#25D366]" aria-hidden="true">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
    </svg>
  )
}

