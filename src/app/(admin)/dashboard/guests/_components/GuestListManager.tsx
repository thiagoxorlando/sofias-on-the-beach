'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { DeleteGuestsModal, type DeleteGuestInfo } from './DeleteGuestsModal'

type GuestRow = {
  id: string
  fullName: string
  email: string
  phone: string | null
  cpf: string | null
  reservationCount: number
  totalSpent: string
  lastStay: string | null
  nextStay: string | null
  createdAt: string
}

const CHECKBOX =
  'w-4 h-4 rounded border-slate-300 text-red-600 cursor-pointer accent-red-600 shrink-0 mt-[18px]'

const CARD =
  'bg-white rounded-2xl border border-admin-border shadow-sm p-4 md:p-5'

const FIELD_LABEL = 'text-[11px] font-medium text-slate-400 mb-0.5'
const FIELD_VALUE = 'text-[13px] font-medium text-slate-800 whitespace-nowrap'

export function GuestListManager({
  rows,
  isAdmin,
}: {
  rows: GuestRow[]
  isAdmin: boolean
}) {
  const router = useRouter()
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [modal, setModal] = useState<DeleteGuestInfo[] | null>(null)

  function toggleOne(id: string) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function toggleAll() {
    if (selected.size === rows.length) {
      setSelected(new Set())
    } else {
      setSelected(new Set(rows.map((r) => r.id)))
    }
  }

  function toDeleteInfo(ids: string[]): DeleteGuestInfo[] {
    return rows
      .filter((r) => ids.includes(r.id))
      .map((r) => ({ id: r.id, name: r.fullName, email: r.email, phone: r.phone }))
  }

  function openSingleDelete(row: GuestRow) {
    setModal([{ id: row.id, name: row.fullName, email: row.email, phone: row.phone }])
  }

  function openBatchDelete() {
    setModal(toDeleteInfo([...selected]))
  }

  function handleSuccess() {
    setSelected(new Set())
    setModal(null)
    router.refresh()
  }

  const allSelected = rows.length > 0 && selected.size === rows.length
  const someSelected = selected.size > 0 && !allSelected

  return (
    <>
      {isAdmin && rows.length > 0 && (
        <div className="flex items-center justify-between bg-white rounded-2xl border border-admin-border shadow-sm px-4 py-3">
          <label className="flex items-center gap-2.5 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={allSelected}
              ref={(el) => { if (el) el.indeterminate = someSelected }}
              onChange={toggleAll}
              className={CHECKBOX}
              style={{ marginTop: 0 }}
            />
            <span className="text-[12px] text-slate-500">
              {selected.size > 0
                ? `${selected.size} selecionado${selected.size !== 1 ? 's' : ''}`
                : 'Selecionar todos'}
            </span>
          </label>
          {selected.size > 0 && (
            <button
              type="button"
              onClick={openBatchDelete}
              className="inline-flex items-center gap-1.5 rounded-xl border border-red-200 text-red-600 px-3 py-1.5 text-[12px] font-semibold hover:bg-red-50 transition-colors"
            >
              <TrashIcon />
              Excluir selecionados ({selected.size})
            </button>
          )}
        </div>
      )}

      <div className="space-y-3">
        {rows.map((row) => (
          <div key={row.id} className="flex items-start gap-3">
            {isAdmin && (
              <input
                type="checkbox"
                checked={selected.has(row.id)}
                onChange={() => toggleOne(row.id)}
                className={CHECKBOX}
              />
            )}
            <div className={`flex-1 ${CARD}`}>
              {/* Title row */}
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-semibold text-slate-800 text-[14px]">{row.fullName}</p>
                  <p className="text-[12px] text-slate-400 mt-0.5 truncate">
                    {row.email}
                    {row.phone ? ` · ${row.phone}` : ''}
                    {row.cpf ? ` · CPF ${row.cpf}` : ''}
                    {' · cadastrado em '}
                    {formatDateTime(row.createdAt)}
                  </p>
                </div>
              </div>

              {/* Fields */}
              <div className="flex flex-wrap items-start gap-x-6 gap-y-3 mt-4 pt-4 border-t border-admin-border">
                <div>
                  <p className={FIELD_LABEL}>Reservas</p>
                  <p className={FIELD_VALUE}>{row.reservationCount}</p>
                </div>
                <div>
                  <p className={FIELD_LABEL}>Total gasto</p>
                  <p className={FIELD_VALUE}>{row.totalSpent}</p>
                </div>
                <div>
                  <p className={FIELD_LABEL}>Última estadia</p>
                  <p className={FIELD_VALUE}>{row.lastStay ? formatDate(row.lastStay) : '—'}</p>
                </div>
                <div>
                  <p className={FIELD_LABEL}>Próxima estadia</p>
                  <p className={FIELD_VALUE}>
                    <span className={row.nextStay ? 'text-emerald-700' : 'text-slate-400'}>
                      {row.nextStay ? formatDate(row.nextStay) : '—'}
                    </span>
                  </p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-between mt-4 pt-3 border-t border-admin-border">
                <Link
                  href={`/dashboard/guests/${row.id}`}
                  className="text-admin-sidebar-act hover:text-admin-sidebar text-[13px] font-semibold transition-colors"
                >
                  Ver detalhes →
                </Link>
                {isAdmin && (
                  <button
                    type="button"
                    onClick={() => openSingleDelete(row)}
                    className="inline-flex items-center gap-1 rounded-xl border border-red-200 text-red-600 px-3 py-1.5 text-[12px] font-semibold hover:bg-red-50 transition-colors"
                  >
                    <TrashIcon />
                    Excluir
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {modal && (
        <DeleteGuestsModal
          guests={modal}
          onClose={() => setModal(null)}
          onSuccess={handleSuccess}
        />
      )}
    </>
  )
}

function formatDate(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number)
  return `${String(d).padStart(2, '0')}/${String(m).padStart(2, '0')}/${y}`
}

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleDateString('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
  })
}

function TrashIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5" aria-hidden="true">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
      <path d="M10 11v6M14 11v6" />
      <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
    </svg>
  )
}
