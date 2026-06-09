import type { Metadata } from 'next'
import Link from 'next/link'
import { getSiteSettings } from '@/lib/settings'

export const metadata: Metadata = {
  title: "Detalhes do quarto — Sofia's on the Beach",
  description:
    "Acomodação na pousada boutique Sofia's on the Beach à beira-mar em Búzios.",
}

export default async function RoomDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  await params
  const settings = await getSiteSettings()

  const waHref = `https://wa.me/${settings.whatsapp}?text=${encodeURIComponent(
    "Olá! Gostaria de reservar na pousada Sofia's on the Beach. Podem me ajudar com disponibilidade?",
  )}`

  const bookingEnabled = settings.onlineBookingEnabled

  return (
    <section className="bg-white py-20 md:py-32 px-6">
      <div className="max-w-lg mx-auto text-center">
        <p className="text-[11px] font-bold text-ocean-500 uppercase tracking-[0.25em] mb-5">
          {bookingEnabled ? 'Em breve' : 'Reservas via WhatsApp'}
        </p>
        <h1
          className="font-serif font-bold text-ocean-900 leading-tight mb-4"
          style={{ fontSize: 'clamp(24px, 3vw, 36px)' }}
        >
          {bookingEnabled ? 'Página em construção' : 'Consulte disponibilidade pelo WhatsApp'}
        </h1>
        <p className="text-[14px] text-foreground/60 leading-relaxed mb-10 max-w-sm mx-auto">
          {bookingEnabled
            ? 'A página de detalhes desta acomodação está sendo preparada. Entre em contato pelo WhatsApp para saber mais ou fazer sua reserva.'
            : 'Reservas online ainda não estão disponíveis. Fale conosco pelo WhatsApp para consultar disponibilidade e valores.'}
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <a
            href={waHref}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 bg-ocean-900 text-white px-7 py-3.5 rounded-xl text-[13px] font-bold hover:bg-ocean-800 transition-colors shadow-sm uppercase tracking-wide"
          >
            {bookingEnabled ? 'Falar no WhatsApp' : 'Consultar pelo WhatsApp'}
          </a>
          <Link
            href="/quartos"
            className="inline-flex items-center justify-center border border-ocean-200 text-ocean-700 px-7 py-3.5 rounded-xl text-[13px] font-semibold hover:border-ocean-400 hover:text-ocean-900 transition-colors"
          >
            ← Ver todas as suítes
          </Link>
        </div>
      </div>
    </section>
  )
}
