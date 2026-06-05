const WA_MSG = encodeURIComponent(
  "Olá! Gostaria de fazer uma reserva na pousada Sofia's on the Beach."
)

export function HeroSection() {
  const phone = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? '5522999999999'
  const waHref = `https://wa.me/${phone}?text=${WA_MSG}`

  return (
    <section className="bg-background overflow-hidden">
      <div className="max-w-6xl mx-auto px-6 md:px-10">
        <div className="flex flex-col lg:flex-row lg:items-center lg:min-h-[88vh] gap-10 lg:gap-16 py-12 lg:py-0">

          {/* Content — below image on mobile, left on desktop */}
          <div className="flex-1 order-2 lg:order-1 lg:py-16">

            {/* Trust tags */}
            <div className="flex flex-wrap gap-2 mb-7">
              {['Beira-mar', 'Búzios, RJ', 'Reserva direta'].map((tag) => (
                <span
                  key={tag}
                  className="text-xs font-bold text-ocean-600 bg-ocean-50 border border-ocean-100 px-3 py-1 rounded-full tracking-wide"
                >
                  {tag}
                </span>
              ))}
            </div>

            {/* Headline */}
            <h1 className="font-serif text-4xl md:text-5xl lg:text-[3.25rem] font-bold text-foreground leading-[1.1] mb-6">
              Hospede-se de frente para o mar em Búzios
            </h1>

            {/* Subheadline */}
            <p className="text-base md:text-lg text-muted-foreground leading-relaxed mb-10 max-w-lg">
              Uma pousada boutique à beira-mar, com vista privilegiada para o
              oceano e atendimento direto para sua reserva.
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-3">
              <a
                href="/quartos"
                className="inline-flex items-center justify-center bg-primary text-primary-foreground px-8 py-4 rounded-xl font-semibold text-sm hover:bg-ocean-700 transition-colors shadow-sm"
              >
                Reservar agora
              </a>
              <a
                href={waHref}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2.5 bg-white border border-border text-foreground px-8 py-4 rounded-xl font-semibold text-sm hover:bg-muted/50 transition-colors shadow-sm"
              >
                <WhatsAppIcon className="w-4 h-4 text-[#25D366] shrink-0" />
                Falar no WhatsApp
              </a>
            </div>
          </div>

          {/* Image — top on mobile, right on desktop */}
          <div className="flex-1 order-1 lg:order-2">
            <div className="relative w-full h-72 sm:h-96 lg:h-[88vh] rounded-3xl overflow-hidden">

              {/* Gradient base */}
              <div className="absolute inset-0 bg-gradient-to-br from-ocean-200 via-ocean-400 to-ocean-700" />

              {/* Atmospheric overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-ocean-900/50 via-transparent to-transparent" />

              {/* Light reflection */}
              <div className="absolute top-8 right-10 w-36 h-36 rounded-full bg-white/10 blur-2xl pointer-events-none" />
              <div className="absolute top-14 right-20 w-10 h-10 rounded-full bg-white/25 pointer-events-none" />

              {/* Center placeholder label */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <div className="w-14 h-14 rounded-full bg-white/15 border border-white/25 flex items-center justify-center mx-auto mb-3">
                    <WavesIcon className="w-6 h-6 text-white/70" />
                  </div>
                  <span className="text-white/60 text-sm tracking-wide font-medium">
                    Vista privilegiada para o oceano
                  </span>
                </div>
              </div>

              {/* Location badge */}
              <div className="absolute bottom-6 left-6">
                <div className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-md border border-white/20 rounded-xl px-4 py-2.5">
                  <MapPinIcon className="w-3.5 h-3.5 text-white shrink-0" />
                  <span className="text-white text-xs font-medium">
                    Búzios, RJ · Frente ao oceano
                  </span>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  )
}

/* ── Inline icons ── */

function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
    </svg>
  )
}

function WavesIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" className={className} aria-hidden="true">
      <path d="M2 6c.6.5 1.2 1 2.5 1C7 7 7 5 9.5 5s2.5 2 5 2 2.5-2 5-2" />
      <path d="M2 12c.6.5 1.2 1 2.5 1C7 13 7 11 9.5 11s2.5 2 5 2 2.5-2 5-2" />
      <path d="M2 18c.6.5 1.2 1 2.5 1C7 19 7 17 9.5 17s2.5 2 5 2 2.5-2 5-2" />
    </svg>
  )
}

function MapPinIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
      <circle cx={12} cy={10} r={3} />
    </svg>
  )
}
