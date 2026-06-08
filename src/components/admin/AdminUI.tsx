import Link from 'next/link'
import { cn } from '@/lib/utils'

// ─────────────────────────────────────────────────────────────────────────────
// Sofia's — Admin / Staff Panel design system primitives
//
// Shared building blocks for the operations dashboard (reception, reservations,
// guests, …). Calm, "command-center" register: white/off-white surfaces, deep
// navy for primary actions, controlled blue for links, soft borders, generous
// spacing. Kept intentionally small — compose these instead of adding new ones.
// ─────────────────────────────────────────────────────────────────────────────

export type AdminTone = 'navy' | 'success' | 'warning' | 'danger' | 'info' | 'neutral'

const TONE_SOFT: Record<AdminTone, string> = {
  navy:    'bg-ocean-50 text-ocean-700',
  success: 'bg-emerald-50 text-emerald-700',
  warning: 'bg-amber-50 text-amber-700',
  danger:  'bg-red-50 text-red-600',
  info:    'bg-ocean-50 text-ocean-600',
  neutral: 'bg-slate-100 text-slate-500',
}

// ── AdminPageHeader ──────────────────────────────────────────────────────────
// eyebrow / title / short subtitle / optional primary action

export function AdminPageHeader({
  eyebrow,
  title,
  subtitle,
  action,
}: {
  eyebrow?: string
  title: string
  subtitle?: string
  action?: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        {eyebrow && (
          <p className="text-[11px] font-semibold text-ocean-500 uppercase tracking-[0.2em] mb-1.5">
            {eyebrow}
          </p>
        )}
        <h1 className="font-serif text-[26px] md:text-[30px] font-bold text-ocean-900">{title}</h1>
        {subtitle && <p className="text-[14px] text-ocean-500 mt-1.5 max-w-2xl">{subtitle}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  )
}

// ── AdminSection ─────────────────────────────────────────────────────────────
// titled section with optional count and consistent vertical rhythm

export function AdminSection({
  title,
  count,
  children,
}: {
  title: string
  count?: number
  children: React.ReactNode
}) {
  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="font-serif text-[18px] font-bold text-ocean-900">{title}</h2>
        {typeof count === 'number' && (
          <span className="text-[12px] font-semibold text-ocean-400">{count}</span>
        )}
      </div>
      {children}
    </section>
  )
}

// ── AdminCard ────────────────────────────────────────────────────────────────
// base surface — white card with soft border and consistent radius/padding

export function AdminCard({
  className,
  tone,
  children,
}: {
  className?: string
  tone?: 'default' | 'warning'
  children: React.ReactNode
}) {
  return (
    <div
      className={cn(
        'bg-white rounded-[18px] border p-5 md:p-6',
        tone === 'warning' ? 'border-amber-200 bg-amber-50/40' : 'border-ocean-100',
        className,
      )}
    >
      {children}
    </div>
  )
}

// ── AdminStatCard ────────────────────────────────────────────────────────────
// summary metric card for the top of operational pages

export function AdminStatCard({
  label,
  value,
  tone = 'navy',
  hint,
}: {
  label: string
  value: string | number
  tone?: AdminTone
  hint?: string
}) {
  return (
    <div className="bg-white rounded-[18px] border border-ocean-100 p-4 md:p-5">
      <p className="text-[12px] font-medium text-ocean-500">{label}</p>
      <p
        className={cn(
          'font-serif text-[24px] font-bold mt-1.5 inline-flex items-center rounded-xl px-2.5 py-0.5 -mx-2.5',
          TONE_SOFT[tone],
        )}
      >
        {value}
      </p>
      {hint && <p className="text-[12px] text-ocean-400 mt-1.5">{hint}</p>}
    </div>
  )
}

// ── AdminActionButton ────────────────────────────────────────────────────────
// consistent button/link styling across admin pages

export type AdminButtonVariant = 'primary' | 'secondary' | 'danger' | 'link'

const BUTTON_BASE =
  'inline-flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap'

const BUTTON_VARIANTS: Record<AdminButtonVariant, string> = {
  primary:
    'rounded-xl bg-ocean-900 text-white px-4 py-2.5 text-[13px] font-semibold hover:bg-ocean-800',
  secondary:
    'rounded-xl border border-ocean-200 text-ocean-700 px-4 py-2.5 text-[13px] font-semibold hover:bg-ocean-50',
  danger:
    'rounded-xl border border-red-200 text-red-600 px-4 py-2.5 text-[13px] font-semibold hover:bg-red-50',
  link:
    'text-ocean-600 hover:text-ocean-900 text-[13px] font-semibold',
}

