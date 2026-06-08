'use client'

import { useActionState, useEffect, useState } from 'react'
import { createMaintenanceTicketAction, type ActionState } from '../actions'
import { ModalOverlay, FormField, INPUT, BTN_PRIMARY, BTN_SECONDARY, ErrorMessage } from '@/app/(admin)/dashboard/rooms/_components/form-helpers'
import type { RoomOption, StaffOption } from './types'

const TEXTAREA =
  'w-full border border-admin-border rounded-xl px-3.5 py-2.5 text-[13px] text-foreground placeholder:text-foreground/35 ' +
  'focus:outline-none focus:ring-2 focus:ring-admin-sidebar-act/30 focus:border-admin-sidebar-act/40 bg-white resize-none'

const PRIORITY_OPTIONS = [
  { value: 'low',    label: 'Baixa' },
  { value: 'medium', label: 'Média' },
  { value: 'high',   label: 'Alta' },
  { value: 'urgent', label: 'Urgente' },
]

type Props = {
  rooms: RoomOption[]
  staff: StaffOption[]
  onClose: () => void
}

export function TicketFormModal({ rooms, staff, onClose }: Props) {
  const [state, formAction, isPending] = useActionState<ActionState, FormData>(createMaintenanceTicketAction, undefined)
  const [roomId, setRoomId] = useState('')
  const [blocksRoom, setBlocksRoom] = useState(false)

  useEffect(() => {
    if (state && 'success' in state) onClose()
  }, [state, onClose])

  return (
    <ModalOverlay onClose={onClose}>
      <h2 className="text-[20px] font-bold text-slate-800 mb-6">Novo chamado de manutenção</h2>

      <form action={formAction} className="space-y-4">
        <FormField label="Título *">
          <input name="title" required className={INPUT} placeholder="Ex: Ar-condicionado não liga" />
        </FormField>

        <FormField label="Descrição">
          <textarea name="description" rows={3} className={TEXTAREA} placeholder="Detalhes do problema, onde acontece, há quanto tempo…" />
        </FormField>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField label="Quarto" hint="opcional — para problemas de área comum, deixe em branco">
            <select name="room_id" value={roomId} onChange={(e) => setRoomId(e.target.value)} className={INPUT}>
              <option value="">— Sem quarto específico —</option>
              {rooms.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
            </select>
          </FormField>
          <FormField label="Prioridade *">
            <select name="priority" defaultValue="medium" required className={INPUT}>
              {PRIORITY_OPTIONS.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
            </select>
          </FormField>
        </div>

        <FormField label="Responsável" hint="opcional">
          <select name="assigned_to" defaultValue="" className={INPUT}>
            <option value="">— Não atribuído —</option>
            {staff.map((s) => <option key={s.id} value={s.id}>{s.full_name}</option>)}
          </select>
        </FormField>

        <FormField label="Fotos" hint="opcional — JPG, PNG ou WebP, até 5MB cada">
          <input
            type="file"
            name="photos"
            accept="image/jpeg,image/jpg,image/png,image/webp"
            multiple
            className="block w-full text-[12px] text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-slate-100 file:px-3.5 file:py-2 file:text-[11px] file:font-bold file:uppercase file:tracking-[0.06em] file:text-slate-700 hover:file:bg-slate-200"
          />
        </FormField>

        <div className="border-t border-slate-100 pt-4">
          <label className="flex items-center gap-2.5 cursor-pointer">
            <input
              type="checkbox"
              name="blocks_room"
              checked={blocksRoom}
              onChange={(e) => setBlocksRoom(e.target.checked)}
              disabled={!roomId}
              className="w-4 h-4 rounded"
            />
            <span className="text-[13px] font-semibold text-slate-800">Bloquear quarto durante o reparo</span>
          </label>
          {!roomId && (
            <p className="text-[11px] text-slate-400 mt-1.5 ml-6">Selecione um quarto acima para poder bloqueá-lo.</p>
          )}

          {blocksRoom && roomId && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
              <FormField label="Início do bloqueio *">
                <input type="date" name="blocked_start_date" required={blocksRoom} className={INPUT} />
              </FormField>
              <FormField label="Fim do bloqueio *" hint="data de saída — não incluída no bloqueio">
                <input type="date" name="blocked_end_date" required={blocksRoom} className={INPUT} />
              </FormField>
            </div>
          )}
        </div>

        {state && 'error' in state && <ErrorMessage message={state.error} />}

        <div className="flex gap-3 pt-2">
          <button type="button" onClick={onClose} className={BTN_SECONDARY}>
            Cancelar
          </button>
          <button type="submit" disabled={isPending} className={BTN_PRIMARY}>
            {isPending ? 'Criando…' : 'Criar chamado'}
          </button>
        </div>
      </form>
    </ModalOverlay>
  )
}
