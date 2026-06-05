import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: "Sofia's on the Beach — Pousada Boutique em Búzios",
  description:
    "Hospede-se de frente para o mar em Búzios. Reserve diretamente e garanta a melhor tarifa na pousada boutique Sofia's on the Beach.",
}

const WA_MSG = encodeURIComponent(
  "Olá! Gostaria de saber mais sobre a pousada Sofia's on the Beach."
)

export default function HomePage() {
  const phone = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? '5522999999999'
  const waHref = `https://wa.me/${phone}?text=${WA_MSG}`

  return (
    <section className="flex flex-col items-center justify-center min-h-[calc(100svh-72px)] px-6 py-20 text-center bg-gradient-to-b from-ocean-50 via-background to-sand-50">

      {/* Badge */}
      <span className="inline-block text-xs font-bold text-ocean-500 tracking-widest uppercase bg-white border border-ocean-100 px-4 py-1.5 rounded-full mb-8 shadow-sm">
        Site oficial em construção
      </span>

      {/* Heading */}
      <h1 className="font-serif text-5xl md:text-6xl lg:text-7xl font-bold text-ocean-800 leading-[1.1] mb-5 max-w-2xl">
        Sofia&apos;s<br className="sm:hidden" /> on the Beach
      </h1>

      {/* Tagline */}
      <p className="font-serif text-xl md:text-2xl text-ocean-600/80 italic mb-4 max-w-lg leading-relaxed">
        Hospede-se de frente para o mar em Búzios
      </p>

      {/* Sub-copy */}
      <p className="text-sm text-muted-foreground mb-12 max-w-sm leading-relaxed">
        Nossa pousada boutique está chegando. Em breve você poderá explorar
        nossos quartos e fazer sua reserva diretamente conosco.
      </p>

      {/* CTAs */}
      <div className="flex flex-col sm:flex-row gap-3 w-full max-w-xs sm:max-w-none sm:w-auto">
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

      {/* Decorative wave */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-ocean-200 to-transparent pointer-events-none" />
    </section>
  )
}

function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden="true"
    >
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
    </svg>
  )
}
