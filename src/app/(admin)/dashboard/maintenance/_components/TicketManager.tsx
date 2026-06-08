'use client'

import { useState } from 'react'
import { TicketFormModal } from './TicketFormModal'
import { TicketDetailModal } from './TicketDetailModal'
import { BTN_PRIMARY } from '@/app/(admin)/dashboard/rooms/_components/form-helpers'
import type { RoomOption, StaffOption, TicketRow } from './types'

const CARD = 'bg-white rounded-2xl border border-admin-border shadow-sm p-5'

const STATUS_ORDER = ['open', 'in_progress', 'fixed'] as const

const COLUMN_TITLES: Record<string, string> = {
  open:        'Abertos',
  in_progress: 'Em andamento',
  fixed:       'Resolvidos',
}

const STATUS_TONES: Record<string, string> = {
  open:        'bg-red-50 text-red-600',
  in_progress: 'bg-amber-50 text-amber-700',
  fixed:       'bg-emerald-50 text-emerald-700',
}

const STATUS_BADGE_LABELS: Record<string, string> = {
  open:        'Aberto',
  in_progress: 'Em andamento',
  fixed:       'Resolvido',
}

const PRIORITY_TONES: Record<string, string> = {
  urgent: 'bg-red-100 text-red-700',
  high:   'bg-amber-100 text-amber-700',
  medium: 'bg-slate-100 text-slate-600',
  low:    'bg-slate-100 text-slate-500',
}

const PRIORITY_LABELS: Record<string, string> = {
  urgent: 'Urgente',
  high:   'Alta',
  medium: 'Média',
  low:    'Baixa',
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

type ActiveModal =
  | { type: 'create' }
  | { type: 'detail'; ticket: TicketRow }
  | null

export function TicketManager({ tickets, rooms, staff }: {
  tickets: TicketRow[]
  rooms: RoomOption[]
  staff: StaffOption[]
}) {
  const [modal, setModal] = useState<ActiveModal>(null)

  const byStatus = new Map<string, TicketRow[]>()
  for (const status of STATUS_ORDER) byStatus.set(status, [])
  for (const ticket of tickets) {
    const bucket = byStatus.get(ticket.status)
    if (bucket) bucket.push(ticket)
    else byStatus.set(ticket.status, [ticket])
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-end">
        <button onClick={() => setModal({ type: 'create' })} className={BTN_PRIMARY}>
          + Novo chamado
        </button>
      </div>

      {STATUS_ORDER.map((status) => (
        <TicketColumn
          key={status}
          status={status}
          title={COLUMN_TITLES[status]}
          tickets={byStatus.get(status) ?? []}
          onSelect={(ticket) => setModal({ type: 'detail', ticket })}
        />
      ))}

      {modal?.type === 'create' && (
        <TicketFormModal rooms={rooms} staff={staff} onClose={() => setModal(null)} />
      )}
      {modal?.type === 'detail' && (
        <TicketDetailModal ticket={modal.ticket} staff={staff} onClose={() => setModal(null)} />
      )}
    </div>
  )
}

function TicketColumn({ status, title, tickets, onSelect }: {
  status: string
  title: string
  tickets: TicketRow[]
  onSelect: (ticket: TicketRow) => void
}) {
  return (
    <section>
      <div className="flex items-center gap-2.5 mb-3">
        <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold ${STATUS_TONES[status] ?? 'bg-slate-100 text-slate-500'}`}>
          {title}
        </span>
        <span className="text-[12px] font-semibold text-slate-400">{tickets.length}</span>
      </div>
      {tickets.length === 0 ? (
        <div className={`${CARD} text-center text-[13px] text-slate-400 py-6`}>
          Nenhum chamado neste status no momento.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {tickets.map((ticket) => (
            <TicketCard key={ticket.id} ticket={ticket} onSelect={() => onSelect(ticket)} />
          ))}
        </div>
      )}
    </section>
  )
}

function TicketCard({ ticket, onSelect }: { ticket: TicketRow; onSelect: () => void }) {
  return (
    <div className={CARD}>

      {/* Title + badges */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-semibold text-slate-800 text-[14px] truncate">{ticket.title}</p>
          <p className="text-[12px] text-slate-400 truncate">{ticket.roomName ?? 'Sem quarto específico'}</p>
        </div>
        <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold whitespace-nowrap ${PRIORITY_TONES[ticket.priority] ?? 'bg-slate-100 text-slate-500'}`}>
          {PRIORITY_LABELS[ticket.priority] ?? ticket.priority}
        </span>
      </div>

      {/* Details */}
      <div className="mt-3.5 pt-3.5 border-t border-slate-100 space-y-1.5">
        <InfoLine label="Status" value={STATUS_BADGE_LABELS[ticket.status] ?? ticket.status} />
        <InfoLine label="Aberto em" value={formatDate(ticket.created_at)} />
        {ticket.assignedToName && <InfoLine label="Responsável" value={ticket.assignedToName} />}
        <InfoLine
          label="Bloqueia o quarto"
          value={
            ticket.blocks_room && ticket.blocked_start_date && ticket.blocked_end_date
              ? `Sim · ${formatDate(ticket.blocked_start_date)} até ${formatDate(ticket.blocked_end_date)}`
              : 'Não'
          }
        />
        {ticket.photo_paths.length > 0 && (
          <InfoLine label="Fotos" value={`${ticket.photo_paths.length} anexada${ticket.photo_paths.length !== 1 ? 's' : ''}`} />
        )}
      </div>

      {/* CTA */}
      <div className="mt-3.5 pt-3.5 border-t border-slate-100">
        <button
          type="button"
          onClick={onSelect}
          className="text-[12px] font-semibold text-admin-sidebar-act hover:text-admin-sidebar transition-colors"
        >
          Ver / Editar →
        </button>
      </div>
    </div>
  )
}

function InfoLine({ label, value }: { label: string; value: string }) {
  return (
    <p className="text-[12px] text-slate-600 leading-relaxed">
      <span className="font-semibold text-slate-700">{label}:</span> {value}
    </p>
  )
}
