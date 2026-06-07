// Shared style primitives for guest-facing pages (entrar, criar-conta,
// minha-conta, quartos, reservar, reserva) — unified with the landing page's
// brand identity: white surfaces, pale ocean borders, deep-navy CTAs, large
// editorial type. Keeps the premium register consistent without redefining
// classes on every page.

import type { ReactNode } from 'react'

// ── Layout ───────────────────────────────────────────────────────────────────

export const PAGE_SURFACE = 'bg-gradient-to-b from-white to-ivory min-h-screen'

const CONTAINER_WIDTH: Record<'narrow' | 'medium' | 'default' | 'wide', string> = {
  narrow:  'max-w-[480px]',   // entrar / criar-conta cards
  medium:  'max-w-[800px]',   // reserva/[token] — single booking/payment column
  default: 'max-w-[1100px]',  // minha-conta dashboard & reservation lists
  wide:    'max-w-[1240px]',  // quartos browsing, reservar checkout
}

export function Container({
  children,
  size = 'default',
  className = '',
}: {
  children: ReactNode
  size?: 'narrow' | 'medium' | 'default' | 'wide'
  className?: string
}) {
  return <div className={`${CONTAINER_WIDTH[size]} mx-auto px-6 md:px-10 ${className}`}>{children}</div>
}

// ── Section / page headers ───────────────────────────────────────────────────

export function Eyebrow({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <p className={`text-[11px] font-bold text-navy/50 uppercase tracking-[0.28em] ${className}`}>
      {children}
    </p>
  )
}

export function PageHeader({
  eyebrow,
  title,
  description,
  className = '',
}: {
  eyebrow?: string
  title: string
  description?: string
  className?: string
}) {
  return (
    <div className={className}>
      {eyebrow && <Eyebrow className="mb-3">{eyebrow}</Eyebrow>}
      <h1
        className="font-serif font-bold text-navy-deep leading-[1.08]"
        style={{ fontSize: 'clamp(32px, 4vw, 48px)' }}
      >
        {title}
      </h1>
      {description && (
        <p className="text-[15px] md:text-[16px] text-stone mt-4 leading-relaxed max-w-2xl">{description}</p>
      )}
    </div>
  )
}

// ── Cards ────────────────────────────────────────────────────────────────────
// Clean white surfaces lifted off the page through soft shadow plus a hairline
// ocean border (foam, #DDEDEE) — the same combination the landing page's own
// cards use (border-ocean-100/60). Depth comes from shadow and tone, not from
// a harsh outline — this is what separates "luxury hotel" from "wireframe".

export const CARD =
  'bg-white border border-foam rounded-[28px] shadow-[0_28px_80px_-24px_rgba(0,40,80,0.20)]'

export const CARD_SOFT =
  'bg-white border border-foam rounded-[24px] shadow-[0_18px_54px_-20px_rgba(0,40,80,0.14)]'

export const CARD_INTERACTIVE =
  'transition-all duration-300 hover:shadow-[0_36px_100px_-22px_rgba(0,40,80,0.26)] hover:-translate-y-1'

export const PLACEHOLDER_GRADIENT =
  'linear-gradient(160deg, #DDEDEE 0%, #C9DCE3 50%, #AFCBD6 100%)'

// ── Buttons ──────────────────────────────────────────────────────────────────

export const BTN_PRIMARY =
  'inline-flex items-center justify-center gap-2 bg-navy-deep text-ivory font-bold uppercase tracking-[0.09em] rounded-2xl ' +
  'transition-all duration-300 hover:bg-navy hover:shadow-[0_16px_44px_-8px_rgba(0,40,80,0.40)] shadow-[0_10px_32px_-6px_rgba(0,40,80,0.28)] ' +
  'disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none'

export const BTN_SECONDARY =
  'inline-flex items-center justify-center gap-2 bg-white text-navy-deep font-semibold rounded-2xl border border-foam ' +
  'shadow-[0_8px_28px_-10px_rgba(0,40,80,0.16)] transition-all duration-300 hover:shadow-[0_14px_40px_-10px_rgba(0,40,80,0.22)] hover:-translate-y-0.5'

export const BTN_GHOST =
  'inline-flex items-center gap-1.5 text-stone hover:text-navy-deep transition-colors font-medium'

// ── Forms ────────────────────────────────────────────────────────────────────

export const LABEL = 'block text-[11px] font-bold text-navy uppercase tracking-[0.12em] mb-2'

export const INPUT =
  'w-full px-4 py-3.5 rounded-2xl border border-foam bg-white text-[14px] text-navy-deep ' +
  'placeholder:text-stone/45 outline-none shadow-[inset_0_1px_2px_rgba(0,40,80,0.04)] ' +
  'focus:border-ocean-300 focus:ring-2 focus:ring-ocean-400/15 transition-shadow'

// ── Reservation status badge ─────────────────────────────────────────────────

const STATUS_LABELS: Record<string, string> = {
  pending_payment: 'Aguardando pagamento',
  confirmed:       'Confirmada',
  cancelled:       'Cancelada',
  checked_in:      'Check-in realizado',
  checked_out:     'Check-out realizado',
}

const STATUS_TONES: Record<string, string> = {
  pending_payment: 'bg-warm-sand/30 text-navy',
  confirmed:       'bg-emerald-100 text-emerald-700',
  cancelled:       'bg-red-100 text-red-600',
  checked_in:      'bg-mist/45 text-navy',
  checked_out:     'bg-foam text-navy/55',
}

export function StatusBadge({ status, compact = false }: { status: string; compact?: boolean }) {
  const label = STATUS_LABELS[status] ?? status
  const tone = STATUS_TONES[status] ?? 'bg-driftwood/25 text-navy'
  return (
    <span
      className={`inline-flex items-center rounded-full font-bold uppercase tracking-wide shrink-0 ${tone} ${
        compact ? 'px-3 py-1.5 text-[10px]' : 'px-4 py-2 text-[11px]'
      }`}
    >
      {label}
    </span>
  )
}

// ── Payment status badge ─────────────────────────────────────────────────────

const PAYMENT_LABELS: Record<string, string> = {
  pending:   'Pagamento pendente',
  confirmed: 'Pagamento confirmado',
  failed:    'Pagamento recusado',
  refunded:  'Pagamento estornado',
}

const PAYMENT_TONES: Record<string, string> = {
  pending:   'bg-warm-sand/25 text-navy',
  confirmed: 'bg-emerald-50 text-emerald-700',
  failed:    'bg-red-50 text-red-600',
  refunded:  'bg-foam text-navy/55',
}

export function PaymentBadge({ status, compact = false }: { status: string; compact?: boolean }) {
  const label = PAYMENT_LABELS[status] ?? status
  const tone = PAYMENT_TONES[status] ?? 'bg-driftwood/20 text-navy'
  return (
    <span
      className={`inline-flex items-center rounded-full font-bold uppercase tracking-wide shrink-0 ${tone} ${
        compact ? 'px-3 py-1.5 text-[10px]' : 'px-3.5 py-2 text-[11px]'
      }`}
    >
      {label}
    </span>
  )
}
