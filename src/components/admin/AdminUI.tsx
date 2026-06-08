import Link from 'next/link'
import { cn } from '@/lib/utils'

// ─────────────────────────────────────────────────────────────────────────────
// Sofia's — Admin / Staff Panel design system primitives
//
// Light content-area components for the dark-sidebar admin shell.
// White cards with soft shadows, slate metadata, deep-navy headings.
// Tone system: navy / success / warning / danger / info / neutral.
// ─────────────────────────────────────────────────────────────────────────────

export type AdminTone = 'navy' | 'success' | 'warning' | 'danger' | 'info' | 'neutral'

const TONE_VALUE: Record<AdminTone, string> = {
  navy:    'text-[#061A2A]',
  success: 'text-emerald-600',
  warning: 'text-amber-600',
  danger:  'text-red-600',
  info:    'text-sky-600',
  neutral: 'text-slate-500',
}

const TONE_BADGE: Record<AdminTone, string> = {
  navy:    'bg-slate-100 text-slate-700',
  success: 'bg-emerald-50 text-emerald-700',
  warning: 'bg-amber-50 text-amber-700',
  danger:  'bg-red-50 text-red-600',
  info:    'bg-sky-50 text-sky-700',
  neutral: 'bg-slate-100 text-slate-500',
}

// ── AdminPageHeader ──────────────────────────────────────────────────────────

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
          <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-[0.18em] mb-2">
            {eyebrow}
          </p>
        )}
        <h1 className="text-[22px] md:text-[24px] font-bold text-slate-900 tracking-tight">{title}</h1>
        {subtitle && <p className="text-[14px] text-slate-500 mt-1.5 max-w-2xl">{subtitle}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  )
}

// ── AdminSection ─────────────────────────────────────────────────────────────

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
        <h2 className="text-[17px] font-semibold text-slate-800">{title}</h2>
        {typeof count === 'number' && (
          <span className="text-[12px] font-medium text-slate-400">{count}</span>
        )}
      </div>
      {children}
    </section>
  )
}

// ── AdminCard ────────────────────────────────────────────────────────────────

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
        'bg-white rounded-2xl border shadow-sm p-5 md:p-6',
        tone === 'warning' ? 'border-amber-200 bg-amber-50/50' : 'border-admin-border',
        className,
      )}
    >
      {children}
    </div>
  )
}

// ── AdminStatCard ────────────────────────────────────────────────────────────

const ICON_BG: Record<AdminTone, string> = {
  navy:    'bg-slate-100',
  success: 'bg-emerald-50',
  warning: 'bg-amber-50',
  danger:  'bg-red-50',
  info:    'bg-sky-50',
  neutral: 'bg-slate-100',
}

export function AdminStatCard({
  label,
  value,
  tone = 'navy',
  hint,
  icon,
}: {
  label: string
  value: string | number
  tone?: AdminTone
  hint?: string
  icon?: React.ReactNode
}) {
  return (
    <div className="bg-white rounded-2xl border border-admin-border shadow-sm p-4 md:p-5">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className="text-[12px] font-medium text-slate-500">{label}</p>
          <p className={cn('text-[28px] md:text-[30px] font-bold mt-2 leading-none tabular-nums', TONE_VALUE[tone])}>
            {value}
          </p>
          {hint && <p className="text-[11px] text-slate-400 mt-2 leading-relaxed">{hint}</p>}
        </div>
        {icon && (
          <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center shrink-0 mt-0.5', ICON_BG[tone])}>
            {icon}
          </div>
        )}
      </div>
    </div>
  )
}

// ── AdminActionButton ────────────────────────────────────────────────────────

export type AdminButtonVariant = 'primary' | 'secondary' | 'danger' | 'link'

const BUTTON_BASE =
  'inline-flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap'

const BUTTON_VARIANTS: Record<AdminButtonVariant, string> = {
  primary:
    'rounded-xl bg-admin-sidebar text-white px-4 py-2.5 text-[13px] font-semibold hover:bg-admin-sidebar-act',
  secondary:
    'rounded-xl border border-admin-border text-slate-600 px-4 py-2.5 text-[13px] font-semibold hover:bg-slate-50 hover:border-slate-300',
  danger:
    'rounded-xl border border-red-200 text-red-600 px-4 py-2.5 text-[13px] font-semibold hover:bg-red-50',
  link:
    'text-admin-sidebar-act hover:text-admin-sidebar text-[13px] font-semibold',
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
        TONE_BADGE[tone],
        className,
      )}
    >
      {label}
    </span>
  )
}

// ── AdminSearchPanel ─────────────────────────────────────────────────────────

export function AdminSearchPanel({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl border border-admin-border shadow-sm p-4 md:p-5 space-y-3.5">
      {children}
    </div>
  )
}

// ── AdminEmptyState ──────────────────────────────────────────────────────────

export function AdminEmptyState({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl border border-admin-border shadow-sm py-14 text-center text-[13px] text-slate-400">
      {children}
    </div>
  )
}

// ── AdminListCard ────────────────────────────────────────────────────────────
// Operational record card: identity + badges on top, labelled fields,
// optional notes, bottom action row.

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
      {/* Title row */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-semibold text-slate-800 text-[14px]">{title}</p>
            {badges}
          </div>
          {titleMeta && (
            <p className="text-[12px] text-slate-400 mt-0.5 truncate">{titleMeta}</p>
          )}
        </div>
        {meta && (
          <span className="font-mono text-[11px] text-slate-400 shrink-0">{meta}</span>
        )}
      </div>

      {/* Fields */}
      {fields && fields.length > 0 && (
        <div className="flex flex-wrap items-start gap-x-6 gap-y-3 mt-4 pt-4 border-t border-admin-border">
          {fields.map((f, i) => (
            <div key={i} className="min-w-0">
              <p className="text-[11px] font-medium text-slate-400 mb-0.5">{f.label}</p>
              <div className="text-[13px] font-medium text-slate-800 whitespace-nowrap">{f.value}</div>
            </div>
          ))}
        </div>
      )}

      {/* Notes */}
      {notes && notes.length > 0 && (
        <div className="space-y-2 mt-3.5">
          {notes.map((n, i) => (
            <p key={i} className="text-[12px] text-slate-600 bg-slate-50 rounded-xl px-3.5 py-2.5 leading-relaxed">
              <span className="font-semibold">{n.label}:</span> {n.text}
            </p>
          ))}
        </div>
      )}

      {/* Actions */}
      {actions && (
        <div className="mt-4 pt-4 border-t border-admin-border">
          {actions}
        </div>
      )}
    </AdminCard>
  )
}
