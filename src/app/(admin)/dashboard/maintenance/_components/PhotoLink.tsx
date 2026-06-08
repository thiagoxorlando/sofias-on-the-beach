'use client'

import { useState, useTransition } from 'react'
import { getMaintenancePhotoSignedUrlAction, deleteMaintenancePhotoAction } from '../actions'

export function PhotoLink({ ticketId, photoPath, index, canDelete }: {
  ticketId: string
  photoPath: string
  index: number
  canDelete?: boolean
}) {
  const [isOpening, startOpen] = useTransition()
  const [isDeleting, startDelete] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function open() {
    setError(null)
    startOpen(async () => {
      const result = await getMaintenancePhotoSignedUrlAction(photoPath)
      if ('error' in result) { setError(result.error); return }
      window.open(result.url, '_blank', 'noopener,noreferrer')
    })
  }

  function remove() {
    setError(null)
    startDelete(async () => {
      const result = await deleteMaintenancePhotoAction(ticketId, photoPath)
      if (result && 'error' in result) setError(result.error)
    })
  }

  return (
    <span className="inline-flex items-center gap-2">
      <button
        type="button"
        onClick={open}
        disabled={isOpening || isDeleting}
        className="text-[12px] font-semibold text-admin-sidebar-act hover:text-admin-sidebar transition-colors disabled:opacity-50"
      >
        {isOpening ? 'Abrindo…' : `Foto ${index + 1} →`}
      </button>
      {canDelete && (
        <button
          type="button"
          onClick={remove}
          disabled={isOpening || isDeleting}
          className="text-[11px] font-semibold text-red-500 hover:text-red-700 transition-colors disabled:opacity-50"
        >
          {isDeleting ? 'Removendo…' : 'remover'}
        </button>
      )}
      {error && <span className="text-[11px] text-red-600">{error}</span>}
    </span>
  )
}
