'use client'

import { useState } from 'react'
import { ForceDeleteModal } from '@/components/admin/ForceDeleteModal'
import { forceDeleteReservationsAction } from '../actions'
import { AdminListCard, AdminActionButton } from '@/components/admin/AdminUI'
import { ReservationStatusBadge, PaymentStatusBadge } from './badges'

export type BulkRow = {
  id: string
  token: string
  status: string
  checkIn: string
  checkOut: string
  adults: number
  children: number
  total: number
  createdAt: string
  guestName: string
  guestEmail: string
  guestPhone: string | null
  roomName: string
  paymentStatus: string | null
}

type Props = {
  rows: BulkRow[]
  adminRole: string
}

function formatDate(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number)
  return `${String(d).padStart(2, '0')}/${String(m).padStart(2, '0')}/${y}`
}

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleDateString('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit',
  })
}

function formatBRL(value: number): string {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(value)
}

export function ReservationsBulkActions({ rows, adminRole }: Props) {
  const canBulkDelete = adminRole === 'super_admin' || adminRole === 'admin'
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [showForceDelete, setShowForceDelete] = useState(false)

  function toggleSelect(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) { next.delete(id) } else { next.add(id) }
      return next
    })
  }

  function toggleSelectAll() {
    setSelectedIds((prev) =>
      prev.size === rows.length ? new Set() : new Set(rows.map((r) => r.id)),
    )
  }

  const selectedRows = rows.filter((r) => selectedIds.has(r.id))

  return (
    <>
      {/* Bulk action bar */}
      {canBulkDelete && selectedIds.size > 0 && (
        <div className="flex items-center justify-between gap-3 bg-red-50 border border-red-200 rounded-xl px-4 py-2.5 mb-3">
          <p className="text-[13px] font-semibold text-red-700">
            {selectedIds.size} reserva{selectedIds.size !== 1 ? 's' : ''} selecionada{selectedIds.size !== 1 ? 's' : ''}
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
              onClick={() => setShowForceDelete(true)}
              className="text-[12px] font-semibold text-white bg-red-600 hover:bg-red-700 rounded-lg px-3 py-1.5 transition-colors"
            >
              Excluir selecionadas
            </button>
          </div>
        </div>
      )}

      {/* Select all row — shown only to admin/super_admin */}
      {canBulkDelete && rows.length > 0 && (
        <div className="flex items-center gap-2 mb-2 px-1">
          <input
            type="checkbox"
            id="select-all-reservations"
            checked={selectedIds.size === rows.length}
            onChange={toggleSelectAll}
            className="rounded border-slate-300 text-red-600 focus:ring-red-400/30 cursor-pointer"
          />
          <label htmlFor="select-all-reservations" className="text-[12px] text-slate-500 cursor-pointer select-none">
            Selecionar todos ({rows.length})
          </label>
        </div>
      )}

      {/* Reservation list */}
      <div className="space-y-3">
        {rows.map((row) => (
          <div key={row.id} className="flex items-start gap-3">
            {canBulkDelete && (
              <div className="pt-4 shrink-0">
                <input
                  type="checkbox"
                  checked={selectedIds.has(row.id)}
                  onChange={() => toggleSelect(row.id)}
                  className="rounded border-slate-300 text-red-600 focus:ring-red-400/30 cursor-pointer"
                  aria-label={`Selecionar reserva ${row.token}`}
                />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <AdminListCard
                title={row.guestName}
                titleMeta={`${row.guestEmail}${row.guestPhone ? ` · ${row.guestPhone}` : ''} · criada em ${formatDateTime(row.createdAt)}`}
                badges={
                  <>
                    <ReservationStatusBadge status={row.status} />
                    <PaymentStatusBadge status={row.paymentStatus} />
                  </>
                }
                meta={row.token}
                fields={[
                  { label: 'Quarto', value: row.roomName },
                  { label: 'Check-in / Check-out', value: <>{formatDate(row.checkIn)} <span className="text-slate-400">→</span> {formatDate(row.checkOut)}</> },
                  { label: 'Hóspedes', value: `${row.adults}${row.children > 0 ? ` + ${row.children}` : ''}` },
                  { label: 'Total', value: formatBRL(row.total) },
                ]}
                actions={
                  <div className="flex items-center justify-end">
                    <AdminActionButton href={`/dashboard/reservations/${row.id}`} variant="link">
                      Ver detalhes →
                    </AdminActionButton>
                  </div>
                }
              />
            </div>
          </div>
        ))}
      </div>

      {/* Force delete modal */}
      {showForceDelete && (
        <ForceDeleteModal
          title="Excluir reservas permanentemente"
          items={selectedRows.map((r) => ({
            id: r.id,
            label: `${r.token} — ${r.guestName}`,
          }))}
          onConfirm={forceDeleteReservationsAction}
          onClose={() => {
            setShowForceDelete(false)
            setSelectedIds(new Set())
          }}
        />
      )}
    </>
  )
}
