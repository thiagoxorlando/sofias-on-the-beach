'use client'

import { useState } from 'react'
import { HandoffRequestModal } from '@/components/admin/HandoffRequestModal'

const DEPT_LABELS: Record<string, string> = {
  housekeeping: 'Governança',
  maintenance:  'Manutenção',
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

export type HandoffRequestItem = {
  id: string
  title: string
  description: string | null
  priority: string
  status: string
  targetDepartment: string
  requestedByName: string | null
  createdAt: string
  completedAt: string | null
}

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleDateString('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit',
  })
}

export function HandoffRequestsPanel({
  reservationId,
  roomId,
  roomName,
  requests,
  canCreate,
}: {
  reservationId: string
  roomId: string | null
  roomName: string | null
  requests: HandoffRequestItem[]
  canCreate: boolean
}) {
  const [showModal, setShowModal] = useState(false)

  return (
    <div className="space-y-3">
      {requests.length === 0 ? (
        <p className="text-[13px] text-slate-400">Nenhuma solicitação para esta reserva.</p>
      ) : (
        <ul className="space-y-2.5">
          {requests.map((req) => (
            <li key={req.id} className="rounded-xl border border-admin-border px-4 py-3 space-y-2">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-[13px] font-semibold text-slate-800">{req.title}</p>
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ${PRIORITY_BADGE[req.priority] ?? PRIORITY_BADGE.normal}`}>
                      {PRIORITY_LABELS[req.priority] ?? req.priority}
                    </span>
                  </div>
                  {req.description && (
                    <p className="text-[12px] text-slate-500 mt-0.5 leading-relaxed">{req.description}</p>
                  )}
                </div>
                <div className="flex flex-col items-end gap-1.5 shrink-0">
                  <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-[10px] font-semibold ${STATUS_BADGE[req.status] ?? STATUS_BADGE.open}`}>
                    {STATUS_LABELS[req.status] ?? req.status}
                  </span>
                  <span className="text-[10px] text-slate-400">
                    {DEPT_LABELS[req.targetDepartment] ?? req.targetDepartment}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-3 flex-wrap text-[11px] text-slate-400">
                <span>{formatDateTime(req.createdAt)}</span>
                {req.requestedByName && <span>· {req.requestedByName}</span>}
                {req.completedAt && (
                  <span className="text-emerald-600">· Concluído {formatDateTime(req.completedAt)}</span>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}

      {canCreate && (
        <button
          type="button"
          onClick={() => setShowModal(true)}
          className="inline-flex items-center justify-center rounded-xl border border-admin-border text-slate-600 px-4 py-2.5 text-[12px] font-bold uppercase tracking-[0.08em] hover:bg-slate-50 transition-colors"
        >
          + Nova solicitação
        </button>
      )}

      {showModal && (
        <HandoffRequestModal
          reservationId={reservationId}
          roomId={roomId}
          roomName={roomName}
          onClose={() => setShowModal(false)}
        />
      )}
    </div>
  )
}
