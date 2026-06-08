'use client'

import { useEffect, useState, useTransition } from 'react'
import { deleteStaffAction } from '../actions'
import { ModalOverlay, FormField, INPUT, BTN_SECONDARY } from '@/app/(admin)/dashboard/rooms/_components/form-helpers'
import type { StaffRow } from './types'

const BTN_DANGER =
  'inline-flex items-center justify-center rounded-xl bg-red-600 text-white px-5 py-2.5 ' +
  'text-[12px] font-bold uppercase tracking-[0.08em] hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed'

type Outcome = { kind: 'error'; text: string } | { kind: 'archived' } | { kind: 'deleted' }

export function DeleteStaffModal({ row, onClose }: { row: StaffRow; onClose: () => void }) {
  const [confirmation, setConfirmation] = useState('')
  const [isPending, startTransition] = useTransition()
  const [outcome, setOutcome] = useState<Outcome | null>(null)

  const matches = confirmation.trim().toLowerCase() === row.email.toLowerCase()
  const done = outcome?.kind === 'archived' || outcome?.kind === 'deleted'

  useEffect(() => {
    if (done) {
      const timer = setTimeout(onClose, 2400)
      return () => clearTimeout(timer)
    }
  }, [done, onClose])

  function handleDelete() {
    setOutcome(null)
    startTransition(async () => {
      const result = await deleteStaffAction(row.id, confirmation)
      if (result && 'error' in result) setOutcome({ kind: 'error', text: result.error })
      else if (result && 'archived' in result) setOutcome({ kind: 'archived' })
      else if (result && 'deleted' in result) setOutcome({ kind: 'deleted' })
    })
  }

  return (
    <ModalOverlay onClose={onClose}>
      <h2 className="font-serif text-[20px] font-bold text-ocean-900 mb-1.5">Excluir usuário</h2>
      <p className="text-[12px] text-ocean-500 mb-6">
        <span className="font-semibold text-ocean-700">{row.full_name}</span> ({row.email})
      </p>

      {outcome?.kind === 'archived' && (
        <p className="text-[13px] text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 leading-relaxed">
          Este usuário possui histórico no sistema. A conta foi desativada para preservar os registros.
        </p>
      )}
      {outcome?.kind === 'deleted' && (
        <p className="text-[13px] text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3">
          Conta excluída permanentemente.
        </p>
      )}

      {!done && (
        <div className="space-y-4">
          <p className="text-[13px] text-red-700 bg-red-50 border border-red-200 rounded-xl px-4 py-3 leading-relaxed">
            Esta ação pode afetar histórico da equipe. Para preservar registros, recomendamos desativar.
            Deseja continuar?
          </p>

          <FormField label="Digite o e-mail da conta para confirmar" hint={row.email}>
            <input
              value={confirmation}
              onChange={(e) => setConfirmation(e.target.value)}
              className={INPUT}
              placeholder={row.email}
              autoComplete="off"
            />
          </FormField>

          {outcome?.kind === 'error' && (
            <p className="text-[13px] text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
              {outcome.text}
            </p>
          )}

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className={BTN_SECONDARY}>
              Cancelar
            </button>
            <button type="button" onClick={handleDelete} disabled={isPending || !matches} className={BTN_DANGER}>
              {isPending ? 'Excluindo…' : 'Excluir permanentemente'}
            </button>
          </div>
        </div>
      )}
    </ModalOverlay>
  )
}
