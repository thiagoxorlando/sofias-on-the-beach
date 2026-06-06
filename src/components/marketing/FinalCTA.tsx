const WA_MSG = encodeURIComponent(
  "Olá! Gostaria de consultar disponibilidade na pousada Sofia's on the Beach."
)

export function FinalCTA() {
  const phone = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? '5522999999999'
  const waHref = `https://wa.me/${phone}?text=${WA_MSG}`

  return (
    <section className="relative bg-gradient-to-br from-ocean-900 via-ocean-800 to-ocean-700 overflow-hidden py-24 md:py-32 px-6 md:px-10">

      {/* Large arch silhouette — Mykonos architectural motif */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] rounded-t-full bg-ocean-800/30 pointer-events-none" />
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[360px] h-[180px] rounded-t-full bg-ocean-700/25 pointer-events-none" />

      {/* Sun glow — center top */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-96 rounded-full bg-ocean-400/15 blur-3xl pointer-events-none" />
      {/* Corner glows */}
      <div className="absolute bottom-0 right-0 w-64 h-64 rounded-full bg-ocean-500/10 blur-2xl pointer-events-none" />
      <div className="absolute top-8 left-0 w-48 h-48 rounded-full bg-ocean-600/15 blur-2xl pointer-events-none" />

      {/* Sun circle decoration */}
      <div className="absolute top-12 right-12 md:right-24 w-32 h-32 rounded-full border border-white/10 pointer-events-none" />
      <div className="absolute top-16 right-16 md:right-28 w-20 h-20 rounded-full border border-white/15 pointer-events-none" />

      <div className="relative max-w-3xl mx-auto text-center">

        {/* Logo mark in white */}
        <div className="flex items-center justify-center gap-3 mb-8">
          <SofiasMark className="w-10 h-10 text-ocean-300" />
          <div className="flex flex-col leading-none text-left">
            <span className="font-serif text-lg font-bold text-white leading-none">Sofia&apos;s</span>
            <span className="text-[9px] font-bold text-ocean-400 uppercase tracking-[0.18em] mt-0.5">on the Beach</span>
          </div>
        </div>

        <p className="text-[11px] font-bold text-ocean-300 uppercase tracking-widest mb-6">
          Reserva direta
        </p>

        <h2 className="font-serif text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-[1.1] mb-6">
          Reserve direto com<br className="hidden sm:block" /> Sofia&apos;s on the Beach
        </h2>

        <p className="text-ocean-200 text-base md:text-lg leading-relaxed mb-10 max-w-lg mx-auto">
          Fale com a equipe e consulte as melhores condições<br className="hidden sm:block" />
          para sua estadia à beira-mar.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <a
            href="/quartos"
            className="inline-flex items-center justify-center bg-white text-ocean-900 px-8 py-4 rounded-xl font-semibold text-sm hover:bg-ocean-50 transition-colors shadow-lg"
          >
            Consultar disponibilidade
          </a>
          <a
            href={waHref}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2.5 bg-white/10 border border-white/20 text-white px-8 py-4 rounded-xl font-semibold text-sm hover:bg-white/20 transition-colors backdrop-blur-sm"
          >
            <WhatsAppIcon className="w-4 h-4 text-[#25D366] shrink-0" />
            Falar no WhatsApp
          </a>
        </div>

        {/* Wave accent */}
        <div className="mt-10 flex justify-center opacity-40">
          <WaveAccent className="w-32 text-ocean-300" />
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

function WaveAccent({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 160 20" fill="none" className={className} aria-hidden="true">
      <path d="M0 10 Q20 2 40 10 T80 10 T120 10 T160 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
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
