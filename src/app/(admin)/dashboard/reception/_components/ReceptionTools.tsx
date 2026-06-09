'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import Link from 'next/link'
import { HandoffRequestModal } from '@/components/admin/HandoffRequestModal'
import { CheckInOutModal } from './CheckInOutModal'

// ── Search result type (matches route handler JSON) ───────────────────────────

type SearchResult = {
  id: string
  token: string
  status: string
  check_in: string
  check_out: string
  guestName: string
  guestPhone: string | null
  roomName: string
}

const STATUS_LABEL: Record<string, string> = {
  confirmed:       'Confirmado',
  pending_payment: 'Aguard. pag.',
  checked_in:      'Hospedado',
  checked_out:     'Check-out',
  cancelled:       'Cancelado',
}

const STATUS_COLOR: Record<string, string> = {
  confirmed:       'bg-emerald-50 text-emerald-700',
  pending_payment: 'bg-amber-50   text-amber-700',
  checked_in:      'bg-sky-50     text-sky-700',
  checked_out:     'bg-slate-100  text-slate-500',
  cancelled:       'bg-red-50     text-red-600',
}

function formatDate(d: string): string {
  const [y, m, day] = d.split('-').map(Number)
  return `${String(day).padStart(2, '0')}/${String(m).padStart(2, '0')}/${y}`
}

// ── Quick action shared styles ─────────────────────────────────────────────────

const QA_ICON_BG: Record<string, string> = {
  blue:    'bg-sky-100     text-sky-600',
  amber:   'bg-amber-100   text-amber-600',
  emerald: 'bg-emerald-100 text-emerald-600',
  slate:   'bg-slate-100   text-slate-600',
  red:     'bg-red-100     text-red-600',
}

const QA_WRAPPER =
  'flex flex-col items-center gap-2 rounded-xl border border-admin-border bg-slate-50/60 ' +
  'hover:bg-white hover:shadow-sm px-2 py-3.5 text-center transition-all group cursor-pointer'

