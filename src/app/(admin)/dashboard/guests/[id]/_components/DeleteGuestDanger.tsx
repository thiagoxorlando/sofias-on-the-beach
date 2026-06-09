'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { DeleteGuestsModal } from '../../_components/DeleteGuestsModal'

export function DeleteGuestDanger({
  guestId,
  guestName,
  guestEmail,
  guestPhone,
}: {
  guestId: string
  guestName: string
  guestEmail: string
  guestPhone: string | null
}) {
  const router = useRouter()
  const [showModal, setShowModal] = useState(false)

  function handleSuccess() {
    setShowModal(false)
    router.push('/dashboard/guests')
  }

  return (
    <>
      <div className="rounded-2xl border border-red-200 bg-red-50/40 p-5">
        <h3 className="text-[13px] font-semibold text-red-800 mb-1">Zona de perigo</h3>
        <p className="text-[12px] text-red-600 mb-4 leading-relaxed">
          Excluir este hóspede apagará permanentemente todas as reservas, pagamentos e histórico associados.
          Esta ação não pode ser desfeita.
        </p>
        <button
          type="button"
          onClick={() => setShowModal(true)}
          className="inline-flex items-center gap-1.5 rounded-xl border border-red-300 bg-white text-red-700 px-4 py-2.5 text-[12px] font-bold uppercase tracking-[0.08em] hover:bg-red-50 transition-colors"
        >
          <TrashIcon />
          Excluir hóspede permanentemente
        </button>
      </div>

      {showModal && (
        <DeleteGuestsModal
          guests={[{ id: guestId, name: guestName, email: guestEmail, phone: guestPhone }]}
          onClose={() => setShowModal(false)}
          onSuccess={handleSuccess}
        />
      )}
    </>
  )
}

function TrashIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4" aria-hidden="true">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
      <path d="M10 11v6M14 11v6" />
      <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
    </svg>
  )
}
