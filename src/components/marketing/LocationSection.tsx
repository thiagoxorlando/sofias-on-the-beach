import Image from 'next/image'

const WA_MSG = encodeURIComponent(
  "Olá! Gostaria de saber mais sobre como chegar na pousada Sofia's on the Beach."
)

export function LocationSection() {
  const phone = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? '5522999999999'
  const waHref = `https://wa.me/${phone}?text=${WA_MSG}`

  return (
    <section className="bg-white py-20 px-6 md:px-10">
      <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-12 md:gap-20 items-center">

        {/* Text */}
        <div>
          <p className="text-[11px] font-bold text-ocean-500 uppercase tracking-widest mb-3">
            Localização
          </p>
          <h2 className="font-serif text-3xl md:text-4xl font-bold text-foreground mb-5 leading-tight">
            No coração de Búzios,<br className="hidden sm:block" /> com o mar como cenário
          </h2>
          <p className="text-muted-foreground leading-relaxed mb-8">
            A Sofia&apos;s on the Beach está localizada diretamente na orla de Búzios,
            em uma das posições mais privilegiadas do litoral brasileiro. Acesso
            imediato à praia e a poucos minutos do centro histórico.
          </p>

          {/* Highlights */}
          <ul className="space-y-4 mb-10">
            {[
              { text: 'Acesso direto à praia', sub: 'Beira-mar · Búzios, RJ' },
              { text: 'Próximo ao centro histórico', sub: 'Rua das Pedras e Orla Bardot' },
              { text: 'Fácil contato pelo WhatsApp', sub: 'Atendimento direto com a equipe' },
              { text: 'Experiência exclusiva à beira-mar', sub: 'A 2h30 do Rio de Janeiro' },
            ].map((item) => (
              <li key={item.text} className="flex items-start gap-4">
                <span className="w-7 h-7 rounded-full bg-ocean-50 border border-ocean-100 flex items-center justify-center shrink-0 mt-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-ocean-400" />
                </span>
                <div>
                  <p className="text-sm font-medium text-foreground">{item.text}</p>
                  <p className="text-xs text-muted-foreground">{item.sub}</p>
                </div>
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

        {/* Visual — arch-framed location photo */}
        <div className="relative flex justify-center">

          {/* Decorative background circle */}
          <div className="absolute -top-10 -right-10 w-64 h-64 rounded-full border border-ocean-100 pointer-events-none" />
          <div className="absolute -top-4 -right-4 w-44 h-44 rounded-full bg-ocean-50 pointer-events-none" />

          {/* Main photo — arch-shaped for Mykonos motif */}
          <div className="relative w-[280px] md:w-[320px] lg:w-[360px] h-[380px] md:h-[420px] rounded-t-full rounded-b-3xl overflow-hidden shadow-2xl z-10">
            <Image
              src="/images/location/buzios-beachfront.jpg"
              alt="Vista da baía de Búzios com barcos e montanhas ao fundo, a partir da pousada"
              fill
              className="object-cover object-center"
              sizes="(max-width: 768px) 280px, 360px"
            />

            {/* Floating distance badge */}
            <div className="absolute bottom-14 inset-x-0 flex justify-center z-10">
              <div className="inline-flex items-center gap-2 bg-white/90 backdrop-blur-sm rounded-full px-4 py-1.5 shadow-md border border-white/80">
                <span className="w-1.5 h-1.5 rounded-full bg-ocean-400 shrink-0" />
                <span className="text-[10px] font-bold text-ocean-700 tracking-wide uppercase">
                  2h30 do Rio de Janeiro
                </span>
              </div>
            </div>
          </div>

          {/* Small accent card */}
          <div className="absolute -bottom-4 -left-4 z-20 bg-white rounded-2xl shadow-xl border border-ocean-100 px-4 py-3">
            <p className="text-[9px] font-bold text-ocean-500 uppercase tracking-widest mb-0.5">
              Localização
            </p>
            <p className="text-sm font-semibold text-foreground">Búzios, Rio de Janeiro</p>
          </div>
        </div>
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
