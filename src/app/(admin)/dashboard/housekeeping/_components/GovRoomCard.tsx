'use client'

import { useState, useTransition } from 'react'
import { cn } from '@/lib/utils'
import { updateHousekeepingStatusAction, selfAssignRoomAction } from '../actions'
import type { RoomBoardItem } from './HousekeepingBoard'

const STATUS_BADGE: Record<string, string> = {
  dirty:     'bg-red-100 text-red-700',
  cleaning:  'bg-amber-100 text-amber-700',
  clean:     'bg-teal-100 text-teal-700',
  inspected: 'bg-sky-100 text-sky-700',
  ready:     'bg-emerald-100 text-emerald-700',
}

const STATUS_LABEL: Record<string, string> = {
  dirty:     'Sujo',
  cleaning:  'Em limpeza',
  clean:     'Limpo',
  inspected: 'Inspecionado',
  ready:     'Pronto',
}

function formatDate(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number)
  return `${String(d).padStart(2, '0')}/${String(m).padStart(2, '0')}/${y}`
}

function todayBRT(): string {
  return new Date().toLocaleDateString('sv-SE', { timeZone: 'America/Sao_Paulo' })
}

type ActionConfig = {
  label: string
  target: string
  variant: 'primary' | 'secondary' | 'danger'
}

function getActions(status: string, isSupervisor: boolean): ActionConfig[] {
  if (status === 'dirty') {
    return [{ label: 'Iniciar limpeza', target: 'cleaning', variant: 'primary' }]
  }
  if (status === 'cleaning') {
    return [{ label: 'Marcar como limpo', target: 'clean', variant: 'primary' }]
  }
  if (status === 'clean' && isSupervisor) {
    return [
      { label: 'Inspecionado', target: 'inspected', variant: 'secondary' },
      { label: 'Liberar →', target: 'ready', variant: 'primary' },
    ]
  }
  if (status === 'inspected' && isSupervisor) {
    return [{ label: 'Liberar como pronto →', target: 'ready', variant: 'primary' }]
  }
  if (status === 'ready' && isSupervisor) {
    return [{ label: 'Marcar como sujo', target: 'dirty', variant: 'danger' }]
  }
  return []
}

