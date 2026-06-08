'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useState } from 'react'

const INPUT =
  'border border-admin-border rounded-xl px-3 py-2.5 text-[13px] text-slate-700 placeholder:text-slate-400 bg-white ' +
  'focus:outline-none focus:ring-2 focus:ring-admin-sidebar-act/20 focus:border-admin-sidebar-act/40'

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
      className="bg-white rounded-2xl border border-admin-border shadow-sm p-4 md:p-5 flex flex-col md:flex-row gap-3"
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
        className="bg-admin-sidebar text-white px-5 py-2.5 rounded-xl text-[13px] font-semibold hover:bg-admin-sidebar-act transition-colors shrink-0"
      >
        Buscar
      </button>
      {searchParams.get('q') && (
        <button
          type="button"
          onClick={clear}
          className="text-[12px] font-semibold text-slate-400 hover:text-slate-700 transition-colors px-3 py-2.5 shrink-0"
        >
          Limpar busca
        </button>
      )}
    </form>
  )
}
