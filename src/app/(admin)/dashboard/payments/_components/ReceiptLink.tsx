'use client'

import { useState, useTransition } from 'react'
import { getReceiptSignedUrlAction } from '../actions'

export function ReceiptLink({ receiptPath, label = 'Ver comprovante →' }: { receiptPath: string; label?: string }) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function open() {
    setError(null)
    startTransition(async () => {
      const result = await getReceiptSignedUrlAction(receiptPath)
      if ('error' in result) { setError(result.error); return }
      window.open(result.url, '_blank', 'noopener,noreferrer')
    })
  }

  return (
    <span className="inline-flex items-center gap-2">
      <button
        type="button"
        onClick={open}
        disabled={isPending}
        className="text-[12px] font-semibold text-ocean-600 hover:text-ocean-900 transition-colors disabled:opacity-50 whitespace-nowrap"
      >
        {isPending ? 'Abrindo…' : label}
      </button>
      {error && <span className="text-[11px] text-red-600">{error}</span>}
    </span>
  )
}
