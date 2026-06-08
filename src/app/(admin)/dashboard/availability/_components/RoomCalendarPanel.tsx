'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { cn } from '@/lib/utils'
import { nextDay } from '@/lib/pricing'
import type { CalendarDay, CalendarDayStatus, RoomCalendarMonth } from '@/lib/roomCalendar'
import { SelectionActionPanel, type SelectionRange } from './SelectionActionPanel'

const CARD = 'bg-white rounded-2xl border border-admin-border shadow-sm overflow-hidden'

const WEEKDAYS_PT = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb']

const MONTHS_PT = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
]

// Status → cell background + border. Color is the primary signal; a small dot
// reinforces reservation/manual-block so staff can scan the grid at a glance
// without reading any text.
const STATUS_STYLES: Record<CalendarDayStatus, string> = {
  available:    'bg-emerald-50/70 border border-emerald-100 hover:bg-emerald-100/60',
  reservation:  'bg-sky-50 border border-sky-200 hover:bg-sky-100/70',
  manual_block: 'bg-rose-50 border border-rose-200 hover:bg-rose-100/70',
}

function formatBRLShort(value: number): string {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(value)
}

export function formatDateFull(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number)
  return `${String(d).padStart(2, '0')}/${String(m).padStart(2, '0')}/${y}`
}

function shiftMonth(monthStr: string, offset: number): string {
  const [y, m] = monthStr.split('-').map(Number)
  const total = y * 12 + (m - 1) + offset
  const newYear = Math.floor(total / 12)
  const newMonth = (total % 12) + 1
  return `${newYear}-${String(newMonth).padStart(2, '0')}`
}

// Pads a month's days into full weeks (Sun–Sat) for grid rendering.
function buildWeeks(month: RoomCalendarMonth): (CalendarDay | null)[][] {
  const firstWeekday = new Date(month.monthStart + 'T00:00:00Z').getUTCDay()
  const cells: (CalendarDay | null)[] = [
    ...Array.from({ length: firstWeekday }, () => null),
    ...month.days,
  ]
  while (cells.length % 7 !== 0) cells.push(null)
  const weeks: (CalendarDay | null)[][] = []
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7))
  return weeks
}

