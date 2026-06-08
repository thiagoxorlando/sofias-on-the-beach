'use client'

import { useActionState, useEffect } from 'react'
import { createStaffAction, updateStaffAction, type ActionState } from '../actions'
import { ModalOverlay, FormField, INPUT, BTN_PRIMARY, BTN_SECONDARY, ErrorMessage } from '@/app/(admin)/dashboard/rooms/_components/form-helpers'
import type { StaffRow } from './types'

const ROLE_OPTIONS: { value: string; label: string; superAdminOnly?: boolean }[] = [
  { value: 'manager',      label: 'Gerente' },
  { value: 'reception',    label: 'Recepção' },
  { value: 'housekeeping', label: 'Governança' },
  { value: 'maintenance',  label: 'Manutenção' },
  { value: 'finance',      label: 'Financeiro' },
  { value: 'staff',        label: 'Equipe (genérico)' },
  { value: 'admin',        label: 'Administrador' },
  { value: 'super_admin',  label: 'Super Admin', superAdminOnly: true },
]

type Props = {
  mode: 'create' | 'edit'
  initial?: StaffRow
  isSuperAdmin: boolean
  onClose: () => void
}

export function StaffFormModal({ mode, initial, isSuperAdmin, onClose }: Props) {
  const action = mode === 'edit' ? updateStaffAction : createStaffAction
  const [state, formAction, isPending] = useActionState<ActionState, FormData>(action, undefined)

  useEffect(() => {
    if (state && 'success' in state) onClose()
  }, [state, onClose])

  const roleOptions = ROLE_OPTIONS.filter((opt) => !opt.superAdminOnly || isSuperAdmin)

  return (
    <ModalOverlay onClose={onClose}>
      <h2 className="text-[20px] font-bold text-slate-800 mb-6">
        {mode === 'edit' ? 'Editar usuário da equipe' : 'Novo usuário da equipe'}
      </h2>

      <form action={formAction} className="space-y-4">
        {mode === 'edit' && <input type="hidden" name="id" value={initial?.id} />}

        <FormField label="Nome completo *">
          <input
            name="full_name"
            defaultValue={initial?.full_name ?? ''}
            required
            className={INPUT}
            placeholder="Ex: Maria Souza"
          />
        </FormField>

        {mode === 'create' && (
          <>
            <FormField label="E-mail *">
              <input
                name="email"
                type="email"
                required
                className={INPUT}
                placeholder="maria@sofiasonthebeach.com"
              />
            </FormField>

            <FormField label="Senha temporária *" hint="mínimo 8 caracteres — peça para o usuário trocar no primeiro acesso">
              <input
                name="password"
                type="text"
                required
                minLength={8}
                className={INPUT}
                placeholder="Ex: praia2026temp"
              />
            </FormField>
          </>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField label="Cargo *">
            <select name="role" defaultValue={initial?.role ?? 'reception'} required className={INPUT}>
              {roleOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </FormField>
          <FormField label="Status">
            <label className="flex items-center gap-2 h-[42px] cursor-pointer">
              <input
                type="checkbox"
                name="is_active"
                defaultChecked={initial?.is_active ?? true}
                className="w-4 h-4 rounded"
              />
              <span className="text-[13px] text-foreground/70">Ativo</span>
            </label>
          </FormField>
        </div>

        {state && 'error' in state && <ErrorMessage message={state.error} />}

        <div className="flex gap-3 pt-2">
          <button type="button" onClick={onClose} className={BTN_SECONDARY}>
            Cancelar
          </button>
          <button type="submit" disabled={isPending} className={BTN_PRIMARY}>
            {isPending ? 'Salvando…' : mode === 'edit' ? 'Salvar alterações' : 'Criar usuário'}
          </button>
        </div>
      </form>
    </ModalOverlay>
  )
}
