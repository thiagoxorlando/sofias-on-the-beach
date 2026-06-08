'use client'

// Shared UI primitives for the rooms management forms.

export function ModalOverlay({
  children,
  onClose,
}: {
  children: React.ReactNode
  onClose: () => void
}) {
  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/30 backdrop-blur-[2px]"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="bg-white rounded-[22px] shadow-[0_24px_64px_rgba(0,18,50,0.20)] w-full max-w-[520px] max-h-[90vh] overflow-y-auto p-7">
        {children}
      </div>
    </div>
  )
}

export function FormField({
  label,
  hint,
  children,
}: {
  label: string
  hint?: string
  children: React.ReactNode
}) {
  return (
    <div>
      <label className="block text-[11px] font-semibold text-slate-700 uppercase tracking-[0.10em] mb-1.5">
        {label}
        {hint && (
          <span className="ml-1.5 text-slate-400 font-normal normal-case tracking-normal">
            {hint}
          </span>
        )}
      </label>
      {children}
    </div>
  )
}

export const INPUT =
  'w-full border border-admin-border rounded-xl px-3.5 py-2.5 text-[13px] text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-admin-sidebar-act/30 focus:border-admin-sidebar-act/40 bg-white'

export const BTN_PRIMARY =
  'bg-admin-sidebar text-white px-5 py-2.5 rounded-xl text-[13px] font-semibold hover:bg-admin-sidebar-act transition-colors disabled:opacity-60 disabled:cursor-not-allowed'

export const BTN_SECONDARY =
  'border border-admin-border text-slate-600 px-5 py-2.5 rounded-xl text-[13px] font-semibold hover:bg-slate-50 transition-colors'

export function ErrorMessage({ message }: { message: string }) {
  return (
    <p className="text-[13px] text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
      {message}
    </p>
  )
}
