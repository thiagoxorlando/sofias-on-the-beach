'use client'

import { useState } from 'react'
import { StaffFormModal } from './StaffFormModal'
import { ResetPasswordModal } from './ResetPasswordModal'
import { DeleteStaffModal } from './DeleteStaffModal'
import { BTN_PRIMARY } from '@/app/(admin)/dashboard/rooms/_components/form-helpers'
import type { StaffRow } from './types'

const ROLE_LABEL: Record<string, string> = {
  super_admin:  'Super Admin',
  admin:        'Administrador',
  manager:      'Gerente',
  reception:    'Recepção',
  housekeeping: 'Governança',
  maintenance:  'Manutenção',
  finance:      'Financeiro',
  staff:        'Equipe',
}

const ROLE_TONE: Record<string, string> = {
  super_admin:  'bg-red-50 text-red-700',
  admin:        'bg-slate-700 text-white',
  manager:      'bg-slate-200 text-slate-800',
  reception:    'bg-sky-100 text-sky-700',
  housekeeping: 'bg-emerald-100 text-emerald-700',
  maintenance:  'bg-amber-100 text-amber-700',
  finance:      'bg-violet-100 text-violet-700',
  staff:        'bg-slate-100 text-slate-600',
}

function formatDateTime(iso: string | null): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit',
  })
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

type ActiveModal =
  | { type: 'create' }
  | { type: 'edit'; row: StaffRow }
  | { type: 'reset-password'; row: StaffRow }
  | { type: 'delete'; row: StaffRow }
  | null

export function StaffManager({ staff, currentAdminId, isSuperAdmin }: {
  staff: StaffRow[]
  currentAdminId: string
  isSuperAdmin: boolean
}) {
  const [modal, setModal] = useState<ActiveModal>(null)

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-[15px] font-semibold text-slate-800">Usuários</h2>
          <p className="text-[12px] text-slate-500 mt-0.5">
            {staff.length} conta{staff.length !== 1 ? 's' : ''} de equipe cadastrada{staff.length !== 1 ? 's' : ''}
          </p>
        </div>
        <button onClick={() => setModal({ type: 'create' })} className={BTN_PRIMARY}>
          + Novo usuário
        </button>
      </div>

      {staff.length === 0 ? (
        <div className="bg-white rounded-2xl border border-admin-border shadow-sm text-center text-[13px] text-slate-400 py-10">
          Nenhum usuário de equipe cadastrado ainda.
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-admin-border shadow-sm overflow-hidden overflow-x-auto">
          <table className="w-full text-[13px]">
            <thead>
              <tr className="border-b border-admin-border bg-slate-50/50">
                <th className="text-left px-4 py-3 text-[11px] font-semibold text-slate-500 uppercase tracking-[0.08em]">Nome</th>
                <th className="text-left px-4 py-3 text-[11px] font-semibold text-slate-500 uppercase tracking-[0.08em] hidden md:table-cell">E-mail</th>
                <th className="text-left px-4 py-3 text-[11px] font-semibold text-slate-500 uppercase tracking-[0.08em]">Cargo</th>
                <th className="text-left px-4 py-3 text-[11px] font-semibold text-slate-500 uppercase tracking-[0.08em]">Status</th>
                <th className="text-left px-4 py-3 text-[11px] font-semibold text-slate-500 uppercase tracking-[0.08em] hidden lg:table-cell">Último acesso</th>
                <th className="text-left px-4 py-3 text-[11px] font-semibold text-slate-500 uppercase tracking-[0.08em] hidden lg:table-cell">Criado em</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {staff.map((row) => (
                <tr key={row.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50/40 transition-colors">
                  <td className="px-4 py-3">
                    <p className="font-semibold text-slate-800">{row.full_name}</p>
                    <p className="text-[11px] text-slate-400 md:hidden">{row.email}</p>
                  </td>
                  <td className="px-4 py-3 text-slate-600 hidden md:table-cell">{row.email}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold ${ROLE_TONE[row.role] ?? 'bg-slate-100 text-slate-700'}`}>
                      {ROLE_LABEL[row.role] ?? row.role}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                      row.is_active ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-600'
                    }`}>
                      {row.is_active ? 'Ativo' : 'Inativo'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-500 hidden lg:table-cell">{formatDateTime(row.last_login_at)}</td>
                  <td className="px-4 py-3 text-slate-500 hidden lg:table-cell">{formatDate(row.created_at)}</td>
                  <td className="px-4 py-3 text-right whitespace-nowrap">
                    <button
                      onClick={() => setModal({ type: 'edit', row })}
                      className="text-[12px] font-semibold text-admin-sidebar-act hover:text-admin-sidebar transition-colors"
                    >
                      Editar
                    </button>
                    <span className="mx-2 text-slate-200">·</span>
                    <button
                      onClick={() => setModal({ type: 'reset-password', row })}
                      className="text-[12px] font-semibold text-admin-sidebar-act hover:text-admin-sidebar transition-colors"
                    >
                      Redefinir senha
                    </button>
                    {isSuperAdmin && row.id !== currentAdminId && (
                      <>
                        <span className="mx-2 text-slate-200">·</span>
                        <button
                          onClick={() => setModal({ type: 'delete', row })}
                          className="text-[12px] font-semibold text-red-600 hover:text-red-700 transition-colors"
                        >
                          Excluir
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {modal?.type === 'create' && (
        <StaffFormModal mode="create" isSuperAdmin={isSuperAdmin} onClose={() => setModal(null)} />
      )}
      {modal?.type === 'edit' && (
        <StaffFormModal mode="edit" initial={modal.row} isSuperAdmin={isSuperAdmin} onClose={() => setModal(null)} />
      )}
      {modal?.type === 'reset-password' && (
        <ResetPasswordModal row={modal.row} onClose={() => setModal(null)} />
      )}
      {modal?.type === 'delete' && (
        <DeleteStaffModal row={modal.row} onClose={() => setModal(null)} />
      )}

      <p className="text-[11px] text-slate-400 mt-3">
        Sua conta: {staff.find((s) => s.id === currentAdminId)?.full_name ?? '—'}. Não é possível desativar a própria conta.
      </p>
    </div>
  )
}
