'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'

type AlertItem = {
  severity: 'critical' | 'warning' | 'info'
  text: string
  href: string
}

const DOT: Record<string, string> = {
  critical: 'bg-red-500',
  warning:  'bg-amber-500',
  info:     'bg-sky-400',
}

const TEXT: Record<string, string> = {
  critical: 'text-red-700',
  warning:  'text-amber-700',
  info:     'text-slate-700',
}

export function NotificationBell({ alerts }: { alerts: AlertItem[] }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  // Close panel on outside click
  useEffect(() => {
    if (!open) return
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  if (alerts.length === 0) return null

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={`${alerts.length} alertas`}
        className="relative flex items-center justify-center w-8 h-8 rounded-xl hover:bg-slate-100 transition-colors"
      >
        <BellIcon className="w-5 h-5 text-slate-500" />
        <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center">
          {alerts.length > 9 ? '9+' : alerts.length}
        </span>
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-2xl border border-admin-border shadow-xl z-50 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
            <h3 className="text-[13px] font-bold text-slate-800">Alertas operacionais</h3>
            <span className="text-[11px] font-bold text-white bg-red-500 rounded-full px-2 py-0.5">
              {alerts.length}
            </span>
          </div>
          <div className="divide-y divide-slate-100 max-h-80 overflow-y-auto">
            {alerts.map((alert, i) => (
              <Link
                key={i}
                href={alert.href}
                onClick={() => setOpen(false)}
                className="flex items-start gap-3 px-4 py-3 hover:bg-slate-50 transition-colors"
              >
                <div className={`w-2 h-2 rounded-full ${DOT[alert.severity]} shrink-0 mt-[3px]`} />
                <p className={`text-[12px] font-medium ${TEXT[alert.severity]} flex-1 leading-snug`}>
                  {alert.text}
                </p>
                <span className="text-[11px] font-semibold text-admin-sidebar-act shrink-0">Ver →</span>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function BellIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  )
}
