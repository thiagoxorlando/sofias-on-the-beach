const WA_MSG = encodeURIComponent(
  "Olá! Gostaria de consultar disponibilidade na pousada Sofia's on the Beach."
)

export function FinalCTA() {
  const phone = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? '5522999999999'
  const waHref = `https://wa.me/${phone}?text=${WA_MSG}`

  return (
    <section className="relative bg-ocean-900 py-16 md:py-20 px-6 md:px-10 overflow-hidden">

      {/* Very subtle bottom glow */}
      <div
        className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[600px] h-[180px] pointer-events-none"
        style={{ background: 'radial-gradient(ellipse at bottom, rgba(0,111,182,0.09) 0%, transparent 70%)' }}
      />

      <div className="relative max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-[340px_1fr] gap-10 md:gap-16 items-center">

          {/* ── Left: brand anchor — horizontal icon + wordmark ── */}
          <div className="flex items-center gap-4 md:border-r md:border-white/10 md:pr-16">
            <SofiasMark className="w-[56px] h-[56px] text-ocean-300 shrink-0" />
            <div>
              <p className="font-serif text-[34px] md:text-[38px] font-bold text-white leading-none tracking-tight">
                SOFIA&apos;S
              </p>
              <p className="text-[10px] font-semibold text-ocean-400 uppercase tracking-[0.20em] mt-1.5">
                on the beach
              </p>
            </div>
          </div>

          {/* ── Right: CTA ── */}
          <div>
            <h2
              className="font-serif font-bold text-white leading-[1.1] mb-4"
              style={{ fontSize: 'clamp(28px, 3.8vw, 52px)' }}
            >
              Reserve direto com Sofia&apos;s on the Beach
            </h2>
            <p className="text-[14px] md:text-[15px] text-ocean-300 leading-[1.7] mb-8" style={{ maxWidth: '560px' }}>
              A melhor tarifa garantida, atendimento personalizado e condições exclusivas
              para sua estadia à beira-mar.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              {/* Primary — blue filled */}
              <a
                href="/quartos"
                className="inline-flex items-center justify-center gap-2.5 bg-ocean-600 text-white px-7 py-3.5 rounded-xl text-[12px] font-bold uppercase tracking-[0.12em] hover:bg-ocean-500 transition-colors shadow-md whitespace-nowrap"
              >
                <CalendarIcon />
                Ver disponibilidade
              </a>
              {/* Secondary — outlined */}
              <a
                href={waHref}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2.5 border border-white/25 text-white px-7 py-3.5 rounded-xl text-[12px] font-bold uppercase tracking-[0.12em] hover:bg-white/10 transition-colors whitespace-nowrap"
              >
                <WhatsAppIcon />
                Falar no WhatsApp
              </a>
            </div>
          </div>

        </div>
      </div>
    </section>
  )
}

function SofiasMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 40" fill="none" className={className} aria-hidden="true">
      <path d="M10 36 L10 20 A10 10 0 0 1 30 20 L30 36" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M4 38 Q12 34 20 38 T36 38" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  )
}

function CalendarIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 shrink-0" aria-hidden="true">
      <rect x={3} y={4} width={18} height={18} rx={2} ry={2} />
      <line x1={16} y1={2} x2={16} y2={6} />
      <line x1={8} y1={2} x2={8} y2={6} />
      <line x1={3} y1={10} x2={21} y2={10} />
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
