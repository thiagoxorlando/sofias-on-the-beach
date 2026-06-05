const WA_MSG = encodeURIComponent(
  "Olá! Gostaria de saber mais sobre a localização da pousada Sofia's on the Beach."
)

export function LocationSection() {
  const phone = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? '5522999999999'
  const waHref = `https://wa.me/${phone}?text=${WA_MSG}`

  return (
    <section className="bg-sand-50 py-20 px-6 md:px-10 border-y border-sand-200">
      <div className="max-w-6xl mx-auto">

        <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-20">

          {/* Text */}
          <div className="flex-1">
            <p className="text-xs font-bold text-ocean-500 uppercase tracking-widest mb-3">
              Localização
            </p>
            <h2 className="font-serif text-3xl md:text-4xl font-bold text-foreground mb-5">
              No coração de Búzios, frente ao oceano
            </h2>
            <div className="h-0.5 w-12 bg-accent rounded-full mb-6" />

            <p className="text-muted-foreground text-base leading-relaxed mb-4">
              A Sofia&apos;s on the Beach está localizada diretamente na orla de
              Búzios, em uma das posições mais privilegiadas da cidade. Com acesso
              imediato à praia e a poucos minutos do centro histórico e das melhores
              praias da região.
            </p>
            <p className="text-muted-foreground text-base leading-relaxed mb-8">
              Búzios é considerada um dos destinos mais charmosos do Brasil, com
              mais de 23 praias de diferentes perfis, gastronomia sofisticada e o
              relaxamento inconfundível do litoral fluminense.
            </p>

            {/* Location details */}
            <ul className="space-y-3 mb-8">
              {[
                'Acesso direto à praia',
                'A 2h30 do Rio de Janeiro',
                'Próximo ao centro histórico de Búzios',
                'Cercado pelas praias mais belas da região',
              ].map((item) => (
                <li key={item} className="flex items-start gap-3 text-sm text-foreground">
                  <CheckIcon className="w-4 h-4 text-ocean-500 shrink-0 mt-0.5" />
                  {item}
                </li>
              ))}
            </ul>

            <a
              href={waHref}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2.5 bg-primary text-primary-foreground px-7 py-3.5 rounded-xl font-semibold text-sm hover:bg-ocean-700 transition-colors shadow-sm"
            >
              <WhatsAppIcon className="w-4 h-4 text-white/80 shrink-0" />
              Falar sobre como chegar
            </a>
          </div>

          {/* Map placeholder */}
          <div className="flex-1 w-full lg:max-w-md">
            <div className="relative w-full h-80 lg:h-96 rounded-3xl overflow-hidden bg-ocean-50 border border-ocean-100 shadow-sm">

              {/* Grid lines (abstract map feel) */}
              <div className="absolute inset-0 opacity-20">
                {[20, 40, 60, 80].map((pct) => (
                  <div
                    key={`h-${pct}`}
                    className="absolute w-full h-px bg-ocean-400"
                    style={{ top: `${pct}%` }}
                  />
                ))}
                {[20, 40, 60, 80].map((pct) => (
                  <div
                    key={`v-${pct}`}
                    className="absolute h-full w-px bg-ocean-400"
                    style={{ left: `${pct}%` }}
                  />
                ))}
              </div>

              {/* Ocean area */}
              <div className="absolute bottom-0 left-0 right-0 h-2/5 bg-ocean-200/60 rounded-b-3xl" />

              {/* Land area */}
              <div className="absolute bottom-1/3 left-0 right-0 h-12 bg-sand-200/80" />

              {/* Location marker */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                <div className="relative flex flex-col items-center">
                  <div className="w-10 h-10 rounded-full bg-primary shadow-lg flex items-center justify-center">
                    <MapPinIcon className="w-5 h-5 text-white" />
                  </div>
                  <div className="mt-2 bg-white border border-border rounded-xl px-3 py-1.5 shadow-sm whitespace-nowrap">
                    <p className="text-xs font-bold text-foreground">Sofia&apos;s on the Beach</p>
                    <p className="text-[10px] text-muted-foreground">Búzios, RJ</p>
                  </div>
                  <div className="absolute -bottom-1 w-2 h-2 bg-primary rotate-45 -z-10 translate-y-3 left-1/2 -translate-x-1/2 shadow-sm" />
                </div>
              </div>

              {/* Corner label */}
              <div className="absolute top-4 left-4">
                <span className="text-[10px] font-bold text-ocean-400 uppercase tracking-widest">
                  Búzios · Rio de Janeiro
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

/* ── Inline icons ── */

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  )
}

function MapPinIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
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
