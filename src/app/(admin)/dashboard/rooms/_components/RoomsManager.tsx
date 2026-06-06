'use client'

import { useState, useTransition } from 'react'
import { CategoryFormModal } from './CategoryFormModal'
import { RoomFormModal } from './RoomFormModal'
import { toggleCategoryActiveAction, toggleRoomActiveAction } from '../actions'
import type { CategoryRow, RoomRow } from './types'
import { BTN_PRIMARY } from './form-helpers'
import { cn } from '@/lib/utils'

type Props = {
  categories: CategoryRow[]
  rooms: RoomRow[]
}

type ActiveModal =
  | { type: 'category-create' }
  | { type: 'category-edit'; row: CategoryRow }
  | { type: 'room-create' }
  | { type: 'room-edit'; row: RoomRow }
  | null

export function RoomsManager({ categories, rooms }: Props) {
  const [modal, setModal] = useState<ActiveModal>(null)

  return (
    <div className="space-y-10">
      {/* Categories section */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="font-serif text-[18px] font-bold text-ocean-900">Categorias</h2>
            <p className="text-[12px] text-ocean-500 mt-0.5">Tipos de quarto disponíveis</p>
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
          <div className="bg-white rounded-[18px] border border-ocean-100 overflow-hidden">
            <table className="w-full text-[13px]">
              <thead>
                <tr className="border-b border-ocean-100 bg-ocean-50/50">
                  <th className="text-left px-4 py-3 font-semibold text-ocean-700">Nome</th>
                  <th className="text-left px-4 py-3 font-semibold text-ocean-700 hidden sm:table-cell">Slug</th>
                  <th className="text-left px-4 py-3 font-semibold text-ocean-700 hidden md:table-cell">Posição na lista</th>
                  <th className="text-left px-4 py-3 font-semibold text-ocean-700">Status</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {categories.map((cat) => (
                  <CategoryRow
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
            <h2 className="font-serif text-[18px] font-bold text-ocean-900">Quartos</h2>
            <p className="text-[12px] text-ocean-500 mt-0.5">{rooms.length} quarto{rooms.length !== 1 ? 's' : ''} cadastrado{rooms.length !== 1 ? 's' : ''}</p>
          </div>
          <button
            onClick={() => setModal({ type: 'room-create' })}
            className={BTN_PRIMARY}
            disabled={categories.filter((c) => c.is_active).length === 0}
            title={categories.filter((c) => c.is_active).length === 0 ? 'Crie uma categoria ativa primeiro' : undefined}
          >
            + Novo quarto
          </button>
        </div>

        {rooms.length === 0 ? (
          <EmptyState message="Nenhum quarto cadastrado ainda." />
        ) : (
          <div className="bg-white rounded-[18px] border border-ocean-100 overflow-hidden">
            <table className="w-full text-[13px]">
              <thead>
                <tr className="border-b border-ocean-100 bg-ocean-50/50">
                  <th className="text-left px-4 py-3 font-semibold text-ocean-700">Nome</th>
                  <th className="text-left px-4 py-3 font-semibold text-ocean-700 hidden md:table-cell">Categoria</th>
                  <th className="text-left px-4 py-3 font-semibold text-ocean-700 hidden sm:table-cell">Preço</th>
                  <th className="text-left px-4 py-3 font-semibold text-ocean-700 hidden lg:table-cell">Hóspedes</th>
                  <th className="text-left px-4 py-3 font-semibold text-ocean-700 hidden lg:table-cell">Vista</th>
                  <th className="text-left px-4 py-3 font-semibold text-ocean-700 hidden sm:table-cell">Landing page</th>
                  <th className="text-left px-4 py-3 font-semibold text-ocean-700">Status</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {rooms.map((room) => (
                  <RoomTableRow
                    key={room.id}
                    row={room}
                    categoryName={categories.find((c) => c.id === room.category_id)?.name ?? '—'}
                    onEdit={() => setModal({ type: 'room-edit', row: room })}
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
        <RoomFormModal mode="edit" initial={modal.row} categories={categories} onClose={() => setModal(null)} />
      )}
    </div>
  )
}

// ── Sub-components ─────────────────────────────────────────────────────────────

function EmptyState({ message }: { message: string }) {
  return (
    <div className="bg-white rounded-[18px] border border-ocean-100 py-12 text-center text-[13px] text-ocean-400">
      {message}
    </div>
  )
}

function CategoryRow({ row, onEdit }: { row: CategoryRow; onEdit: () => void }) {
  const [isPending, startTransition] = useTransition()

  return (
    <tr className="border-b border-ocean-50 last:border-0 hover:bg-ocean-50/30 transition-colors">
      <td className="px-4 py-3 font-medium text-ocean-900">{row.name}</td>
      <td className="px-4 py-3 text-ocean-400 hidden sm:table-cell font-mono text-[11px]">{row.slug}</td>
      <td className="px-4 py-3 text-ocean-500 hidden md:table-cell">{row.sort_order}</td>
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
          className="text-ocean-500 hover:text-ocean-800 text-[12px] font-semibold transition-colors"
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
  onEdit,
}: {
  row: RoomRow
  categoryName: string
  onEdit: () => void
}) {
  const [isPending, startTransition] = useTransition()

  return (
    <tr className="border-b border-ocean-50 last:border-0 hover:bg-ocean-50/30 transition-colors">
      <td className="px-4 py-3">
        <span className="font-medium text-ocean-900">{row.name}</span>
        {row.short_description && (
          <p className="text-[11px] text-ocean-400 mt-0.5 line-clamp-1">{row.short_description}</p>
        )}
      </td>
      <td className="px-4 py-3 text-ocean-500 hidden md:table-cell">{categoryName}</td>
      <td className="px-4 py-3 text-ocean-700 hidden sm:table-cell font-medium">
        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(row.base_price_brl)}
      </td>
      <td className="px-4 py-3 text-ocean-500 hidden lg:table-cell">{row.max_guests}</td>
      <td className="px-4 py-3 hidden lg:table-cell">
        {row.ocean_view ? (
          <span className="text-[11px] text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">Sim</span>
        ) : (
          <span className="text-[11px] text-slate-400">—</span>
        )}
      </td>
      <td className="px-4 py-3 hidden sm:table-cell">
        {row.featured ? (
          <span className="text-[11px] text-ocean-700 bg-ocean-50 px-2 py-0.5 rounded-full">
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
        <button
          onClick={onEdit}
          className="text-ocean-500 hover:text-ocean-800 text-[12px] font-semibold transition-colors"
        >
          Editar
        </button>
      </td>
    </tr>
  )
}
