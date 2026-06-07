import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import fs from 'node:fs'
import path from 'node:path'
import { createAdminClient } from '@/lib/supabase/admin'
import { PaymentSection } from './PaymentSection'
import type { InitialPayment } from './PaymentSection'
import { PAGE_SURFACE, Container, CARD, Eyebrow, BTN_PRIMARY, BTN_SECONDARY, StatusBadge } from '@/components/booking/ui'

export const metadata: Metadata = {
  title: "Pré-reserva criada — Sofia's on the Beach",
  robots: { index: false },
}

const WA_NUMBER = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? '5522999999999'

const MONTHS_PT = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez']
function formatDate(dateStr: string): string {
  const [, m, d] = dateStr.split('-').map(Number)
  return `${d} ${MONTHS_PT[m - 1]}`
}

function formatBRL(value: number): string {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(value)
}

function localImgExists(src: string): boolean {
  return fs.existsSync(path.join(process.cwd(), 'public', src.replace(/^\//, '')))
}

export default async function ReservaPage({
  params,
}: {
  params: Promise<{ token: string }>
}) {
  const { token } = await params

  const db = createAdminClient()
  const { data: reservation } = await db
    .from('reservations')
    .select(`
      id, token, status, check_in, check_out, adults, total_brl, special_requests,
      rooms ( id, name, slug, room_images ( url, alt_text, is_cover, sort_order ) ),
      guests ( full_name, email )
    `)
    .eq('token', token)
    .single()

  if (!reservation) {
    return <NotFound />
  }

  // Load existing payment for pending_payment status (to restore UI on refresh)
  let existingPayment: InitialPayment = null
  let hasPaidPayment = false
  if (reservation.status === 'pending_payment') {
    const { data: paymentRow } = await db
      .from('payments')
      .select('method, asaas_invoice_url, asaas_pix_qr_code, asaas_pix_copy_paste, status')
      .eq('reservation_id', reservation.id)
      .neq('status', 'failed')
      .maybeSingle()
    if (paymentRow) {
      existingPayment = {
        method:       (paymentRow.method as 'pix' | 'card'),
        invoiceUrl:   paymentRow.asaas_invoice_url,
        pixQrCode:    paymentRow.asaas_pix_qr_code,
        pixCopyPaste: paymentRow.asaas_pix_copy_paste,
      }
    }
  } else if (reservation.status === 'confirmed') {
    // A reservation can be confirmed by staff without a paid charge backing it
    // (walk-ins, comp stays, arrangements settled outside the platform) — never
    // tell the guest "payment confirmed" unless a payments.status='paid' row exists.
    const { count } = await db
      .from('payments')
      .select('id', { count: 'exact', head: true })
      .eq('reservation_id', reservation.id)
      .eq('status', 'paid')
    hasPaidPayment = (count ?? 0) > 0
  }

  // Extract joined room
  type RoomImg = { url: string; alt_text: string | null; is_cover: boolean; sort_order: number }
  type RoomJoin = { id: string; name: string; slug: string; room_images: RoomImg[] }
  const roomData: RoomJoin | null =
    reservation.rooms && !Array.isArray(reservation.rooms)
      ? (reservation.rooms as RoomJoin)
      : null

  // Extract joined guest
  type GuestJoin = { full_name: string; email: string }
  const guestData: GuestJoin | null =
    reservation.guests && !Array.isArray(reservation.guests)
      ? (reservation.guests as GuestJoin)
      : null

  // Cover image
  const imgs = (roomData?.room_images ?? []).slice()
  imgs.sort((a, b) => a.sort_order - b.sort_order)
  const cover = imgs.find((i) => i.is_cover) ?? imgs[0] ?? null
  const imageUrl = cover?.url ?? (roomData ? `/images/rooms/${roomData.slug}.jpg` : null)
  const isExternal = !!imageUrl?.startsWith('http')
  const showImage = !!imageUrl && (isExternal || localImgExists(imageUrl))

  const nights = Math.round(
    (new Date(reservation.check_out + 'T00:00:00Z').getTime() -
      new Date(reservation.check_in + 'T00:00:00Z').getTime()) / 86_400_000,
  )

  const waMsg = encodeURIComponent(
    `Olá! Fiz uma pré-reserva no site com o código ${reservation.token}. Gostaria de confirmar.`,
  )
  const waHref = `https://wa.me/${WA_NUMBER}?text=${waMsg}`

  return (
    <section className={`${PAGE_SURFACE} py-12 md:py-20`}>
      <Container size="medium">

        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-100 mb-5">
            <CheckCircleIcon />
          </div>
          <Eyebrow className="mb-2 justify-center flex">Reserva registrada</Eyebrow>
          <h1 className="font-serif font-bold text-navy-deep mb-3" style={{ fontSize: 'clamp(30px, 3.6vw, 42px)' }}>
            Pré-reserva criada!
          </h1>
          <p className="text-[15px] text-stone max-w-md mx-auto leading-relaxed">
            Sua reserva foi registrada com sucesso. Aguarde a confirmação da nossa equipe.
          </p>
        </div>

        {/* Card */}
        <div className={`${CARD} overflow-hidden`}>

          {/* Room photo */}
          {showImage && imageUrl && (
            <div className="relative h-56 md:h-64 overflow-hidden">
              <Image
                src={imageUrl}
                alt={cover?.alt_text ?? roomData?.name ?? ''}
                fill
                unoptimized={isExternal}
                className="object-cover object-center"
                sizes="(max-width: 800px) 100vw, 800px"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-navy-deep/55 via-navy-deep/10 to-transparent" />
              <div className="absolute bottom-5 left-7 right-7 flex items-end justify-between gap-3">
                <div>
                  <p className="text-[10px] font-bold text-ivory/70 uppercase tracking-widest mb-1">
                    Código da reserva
                  </p>
                  <p className="font-serif text-[24px] font-bold text-ivory tracking-wide">
                    {reservation.token}
                  </p>
                </div>
                <StatusBadge status={reservation.status} />
              </div>
            </div>
          )}

          <div className="p-7 md:p-9 space-y-7">

            {/* Token + status — shown only when there's no photo to host it */}
            {!(showImage && imageUrl) && (
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                  <p className="text-[10px] font-bold text-stone/80 uppercase tracking-widest mb-1">
                    Código da reserva
                  </p>
                  <p className="font-serif text-[24px] font-bold text-navy-deep tracking-wide">
                    {reservation.token}
                  </p>
                </div>
                <StatusBadge status={reservation.status} />
              </div>
            )}

            {/* Booking details */}
            <div className="rounded-2xl bg-foam/40 px-6 py-5 space-y-3">
              {roomData && (
                <Row label="Acomodação" value={roomData.name} />
              )}
              <Row label="Check-in"  value={formatDate(reservation.check_in)} />
              <Row label="Check-out" value={formatDate(reservation.check_out)} />
              <Row
                label="Duração"
                value={`${nights} noite${nights > 1 ? 's' : ''} · ${reservation.adults} hóspede${reservation.adults > 1 ? 's' : ''}`}
              />
              <div className="flex justify-between items-center gap-4 pt-3 border-t border-mist/35">
                <span className="text-[14px] font-bold text-navy-deep">Total estimado</span>
                <span className="font-serif text-[22px] font-bold text-navy-deep">
                  {formatBRL(reservation.total_brl)}
                </span>
              </div>
            </div>

            {/* Guest */}
            {guestData && (
              <div className="space-y-3">
                <p className="text-[10px] font-bold text-stone/80 uppercase tracking-widest">Hóspede</p>
                <Row label="Nome"  value={guestData.full_name} />
                <Row label="E-mail" value={guestData.email} />
              </div>
            )}

            {/* Payment section / status message */}
            <div>
              {reservation.status === 'pending_payment' ? (
                <PaymentSection
                  reservationToken={reservation.token}
                  initialPayment={existingPayment}
                />
              ) : reservation.status === 'confirmed' ? (
                <div className="bg-emerald-50 rounded-2xl p-5">
                  <p className="text-[14px] text-emerald-700 font-medium leading-relaxed">
                    {hasPaidPayment
                      ? 'Pagamento confirmado. Sua reserva está garantida!'
                      : 'Reserva confirmada pela equipe. Pagamento será tratado diretamente com a pousada.'}
                  </p>
                </div>
              ) : (
                <div className="bg-foam/50 rounded-2xl p-5">
                  <p className="text-[14px] text-navy leading-relaxed">
                    Sua pré-reserva foi criada. O pagamento será ativado na próxima etapa.
                    Nossa equipe entrará em contato em breve para confirmar.
                  </p>
                </div>
              )}
            </div>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-3 pt-1">
              <a
                href={waHref}
                target="_blank"
                rel="noopener noreferrer"
                className={`flex-1 gap-2 py-3.5 text-[13px] ${BTN_PRIMARY}`}
              >
                <WAIcon />
                Falar no WhatsApp
              </a>
              <Link href="/quartos" className={`py-3.5 px-6 text-[13px] ${BTN_SECONDARY}`}>
                Ver outros quartos
              </Link>
            </div>

          </div>
        </div>

      </Container>
    </section>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-start gap-4">
      <span className="text-[13px] text-stone shrink-0">{label}</span>
      <span className="text-[14px] font-semibold text-navy text-right">{value}</span>
    </div>
  )
}

function NotFound() {
  return (
    <section className="bg-ivory min-h-[60vh] flex items-center py-20 md:py-32 px-6">
      <div className="max-w-md mx-auto text-center">
        <h1 className="font-serif text-[28px] font-bold text-navy-deep mb-4">
          Reserva não encontrada
        </h1>
        <p className="text-[14px] text-stone mb-8">
          Verifique o código ou entre em contato pelo WhatsApp.
        </p>
        <Link href="/" className={`px-8 py-3.5 text-[13px] ${BTN_PRIMARY}`}>
          Voltar ao início
        </Link>
      </div>
    </section>
  )
}

function CheckCircleIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-7 h-7 text-emerald-600" aria-hidden="true">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  )
}

function WAIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 shrink-0" aria-hidden="true">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
    </svg>
  )
}
