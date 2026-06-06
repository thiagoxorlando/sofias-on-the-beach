import fs from 'node:fs'
import path from 'node:path'
import Image from 'next/image'
import { BookingWidget } from '@/components/marketing/BookingWidget'

const HERO_IMG = '/images/hero/hero-terrace-main.png'
const WA_MSG = encodeURIComponent(
  "Olá! Gostaria de consultar disponibilidade na pousada Sofia's on the Beach.",
)

function heroExists(): boolean {
  return fs.existsSync(path.join(process.cwd(), 'public', HERO_IMG.replace(/^\//, '')))
}

export function HeroSection() {
  const hasImage = heroExists()
  const phone = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? '5522999999999'
  const waHref = `https://wa.me/${phone}?text=${WA_MSG}`

  return (
    <>
      {/* ──────────────────────────────────────────────────
          DESKTOP HERO
      ────────────────────────────────────────────────── */}
      <section className="relative hidden md:block overflow-hidden h-[calc(100svh-92px)] min-h-[720px] max-h-[880px]">

        {/* Z-0 — full-bleed background */}
        <div className="absolute inset-0 z-0">
          {hasImage ? (
            <Image
              src={HERO_IMG}
              alt="Vista da varanda da pousada com mar de Búzios ao fundo"
              fill
              priority
              className="object-cover object-center"
              sizes="100vw"
            />
          ) : (
            <div
              className="absolute inset-0"
              style={{
                background:
                  'linear-gradient(160deg, #001e36 0%, #002B4A 38%, #004d80 72%, #0077b6 100%)',
              }}
            />
          )}
        </div>

        {/* Z-5 — bottom vignette for booking widget legibility */}
        <div
          className="absolute inset-x-0 bottom-0 z-[5] h-60 pointer-events-none"
          style={{
            background:
              'linear-gradient(to top, rgba(0,18,36,0.58) 0%, rgba(0,18,36,0.22) 52%, transparent 100%)',
          }}
        />

        {/* Z-10 — glass content card */}
        <div
          className="absolute z-[10]"
          style={{ left: '7%', top: '24%', width: 'min(520px, 42%)' }}
        >
          <div className="bg-white/88 backdrop-blur-md rounded-[28px] border border-white/70 shadow-[0_20px_64px_rgba(0,18,50,0.22)] px-8 py-7">

            <p className="text-[11px] font-bold text-ocean-600 uppercase tracking-[0.32em] mb-4">
              Beira-mar · Búzios · RJ
            </p>

            <h1
              className="font-serif font-bold text-ocean-900 leading-[1.1] mb-4"
              style={{ fontSize: 'clamp(28px, 2.5vw, 40px)' }}
            >
              Acorde de frente para o mar em Búzios
            </h1>

            <div className="w-10 h-[3px] rounded-full bg-ocean-500 mb-4" />

            <p className="text-[13px] text-foreground/60 leading-relaxed mb-4">
              Pousada boutique à beira-mar com vista direta para o oceano,
              arquitetura branca e serviço personalizado no coração de Búzios.
            </p>

            <p className="font-serif italic text-ocean-700 text-[15px] mb-6">
              Seu refúgio. Sua vista. Seu tempo.
            </p>

            <div className="flex flex-wrap gap-2.5">
              <a
                href="/quartos"
                className="inline-flex items-center gap-2 bg-ocean-900 text-white px-5 py-2.5 rounded-xl text-[12px] font-bold uppercase tracking-[0.08em] hover:bg-ocean-800 transition-colors shadow-sm"
              >
                <CalendarIcon />
                Consultar disponibilidade
              </a>
              <a
                href={waHref}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 border border-ocean-200 text-ocean-700 bg-white/60 px-5 py-2.5 rounded-xl text-[12px] font-bold uppercase tracking-[0.08em] hover:bg-ocean-50 transition-colors"
              >
                <WhatsAppIcon className="w-[14px] h-[14px] text-[#25D366] shrink-0" />
                Falar no WhatsApp
              </a>
            </div>
          </div>
        </div>

        {/* Z-20 — floating booking widget */}
        <div
          className="absolute z-[20]"
          style={{
            bottom: '52px',
            left: '50%',
            transform: 'translateX(-50%)',
            width: 'min(1120px, calc(100% - 80px))',
          }}
        >
          <BookingWidget />
        </div>
      </section>

      {/* ──────────────────────────────────────────────────
          MOBILE HERO
      ────────────────────────────────────────────────── */}
      <section
        className="md:hidden relative overflow-hidden"
        style={{ height: 'calc(100svh - 64px)', minHeight: '620px' }}
      >
        {/* Background */}
        <div className="absolute inset-0">
          {hasImage ? (
            <Image
              src={HERO_IMG}
              alt="Vista da varanda da pousada com mar de Búzios ao fundo"
              fill
              priority
              className="object-cover object-center"
              sizes="100vw"
            />
          ) : (
            <div
              className="absolute inset-0"
              style={{
                background:
                  'linear-gradient(175deg, #001e36 0%, #002B4A 40%, #004d80 80%, #0077b6 100%)',
              }}
            />
          )}
        </div>

        {/* Bottom gradient */}
        <div
          className="absolute inset-x-0 bottom-0 h-[65%] pointer-events-none"
          style={{
            background:
              'linear-gradient(to top, rgba(0,12,28,0.84) 0%, rgba(0,12,28,0.52) 44%, transparent 100%)',
          }}
        />

        {/* Bottom content */}
        <div className="absolute bottom-0 inset-x-0 px-6 pb-8">
          <p className="text-[10px] font-bold text-white/60 uppercase tracking-[0.3em] mb-3">
            Beira-mar · Búzios · RJ
          </p>
          <h1 className="font-serif text-[30px] font-bold text-white leading-[1.1] mb-5">
            Acorde de frente para o mar em Búzios
          </h1>
          <div className="flex flex-col gap-2.5">
            <a
              href="/quartos"
              className="flex items-center justify-center gap-2.5 bg-white text-ocean-900 py-3.5 rounded-xl font-bold text-[13px] uppercase tracking-[0.08em]"
            >
              <CalendarIcon />
              Consultar disponibilidade
            </a>
            <a
              href={waHref}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2.5 border-2 border-white/40 text-white py-3.5 rounded-xl font-bold text-[13px] uppercase tracking-[0.08em]"
            >
              <WhatsAppIcon className="w-[16px] h-[16px] text-[#25D366] shrink-0" />
              Falar no WhatsApp
            </a>
          </div>
        </div>
      </section>

      {/* Mobile booking widget */}
      <div className="md:hidden bg-white px-4 pt-4 pb-8 border-b border-ocean-100">
        <BookingWidget />
      </div>
    </>
  )
}

function CalendarIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="w-[15px] h-[15px] shrink-0"
      aria-hidden="true"
    >
      <rect x={3} y={4} width={18} height={18} rx={2} />
      <line x1={16} y1={2} x2={16} y2={6} />
      <line x1={8} y1={2} x2={8} y2={6} />
      <line x1={3} y1={10} x2={21} y2={10} />
    </svg>
  )
}

function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
    </svg>
  )
}
