import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import fs from 'node:fs'
import path from 'node:path'
import { createAdminClient } from '@/lib/supabase/admin'

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

function formatStatus(status: string): string {
  const map: Record<string, string> = {
    pending_payment: 'Aguardando pagamento',
    confirmed:       'Confirmada',
    cancelled:       'Cancelada',
    checked_in:      'Check-in realizado',
    checked_out:     'Check-out realizado',
  }
  return map[status] ?? status
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
    <section className="bg-ocean-50 min-h-screen py-12 md:py-20 px-6 md:px-10">
      <div className="max-w-2xl mx-auto">

        {/* Success header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-emerald-100 mb-4">
            <CheckCircleIcon />
          </div>
          <h1 className="font-serif text-[28px] md:text-[34px] font-bold text-ocean-900 mb-2">
            Pré-reserva criada!
          </h1>
          <p className="text-[14px] text-ocean-500">
            Sua reserva foi registrada com sucesso. Aguarde a confirmação.
          </p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-[22px] border border-ocean-100 shadow-[0_4px_24px_rgba(0,40,80,0.08)] overflow-hidden">

          {/* Room photo strip */}
          {showImage && imageUrl && (
            <div className="relative h-36 overflow-hidden">
              <Image
                src={imageUrl}
                alt={cover?.alt_text ?? roomData?.name ?? ''}
                fill
                unoptimized={isExternal}
                className="object-cover object-center"
                sizes="(max-width: 672px) 100vw, 672px"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
            </div>
          )}

          <div className="p-6 md:p-8 space-y-6">

            {/* Token + status */}
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div>
                <p className="text-[10px] font-bold text-ocean-400 uppercase tracking-widest mb-1">
                  Código da reserva
                </p>
                <p className="font-serif text-[22px] font-bold text-ocean-900 tracking-wide">
                  {reservation.token}
                </p>
              </div>
              <span className="inline-flex items-center px-3.5 py-1.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-700 uppercase tracking-wide">
                {formatStatus(reservation.status)}
              </span>
            </div>

            {/* Booking details */}
            <div className="border-t border-ocean-50 pt-5 space-y-3">
              {roomData && (
                <Row label="Acomodação" value={roomData.name} />
              )}
              <Row label="Check-in"  value={formatDate(reservation.check_in)} />
              <Row label="Check-out" value={formatDate(reservation.check_out)} />
              <Row
                label="Duração"
                value={`${nights} noite${nights > 1 ? 's' : ''} · ${reservation.adults} hóspede${reservation.adults > 1 ? 's' : ''}`}
              />
              <div className="flex justify-between items-center gap-4 pt-2 border-t border-ocean-50">
                <span className="text-[14px] font-bold text-ocean-900">Total estimado</span>
                <span className="font-serif text-[20px] font-bold text-ocean-900">
                  {formatBRL(reservation.total_brl)}
                </span>
              </div>
            </div>

            {/* Guest */}
            {guestData && (
              <div className="border-t border-ocean-50 pt-5 space-y-3">
                <p className="text-[10px] font-bold text-ocean-400 uppercase tracking-widest">Hóspede</p>
                <Row label="Nome"  value={guestData.full_name} />
                <Row label="E-mail" value={guestData.email} />
              </div>
            )}

            {/* Info message */}
            <div className="border-t border-ocean-50 pt-5">
              <div className="bg-ocean-50 rounded-xl p-4">
                <p className="text-[13px] text-ocean-700 leading-relaxed">
                  Sua pré-reserva foi criada. O pagamento será ativado na próxima etapa.
                  Nossa equipe entrará em contato em breve para confirmar.
                </p>
              </div>
            </div>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-3">
              <a
                href={waHref}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 flex items-center justify-center gap-2 bg-ocean-900 text-white py-3.5 rounded-xl text-[13px] font-bold hover:bg-ocean-800 transition-colors shadow-sm"
              >
                <WAIcon />
                Falar no WhatsApp
              </a>
              <Link
                href="/quartos"
                className="flex items-center justify-center border border-ocean-200 text-ocean-700 py-3.5 px-6 rounded-xl text-[13px] font-semibold hover:border-ocean-400 hover:text-ocean-900 transition-colors"
              >
                Ver outros quartos
              </Link>
            </div>

          </div>
        </div>

      </div>
    </section>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-start gap-4">
      <span className="text-[13px] text-ocean-400 shrink-0">{label}</span>
      <span className="text-[13px] font-semibold text-ocean-800 text-right">{value}</span>
    </div>
  )
}

function NotFound() {
  return (
    <section className="bg-white py-20 md:py-32 px-6">
      <div className="max-w-md mx-auto text-center">
        <h1 className="font-serif text-[26px] font-bold text-ocean-900 mb-4">
          Reserva não encontrada
        </h1>
        <p className="text-[14px] text-foreground/60 mb-8">
          Verifique o código ou entre em contato pelo WhatsApp.
        </p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 bg-ocean-900 text-white px-8 py-3.5 rounded-xl text-[13px] font-bold hover:bg-ocean-800 transition-colors"
        >
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