export function GovRoomCard({
  room,
  isSupervisor,
  currentAdminId,
  selfAssignMode = false,
}: {
  room: RoomBoardItem
  isSupervisor: boolean
  currentAdminId?: string
  selfAssignMode?: boolean
}) {
  const [isPending, startTransition] = useTransition()
  const [showNote, setShowNote] = useState(false)
  const [note, setNote] = useState('')
  const [feedback, setFeedback] = useState<{ kind: 'error' | 'success'; text: string } | null>(null)

  const today    = todayBRT()
  const isUrgent = room.nextArrival?.date === today
  const isMyTask = !!currentAdminId && room.assignment?.assignedToId === currentAdminId
  const actions  = getActions(room.status, isSupervisor)

  // selfAssignMode shows "Assumir limpeza" instead of regular action buttons
  // (used in staff "Disponíveis para limpar" section)
  const showSelfAssign = selfAssignMode && room.status === 'dirty' && !room.assignment

  function run(target: string, label: string) {
    setFeedback(null)
    startTransition(async () => {
      const res = await updateHousekeepingStatusAction(room.id, target, note.trim() || undefined)
      if (res && 'error' in res) {
        setFeedback({ kind: 'error', text: res.error })
      } else {
        setFeedback({ kind: 'success', text: `${label} — registrado.` })
        setNote('')
        setShowNote(false)
      }
    })
  }

  function runSelfAssign() {
    setFeedback(null)
    startTransition(async () => {
      const res = await selfAssignRoomAction(room.id)
      if (res && 'error' in res) {
        setFeedback({ kind: 'error', text: res.error })
      } else {
        setFeedback({ kind: 'success', text: 'Limpeza iniciada.' })
      }
    })
  }

  return (
    <div className={cn(
      'bg-white rounded-xl border shadow-sm p-3 transition-shadow hover:shadow-md',
      isMyTask  ? 'border-violet-300 ring-1 ring-violet-100' :
      isUrgent  ? 'border-amber-300' : 'border-admin-border',
    )}>

      {/* Room identifier + status badge */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline gap-1.5 flex-wrap">
            <p className="text-[22px] font-bold text-admin-sidebar leading-none font-mono">
              {room.roomNumber ? `#${room.roomNumber}` : room.name}
            </p>
            {isMyTask && (
              <span className="text-[10px] font-bold text-violet-700 bg-violet-50 border border-violet-200 rounded-full px-1.5 py-0.5 leading-none shrink-0">
                ★ minha tarefa
              </span>
            )}
            {!isMyTask && isUrgent && (
              <span className="text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200 rounded-full px-1.5 py-0.5 leading-none shrink-0">
                ⚡ hoje
              </span>
            )}
          </div>
          {room.roomNumber && (
            <p className="text-[11px] text-slate-500 mt-0.5 truncate">{room.name}</p>
          )}
          <p className="text-[10px] text-slate-400 truncate">{room.categoryName}</p>
        </div>
        <span className={cn(
          'text-[10px] font-bold rounded-full px-2 py-1 shrink-0 whitespace-nowrap mt-0.5',
          STATUS_BADGE[room.status] ?? 'bg-slate-100 text-slate-500',
        )}>
          {STATUS_LABEL[room.status] ?? room.status}
        </span>
      </div>

      {/* Assignment info */}
      {room.assignment && (
        <div className="mb-2 flex items-center gap-1.5 bg-violet-50 border border-violet-100 rounded-lg px-2.5 py-1.5">
          <span className="text-violet-300 text-[11px] shrink-0 font-mono">→</span>
          <span className="text-[11px] font-semibold text-violet-800 truncate flex-1">
            {room.assignment.assignedToName}
          </span>
        </div>
      )}

      {/* Movement info */}
      {(room.lastCheckout ?? room.nextArrival) && (
        <div className="mb-2.5 pt-2 border-t border-slate-100 space-y-1">
          {room.lastCheckout && (
            <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
              <span className="text-slate-300 shrink-0 font-mono">↑</span>
              <span className="truncate">{room.lastCheckout.guestName} · {formatDate(room.lastCheckout.date)}</span>
            </div>
          )}
          {room.nextArrival && (
            <div className={cn(
              'flex items-center gap-1.5 text-[11px]',
              isUrgent ? 'text-amber-700 font-semibold' : 'text-slate-500',
            )}>
              <span className={cn('shrink-0 font-mono', isUrgent ? 'text-amber-500' : 'text-slate-300')}>↓</span>
              <span className="truncate">{room.nextArrival.guestName} · {formatDate(room.nextArrival.date)}</span>
            </div>
          )}
        </div>
      )}

      {/* Latest log author */}
      {room.latestLog?.authorName && (
        <p className="text-[10px] text-slate-400 mb-2 truncate">
          Última ação: {room.latestLog.authorName}
        </p>
      )}

      {/* Staff waiting badge — clean/inspected awaiting supervisor */}
      {!isSupervisor && !selfAssignMode && (room.status === 'clean' || room.status === 'inspected') && (
        <div className="mb-2 text-[11px] text-sky-700 bg-sky-50 border border-sky-100 rounded-lg px-2.5 py-1.5 text-center font-semibold">
          Aguardando supervisão
        </div>
      )}

      {/* Note textarea */}
      {showNote && (
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={2}
          placeholder="Observação sobre o quarto (opcional)…"
          disabled={isPending}
          className="w-full border border-admin-border rounded-lg px-3 py-2 text-[12px] text-slate-800 placeholder:text-slate-400 bg-white focus:outline-none focus:ring-2 focus:ring-admin-sidebar-act/30 focus:border-admin-sidebar-act/40 resize-none mb-2"
        />
      )}

      {/* Action buttons */}
      {showSelfAssign ? (
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            disabled={isPending}
            onClick={runSelfAssign}
            className="text-[11px] font-bold rounded-lg px-3 py-1.5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed bg-admin-sidebar text-white hover:bg-admin-sidebar-act"
          >
            {isPending ? '…' : 'Assumir limpeza'}
          </button>
        </div>
      ) : (
        actions.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5">
            {actions.map((action) => (
              <button
                key={action.target}
                type="button"
                disabled={isPending}
                onClick={() => run(action.target, action.label)}
                className={cn(
                  'text-[11px] font-bold rounded-lg px-3 py-1.5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed',
                  action.variant === 'primary'   && 'bg-admin-sidebar text-white hover:bg-admin-sidebar-act',
                  action.variant === 'secondary' && 'border border-admin-border text-slate-600 hover:bg-slate-50 bg-white',
                  action.variant === 'danger'    && 'border border-red-200 text-red-600 hover:bg-red-50 bg-white',
                )}
              >
                {isPending ? '…' : action.label}
              </button>
            ))}
            <button
              type="button"
              onClick={() => setShowNote((v) => !v)}
              className="text-[10px] text-slate-400 hover:text-slate-600 transition-colors font-medium px-1"
            >
              {showNote ? '− nota' : '+ nota'}
            </button>
          </div>
        )
      )}

      {feedback && (
        <p className={cn(
          'text-[11px] font-medium mt-1.5',
          feedback.kind === 'error' ? 'text-red-600' : 'text-emerald-600',
        )}>
          {feedback.text}
        </p>
      )}
    </div>
  )
}
