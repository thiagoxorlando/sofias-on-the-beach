'use client'

import { useState, useTransition } from 'react'
import { CategoryFormModal } from './CategoryFormModal'
import { RoomFormModal } from './RoomFormModal'
import { DeleteRoomModal } from './DeleteRoomModal'
import { ForceDeleteModal } from '@/components/admin/ForceDeleteModal'
import { toggleCategoryActiveAction, toggleRoomActiveAction, seedStandardRoomsAction, forceDeleteRoomsAction, type SeedResult } from '../actions'
import type { CategoryRow, RoomRow, ImageRow } from './types'
import { BTN_PRIMARY } from './form-helpers'
import { cn } from '@/lib/utils'

type Props = {
  categories: CategoryRow[]
  rooms: RoomRow[]
  imagesByRoomId: Record<string, ImageRow[]>
  adminRole: string
}

type ActiveModal =
  | { type: 'category-create' }
  | { type: 'category-edit'; row: CategoryRow }
  | { type: 'room-create' }
  | { type: 'room-edit'; row: RoomRow }
  | { type: 'room-delete'; row: RoomRow }
  | { type: 'force-delete-rooms' }
  | null

export function RoomsManager({ categories, rooms, imagesByRoomId, adminRole }: Props) {
  const [modal, setModal] = useState<ActiveModal>(null)
  const [seedState, setSeedState] = useState<SeedResult>(undefined)
  const [isSeedPending, startSeed] = useTransition()
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const canSeed = adminRole === 'super_admin' || adminRole === 'admin'

  function toggleSelect(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) { next.delete(id) } else { next.add(id) }
      return next
    })
  }

  function toggleSelectAll() {
    setSelectedIds((prev) =>
      prev.size === rooms.length ? new Set() : new Set(rooms.map((r) => r.id)),
    )
  }

  return (
    <div className="space-y-10">
      {/* Categories section */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-[15px] font-semibold text-slate-800">Categorias</h2>
            <p className="text-[12px] text-slate-500 mt-0.5">Tipos de quarto disponíveis</p>
          </div>
          <button
            onClick={() => setModal({ type: 'category-create' })}
            className={BTN_PRIMARY}
          >
            + Nova categoria
          </button>
        </div>

        {categories.length === 0 ? (
          <EmptyState message="Nenhuma categoria criada ainda." />
        ) : (
          <div className="bg-white rounded-2xl border border-admin-border shadow-sm overflow-hidden">
            <table className="w-full text-[13px]">
              <thead>
                <tr className="border-b border-admin-border bg-slate-50/50">
                  <th className="text-left px-4 py-3 text-[11px] font-semibold text-slate-500 uppercase tracking-[0.08em]">Nome</th>
                  <th className="text-left px-4 py-3 text-[11px] font-semibold text-slate-500 uppercase tracking-[0.08em] hidden sm:table-cell">Slug</th>
                  <th className="text-left px-4 py-3 text-[11px] font-semibold text-slate-500 uppercase tracking-[0.08em] hidden md:table-cell">Posição</th>
                  <th className="text-left px-4 py-3 text-[11px] font-semibold text-slate-500 uppercase tracking-[0.08em]">Status</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {categories.map((cat) => (
                  <CategoryTableRow
                    key={cat.id}
                    row={cat}
                    onEdit={() => setModal({ type: 'category-edit', row: cat })}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Rooms section */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-[15px] font-semibold text-slate-800">Quartos</h2>
            <p className="text-[12px] text-slate-500 mt-0.5">{rooms.length} quarto{rooms.length !== 1 ? 's' : ''} cadastrado{rooms.length !== 1 ? 's' : ''}</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap justify-end">
            {canSeed && (
              <button
                type="button"
                onClick={() => startSeed(async () => {
                  const res = await seedStandardRoomsAction()
                  setSeedState(res)
                })}
                disabled={isSeedPending || categories.filter((c) => c.is_active).length === 0}
                className="text-[12px] font-medium text-slate-500 hover:text-slate-700 border border-dashed border-slate-300 rounded-xl px-3 py-1.5 transition-colors disabled:opacity-50"
                title="Cria quartos 1–17 com número interno. Ignora duplicatas."
              >
                {isSeedPending ? 'Criando…' : 'Criar quartos 1–17'}
              </button>
            )}
            <button
              onClick={() => setModal({ type: 'room-create' })}
              className={BTN_PRIMARY}
              disabled={categories.filter((c) => c.is_active).length === 0}
              title={categories.filter((c) => c.is_active).length === 0 ? 'Crie uma categoria ativa primeiro' : undefined}
            >
              + Novo quarto
            </button>
          </div>
        </div>

        {/* Bulk action bar — admin only, visible when items are selected */}
        {canSeed && selectedIds.size > 0 && (
          <div className="mb-3 flex items-center justify-between gap-3 bg-red-50 border border-red-200 rounded-xl px-4 py-2.5">
            <p className="text-[13px] font-semibold text-red-700">
              {selectedIds.size} quarto{selectedIds.size !== 1 ? 's' : ''} selecionado{selectedIds.size !== 1 ? 's' : ''}
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setSelectedIds(new Set())}
                className="text-[12px] font-semibold text-slate-500 hover:text-slate-700 transition-colors"
              >
                Limpar seleção
              </button>
              <button
                type="button"
                onClick={() => setModal({ type: 'force-delete-rooms' })}
                className="text-[12px] font-semibold text-white bg-red-600 hover:bg-red-700 rounded-lg px-3 py-1.5 transition-colors"
              >
                Excluir selecionados
              </button>
            </div>
          </div>
        )}
        {seedState && 'success' in seedState && (
          <p className={`mb-3 text-[12px] rounded-xl px-3 py-2 border ${seedState.created > 0 ? 'text-emerald-700 bg-emerald-50 border-emerald-200' : 'text-slate-600 bg-slate-50 border-slate-200'}`}>
            {seedState.created > 0
              ? `${seedState.created} quarto${seedState.created > 1 ? 's' : ''} criado${seedState.created > 1 ? 's' : ''}${seedState.skipped > 0 ? `, ${seedState.skipped} ignorado${seedState.skipped > 1 ? 's' : ''} (já existem)` : ''}.`
              : `Todos os quartos 1–17 já existem. ${seedState.skipped} ignorados.`}
          </p>
        )}
        {seedState && 'error' in seedState && (
          <p className="mb-3 text-[12px] text-red-600 bg-red-50 border border-red-200 rounded-xl px-3 py-2">
            {seedState.error}
          </p>
        )}

        {rooms.length === 0 ? (
          <EmptyState message="Nenhum quarto cadastrado ainda." />
        ) : (
          <div className="bg-white rounded-2xl border border-admin-border shadow-sm overflow-hidden">
            <table className="w-full text-[13px]">
              <thead>
                <tr className="border-b border-admin-border bg-slate-50/50">
                  {canSeed && (
                    <th className="px-4 py-3 w-8">
                      <input
                        type="checkbox"
                        checked={rooms.length > 0 && selectedIds.size === rooms.length}
                        onChange={toggleSelectAll}
                        className="rounded border-slate-300 text-red-600 focus:ring-red-400/30 cursor-pointer"
                        title="Selecionar todos"
                      />
                    </th>
                  )}
                  <th className="text-left px-4 py-3 text-[11px] font-semibold text-slate-500 uppercase tracking-[0.08em]">Nome</th>
                  <th className="text-left px-4 py-3 text-[11px] font-semibold text-slate-500 uppercase tracking-[0.08em] hidden md:table-cell">Categoria</th>
                  <th className="text-left px-4 py-3 text-[11px] font-semibold text-slate-500 uppercase tracking-[0.08em] hidden sm:table-cell">Preço</th>
                  <th className="text-left px-4 py-3 text-[11px] font-semibold text-slate-500 uppercase tracking-[0.08em] hidden lg:table-cell">Hóspedes</th>
                  <th className="text-left px-4 py-3 text-[11px] font-semibold text-slate-500 uppercase tracking-[0.08em] hidden lg:table-cell">Vista</th>
                  <th className="text-left px-4 py-3 text-[11px] font-semibold text-slate-500 uppercase tracking-[0.08em] hidden lg:table-cell">Fotos</th>
                  <th className="text-left px-4 py-3 text-[11px] font-semibold text-slate-500 uppercase tracking-[0.08em] hidden sm:table-cell">Landing page</th>
                  <th className="text-left px-4 py-3 text-[11px] font-semibold text-slate-500 uppercase tracking-[0.08em]">Status</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {rooms.map((room) => (
                  <RoomTableRow
                    key={room.id}
                    row={room}
                    categoryName={categories.find((c) => c.id === room.category_id)?.name ?? '—'}
                    photoCount={(imagesByRoomId[room.id] ?? []).length}
                    onEdit={() => setModal({ type: 'room-edit', row: room })}
                    onDelete={canSeed ? () => setModal({ type: 'room-delete', row: room }) : undefined}
                    selected={canSeed ? selectedIds.has(room.id) : undefined}
                    onToggleSelect={canSeed ? () => toggleSelect(room.id) : undefined}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Modals */}
      {modal?.type === 'category-create' && (
        <CategoryFormModal mode="create" onClose={() => setModal(null)} />
      )}
      {modal?.type === 'category-edit' && (
        <CategoryFormModal mode="edit" initial={modal.row} onClose={() => setModal(null)} />
      )}
      {modal?.type === 'room-create' && (
        <RoomFormModal mode="create" categories={categories} onClose={() => setModal(null)} />
      )}
      {modal?.type === 'room-edit' && (
        <RoomFormModal
          mode="edit"
          initial={modal.row}
          images={imagesByRoomId[modal.row.id] ?? []}
          categories={categories}
          onClose={() => setModal(null)}
        />
      )}
      {modal?.type === 'room-delete' && (
        <DeleteRoomModal
          room={modal.row}
          onClose={() => setModal(null)}
        />
      )}
      {modal?.type === 'force-delete-rooms' && (
        <ForceDeleteModal
          title="Excluir quartos permanentemente"
          items={rooms
            .filter((r) => selectedIds.has(r.id))
            .map((r) => ({
              id: r.id,
              label: r.room_number ? `#${r.room_number} — ${r.name}` : r.name,
            }))}
          onConfirm={forceDeleteRoomsAction}
          onClose={() => {
            setModal(null)
            setSelectedIds(new Set())
          }}
        />
      )}
    </div>
  )
}

// ── Sub-components ─────────────────────────────────────────────────────────────

function EmptyState({ message }: { message: string }) {
  return (
    <div className="bg-white rounded-2xl border border-admin-border shadow-sm py-12 text-center text-[13px] text-slate-400">
      {message}
    </div>
  )
}

function CategoryTableRow({ row, onEdit }: { row: CategoryRow; onEdit: () => void }) {
  const [isPending, startTransition] = useTransition()

  return (
    <tr className="border-b border-slate-100 last:border-0 hover:bg-slate-50/40 transition-colors">
      <td className="px-4 py-3 font-medium text-slate-800">{row.name}</td>
      <td className="px-4 py-3 text-slate-400 hidden sm:table-cell font-mono text-[11px]">{row.slug}</td>
      <td className="px-4 py-3 text-slate-500 hidden md:table-cell">{row.sort_order}</td>
      <td className="px-4 py-3">
        <button
          onClick={() => startTransition(() => toggleCategoryActiveAction(row.id, !row.is_active))}
          disabled={isPending}
          className={cn(
            'text-[11px] font-semibold px-2.5 py-1 rounded-full transition-colors',
            row.is_active
              ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
              : 'bg-slate-100 text-slate-500 hover:bg-slate-200',
          )}
        >
          {isPending ? '…' : row.is_active ? 'Ativa' : 'Inativa'}
        </button>
      </td>
      <td className="px-4 py-3 text-right">
        <button
          onClick={onEdit}
          className="text-admin-sidebar-act hover:text-admin-sidebar text-[12px] font-semibold transition-colors"
        >
          Editar
        </button>
      </td>
    </tr>
  )
}

function RoomTableRow({
  row,
  categoryName,
  photoCount,
  onEdit,
  onDelete,
  selected,
  onToggleSelect,
}: {
  row: RoomRow
  categoryName: string
  photoCount: number
  onEdit: () => void
  onDelete?: () => void
  selected?: boolean
  onToggleSelect?: () => void
}) {
  const [isPending, startTransition] = useTransition()

  return (
    <tr className={cn('border-b border-slate-100 last:border-0 hover:bg-slate-50/40 transition-colors', selected && 'bg-red-50/40')}>
      {onToggleSelect !== undefined && (
        <td className="px-4 py-3 w-8">
          <input
            type="checkbox"
            checked={selected ?? false}
            onChange={onToggleSelect}
            className="rounded border-slate-300 text-red-600 focus:ring-red-400/30 cursor-pointer"
          />
        </td>
      )}
      <td className="px-4 py-3">
        <span className="font-medium text-slate-800">{row.name}</span>
        {row.room_number && (
          <span className="ml-1.5 text-[10px] text-slate-400 font-mono">#{row.room_number}</span>
        )}
        {row.short_description && (
          <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-1">{row.short_description}</p>
        )}
      </td>
      <td className="px-4 py-3 text-slate-500 hidden md:table-cell">{categoryName}</td>
      <td className="px-4 py-3 text-slate-700 hidden sm:table-cell font-medium">
        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(row.base_price_brl)}
      </td>
      <td className="px-4 py-3 text-slate-500 hidden lg:table-cell">{row.max_guests}</td>
      <td className="px-4 py-3 hidden lg:table-cell">
        {row.ocean_view ? (
          <span className="text-[11px] text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">Sim</span>
        ) : (
          <span className="text-[11px] text-slate-400">—</span>
        )}
      </td>
      <td className="px-4 py-3 hidden lg:table-cell">
        {photoCount > 0 ? (
          <span className="text-[11px] font-semibold text-sky-700 bg-sky-50 px-2 py-0.5 rounded-full">{photoCount}</span>
        ) : (
          <span className="text-[11px] text-red-400">Sem fotos</span>
        )}
      </td>
      <td className="px-4 py-3 hidden sm:table-cell">
        {row.featured ? (
          <span className="text-[11px] text-sky-700 bg-sky-50 px-2 py-0.5 rounded-full">
            {row.sort_order + 1}º destaque
          </span>
        ) : (
          <span className="text-[11px] text-slate-400">Não destacar</span>
        )}
      </td>
      <td className="px-4 py-3">
        <button
          onClick={() => startTransition(() => toggleRoomActiveAction(row.id, !row.is_active))}
          disabled={isPending}
          className={cn(
            'text-[11px] font-semibold px-2.5 py-1 rounded-full transition-colors',
            row.is_active
              ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
              : 'bg-slate-100 text-slate-500 hover:bg-slate-200',
          )}
        >
          {isPending ? '…' : row.is_active ? 'Ativo' : 'Inativo'}
        </button>
      </td>
      <td className="px-4 py-3 text-right">
        <div className="flex items-center justify-end gap-3">
          <button
            onClick={onEdit}
            className="text-admin-sidebar-act hover:text-admin-sidebar text-[12px] font-semibold transition-colors"
          >
            Editar
          </button>
          {onDelete && (
            <button
              onClick={onDelete}
              className="text-red-400 hover:text-red-600 text-[12px] font-semibold transition-colors"
            >
              Excluir
            </button>
          )}
        </div>
      </td>
    </tr>
  )
}
