import { cn } from '@/lib/utils'

// ── Reservation status ────────────────────────────────────────────────────────

export const STATUS_LABELS: Record<string, string> = {
  pending_payment: 'Aguardando pagamento',
  confirmed:       'Confirmada',
  cancelled:       'Cancelada',
  checked_in:      'Check-in feito',
  checked_out:     'Check-out feito',
}

const STATUS_TONES: Record<string, string> = {
  pending_payment: 'bg-amber-50 text-amber-700',
  confirmed:       'bg-emerald-50 text-emerald-700',
  cancelled:       'bg-red-50 text-red-600',
  checked_in:      'bg-sky-50 text-sky-700',
  checked_out:     'bg-slate-100 text-slate-500',
}

export function ReservationStatusBadge({ status, className = '' }: { status: string; className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold whitespace-nowrap',
        STATUS_TONES[status] ?? 'bg-slate-100 text-slate-500',
        className,
      )}
    >
      {STATUS_LABELS[status] ?? status}
    </span>
  )
}

// ── Payment status ────────────────────────────────────────────────────────────

export const PAYMENT_LABELS: Record<string, string> = {
  pending:   'Pendente',
  paid:      'Pago',
  overdue:   'Vencido',
  refunded:  'Estornado',
  failed:    'Recusado',
  cancelled: 'Cancelado',
}

const PAYMENT_TONES: Record<string, string> = {
  pending:   'bg-amber-50 text-amber-700',
  paid:      'bg-emerald-50 text-emerald-700',
  overdue:   'bg-orange-50 text-orange-700',
  refunded:  'bg-slate-100 text-slate-500',
  failed:    'bg-red-50 text-red-600',
  cancelled: 'bg-slate-100 text-slate-500',
}

export function PaymentStatusBadge({ status, className = '' }: { status: string | null; className?: string }) {
  if (!status) {
    return (
      <span className={cn('inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold whitespace-nowrap bg-slate-100 text-slate-400', className)}>
        Sem pagamento registrado
      </span>
    )
  }
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold whitespace-nowrap',
        PAYMENT_TONES[status] ?? 'bg-slate-100 text-slate-500',
        className,
      )}
    >
      {PAYMENT_LABELS[status] ?? status}
    </span>
  )
}
