const WA_MSG = encodeURIComponent(
  "Olá! Gostaria de consultar disponibilidade na pousada Sofia's on the Beach."
)

export function FinalCTA() {
  const phone = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? '5522999999999'
  const waHref = `https://wa.me/${phone}?text=${WA_MSG}`

  return (
    <section className="bg-ocean-900 py-20 px-6 md:px-10">
      <div className="max-w-3xl mx-auto text-center">

        <p className="text-ocean-400 text-xs font-bold uppercase tracking-widest mb-4">
          Reserve agora
        </p>

        <h2 className="font-serif text-3xl md:text-4xl lg:text-5xl font-bold text-white leading-[1.15] mb-5">
          Reserve direto com Sofia&apos;s on the Beach
        </h2>

        <p className="text-ocean-300 text-base md:text-lg leading-relaxed mb-10 max-w-xl mx-auto">
          Garanta a melhor tarifa, atendimento personalizado e comunicação direta
          com a equipe da pousada. Sem intermediários.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <a
            href="/quartos"
            className="inline-flex items-center justify-center bg-white text-ocean-900 px-8 py-4 rounded-xl font-semibold text-sm hover:bg-ocean-50 transition-colors shadow-sm"
          >
            Consultar disponibilidade
          </a>
          <a
            href={waHref}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2.5 bg-ocean-800 border border-ocean-700 text-white px-8 py-4 rounded-xl font-semibold text-sm hover:bg-ocean-700 transition-colors"
          >
            <WhatsAppIcon className="w-4 h-4 text-[#25D366] shrink-0" />
            Falar no WhatsApp
          </a>
        </div>

        {/* Trust line */}
        <p className="text-ocean-500 text-xs mt-8 font-medium tracking-wide">
          Reservas diretas · Melhor tarifa garantida · Atendimento pelo WhatsApp
        </p>
      </div>
    </section>
  )
}

function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
    </svg>
  )
}
