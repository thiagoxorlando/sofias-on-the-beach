import fs from 'node:fs'
import path from 'node:path'
import Image from 'next/image'

function imgExists(src: string): boolean {
  return fs.existsSync(path.join(process.cwd(), 'public', src.replace(/^\//, '')))
}

const _LOC_PRIMARY = '/images/hero/beach-window-view.png'
const _LOC_SECONDARY = '/images/location/buzios-beachfront.jpg'
const _LOC_FALLBACK = '/images/experience/praia-em-frente.jpg'
const LOCATION_IMG: string | null = imgExists(_LOC_PRIMARY)
  ? _LOC_PRIMARY
  : imgExists(_LOC_SECONDARY)
  ? _LOC_SECONDARY
  : imgExists(_LOC_FALLBACK)
  ? _LOC_FALLBACK
  : null

const WA_MSG = encodeURIComponent(
  "Olá! Gostaria de saber mais sobre como chegar na pousada Sofia's on the Beach."
)

const bullets = [
  'Vista panorâmica para o mar de Búzios',
  'A poucos passos da praia',
  'Região tranquila e segura, perfeita para relaxar',
]

export function LocationSection({ whatsapp }: { whatsapp: string }) {
  const waHref = `https://wa.me/${whatsapp}?text=${WA_MSG}`

  return (
    <section className="bg-white py-14 md:py-28 overflow-hidden">
      <div className="max-w-7xl mx-auto px-6 md:px-10">
        <div className="grid md:grid-cols-2 gap-12 md:gap-16 items-center">

          {/* ── Left: text column ── */}
          <div>
            <p className="text-[11px] font-bold text-ocean-600 uppercase tracking-[0.30em] mb-4">
              Localização privilegiada
            </p>
            <h2
              className="font-serif font-bold text-ocean-900 leading-[1.08] mb-5"
              style={{ fontSize: 'clamp(30px, 3.0vw, 48px)' }}
            >
              No coração de Búzios, em<br />frente ao mar
            </h2>
            <div className="w-10 h-[3px] rounded-full bg-ocean-500 mb-6" />
            <p
              className="text-[14px] md:text-[15px] text-foreground/58 leading-[1.75] mb-8"
              style={{ maxWidth: '480px' }}
            >
              Sofia&apos;s on the Beach está localizada à beira-mar, com uma vista
              deslumbrante que transforma cada manhã e pôr do sol em um momento inesquecível.
            </p>

            {/* Bullets */}
            <ul className="space-y-4 mb-10">
              {bullets.map((text) => (
                <li key={text} className="flex items-start gap-3.5">
                  <div className="w-5 h-5 rounded-full bg-ocean-50 border border-ocean-200 flex items-center justify-center shrink-0 mt-[1px]">
                    <CheckmarkIcon />
                  </div>
                  <span className="text-[14px] text-foreground/70 leading-snug">{text}</span>
                </li>
              ))}
            </ul>

            {/* WhatsApp CTA */}
            <a
              href={waHref}
              target="_blank"
              rel="noopener noreferrer"
              className="flex sm:inline-flex items-center justify-center gap-3 w-full sm:w-auto bg-ocean-900 text-white text-[12px] font-bold uppercase tracking-[0.12em] px-7 py-3.5 rounded-xl hover:bg-ocean-800 transition-colors shadow-sm"
            >
              <WhatsAppIcon />
              Como chegar pelo WhatsApp
            </a>
          </div>

          {/* ── Right: arch image + floating card ── */}
          <div className="flex justify-center md:justify-end">
            <div className="relative w-full max-w-[280px] md:max-w-[390px]">

              {/* Arch image frame */}
              <div className="relative h-[380px] md:h-[520px] rounded-t-full rounded-b-[28px] overflow-hidden shadow-[0_24px_64px_rgba(0,43,74,0.18)]">
                {LOCATION_IMG !== null ? (
                  <Image
                    src={LOCATION_IMG}
                    alt="Vista do mar de Búzios a partir da pousada Sofia's on the Beach"
                    fill
                    className="object-cover object-center"
                    sizes="(max-width: 768px) 280px, 390px"
                  />
                ) : (
                  <div
                    className="absolute inset-0"
                    style={{
                      background: 'linear-gradient(160deg, #dceef9 0%, #c4dff0 55%, #a9cde7 100%)',
                    }}
                  />
                )}
              </div>

              {/* Floating card */}
              <div className="absolute bottom-8 left-4 md:-left-14 z-10 bg-white rounded-2xl shadow-[0_8px_32px_rgba(0,43,74,0.13)] border border-ocean-100/60 px-5 py-4 w-[152px]">
                <div className="w-8 h-8 text-ocean-500 mb-3">
                  <SunWaveIcon />
                </div>
                <div className="w-6 h-[2px] bg-ocean-400 mb-3 rounded-full" />
                <p className="font-serif font-bold text-ocean-900 text-[15px] leading-snug mb-1.5">
                  De frente<br />para o mar
                </p>
                <p className="text-[11px] text-foreground/50 leading-snug">
                  Acorde com o mar.<br />Relaxe com a vista.
                </p>
              </div>

              {/* Subtle concentric-circle decoration — top-right */}
              <div className="absolute -top-5 -right-5 pointer-events-none opacity-25" aria-hidden="true">
                <WaveAccent />
              </div>

            </div>
          </div>

        </div>
      </div>
    </section>
  )
}

function CheckmarkIcon() {
  return (
    <svg
      viewBox="0 0 10 10"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="w-2.5 h-2.5 text-ocean-500"
      aria-hidden="true"
    >
      <polyline points="1.5 5 4 7.5 8.5 2.5" />
    </svg>
  )
}

function WhatsAppIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 shrink-0" aria-hidden="true">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
    </svg>
  )
}

function SunWaveIcon() {
  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="w-full h-full"
      aria-hidden="true"
    >
      <circle cx={16} cy={13} r={4} />
      <line x1={16} y1={4} x2={16} y2={6} />
      <line x1={16} y1={20} x2={16} y2={22} />
      <line x1={7} y1={13} x2={9} y2={13} />
      <line x1={23} y1={13} x2={25} y2={13} />
      <line x1={10.1} y1={7.1} x2={11.5} y2={8.5} />
      <line x1={21.9} y1={7.1} x2={20.5} y2={8.5} />
      <path d="M4 27c1.4 1.2 3 1.8 5 1.8 4 0 4-3 8-3s4 3 8 3c2 0 3.6-.6 5-1.8" />
    </svg>
  )
}

function WaveAccent() {
  return (
    <svg width="80" height="80" viewBox="0 0 80 80" fill="none" aria-hidden="true">
      <circle cx="40" cy="40" r="38" stroke="#93C5E8" strokeWidth="1" />
      <circle cx="40" cy="40" r="26" stroke="#93C5E8" strokeWidth="0.6" />
    </svg>
  )
}
