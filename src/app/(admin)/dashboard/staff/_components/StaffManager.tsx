'use client'

import { useState } from 'react'
import { StaffFormModal } from './StaffFormModal'
import { ResetPasswordModal } from './ResetPasswordModal'
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
          <h2 className="font-serif text-[18px] font-bold text-ocean-900">Usuários</h2>
          <p className="text-[12px] text-ocean-500 mt-0.5">
            {staff.length} conta{staff.length !== 1 ? 's' : ''} de equipe cadastrada{staff.length !== 1 ? 's' : ''}
          </p>
        </div>
        <button onClick={() => setModal({ type: 'create' })} className={BTN_PRIMARY}>
          + Novo usuário
        </button>
      </div>

      {staff.length === 0 ? (
        <div className="bg-white rounded-[18px] border border-ocean-100 text-center text-[13px] text-ocean-400 py-10">
          Nenhum usuário de equipe cadastrado ainda.
        </div>
      ) : (
        <div className="bg-white rounded-[18px] border border-ocean-100 overflow-hidden overflow-x-auto">
          <table className="w-full text-[13px]">
            <thead>
              <tr className="border-b border-ocean-100 bg-ocean-50/50">
                <th className="text-left px-4 py-3 font-semibold text-ocean-700">Nome</th>
                <th className="text-left px-4 py-3 font-semibold text-ocean-700 hidden md:table-cell">E-mail</th>
                <th className="text-left px-4 py-3 font-semibold text-ocean-700">Cargo</th>
                <th className="text-left px-4 py-3 font-semibold text-ocean-700">Status</th>
                <th className="text-left px-4 py-3 font-semibold text-ocean-700 hidden lg:table-cell">Último acesso</th>
                <th className="text-left px-4 py-3 font-semibold text-ocean-700 hidden lg:table-cell">Criado em</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {staff.map((row) => (
                <tr key={row.id} className="border-b border-ocean-50 last:border-0 hover:bg-ocean-50/30">
                  <td className="px-4 py-3">
                    <p className="font-semibold text-ocean-900">{row.full_name}</p>
                    <p className="text-[11px] text-ocean-400 md:hidden">{row.email}</p>
                  </td>
                  <td className="px-4 py-3 text-ocean-600 hidden md:table-cell">{row.email}</td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold bg-ocean-100 text-ocean-700">
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
                  <td className="px-4 py-3 text-ocean-500 hidden lg:table-cell">{formatDateTime(row.last_login_at)}</td>
                  <td className="px-4 py-3 text-ocean-500 hidden lg:table-cell">{formatDate(row.created_at)}</td>
                  <td className="px-4 py-3 text-right whitespace-nowrap">
                    <button
                      onClick={() => setModal({ type: 'edit', row })}
                      className="text-[12px] font-semibold text-ocean-700 hover:text-ocean-900 transition-colors"
                    >
                      Editar
                    </button>
                    <span className="mx-2 text-ocean-200">·</span>
                    <button
                      onClick={() => setModal({ type: 'reset-password', row })}
                      className="text-[12px] font-semibold text-ocean-700 hover:text-ocean-900 transition-colors"
                    >
                      Redefinir senha
                    </button>
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

      <p className="text-[11px] text-ocean-400 mt-3">
        Sua conta: {staff.find((s) => s.id === currentAdminId)?.full_name ?? '—'}. Não é possível desativar a própria conta.
      </p>
    </div>
  )
}
