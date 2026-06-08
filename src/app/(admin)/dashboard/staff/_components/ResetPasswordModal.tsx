'use client'

import { useActionState, useEffect } from 'react'
import { resetStaffPasswordAction, type ActionState } from '../actions'
import { ModalOverlay, FormField, INPUT, BTN_PRIMARY, BTN_SECONDARY, ErrorMessage } from '@/app/(admin)/dashboard/rooms/_components/form-helpers'
import type { StaffRow } from './types'

export function ResetPasswordModal({ row, onClose }: { row: StaffRow; onClose: () => void }) {
  const [state, formAction, isPending] = useActionState<ActionState, FormData>(resetStaffPasswordAction, undefined)
  const success = state && 'success' in state

  useEffect(() => {
    if (success) {
      const timer = setTimeout(onClose, 1800)
      return () => clearTimeout(timer)
    }
  }, [success, onClose])

  return (
    <ModalOverlay onClose={onClose}>
      <h2 className="text-[20px] font-bold text-slate-800 mb-1.5">
        Redefinir senha
      </h2>
      <p className="text-[12px] text-slate-500 mb-6">
        Defina uma nova senha temporária para <span className="font-semibold text-slate-700">{row.full_name}</span> ({row.email}).
        Avise a pessoa para trocá-la no próximo acesso.
      </p>

      {success ? (
        <p className="text-[13px] text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3">
          Senha redefinida com sucesso.
        </p>
      ) : (
        <form action={formAction} className="space-y-4">
          <input type="hidden" name="id" value={row.id} />

          <FormField label="Nova senha temporária *" hint="mínimo 8 caracteres">
            <input
              name="password"
              type="text"
              required
              minLength={8}
              className={INPUT}
              placeholder="Ex: praia2026temp"
            />
          </FormField>

          {state && 'error' in state && <ErrorMessage message={state.error} />}

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className={BTN_SECONDARY}>
              Cancelar
            </button>
            <button type="submit" disabled={isPending} className={BTN_PRIMARY}>
              {isPending ? 'Salvando…' : 'Redefinir senha'}
            </button>
          </div>
        </form>
      )}
    </ModalOverlay>
  )
}
