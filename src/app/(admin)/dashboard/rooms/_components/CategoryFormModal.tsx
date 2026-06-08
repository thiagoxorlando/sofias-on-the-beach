'use client'

import { useActionState, useEffect, useState } from 'react'
import { cn } from '@/lib/utils'
import { toSlug } from '@/lib/utils'
import {
  createCategoryAction,
  updateCategoryAction,
  type FormState,
} from '../actions'
import { ModalOverlay, FormField, INPUT, BTN_PRIMARY, BTN_SECONDARY, ErrorMessage } from './form-helpers'
import type { CategoryRow } from './types'

type Props = {
  mode: 'create' | 'edit'
  initial?: CategoryRow
  onClose: () => void
}

export function CategoryFormModal({ mode, initial, onClose }: Props) {
  const action = mode === 'edit' ? updateCategoryAction : createCategoryAction
  const [state, formAction, isPending] = useActionState<FormState, FormData>(
    action,
    undefined,
  )

  const [name, setName] = useState(initial?.name ?? '')
  const [slug, setSlug] = useState(initial?.slug ?? '')
  const [slugTouched, setSlugTouched] = useState(mode === 'edit')

  function handleNameChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value
    setName(val)
    if (!slugTouched) setSlug(toSlug(val))
  }

  useEffect(() => {
    if (state && 'success' in state) onClose()
  }, [state, onClose])

  return (
    <ModalOverlay onClose={onClose}>
      <h2 className="font-serif text-[20px] font-bold text-ocean-900 mb-6">
        {mode === 'edit' ? 'Editar categoria' : 'Nova categoria'}
      </h2>

      <form action={formAction} className="space-y-4">
        {mode === 'edit' && <input type="hidden" name="id" value={initial?.id} />}

        <FormField label="Nome *">
          <input
            name="name"
            value={name}
            onChange={handleNameChange}
            required
            className={INPUT}
            placeholder="Ex: Suíte Ocean View"
          />
        </FormField>

        <FormField label="Slug *" hint="gerado automaticamente">
          <input
            name="slug"
            value={slug}
            onChange={(e) => { setSlug(e.target.value); setSlugTouched(true) }}
            required
            className={INPUT}
            placeholder="suite-ocean-view"
          />
        </FormField>

        <FormField label="Descrição curta">
          <input
            name="short_description"
            defaultValue={initial?.short_description ?? ''}
            className={INPUT}
            placeholder="Ex: Quartos com vista privilegiada para o mar"
          />
        </FormField>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField label="Posição na lista">
            <select
              name="sort_order"
              defaultValue={initial?.sort_order ?? 0}
              className={INPUT}
            >
              <option value={0}>1º — Mostrar primeiro</option>
              <option value={1}>2º — Mostrar segundo</option>
              <option value={2}>3º — Mostrar terceiro</option>
              <option value={3}>4º — Mostrar quarto</option>
              <option value={4}>5º — Mostrar quinto</option>
              <option value={5}>6º — Mostrar sexto</option>
              <option value={6}>7º — Mostrar sétimo</option>
              <option value={7}>8º — Mostrar oitavo</option>
              <option value={8}>9º — Mostrar nono</option>
              <option value={9}>10º — Mostrar décimo</option>
            </select>
            <p className="text-[11px] text-ocean-400 mt-1.5">
              Define a ordem das categorias no painel e no site.
            </p>
          </FormField>
          <FormField label="Status">
            <label className="flex items-center gap-2 h-[42px] cursor-pointer">
              <input
                type="checkbox"
                name="is_active"
                defaultChecked={initial?.is_active ?? true}
                className="w-4 h-4 rounded"
              />
              <span className="text-[13px] text-foreground/70">Ativa</span>
            </label>
          </FormField>
        </div>

        {state && 'error' in state && <ErrorMessage message={state.error} />}

        <div className="flex gap-3 pt-2">
          <button type="button" onClick={onClose} className={BTN_SECONDARY}>
            Cancelar
          </button>
          <button type="submit" disabled={isPending} className={cn(BTN_PRIMARY, 'flex-1')}>
            {isPending ? 'Salvando…' : mode === 'edit' ? 'Salvar' : 'Criar categoria'}
          </button>
        </div>
      </form>
    </ModalOverlay>
  )
}
