'use client'

import { useActionState, useEffect, useState } from 'react'
import { cn } from '@/lib/utils'
import { toSlug } from '@/lib/utils'
import {
  createRoomAction,
  updateRoomAction,
  type FormState,
} from '../actions'
import { ModalOverlay, FormField, INPUT, BTN_PRIMARY, BTN_SECONDARY, ErrorMessage } from './form-helpers'
import type { CategoryRow, RoomRow } from './types'

type Props = {
  mode: 'create' | 'edit'
  initial?: RoomRow
  categories: CategoryRow[]
  onClose: () => void
}

export function RoomFormModal({ mode, initial, categories, onClose }: Props) {
  const action = mode === 'edit' ? updateRoomAction : createRoomAction
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

  const activeCategories = categories.filter((c) => c.is_active)

  return (
    <ModalOverlay onClose={onClose}>
      <h2 className="font-serif text-[20px] font-bold text-ocean-900 mb-6">
        {mode === 'edit' ? 'Editar quarto' : 'Novo quarto'}
      </h2>

      {activeCategories.length === 0 && (
        <div className="mb-5 text-[13px] text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
          Crie uma categoria ativa antes de adicionar um quarto.
        </div>
      )}

      <form action={formAction} className="space-y-4">
        {mode === 'edit' && <input type="hidden" name="id" value={initial?.id} />}

        {/* Name + slug */}
        <FormField label="Nome *">
          <input
            name="name"
            value={name}
            onChange={handleNameChange}
            required
            className={INPUT}
            placeholder="Ex: Suíte Vista Mar"
          />
        </FormField>

        <FormField label="Slug *" hint="gerado automaticamente">
          <input
            name="slug"
            value={slug}
            onChange={(e) => { setSlug(e.target.value); setSlugTouched(true) }}
            required
            className={INPUT}
            placeholder="suite-vista-mar"
          />
        </FormField>

        {/* Category */}
        <FormField label="Categoria *">
          <select
            name="category_id"
            defaultValue={initial?.category_id ?? ''}
            required
            className={INPUT}
          >
            <option value="">Selecione uma categoria</option>
            {activeCategories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
        </FormField>

        {/* Short description */}
        <FormField label="Descrição curta">
          <input
            name="short_description"
            defaultValue={initial?.short_description ?? ''}
            className={INPUT}
            placeholder="Ex: Vista panorâmica para o oceano"
          />
        </FormField>

        {/* Price + guests */}
        <div className="grid grid-cols-2 gap-4">
          <FormField label="Preço base (R$) *">
            <input
              name="base_price_brl"
              type="number"
              min={1}
              step={0.01}
              defaultValue={initial?.base_price_brl ?? ''}
              required
              className={INPUT}
              placeholder="890.00"
            />
          </FormField>
          <FormField label="Máx. hóspedes *">
            <input
              name="max_guests"
              type="number"
              min={1}
              defaultValue={initial?.max_guests ?? 2}
              required
              className={INPUT}
            />
          </FormField>
        </div>

        {/* Size + position */}
        <div className="grid grid-cols-2 gap-4">
          <FormField label="Tamanho (m²)">
            <input
              name="size_sqm"
              type="number"
              min={1}
              step={0.1}
              defaultValue={initial?.size_sqm ?? ''}
              className={INPUT}
              placeholder="Opcional"
            />
          </FormField>
          <FormField label="Posição no site">
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
              Escolha a ordem em que este quarto aparece no site.
            </p>
          </FormField>
        </div>

        {/* Amenities */}
        <FormField label="Comodidades" hint="separadas por vírgula">
          <input
            name="amenities"
            defaultValue={initial?.amenities?.join(', ') ?? ''}
            className={INPUT}
            placeholder="Ar-condicionado, Wi-Fi, Smart TV, Frigobar"
          />
        </FormField>

        {/* Checkboxes */}
        <div className="flex flex-wrap gap-6 pt-1">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              name="ocean_view"
              defaultChecked={initial?.ocean_view ?? false}
              className="w-4 h-4 rounded"
            />
            <span className="text-[13px] text-foreground/70">Vista para o mar</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              name="is_active"
              defaultChecked={initial?.is_active ?? true}
              className="w-4 h-4 rounded"
            />
            <span className="text-[13px] text-foreground/70">Ativo (visível no site)</span>
          </label>
        </div>

        {state && 'error' in state && <ErrorMessage message={state.error} />}

        <div className="flex gap-3 pt-2">
          <button type="button" onClick={onClose} className={BTN_SECONDARY}>
            Cancelar
          </button>
          <button
            type="submit"
            disabled={isPending || activeCategories.length === 0}
            className={cn(BTN_PRIMARY, 'flex-1')}
          >
            {isPending ? 'Salvando…' : mode === 'edit' ? 'Salvar alterações' : 'Criar quarto'}
          </button>
        </div>
      </form>
    </ModalOverlay>
  )
}