type AdminActionButtonProps = {
  variant?: AdminButtonVariant
  className?: string
  children: React.ReactNode
} & (
  | ({ href: string } & Omit<React.ComponentProps<typeof Link>, 'href' | 'className'>)
  | ({ href?: undefined } & React.ButtonHTMLAttributes<HTMLButtonElement>)
)

export function AdminActionButton({ variant = 'secondary', className, children, ...rest }: AdminActionButtonProps) {
  const cls = cn(BUTTON_BASE, BUTTON_VARIANTS[variant], className)

  if ('href' in rest && rest.href) {
    const { href, ...linkRest } = rest as { href: string } & Omit<React.ComponentProps<typeof Link>, 'href' | 'className'>
    return (
      <Link href={href} className={cls} {...linkRest}>
        {children}
      </Link>
    )
  }

  const buttonRest = rest as React.ButtonHTMLAttributes<HTMLButtonElement>
  return (
    <button type="button" className={cls} {...buttonRest}>
      {children}
    </button>
  )
}

// ── AdminStatusBadge ─────────────────────────────────────────────────────────
// generic pill badge — pass a tone + label (use for any status, not just
// reservation/payment, which keep their own label maps in badges.tsx)

export function AdminStatusBadge({
  label,
  tone = 'neutral',
  className,
}: {
  label: string
  tone?: AdminTone
  className?: string
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold whitespace-nowrap',
        TONE_SOFT[tone],
        className,
      )}
    >
      {label}
    </span>
  )
}

// ── AdminSearchPanel ─────────────────────────────────────────────────────────
// consistent shell for search/filter forms

export function AdminSearchPanel({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-[18px] border border-ocean-100 p-4 md:p-5 space-y-3.5">
      {children}
    </div>
  )
}

// ── AdminEmptyState ──────────────────────────────────────────────────────────

export function AdminEmptyState({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-[18px] border border-ocean-100 py-14 text-center text-[13px] text-ocean-400">
      {children}
    </div>
  )
}

// ── AdminListCard ────────────────────────────────────────────────────────────
// operational record card: top line (title + badges + meta), a row of labelled
// fields, optional notes, and a bottom action row. Used for reservation,
// reception and guest cards alike.

export function AdminListCard({
  title,
  titleMeta,
  badges,
  meta,
  fields,
  notes,
  actions,
  tone,
}: {
  title: string
  titleMeta?: string
  badges?: React.ReactNode
  meta?: string
  fields?: { label: string; value: React.ReactNode }[]
  notes?: { label: string; text: string }[]
  actions?: React.ReactNode
  tone?: 'default' | 'warning'
}) {
  return (
    <AdminCard tone={tone}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-semibold text-ocean-900 text-[14px]">{title}</p>
            {badges}
          </div>
          {titleMeta && <p className="text-[12px] text-ocean-400 mt-0.5 truncate">{titleMeta}</p>}
        </div>
        {meta && <span className="font-mono text-[11px] text-ocean-500 shrink-0">{meta}</span>}
      </div>

      {fields && fields.length > 0 && (
        <div className="flex flex-wrap items-start gap-x-6 gap-y-3 mt-3.5 pt-3.5 border-t border-ocean-50">
          {fields.map((f, i) => (
            <div key={i} className="min-w-0">
              <p className="text-[11px] font-medium text-ocean-400 mb-0.5">{f.label}</p>
              <div className="text-[13px] font-medium text-ocean-900 whitespace-nowrap">{f.value}</div>
            </div>
          ))}
        </div>
      )}

      {notes && notes.length > 0 && (
        <div className="space-y-2 mt-3">
          {notes.map((n, i) => (
            <p key={i} className="text-[12px] text-ocean-600 bg-ocean-50/60 rounded-xl px-3.5 py-2.5 leading-relaxed">
              <span className="font-semibold">{n.label}:</span> {n.text}
            </p>
          ))}
        </div>
      )}

      {actions && (
        <div className="mt-3.5 pt-3.5 border-t border-ocean-50">
          {actions}
        </div>
      )}
    </AdminCard>
  )
}
