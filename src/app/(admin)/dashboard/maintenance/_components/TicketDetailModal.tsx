'use client'

import { useActionState, useEffect, useState, useTransition } from 'react'
import {
  updateMaintenanceTicketAction,
  updateMaintenanceStatusAction,
  type ActionState,
} from '../actions'
import { ModalOverlay, FormField, INPUT, BTN_PRIMARY, BTN_SECONDARY, ErrorMessage } from '@/app/(admin)/dashboard/rooms/_components/form-helpers'
import { PhotoLink } from './PhotoLink'
import type { StaffOption, TicketRow } from './types'

const TEXTAREA =
  'w-full border border-admin-border rounded-xl px-3.5 py-2.5 text-[13px] text-foreground placeholder:text-foreground/35 ' +
  'focus:outline-none focus:ring-2 focus:ring-admin-sidebar-act/30 focus:border-admin-sidebar-act/40 bg-white resize-none'

const PRIORITY_OPTIONS = [
  { value: 'low',    label: 'Baixa' },
  { value: 'medium', label: 'Média' },
  { value: 'high',   label: 'Alta' },
  { value: 'urgent', label: 'Urgente' },
]

const STATUS_BUTTONS: { status: string; label: string }[] = [
  { status: 'open',        label: 'Marcar aberto' },
  { status: 'in_progress', label: 'Marcar em andamento' },
  { status: 'fixed',       label: 'Marcar resolvido' },
]

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleDateString('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit',
  })
}

export function TicketDetailModal({ ticket, staff, onClose }: {
  ticket: TicketRow
  staff: StaffOption[]
  onClose: () => void
}) {
  const [state, formAction, isPending] = useActionState<ActionState, FormData>(updateMaintenanceTicketAction, undefined)
  const [status, setStatus] = useState(ticket.status)
  const [isChangingStatus, startStatusChange] = useTransition()
  const [statusFeedback, setStatusFeedback] = useState<{ kind: 'error' | 'success'; text: string } | null>(null)

  useEffect(() => {
    if (state && 'success' in state) onClose()
  }, [state, onClose])

  function changeStatus(next: string, label: string) {
    setStatusFeedback(null)
    startStatusChange(async () => {
      const result = await updateMaintenanceStatusAction(ticket.id, next)
      if (result && 'error' in result) {
        setStatusFeedback({ kind: 'error', text: result.error })
      } else {
        setStatus(next)
        setStatusFeedback({ kind: 'success', text: `${label} — registrado.` })
      }
    })
  }

  return (
    <ModalOverlay onClose={onClose}>
      <h2 className="text-[20px] font-bold text-slate-800 mb-1">{ticket.title}</h2>
      <p className="text-[12px] text-slate-500 mb-5">
        {ticket.roomName ?? 'Sem quarto específico'} · Aberto por {ticket.reportedByName ?? 'Equipe'} em {formatDate(ticket.created_at)}
      </p>

      {/* Status actions */}
      <div className="mb-5 pb-5 border-b border-slate-100 space-y-2.5">
        <p className="text-[11px] font-semibold text-slate-700 uppercase tracking-[0.10em]">Status</p>
        <div className="flex flex-wrap gap-2">
          {STATUS_BUTTONS.map((btn) => {
            const isCurrent = btn.status === status
            return (
              <button
                key={btn.status}
                type="button"
                disabled={isChangingStatus || isCurrent}
                onClick={() => changeStatus(btn.status, btn.label)}
                className={
                  isCurrent
                    ? 'inline-flex items-center justify-center rounded-xl bg-admin-sidebar text-white px-3.5 py-2 text-[11px] font-bold uppercase tracking-[0.06em] cursor-default'
                    : 'inline-flex items-center justify-center rounded-xl border border-admin-border text-slate-600 px-3.5 py-2 text-[11px] font-bold uppercase tracking-[0.06em] hover:bg-slate-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed'
                }
              >
                {btn.label}
              </button>
            )
          })}
        </div>
        {ticket.blocks_room && status === 'fixed' && (
          <p className="text-[11px] text-slate-400">
            Ao marcar como resolvido, o bloqueio do calendário criado por este chamado é removido automaticamente.
          </p>
        )}
        {statusFeedback && (
          <p className={`text-[12px] font-medium ${statusFeedback.kind === 'error' ? 'text-red-600' : 'text-emerald-600'}`}>
            {statusFeedback.text}
          </p>
        )}
        {ticket.resolved_at && (
          <p className="text-[11px] text-slate-400">Resolvido em {formatDateTime(ticket.resolved_at)}</p>
        )}
      </div>

      {/* Block info */}
      {ticket.blocks_room && (
        <div className="mb-5 pb-5 border-b border-slate-100">
          <p className="text-[11px] font-semibold text-slate-700 uppercase tracking-[0.10em] mb-1.5">Bloqueio do quarto</p>
          <p className="text-[12px] text-slate-600">
            {ticket.blocked_start_date && ticket.blocked_end_date
              ? `${formatDate(ticket.blocked_start_date)} até ${formatDate(ticket.blocked_end_date)} (saída)`
              : '—'}
          </p>
        </div>
      )}

      {/* Photos */}
      {ticket.photo_paths.length > 0 && (
        <div className="mb-5 pb-5 border-b border-slate-100">
          <p className="text-[11px] font-semibold text-slate-700 uppercase tracking-[0.10em] mb-2">Fotos</p>
          <div className="flex flex-wrap gap-3">
            {ticket.photo_paths.map((path, i) => (
              <PhotoLink key={path} ticketId={ticket.id} photoPath={path} index={i} canDelete />
            ))}
          </div>
        </div>
      )}

      {/* Edit form */}
      <form action={formAction} className="space-y-4">
        <input type="hidden" name="id" value={ticket.id} />

        <FormField label="Título *">
          <input name="title" defaultValue={ticket.title} required className={INPUT} />
        </FormField>

        <FormField label="Descrição">
          <textarea name="description" defaultValue={ticket.description ?? ''} rows={3} className={TEXTAREA} />
        </FormField>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField label="Prioridade *">
            <select name="priority" defaultValue={ticket.priority} required className={INPUT}>
              {PRIORITY_OPTIONS.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
            </select>
          </FormField>
          <FormField label="Responsável">
            <select name="assigned_to" defaultValue={ticket.assigned_to ?? ''} className={INPUT}>
              <option value="">— Não atribuído —</option>
              {staff.map((s) => <option key={s.id} value={s.id}>{s.full_name}</option>)}
            </select>
          </FormField>
        </div>

        <FormField label="Adicionar fotos" hint="opcional — JPG, PNG ou WebP, até 5MB cada">
          <input
            type="file"
            name="photos"
            accept="image/jpeg,image/jpg,image/png,image/webp"
            multiple
            className="block w-full text-[12px] text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-slate-100 file:px-3.5 file:py-2 file:text-[11px] file:font-bold file:uppercase file:tracking-[0.06em] file:text-slate-700 hover:file:bg-slate-200"
          />
        </FormField>

        {state && 'error' in state && <ErrorMessage message={state.error} />}

        <div className="flex gap-3 pt-2">
          <button type="button" onClick={onClose} className={BTN_SECONDARY}>
            Fechar
          </button>
          <button type="submit" disabled={isPending} className={BTN_PRIMARY}>
            {isPending ? 'Salvando…' : 'Salvar alterações'}
          </button>
        </div>
      </form>
    </ModalOverlay>
  )
}
