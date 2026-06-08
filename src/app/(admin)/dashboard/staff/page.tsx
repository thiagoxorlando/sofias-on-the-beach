import type { Metadata } from 'next'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireModule } from '@/lib/auth'
import { AdminPageHeader } from '@/components/admin/AdminUI'
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

      <AdminPageHeader
        eyebrow="Administração"
        title="Equipe"
        subtitle="Gerencie as contas de acesso da equipe e os cargos de cada pessoa."
      />

      <StaffManager
        staff={data ?? []}
        currentAdminId={admin.id}
        isSuperAdmin={admin.role === 'super_admin'}
      />

    </div>
  )
}
