'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useState } from 'react'

const INPUT =
  'border border-ocean-200 rounded-xl px-3 py-2.5 text-[13px] text-ocean-900 placeholder:text-ocean-400 bg-white ' +
  'focus:outline-none focus:ring-2 focus:ring-ocean-500 focus:border-transparent'

export function GuestsSearch() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [q, setQ] = useState(searchParams.get('q') ?? '')

  function apply(value: string) {
    const params = new URLSearchParams()
    if (value.trim()) params.set('q', value.trim())
    const qs = params.toString()
    router.push(qs ? `/dashboard/guests?${qs}` : '/dashboard/guests')
  }

  function clear() {
    setQ('')
    router.push('/dashboard/guests')
  }

  return (
    <form
      onSubmit={(e) => { e.preventDefault(); apply(q) }}
      className="bg-white rounded-[18px] border border-ocean-100 p-4 md:p-5 mb-6 flex flex-col md:flex-row gap-3"
    >
      <input
        type="text"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Buscar por nome, e-mail, telefone ou CPF…"
        className={`${INPUT} flex-1`}
      />
      <button
        type="submit"
        className="bg-ocean-900 text-white px-5 py-2.5 rounded-xl text-[12px] font-bold uppercase tracking-[0.08em] hover:bg-ocean-800 transition-colors shrink-0"
      >
        Buscar
      </button>
      {searchParams.get('q') && (
        <button
          type="button"
          onClick={clear}
          className="text-[12px] font-semibold text-ocean-500 hover:text-ocean-800 transition-colors px-3 py-2.5 shrink-0"
        >
          Limpar busca
        </button>
      )}
    </form>
  )
}
