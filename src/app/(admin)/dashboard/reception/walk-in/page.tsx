import type { Metadata } from 'next'
import Link from 'next/link'
import { requireModule } from '@/lib/auth'
import { WalkInForm } from './WalkInForm'

export const metadata: Metadata = { title: "Nova Reserva Walk-in — Sofia's" }

export default async function WalkInPage() {
  await requireModule('reception')

  return (
    <div className="min-h-full bg-admin-page">

      {/* Header */}
      <div className="bg-white border-b border-admin-border px-5 sm:px-7 py-5 print:hidden">
        <div className="max-w-[900px] mx-auto">
          <div className="flex items-center gap-2 text-[12px] text-slate-400 mb-2">
            <Link href="/dashboard/reception" className="hover:text-slate-600 transition-colors">
              Recepção
            </Link>
            <span>/</span>
            <span className="text-slate-600 font-medium">Nova reserva / Walk-in</span>
          </div>
          <h1 className="text-[20px] sm:text-[22px] font-bold text-slate-800">Nova reserva walk-in</h1>
          <p className="text-[13px] text-slate-400 mt-1">
            Crie uma reserva presencial sem necessidade de conta de hóspede.
          </p>
        </div>
      </div>

      <div className="max-w-[900px] mx-auto px-4 sm:px-6 lg:px-7 py-6">
        <WalkInForm />
      </div>

    </div>
  )
}
