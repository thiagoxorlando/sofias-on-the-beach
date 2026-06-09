import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { signOutAction } from './actions'
import { DashboardShell } from './_components/DashboardShell'
import { ReceptionShell } from './_components/ReceptionShell'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const adminDb = createAdminClient()
  const { data: adminUser } = await adminDb
    .from('admin_users')
    .select('email, full_name, role, is_active')
    .eq('id', user.id)
    .single()

  if (!adminUser) {
    return (
      <AccessDenied
        icon="lock"
        title="Acesso não encontrado"
        message="Sua conta ainda não tem acesso ao painel."
        detail={user.email ?? ''}
      />
    )
  }

  if (!adminUser.is_active) {
    return (
      <AccessDenied
        icon="ban"
        title="Conta desativada"
        message="Sua conta está desativada. Entre em contato com o administrador."
        detail={adminUser.email}
      />
    )
  }

  const adminUserProps = {
    email:     adminUser.email,
    full_name: adminUser.full_name,
    role:      adminUser.role,
  }

  // Reception staff get a dedicated front-desk workstation shell with
  // only reception-relevant navigation — no admin modules visible.
  if (adminUser.role === 'reception') {
    return <ReceptionShell adminUser={adminUserProps}>{children}</ReceptionShell>
  }

  return (
    <DashboardShell adminUser={adminUserProps}>
      {children}
    </DashboardShell>
  )
}

// ─── Access denied (no sidebar) ──────────────────────────────────────────────

function AccessDenied({
  icon,
  title,
  message,
  detail,
}: {
  icon: 'lock' | 'ban'
  title: string
  message: string
  detail: string
}) {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-6">
      <div className="text-center max-w-sm">
        <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-5">
          {icon === 'lock' ? (
            <LockIcon className="w-6 h-6 text-slate-500" />
          ) : (
            <BanIcon className="w-6 h-6 text-slate-500" />
          )}
        </div>
        <h1 className="text-[22px] font-bold text-slate-800 mb-2">{title}</h1>
        <p className="text-[14px] text-foreground/60 leading-relaxed">{message}</p>
        <p className="text-[12px] text-slate-500 mt-3">{detail}</p>
        <form action={signOutAction} className="mt-6">
          <button
            type="submit"
            className="text-[12px] font-semibold text-admin-sidebar border border-admin-border hover:border-admin-sidebar/40 px-5 py-2.5 rounded-xl transition-colors"
          >
            Sair
          </button>
        </form>
      </div>
    </div>
  )
}

function LockIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <rect x={3} y={11} width={18} height={11} rx={2} />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  )
}

function BanIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <circle cx={12} cy={12} r={9} />
      <line x1={4.9} y1={4.9} x2={19.1} y2={19.1} />
    </svg>
  )
}
