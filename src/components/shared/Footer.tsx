import Link from 'next/link'
import Image from 'next/image'
import type { SiteSettings } from '@/lib/settings'

const navLinks = [
  { href: '/',        label: 'Início' },
  { href: '/quartos', label: 'Suítes' },
]

const WA_MSG = encodeURIComponent(
  "Olá! Gostaria de reservar na pousada Sofia's on the Beach."
)

export function Footer({ settings }: { settings: SiteSettings }) {
  const waHref = `https://wa.me/${settings.whatsapp}?text=${WA_MSG}`
  const year = new Date().getFullYear()
  const hasAddress = settings.address.trim() !== ''

  return (
    <footer className="bg-ocean-900 border-t border-white/10">
      <div className="max-w-7xl mx-auto px-6 md:px-10 pt-12 pb-8">

        {/* 4 columns: Brand · Navegação · Contato · Siga-nos */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-10 pb-10 border-b border-white/[0.07]">

          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="inline-flex items-center gap-3 mb-4 group">
              <Image
                src="/images/experience/sofias_icon_transparent.png"
                alt="Sofia's on the Beach"
                width={40}
                height={40}
                className="w-9 h-9 object-contain opacity-90 group-hover:opacity-100 transition-opacity"
              />
              <div className="flex flex-col leading-none">
                <span className="font-serif text-[17px] font-bold text-white tracking-tight leading-none">
                  Sofia&apos;s
                </span>
                <span className="text-[9px] font-bold text-ocean-400 uppercase tracking-[0.18em] mt-0.5">
                  on the Beach
                </span>
              </div>
            </Link>
            <p className="text-[12px] text-ocean-500 leading-relaxed max-w-[200px]">
              Pousada boutique à beira-mar em Búzios, RJ.
            </p>
          </div>

          {/* Navegação */}
          <div>
            <p className="text-[10px] font-bold text-ocean-400 uppercase tracking-[0.22em] mb-5">
              Navegação
            </p>
            <ul className="space-y-3.5">
              {navLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-[13px] text-ocean-300 hover:text-white transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contato */}
          <div>
            <p className="text-[10px] font-bold text-ocean-400 uppercase tracking-[0.22em] mb-5">
              Contato
            </p>
            <ul className="space-y-3.5">
              {settings.phone && (
                <li className="flex items-center gap-2.5">
                  <PhoneIcon />
                  <span className="text-[13px] text-ocean-300">{settings.phone}</span>
                </li>
              )}
              <li className="flex items-start gap-2.5">
                <MailIcon />
                <a
                  href={`mailto:${settings.publicEmail}`}
                  className="text-[13px] text-ocean-300 hover:text-white transition-colors leading-snug"
                  style={{ wordBreak: 'break-all' }}
                >
                  {settings.publicEmail}
                </a>
              </li>
              <li className="flex items-start gap-2.5">
                <MapPinIcon />
                <span className="text-[12px] text-ocean-500 leading-snug">
                  {hasAddress && <>{settings.address}<br /></>}
                  {settings.city} — {settings.state}
                </span>
              </li>
            </ul>
          </div>

          {/* Siga-nos */}
          <div>
            <p className="text-[10px] font-bold text-ocean-400 uppercase tracking-[0.22em] mb-5">
              Siga-nos
            </p>
            <div className="flex items-center gap-3">
              {settings.instagramUrl && (
                <a
                  href={settings.instagramUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Instagram"
                  className="w-9 h-9 rounded-full border border-white/20 flex items-center justify-center text-ocean-300 hover:text-white hover:border-white/40 transition-colors"
                >
                  <InstagramIcon />
                </a>
              )}
              <a
                href={waHref}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="WhatsApp"
                className="w-9 h-9 rounded-full border border-white/20 flex items-center justify-center text-ocean-300 hover:text-white hover:border-white/40 transition-colors"
              >
                <WhatsAppIcon />
              </a>
            </div>
          </div>

        </div>

        {/* Bottom bar */}
        <div className="pt-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
          <p className="text-[11px] text-ocean-600">
            {`© ${year} Sofia's on the Beach. Todos os direitos reservados.`}
          </p>
          <div className="flex items-center gap-4">
            <p className="text-[11px] text-ocean-700">
              Reservas diretas · Melhor tarifa garantida
            </p>
            <Link
              href="/entrar"
              className="text-[10px] text-ocean-800/30 hover:text-ocean-500 transition-colors"
            >
              Acesso administrativo
            </Link>
          </div>
        </div>

      </div>
    </footer>
  )
}

function PhoneIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5 shrink-0 text-ocean-500" aria-hidden="true">
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.6 1.28h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.91a16 16 0 0 0 6.18 6.18l.91-.91a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
    </svg>
  )
}

function MailIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5 shrink-0 mt-[1px] text-ocean-500" aria-hidden="true">
      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
      <polyline points="22 6 12 13 2 6" />
    </svg>
  )
}

function MapPinIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5 shrink-0 mt-[1px] text-ocean-500" aria-hidden="true">
      <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
      <circle cx={12} cy={10} r={3} />
    </svg>
  )
}

function InstagramIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5" aria-hidden="true">
      <rect x={2} y={2} width={20} height={20} rx={5} ry={5} />
      <circle cx={12} cy={12} r={4} />
      <circle cx={17.5} cy={6.5} r={0.5} fill="currentColor" stroke="none" />
    </svg>
  )
}

function WhatsAppIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5" aria-hidden="true">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
    </svg>
  )
}
