'use client'

import { useState, useTransition } from 'react'
import { updateHandoffStatusAction } from '@/app/(admin)/dashboard/handoff/actions'

export type HandoffRow = {
  id: string
  title: string
  description: string | null
  priority: string
  status: string
  targetDepartment: string
  roomName: string | null
  guestName: string | null
  token: string | null
  requestedByName: string | null
  createdAt: string
  completedAt: string | null
}

const PRIORITY_BADGE: Record<string, string> = {
  urgent: 'bg-red-50 text-red-700 border border-red-200',
  high:   'bg-amber-50 text-amber-700 border border-amber-200',
  normal: 'bg-sky-50 text-sky-700 border border-sky-200',
  low:    'bg-slate-100 text-slate-500 border border-slate-200',
}

const PRIORITY_LABELS: Record<string, string> = {
  urgent: 'Urgente',
  high:   'Alta',
  normal: 'Normal',
  low:    'Baixa',
}

const STATUS_BADGE: Record<string, string> = {
  open:        'bg-amber-50 text-amber-700',
  in_progress: 'bg-sky-50 text-sky-700',
  done:        'bg-emerald-50 text-emerald-700',
  cancelled:   'bg-slate-100 text-slate-500',
}

const STATUS_LABELS: Record<string, string> = {
  open:        'Aberto',
  in_progress: 'Em andamento',
  done:        'Concluído',
  cancelled:   'Cancelado',
}

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleDateString('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit',
  })
}

export function HandoffRequestCard({ request }: { request: HandoffRow }) {
  const [isPending, startTransition] = useTransition()
  const [feedback, setFeedback] = useState<{ kind: 'error' | 'success'; text: string } | null>(null)

  function runUpdate(newStatus: 'in_progress' | 'done' | 'cancelled') {
    setFeedback(null)
    startTransition(async () => {
      const result = await updateHandoffStatusAction(request.id, newStatus)
      if (result && 'error' in result) setFeedback({ kind: 'error', text: result.error })
      else setFeedback({ kind: 'success', text: newStatus === 'done' ? 'Solicitação concluída.' : 'Status atualizado.' })
    })
  }

  return (
    <div className="bg-white rounded-2xl border border-admin-border shadow-sm p-4">

      {/* Title + badges */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-[13px] font-semibold text-slate-800">{request.title}</p>
            <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ${PRIORITY_BADGE[request.priority] ?? PRIORITY_BADGE.normal}`}>
              {PRIORITY_LABELS[request.priority] ?? request.priority}
            </span>
          </div>
          {request.description && (
            <p className="text-[12px] text-slate-500 leading-relaxed mt-1">{request.description}</p>
          )}
        </div>
        <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-[10px] font-semibold whitespace-nowrap shrink-0 ${STATUS_BADGE[request.status] ?? STATUS_BADGE.open}`}>
          {STATUS_LABELS[request.status] ?? request.status}
        </span>
      </div>

      {/* Meta */}
      <div className="mt-3 pt-3 border-t border-slate-100 space-y-1">
        {request.roomName && (
          <p className="text-[11px] text-slate-500">
            <span className="font-semibold">Quarto:</span> {request.roomName}
          </p>
        )}
        {(request.guestName || request.token) && (
          <p className="text-[11px] text-slate-500">
            <span className="font-semibold">Hóspede:</span>{' '}
            {[request.guestName, request.token].filter(Boolean).join(' · ')}
          </p>
        )}
        {request.requestedByName && (
          <p className="text-[11px] text-slate-500">
            <span className="font-semibold">Solicitado por:</span> {request.requestedByName}
          </p>
        )}
        <p className="text-[11px] text-slate-400">{formatDateTime(request.createdAt)}</p>
        {request.completedAt && (
          <p className="text-[11px] text-emerald-600">
            <span className="font-semibold">Concluído em:</span> {formatDateTime(request.completedAt)}
          </p>
        )}
      </div>

      {/* Actions */}
      {(request.status === 'open' || request.status === 'in_progress') && (
        <div className="mt-3 pt-3 border-t border-slate-100 flex items-center gap-2 flex-wrap">
          {request.status === 'open' && (
            <button
              type="button"
              disabled={isPending}
              onClick={() => runUpdate('in_progress')}
              className="inline-flex items-center justify-center rounded-lg border border-admin-border text-slate-600 px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.06em] hover:bg-slate-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Iniciar
            </button>
          )}
          <button
            type="button"
            disabled={isPending}
            onClick={() => runUpdate('done')}
            className="inline-flex items-center justify-center rounded-lg bg-admin-sidebar text-white px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.06em] hover:bg-admin-sidebar-act transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Concluir
          </button>
          {feedback && (
            <span className={`text-[11px] font-medium ${feedback.kind === 'error' ? 'text-red-600' : 'text-emerald-600'}`}>
              {feedback.text}
            </span>
          )}
        </div>
      )}
    </div>
  )
}