function QAIcon({ color, children }: { color: string; children: React.ReactNode }) {
  return (
    <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${QA_ICON_BG[color] ?? QA_ICON_BG.slate}`}>
      {children}
    </div>
  )
}

function QALabel({ children }: { children: React.ReactNode }) {
  return (
    <span className="text-[10px] font-semibold text-slate-600 group-hover:text-slate-800 leading-snug">
      {children}
    </span>
  )
}

// ── Search panel ──────────────────────────────────────────────────────────────

function SearchPanel({ onClose }: { onClose: () => void }) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  useEffect(() => {
    // All setState calls live inside the timer callback — never synchronously
    // in the effect body — to avoid cascading renders flagged by the lint rule.
    const delay = query.length < 2 ? 0 : 300
    const timer = setTimeout(async () => {
      if (query.length < 2) {
        setResults([])
        setSearched(false)
        return
      }
      setLoading(true)
      try {
        const res = await fetch(`/dashboard/reception/search?q=${encodeURIComponent(query)}`)
        if (res.ok) {
          const json = await res.json() as { results: SearchResult[] }
          setResults(json.results)
        }
      } finally {
        setLoading(false)
        setSearched(true)
      }
    }, delay)
    return () => clearTimeout(timer)
  }, [query])

  return (
    <div className="mb-4 rounded-xl border border-admin-border bg-slate-50/40 overflow-hidden">
      {/* Search input row */}
      <div className="flex items-center gap-2 p-3 border-b border-slate-100">
        <div className="relative flex-1">
          <SearchIconSm className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          <input
            ref={inputRef}
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Nome do hóspede, token ou telefone…"
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-admin-border bg-white text-[13px] text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-admin-sidebar-act/20 focus:border-admin-sidebar-act/40"
          />
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Fechar busca"
          className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors shrink-0"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <line x1={18} y1={6} x2={6} y2={18} /><line x1={6} y1={6} x2={18} y2={18} />
          </svg>
        </button>
      </div>

      {/* Results */}
      {loading && (
        <p className="px-4 py-3 text-[12px] text-slate-400">Buscando…</p>
      )}

      {!loading && searched && results.length === 0 && (
        <p className="px-4 py-3 text-[12px] text-slate-400">Nenhuma reserva encontrada para &ldquo;{query}&rdquo;.</p>
      )}

      {!loading && results.length > 0 && (
        <div className="divide-y divide-slate-100 max-h-64 overflow-y-auto">
          {results.map((r) => (
            <Link
              key={r.id}
              href={`/dashboard/reservations/${r.id}`}
              className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-white transition-colors"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[13px] font-semibold text-slate-800 truncate">{r.guestName}</span>
                  <span className="text-[11px] text-slate-400 font-mono">{r.token}</span>
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5 truncate">
                  {r.roomName} · {formatDate(r.check_in)} → {formatDate(r.check_out)}
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className={`text-[10px] font-semibold rounded-full px-2 py-0.5 ${STATUS_COLOR[r.status] ?? 'bg-slate-100 text-slate-500'}`}>
                  {STATUS_LABEL[r.status] ?? r.status}
                </span>
                <span className="text-[12px] font-bold text-admin-sidebar-act">→</span>
              </div>
            </Link>
          ))}
        </div>
      )}

      {!loading && !searched && query.length < 2 && (
        <p className="px-4 py-3 text-[12px] text-slate-400">Digite pelo menos 2 caracteres para buscar.</p>
      )}
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

export function ReceptionTools() {
  const [showSearch, setShowSearch] = useState(false)
  const [showQueue, setShowQueue] = useState(false)
  const [handoffTarget, setHandoffTarget] = useState<'housekeeping' | 'maintenance' | null>(null)
  const closeHandoff = useCallback(() => setHandoffTarget(null), [])
  const closeSearch = useCallback(() => setShowSearch(false), [])
  const closeQueue = useCallback(() => setShowQueue(false), [])

  return (
    <>
      <div className="bg-white rounded-2xl border border-admin-border shadow-sm p-5">
        <h2 className="text-[15px] font-bold text-slate-800 mb-4">Ferramentas de recepção</h2>

        {showSearch && <SearchPanel onClose={closeSearch} />}

        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2.5">
          <Link href="/dashboard/reception/walk-in" className={QA_WRAPPER}>
            <QAIcon color="emerald"><PlusCircleIcon /></QAIcon>
            <QALabel>Nova reserva / Walk-in</QALabel>
          </Link>

          <button type="button" onClick={() => setShowSearch(true)} className={QA_WRAPPER}>
            <QAIcon color="blue"><SearchIcon2 /></QAIcon>
            <QALabel>Buscar reserva</QALabel>
          </button>

          <button type="button" onClick={() => setShowSearch(true)} className={QA_WRAPPER}>
            <QAIcon color="blue"><UserIcon /></QAIcon>
            <QALabel>Buscar hóspede</QALabel>
          </button>

          <button type="button" onClick={() => setHandoffTarget('housekeeping')} className={QA_WRAPPER}>
            <QAIcon color="amber"><SparkleIcon2 /></QAIcon>
            <QALabel>Solicitar governança</QALabel>
          </button>

          <button type="button" onClick={() => setHandoffTarget('maintenance')} className={QA_WRAPPER}>
            <QAIcon color="red"><WrenchIcon /></QAIcon>
            <QALabel>Solicitar manutenção</QALabel>
          </button>

          <button type="button" onClick={() => setShowQueue(true)} className={QA_WRAPPER}>
            <QAIcon color="slate"><CheckInIcon /></QAIcon>
            <QALabel>Ver check-ins/outs</QALabel>
          </button>
        </div>
      </div>

      {handoffTarget !== null && (
        <HandoffRequestModal
          defaultDepartment={handoffTarget}
          onClose={closeHandoff}
        />
      )}

      {showQueue && <CheckInOutModal onClose={closeQueue} />}
    </>
  )
}

// ── Icons ─────────────────────────────────────────────────────────────────────

function SearchIconSm({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <circle cx={11} cy={11} r={8} /><path d="m21 21-4.35-4.35" />
    </svg>
  )
}

function PlusCircleIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5" aria-hidden="true">
      <circle cx={12} cy={12} r={9} /><line x1={12} y1={8} x2={12} y2={16} /><line x1={8} y1={12} x2={16} y2={12} />
    </svg>
  )
}

function SearchIcon2() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5" aria-hidden="true">
      <circle cx={11} cy={11} r={8} /><path d="m21 21-4.35-4.35" />
    </svg>
  )
}

function UserIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5" aria-hidden="true">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx={12} cy={7} r={4} />
    </svg>
  )
}

function SparkleIcon2() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5" aria-hidden="true">
      <path d="M3 12h2M19 12h2M12 3v2M12 19v2M5.6 5.6l1.4 1.4M16.97 16.97l1.44 1.44M5.64 18.36l1.41-1.41M16.97 7.03l1.44-1.44" />
    </svg>
  )
}

function WrenchIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5" aria-hidden="true">
      <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
    </svg>
  )
}

function CheckInIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5" aria-hidden="true">
      <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" /><polyline points="10 17 15 12 10 7" /><line x1={15} y1={12} x2={3} y2={12} />
    </svg>
  )
}
