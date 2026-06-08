import type { Metadata } from 'next'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireModule } from '@/lib/auth'
import { StaffManager } from './_components/StaffManager'
import type { StaffRow } from './_components/types'

export const metadata: Metadata = { title: "Equipe — Painel Sofia's" }

const STAFF_SELECT = 'id, email, full_name, role, is_active, last_login_at, created_at'

export default async function StaffPage() {
  const admin = await requireModule('staff')

  const db = createAdminClient()
  const { data } = await db
    .from('admin_users')
    .select(STAFF_SELECT)
    .order('created_at', { ascending: true })
    .returns<StaffRow[]>()

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8 max-w-6xl space-y-8">

      {/* Header */}
      <div>
        <p className="text-[11px] font-bold text-ocean-600 uppercase tracking-[0.28em] mb-1.5">Administração</p>
        <h1 className="font-serif text-[26px] md:text-[30px] font-bold text-ocean-900">Equipe</h1>
        <p className="text-[13px] text-ocean-500 mt-1.5">
          Gerencie as contas de acesso da equipe e os cargos de cada pessoa.
        </p>
      </div>

      <StaffManager
        staff={data ?? []}
        currentAdminId={admin.id}
        isSuperAdmin={admin.role === 'super_admin'}
      />

    </div>
  )
}
