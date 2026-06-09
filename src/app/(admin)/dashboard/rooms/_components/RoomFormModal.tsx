'use client'

import { useActionState, useEffect, useRef, useState, useTransition } from 'react'
import { cn } from '@/lib/utils'
import { toSlug } from '@/lib/utils'
import {
  createRoomAction,
  updateRoomAction,
  type FormState,
} from '../actions'
import { ModalOverlay, FormField, INPUT, BTN_PRIMARY, BTN_SECONDARY, ErrorMessage } from './form-helpers'
import { RoomPhotosSection } from './RoomPhotosSection'
import type { CategoryRow, RoomRow, ImageRow, PendingFile } from './types'

type Props = {
  mode: 'create' | 'edit'
  initial?: RoomRow
  images?: ImageRow[]
  categories: CategoryRow[]
  onClose: () => void
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function RoomFormModal({ mode, initial, images, categories, onClose }: Props) {
  // Edit mode — useActionState drives the form action
  const [editState, editFormAction, isEditPending] = useActionState<FormState, FormData>(
    updateRoomAction,
    undefined,
  )

  // Create mode — manual transition so we can append photo files to FormData
  const [createState, setCreateState] = useState<FormState>(undefined)
  const [isCreating, startCreate] = useTransition()

  const state    = mode === 'edit' ? editState : createState
  const isPending = mode === 'edit' ? isEditPending : isCreating

  // Room name / slug
  const [name, setName] = useState(initial?.name ?? '')
  const [slug, setSlug] = useState(initial?.slug ?? '')
  const [slugTouched, setSlugTouched] = useState(mode === 'edit')

  // Pending photos (create mode only)
  const [pendingFiles, setPendingFiles] = useState<PendingFile[]>([])
  const createFileRef = useRef<HTMLInputElement>(null)

  function handleNameChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value
    setName(val)
    if (!slugTouched) setSlug(toSlug(val))
  }

  function handleCreateFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? [])
    if (files.length === 0) return
    setPendingFiles((prev) => {
      const next: PendingFile[] = files.map((file, idx) => ({
        localId: `${Date.now()}-${idx}-${Math.random().toString(36).slice(2, 6)}`,
        file,
        previewUrl: URL.createObjectURL(file),
        altText: '',
        sortOrder: prev.length + idx,
      }))
      return [...prev, ...next]
    })
    if (createFileRef.current) createFileRef.current.value = ''
  }

  function removePendingFile(localId: string) {
    setPendingFiles((prev) => {
      const item = prev.find((p) => p.localId === localId)
      if (item) URL.revokeObjectURL(item.previewUrl)
      return prev.filter((p) => p.localId !== localId)
    })
  }

  function updatePendingAlt(localId: string, altText: string) {
    setPendingFiles((prev) => prev.map((p) => (p.localId === localId ? { ...p, altText } : p)))
  }

  function handleCreateSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    pendingFiles.forEach((item, i) => {
      fd.append('photos', item.file)
      fd.append(`photo_alt_${i}`, item.altText)
    })
    startCreate(async () => {
      const result = await createRoomAction(undefined, fd)
      setCreateState(result)
    })
  }

  useEffect(() => {
    if (state && 'success' in state) onClose()
  }, [state, onClose])

  const activeCategories = categories.filter((c) => c.is_active)

  return (
    <ModalOverlay onClose={onClose}>
      <h2 className="text-[20px] font-bold text-slate-800 mb-6">
        {mode === 'edit' ? 'Editar quarto' : 'Novo quarto'}
      </h2>

      {activeCategories.length === 0 && (
        <div className="mb-5 text-[13px] text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
          Crie uma categoria ativa antes de adicionar um quarto.
        </div>
      )}

      {/* ── Section 1: Room data ───────────────────────────────────────────── */}
      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.15em] mb-4">
        Dados do quarto
      </p>

      <form
        action={mode === 'edit' ? editFormAction : undefined}
        onSubmit={mode === 'create' ? handleCreateSubmit : undefined}
        className="space-y-4"
      >
        {mode === 'edit' && <input type="hidden" name="id" value={initial?.id} />}

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

        <FormField label="Número interno" hint="ex: 1, 2, 101, 202A">
          <input
            name="room_number"
            defaultValue={initial?.room_number ?? ''}
            className={INPUT}
            placeholder="Ex: 1, 101, 202A"
          />
        </FormField>

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

        <FormField label="Descrição curta">
          <input
            name="short_description"
            defaultValue={initial?.short_description ?? ''}
            className={INPUT}
            placeholder="Ex: Vista panorâmica para o oceano"
          />
        </FormField>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

        <FormField label="Destaque na landing page">
          <select
            name="homepage_slot"
            defaultValue={
              initial
                ? initial.featured
                  ? String(initial.sort_order)
                  : 'none'
                : 'none'
            }
            className={INPUT}
          >
            <option value="none">Não destacar na landing page</option>
            <option value="0">1º destaque na landing page</option>
            <option value="1">2º destaque na landing page</option>
            <option value="2">3º destaque na landing page</option>
            <option value="3">4º destaque na landing page</option>
            <option value="4">5º destaque na landing page</option>
            <option value="5">6º destaque na landing page</option>
          </select>
          <p className="text-[11px] text-slate-400 mt-1.5">
            Quartos destacados aparecem na página inicial. Máximo 6.
          </p>
        </FormField>

        <FormField label="Comodidades" hint="separadas por vírgula">
          <input
            name="amenities"
            defaultValue={initial?.amenities?.join(', ') ?? ''}
            className={INPUT}
            placeholder="Ar-condicionado, Wi-Fi, Smart TV, Frigobar"
          />
        </FormField>

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
            <span className="text-[13px] text-foreground/70">Ativo no site (visível ao público)</span>
          </label>
        </div>

        {/* ── Section 2: Photos (create mode inline) ───────────────────────── */}
        {mode === 'create' && (
          <div className="pt-5 border-t border-slate-100 space-y-3">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.15em]">
              Fotos do quarto
            </p>

            {pendingFiles.length > 0 && (
              <div className="space-y-2">
                {pendingFiles.map((item) => (
                  <div
                    key={item.localId}
                    className="flex items-center gap-3 p-2.5 border border-admin-border rounded-xl"
                  >
                    <div className="w-14 h-10 rounded-lg overflow-hidden bg-slate-50 border border-slate-100 shrink-0">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={item.previewUrl} alt="" className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[12px] text-slate-800 font-medium truncate">{item.file.name}</p>
                      <p className="text-[10px] text-slate-400">{formatFileSize(item.file.size)}</p>
                    </div>
                    <input
                      value={item.altText}
                      onChange={(e) => updatePendingAlt(item.localId, e.target.value)}
                      className={cn(INPUT, 'w-32 text-[12px] py-1.5')}
                      placeholder="Texto alt"
                      disabled={isPending}
                    />
                    <button
                      type="button"
                      onClick={() => removePendingFile(item.localId)}
                      disabled={isPending}
                      className="text-slate-300 hover:text-red-500 transition-colors disabled:opacity-40 shrink-0 text-[13px] font-bold px-1"
                      aria-label="Remover"
                    >
                      ✕
                    </button>
                  </div>
                ))}
                <p className="text-[11px] text-slate-500 bg-slate-50 rounded-lg px-3 py-2">
                  {pendingFiles.length} foto{pendingFiles.length > 1 ? 's' : ''} selecionada{pendingFiles.length > 1 ? 's' : ''}. Serão enviadas ao criar o quarto.
                </p>
              </div>
            )}

            <label
              className={cn(
                'flex items-center justify-center cursor-pointer group',
                isPending && 'pointer-events-none opacity-40',
              )}
            >
              <input
                ref={createFileRef}
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/webp"
                multiple
                onChange={handleCreateFileSelect}
                className="sr-only"
                disabled={isPending}
              />
              <span className="flex-1 text-center text-[13px] font-semibold py-2.5 px-4 rounded-xl border-2 border-dashed border-admin-border text-slate-500 transition-colors group-hover:border-admin-sidebar/30 group-hover:text-slate-700">
                {pendingFiles.length > 0 ? '+ Adicionar mais fotos' : 'Selecionar fotos'}
              </span>
            </label>
            <p className="text-[11px] text-slate-400 text-center">
              Opcional. JPG, PNG ou WebP, máx. 5 MB por foto. A primeira foto será definida como capa.
            </p>
          </div>
        )}

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
            {isPending
              ? mode === 'edit'
                ? 'Salvando…'
                : 'Criando quarto…'
              : mode === 'edit'
                ? 'Salvar alterações'
                : 'Criar quarto'}
          </button>
        </div>
      </form>

      {/* ── Section 2: Photos (edit mode — separate component) ────────────── */}
      {mode === 'edit' && (
        <div className="mt-6 pt-6 border-t border-slate-100">
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.15em] mb-4">
            Fotos do quarto
          </p>
          <RoomPhotosSection
            roomId={initial!.id}
            initialImages={images ?? []}
          />
        </div>
      )}
    </ModalOverlay>
  )
}