export function RoomCalendarPanel({
  roomId,
  month,
  monthParam,
  todayISO,
}: {
  roomId: string
  month: RoomCalendarMonth
  monthParam: string
  todayISO: string
}) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [selStart, setSelStart] = useState<string | null>(null)
  const [selEnd, setSelEnd] = useState<string | null>(null)

  function navigate(monthStr: string) {
    const params = new URLSearchParams(searchParams.toString())
    params.set('room_id', roomId)
    params.set('month', monthStr)
    router.push(`/dashboard/availability?${params.toString()}`)
  }

  function handleDayClick(date: string) {
    if (!selStart || (selStart && selEnd)) {
      setSelStart(date)
      setSelEnd(null)
    } else if (date < selStart) {
      setSelEnd(selStart)
      setSelStart(date)
    } else {
      setSelEnd(date)
    }
  }

  function clearSelection() {
    setSelStart(null)
    setSelEnd(null)
  }

  const isSelected = (date: string): boolean => {
    if (selStart && selEnd) return selStart <= date && date <= selEnd
    if (selStart) return date === selStart
    return false
  }

  const selectionRange: SelectionRange | null = useMemo(() => {
    if (!selStart || !selEnd) return null
    return {
      roomId,
      startDate: selStart,
      endDate: nextDay(selEnd),
      lastNight: selEnd,
      nights: Math.round(
        (new Date(nextDay(selEnd) + 'T00:00:00Z').getTime() - new Date(selStart + 'T00:00:00Z').getTime()) / 86_400_000,
      ),
    }
  }, [roomId, selStart, selEnd])

  // Staff need to see *why* a date is blocked before deciding to clear it —
  // surfaced as a briefing list in the action panel below the calendar.
  const manualBlocksInRange = useMemo(() => {
    if (!selStart || !selEnd) return []
    return month.days
      .filter((day) => day.status === 'manual_block' && selStart <= day.date && day.date <= selEnd)
      .map((day) => ({ date: day.date, reason: day.blockedReason ?? 'Bloqueio manual' }))
  }, [month.days, selStart, selEnd])

  const weeks = buildWeeks(month)

  return (
    <div className="space-y-5">
      <div className={CARD}>
        <div className="flex items-center justify-between gap-4 px-5 md:px-7 py-5 border-b border-admin-border flex-wrap">
          <div className="min-w-0">
            <h2 className="text-[20px] sm:text-[24px] font-bold text-slate-800">
              {MONTHS_PT[month.month - 1]} de {month.year}
            </h2>
            {selectionRange ? (
              <p className="text-[13px] font-semibold text-admin-sidebar mt-1.5">
                Período selecionado: {formatDateFull(selectionRange.startDate)} até {formatDateFull(selectionRange.lastNight)}
                {' · '}{selectionRange.nights} noite{selectionRange.nights !== 1 ? 's' : ''}
              </p>
            ) : (
              <p className="text-[12.5px] text-slate-500 mt-1.5">
                Clique na primeira data e depois na última para selecionar um período.
              </p>
            )}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {selectionRange && (
              <button
                type="button"
                onClick={clearSelection}
                className="text-[12px] font-semibold text-admin-sidebar-act hover:text-admin-sidebar px-3.5 py-2 rounded-xl hover:bg-slate-50 transition-colors"
              >
                Limpar seleção
              </button>
            )}
            <div className="flex items-center gap-2 pl-1.5 ml-1 border-l border-admin-border">
              <button
                type="button"
                onClick={() => navigate(shiftMonth(monthParam, -1))}
                className="w-9 h-9 inline-flex items-center justify-center rounded-xl border border-admin-border text-slate-600 hover:bg-slate-50 transition-colors"
                aria-label="Mês anterior"
              >
                <ChevronLeftIcon />
              </button>
              <button
                type="button"
                onClick={() => navigate(shiftMonth(monthParam, 1))}
                className="w-9 h-9 inline-flex items-center justify-center rounded-xl border border-admin-border text-slate-600 hover:bg-slate-50 transition-colors"
                aria-label="Próximo mês"
              >
                <ChevronRightIcon />
              </button>
            </div>
          </div>
        </div>

        <div className="px-4 sm:px-6 md:px-7 py-5">
          <div className="grid grid-cols-7 gap-1.5 sm:gap-2 mb-2.5">
            {WEEKDAYS_PT.map((wd) => (
              <div key={wd} className="text-center text-[10px] sm:text-[11px] font-bold text-slate-400 uppercase tracking-wide py-1">
                {wd}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
            {weeks.flatMap((week, wi) =>
              week.map((day, di) => (
                <div key={`${wi}-${di}`}>
                  {day ? (
                    <DayCell
                      day={day}
                      isToday={day.date === todayISO}
                      selected={isSelected(day.date)}
                      onClick={handleDayClick}
                    />
                  ) : (
                    <div className="min-h-[76px] sm:min-h-[92px] lg:min-h-[100px]" />
                  )}
                </div>
              )),
            )}
          </div>
        </div>
      </div>

      <Legend />

      {selectionRange && (
        <SelectionActionPanel
          range={selectionRange}
          manualBlocks={manualBlocksInRange}
          onCancel={clearSelection}
        />
      )}
    </div>
  )
}

function DayCell({
  day,
  isToday,
  selected,
  onClick,
}: {
  day: CalendarDay
  isToday: boolean
  selected: boolean
  onClick: (date: string) => void
}) {
  const dayNum = parseInt(day.date.slice(8, 10), 10)
  const accent = dayAccent(day)

  // The cell itself is the flex column — rows are distributed by the flex
  // algorithm against `min-h`, not by percentage heights (which "h-full"
  // can't resolve against an auto-height parent and was clipping content).
  const cellClasses = cn(
    'relative isolate overflow-hidden rounded-xl border flex flex-col justify-between gap-1 ' +
    'p-2 sm:p-2.5 min-h-[76px] sm:min-h-[92px] lg:min-h-[100px] text-left transition-colors w-full',
    STATUS_STYLES[day.status],
    selected && 'ring-2 ring-admin-sidebar ring-inset',
  )

  // Positioned with z-0 / z-10 (an explicit stacking order) rather than relying
  // on DOM order, so the tint never paints over the day's content.
  const selectionOverlay = selected && (
    <span className="absolute inset-0 z-0 bg-admin-sidebar/[0.08] pointer-events-none" aria-hidden="true" />
  )

  const dateBadge = (
    <span
      className={cn(
        'inline-flex items-center justify-center w-5 h-5 sm:w-6 sm:h-6 shrink-0 rounded-full ' +
        'text-[11px] sm:text-[12.5px] font-bold text-slate-800 leading-none',
        isToday && 'ring-2 ring-admin-sidebar ring-inset text-admin-sidebar',
      )}
    >
      {dayNum}
    </span>
  )

  const statusDot = (
    <span className={cn('w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full shrink-0', accent.dot)} aria-hidden="true" />
  )

  const label = (
    <span className={cn('relative z-10 block text-[8.5px] sm:text-[10px] font-bold uppercase tracking-wide leading-none whitespace-nowrap', accent.labelColor)}>
      <span className="hidden sm:inline">{accent.labelFull}</span>
      <span className="sm:hidden">{accent.labelShort}</span>
    </span>
  )

  const price = (
    <span
      className={cn(
        'relative z-10 block text-[10.5px] sm:text-[12.5px] font-bold leading-none whitespace-nowrap',
        day.isCustomPrice ? 'text-sand-700' : 'text-slate-800',
      )}
    >
      {formatBRLShort(day.price)}
    </span>
  )

  const body = (
    <>
      {selectionOverlay}
      <div className="relative z-10 flex items-center justify-between">
        {dateBadge}
        {statusDot}
      </div>
      {label}
      {price}
    </>
  )

  if (day.status === 'reservation') {
    return (
      <Link
        href={day.reservationId ? `/dashboard/reservations/${day.reservationId}` : '/dashboard/reservations'}
        className={cellClasses}
        title={day.reservationToken ? `Reserva ${day.reservationToken} — ver detalhes` : 'Reserva — ver detalhes'}
      >
        {body}
      </Link>
    )
  }

  // Tooltip carries the detail that no longer lives inside the cell — reason
  // for manual blocks, rate name for custom pricing, "Hoje" for today.
  const title =
    day.status === 'manual_block' ? (day.blockedReason ?? 'Bloqueio manual') :
    day.isCustomPrice && day.rateName ? day.rateName :
    isToday ? 'Hoje' : undefined

  return (
    <button type="button" onClick={() => onClick(day.date)} title={title} className={cellClasses}>
      {body}
    </button>
  )
}

// Derives the single status accent (dot color, label color, label text) shown
// in every cell — custom pricing only overrides the label/dot on otherwise-
// available days; reservations and manual blocks always take precedence.
function dayAccent(day: CalendarDay): {
  dot: string
  labelColor: string
  labelFull: string
  labelShort: string
} {
  if (day.status === 'reservation') {
    return { dot: 'bg-sky-500',    labelColor: 'text-sky-700',   labelFull: 'Reserva',         labelShort: 'Reserva' }
  }
  if (day.status === 'manual_block') {
    return { dot: 'bg-rose-500',     labelColor: 'text-rose-700',    labelFull: 'Bloqueado',       labelShort: 'Bloq.' }
  }
  if (day.isCustomPrice) {
    return { dot: 'bg-sand-500',     labelColor: 'text-sand-700',    labelFull: 'Tarifa especial', labelShort: 'Especial' }
  }
  return     { dot: 'bg-emerald-500', labelColor: 'text-emerald-700', labelFull: 'Disponível',     labelShort: 'Livre' }
}

function Legend() {
  return (
    <div className="bg-white rounded-2xl border border-admin-border shadow-sm px-5 md:px-7 py-4 flex flex-wrap items-center gap-x-6 gap-y-3">
      <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-[0.10em]">Legenda</span>

      <LegendItem label="Disponível">
        <span className="w-4 h-4 rounded-md bg-emerald-50 border border-emerald-200" />
      </LegendItem>

      <LegendItem label="Reserva">
        <span className="relative w-4 h-4 rounded-md bg-sky-50 border border-sky-200">
          <span className="absolute top-0.5 right-0.5 w-1.5 h-1.5 rounded-full bg-sky-500" />
        </span>
      </LegendItem>

      <LegendItem label="Bloqueio manual">
        <span className="relative w-4 h-4 rounded-md bg-rose-50 border border-rose-200">
          <span className="absolute top-0.5 right-0.5 w-1.5 h-1.5 rounded-full bg-rose-500" />
        </span>
      </LegendItem>

      <LegendItem label="Tarifa especial">
        <span className="w-4 h-4 rounded-md bg-sand-200" />
      </LegendItem>

      <LegendItem label="Selecionado">
        <span className="w-4 h-4 rounded-md bg-white ring-2 ring-admin-sidebar ring-inset border border-admin-border" />
      </LegendItem>

      <LegendItem label="Hoje">
        <span className="w-4 h-4 rounded-full bg-white ring-2 ring-admin-sidebar ring-inset border border-admin-border" />
      </LegendItem>
    </div>
  )
}

function LegendItem({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-2 text-[12.5px] text-slate-600 font-medium">
      {children}
      {label}
    </span>
  )
}

function ChevronLeftIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4" aria-hidden="true">
      <path d="M15 18l-6-6 6-6" />
    </svg>
  )
}

function ChevronRightIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4" aria-hidden="true">
      <path d="M9 18l6-6-6-6" />
    </svg>
  )
}
