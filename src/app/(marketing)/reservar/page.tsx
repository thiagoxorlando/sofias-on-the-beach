import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import fs from 'node:fs'
import path from 'node:path'
import { requireGuest } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase/admin'
import { calculateRoomPriceForDates } from '@/lib/pricing'
import { getSiteSettings } from '@/lib/settings'
import { ReservationForm } from './ReservationForm'
import { PAGE_SURFACE, Container, CARD, CARD_SOFT, BTN_PRIMARY, PLACEHOLDER_GRADIENT } from '@/components/booking/ui'

export const metadata: Metadata = {
  title: "Reservar — Sofia's on the Beach",
  robots: { index: false },
}

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/

const MONTHS_PT_LONG = [
  'janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
  'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro',
]

function formatDateLong(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number)
  return `${d} de ${MONTHS_PT_LONG[m - 1]} de ${y}`
}

function countNights(checkIn: string, checkOut: string): number {
  return Math.round(
    (new Date(checkOut + 'T00:00:00Z').getTime() - new Date(checkIn + 'T00:00:00Z').getTime()) / 86_400_000,
  )
}

function formatBRL(value: number): string {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(value)
}

function localImgExists(src: string): boolean {
  return fs.existsSync(path.join(process.cwd(), 'public', src.replace(/^\//, '')))
}

type SP = Promise<{
  room_id?:   string | string[]
  check_in?:  string | string[]
  check_out?: string | string[]
  guests?:    string | string[]
}>

export default async function ReservarPage({ searchParams }: { searchParams: SP }) {
  const sp = await searchParams

  const roomId   = typeof sp.room_id   === 'string' ? sp.room_id   : null
  const checkIn  = typeof sp.check_in  === 'string' && ISO_DATE.test(sp.check_in)  ? sp.check_in  : null
  const checkOut = typeof sp.check_out === 'string' && ISO_DATE.test(sp.check_out) ? sp.check_out : null
  const guestsRaw = typeof sp.guests   === 'string' ? parseInt(sp.guests, 10) : NaN
  const guests   = !isNaN(guestsRaw) && guestsRaw >= 1 ? guestsRaw : 2

  if (!roomId || !checkIn || !checkOut || checkOut <= checkIn) {
    return <InvalidParams />
  }

  const nights = countNights(checkIn, checkOut)
  if (nights < 1) return <InvalidParams />

  // Check online booking toggle before any auth check — blocked visitors don't need to log in
  const settings = await getSiteSettings()
  if (!settings.onlineBookingEnabled) {
    return <BookingBlocked whatsapp={settings.whatsapp} />
  }

  // Auth + role check — blocks admin accounts, unauthenticated users, and users without a guest record
  const nextPath = `/reservar?room_id=${roomId}&check_in=${checkIn}&check_out=${checkOut}&guests=${guests}`
  const guest = await requireGuest(nextPath)

  // Fetch room data
  const adminDb = createAdminClient()
  const { data: room } = await adminDb
    .from('rooms')
    .select(`
      id, name, slug, base_price_brl, max_guests,
      room_categories ( name ),
      room_images ( url, alt_text, is_cover, sort_order )
    `)
    .eq('id', roomId)
    .eq('is_active', true)
    .single()

  if (!room) {
    return <InvalidParams message="Quarto não encontrado ou indisponível." />
  }

  // Resolve cover image
  type Img = { url: string; alt_text: string | null; is_cover: boolean; sort_order: number }
  const imgs = (Array.isArray(room.room_images) ? room.room_images : []) as Img[]
  const sorted = [...imgs].sort((a, b) => a.sort_order - b.sort_order)
  const cover = sorted.find((i) => i.is_cover) ?? sorted[0] ?? null
  const imageUrl = cover?.url ?? `/images/rooms/${room.slug}.jpg`
  const imageAlt = cover?.alt_text ?? `${room.name} em Búzios`
  const isExternal = imageUrl.startsWith('http')
  const showImage = isExternal || localImgExists(imageUrl)

  const catName =
    room.room_categories && !Array.isArray(room.room_categories)
      ? (room.room_categories as { name: string }).name
      : null

  const pricing = await calculateRoomPriceForDates(roomId, checkIn, checkOut)
  if (!pricing) {
    return <InvalidParams message="Quarto não encontrado ou indisponível." />
  }
  const { total, nightlyPrices } = pricing
  const uniformPrice = nightlyPrices.every((n) => n.price === nightlyPrices[0].price)
    ? nightlyPrices[0].price
    : null

  return (
    <section className={`${PAGE_SURFACE} py-12 md:py-20`}>
      <Container size="wide">

        <Link
          href="/quartos"
          className="inline-flex items-center gap-2 text-[12px] font-semibold text-stone hover:text-navy-deep transition-colors mb-8"
        >
          <ArrowLeftIcon />
          Voltar aos quartos
        </Link>

        <h1
          className="font-serif font-bold text-navy-deep leading-[1.08] mb-10 md:mb-12"
          style={{ fontSize: 'clamp(30px, 3.6vw, 44px)' }}
        >
          Confirmar pré-reserva
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 lg:gap-10 items-start">

          {/* ── Summary ─────────────────────────────────────────── */}
          <div className="lg:col-span-2 lg:sticky lg:top-28">
            <div className={`${CARD} overflow-hidden`}>

              <div className="relative aspect-[4/3] overflow-hidden">
                {showImage ? (
                  <Image
                    src={imageUrl}
                    alt={imageAlt}
                    fill
                    unoptimized={isExternal}
                    className="object-cover object-center"
                    sizes="(max-width: 1024px) 100vw, 40vw"
                  />
                ) : (
                  <div className="absolute inset-0" style={{ background: PLACEHOLDER_GRADIENT }} />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-navy-deep/30 to-transparent" />
                <div className="absolute bottom-5 left-6 right-6">
                  {catName && (
                    <p className="text-[10px] font-bold text-ivory/75 uppercase tracking-widest mb-1.5">
                      {catName}
                    </p>
                  )}
                  <h2 className="font-serif text-[22px] md:text-[24px] font-bold text-ivory leading-snug">
                    {room.name}
                  </h2>
                </div>
              </div>

              <div className="p-7 md:p-8 space-y-6">

                <div className="space-y-3">
                  <SummaryRow icon={<CalendarIcon />} label="Check-in"  value={formatDateLong(checkIn)} />
                  <SummaryRow icon={<CalendarIcon />} label="Check-out" value={formatDateLong(checkOut)} />
                  <SummaryRow
                    icon={<MoonIcon />}
                    label="Noites"
                    value={`${nights} noite${nights > 1 ? 's' : ''}`}
                  />
                  <SummaryRow
                    icon={<GuestsIcon />}
                    label="Hóspedes"
                    value={`${guests} hóspede${guests > 1 ? 's' : ''}`}
                  />
                </div>

                <div className="rounded-2xl bg-foam/45 px-5 py-4 space-y-2.5">
                  <div className="flex items-center justify-between text-[13px]">
                    <span className="text-stone">
                      {uniformPrice !== null
                        ? `${formatBRL(uniformPrice)} × ${nights} noite${nights > 1 ? 's' : ''}`
                        : `Tarifas sazonais · ${nights} noite${nights > 1 ? 's' : ''}`}
                    </span>
                    <span className="text-navy font-medium">{formatBRL(total)}</span>
                  </div>
                  <div className="flex items-center justify-between pt-2.5 border-t border-mist/35">
                    <span className="text-[14px] font-bold text-navy-deep">Total</span>
                    <span className="font-serif text-[22px] font-bold text-navy-deep">
                      {formatBRL(total)}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 text-[10px] text-stone font-semibold uppercase tracking-wide">
                  <LockIcon />
                  Melhor tarifa · Reserva direta
                </div>
              </div>
            </div>
          </div>

          {/* ── Guest form ──────────────────────────────────────── */}
          <div className="lg:col-span-3">
            <div className={`${CARD_SOFT} p-8 md:p-10`}>
              <h2 className="font-serif text-[22px] md:text-[24px] font-bold text-navy-deep mb-2">
                Seus dados
              </h2>
              <p className="text-[14px] text-stone mb-8">
                Confirme seus dados para finalizar a pré-reserva. Sem cobrança agora.
              </p>
              <ReservationForm
                roomId={roomId}
                checkIn={checkIn}
                checkOut={checkOut}
                guests={guests}
                guestName={guest.full_name}
                guestPhone={guest.phone ?? ''}
              />
            </div>
          </div>

        </div>
      </Container>
    </section>
  )
}

function SummaryRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-2.5">
      <span className="text-navy/45 shrink-0">{icon}</span>
      <span className="text-[12px] text-stone w-16 shrink-0">{label}</span>
      <span className="text-[13px] font-medium text-navy flex-1">{value}</span>
    </div>
  )
}

function BookingBlocked({ whatsapp }: { whatsapp: string }) {
  const waHref = `https://wa.me/${whatsapp}?text=${encodeURIComponent(
    "Olá! Gostaria de fazer uma reserva na pousada Sofia's on the Beach.",
  )}`
  return (
    <section className="bg-white py-20 md:py-32 px-6">
      <div className="max-w-md mx-auto text-center">
        <div className="w-12 h-12 rounded-2xl bg-foam/60 flex items-center justify-center mx-auto mb-6">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6 text-navy/50" aria-hidden="true">
            <rect x={3} y={11} width={18} height={11} rx={2} ry={2} />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
        </div>
        <h1 className="font-serif text-[26px] font-bold text-navy-deep mb-4">
          Reservas online em breve
        </h1>
        <p className="text-[14px] text-stone leading-relaxed mb-8">
          Estamos preparando a reserva direta pelo site. Por enquanto, fale conosco pelo WhatsApp
          para consultar disponibilidade e valores.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link href="/quartos" className={`px-7 py-3.5 text-[13px] ${BTN_PRIMARY}`} style={{ background: 'none', border: '1px solid', borderColor: 'var(--color-mist, #d1dbe8)', color: 'var(--color-navy, #0a2540)' }}>
            Ver quartos
          </Link>
          <a
            href={waHref}
            target="_blank"
            rel="noopener noreferrer"
            className={`flex items-center gap-2 px-8 py-3.5 text-[14px] ${BTN_PRIMARY}`}
          >
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 shrink-0" aria-hidden="true">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
            </svg>
            Falar no WhatsApp
          </a>
        </div>
      </div>
    </section>
  )
}

function InvalidParams({ message = 'Link inválido. Por favor, volte e selecione as datas.' }: { message?: string }) {
  return (
    <section className="bg-white py-20 md:py-32 px-6">
      <div className="max-w-md mx-auto text-center">
        <h1 className="font-serif text-[26px] font-bold text-navy-deep mb-4">Dados incompletos</h1>
        <p className="text-[14px] text-stone leading-relaxed mb-8">{message}</p>
        <Link href="/quartos" className={`px-8 py-3.5 text-[13px] ${BTN_PRIMARY}`}>
          Ver quartos disponíveis
        </Link>
      </div>
    </section>
  )
}

function ArrowLeftIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5" aria-hidden="true">
      <path d="M19 12H5M12 5l-7 7 7 7" />
    </svg>
  )
}

function CalendarIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5" aria-hidden="true">
      <rect x={3} y={4} width={18} height={18} rx={2} ry={2} />
      <line x1={3} y1={10} x2={21} y2={10} />
    </svg>
  )
}

function MoonIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5" aria-hidden="true">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  )
}

function GuestsIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5" aria-hidden="true">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx={9} cy={7} r={4} />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
    </svg>
  )
}

function LockIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" className="w-3 h-3 shrink-0" aria-hidden="true">
      <rect x={3} y={11} width={18} height={11} rx={2} ry={2} />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  )
}
