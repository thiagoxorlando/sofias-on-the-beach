'use client'

const BTN_PRIMARY =
  'inline-flex items-center justify-center rounded-xl bg-ocean-900 text-white px-4 py-2.5 ' +
  'text-[12px] font-bold uppercase tracking-[0.08em] hover:bg-ocean-800 transition-colors'

export function PrintButton() {
  return (
    <button type="button" onClick={() => window.print()} className={BTN_PRIMARY}>
      Imprimir ficha
    </button>
  )
}
