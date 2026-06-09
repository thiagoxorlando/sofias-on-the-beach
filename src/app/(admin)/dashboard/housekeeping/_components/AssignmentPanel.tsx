'use client'

import { useState, useTransition } from 'react'
import { assignRoomAction } from '../actions'

export type StaffMember = { id: string; full_name: string }

export type AssignmentItem = {
  id: string
  roomId: string
  roomName: string
  assignedToId: string
  status: string
}

export type AssignableRoom = {
  id: string
  name: string
  roomNumber: string | null
  status: string
}

type Props = {
  isSupervisor: boolean
  currentAdminId: string
  staff: StaffMember[]
  activeAssignments: AssignmentItem[]
  availableRooms: AssignableRoom[]  // dirty + cleaning rooms
}

// ── Staff view: "Minhas tarefas" ──────────────────────────────────────────────

function StaffTasksPanel({
  currentAdminId,
  activeAssignments,
}: {
  currentAdminId: string
  activeAssignments: AssignmentItem[]
}) {
  const myTasks = activeAssignments.filter((a) => a.assignedToId === currentAdminId)

  return (
    <div className="bg-white rounded-2xl border border-admin-border shadow-sm p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-[13px] font-bold text-slate-800">Minhas tarefas</h3>
        {myTasks.length > 0 && (
          <span className="text-[11px] font-bold text-violet-700 bg-violet-100 rounded-full px-2 py-0.5">
            {myTasks.length}
          </span>
        )}
      </div>
      {myTasks.length === 0 ? (
        <p className="text-[12px] text-slate-400 text-center py-3 leading-relaxed">
          Nenhum quarto atribuído a você ainda.
        </p>
      ) : (
        <div className="space-y-1.5">
          {myTasks.map((task) => (
            <div key={task.id} className="flex items-center gap-2 bg-violet-50 border border-violet-100 rounded-xl px-3 py-2">
              <span className="text-violet-400 text-[12px] shrink-0">→</span>
              <span className="text-[12px] font-semibold text-violet-800 truncate flex-1">{task.roomName}</span>
              <StatusDot status={task.status} />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function StatusDot({ status }: { status: string }) {
  const styles: Record<string, string> = {
    pending:     'bg-slate-300',
    in_progress: 'bg-amber-400',
    completed:   'bg-emerald-400',
    cancelled:   'bg-red-300',
  }
  return (
    <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${styles[status] ?? 'bg-slate-300'}`} />
  )
}

// ── Supervisor view: staff roster + assign form ───────────────────────────────

function SupervisorAssignPanel({
  staff,
  activeAssignments,
  availableRooms,
}: {
  staff: StaffMember[]
  activeAssignments: AssignmentItem[]
  availableRooms: AssignableRoom[]
}) {
  const [staffId, setStaffId]   = useState('')
  const [roomId, setRoomId]     = useState('')
  const [note, setNote]         = useState('')
  const [feedback, setFeedback] = useState<{ kind: 'error' | 'success'; text: string } | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleAssign() {
    if (!staffId || !roomId || isPending) return
    setFeedback(null)
    startTransition(async () => {
      const res = await assignRoomAction(roomId, staffId, note.trim() || undefined)
      if (!res || 'error' in res) {
        setFeedback({ kind: 'error', text: res && 'error' in res ? res.error : 'Erro ao atribuir. Tente novamente.' })
      } else {
        setFeedback({ kind: 'success', text: 'Quarto atribuído com sucesso.' })
        setStaffId('')
        setRoomId('')
        setNote('')
      }
    })
  }

  return (
    <div className="bg-white rounded-2xl border border-admin-border shadow-sm p-4">
      <h3 className="text-[13px] font-bold text-slate-800 mb-3">Atribuição da equipe</h3>

      {/* Staff roster */}
      {staff.length === 0 ? (
        <p className="text-[12px] text-slate-400 text-center py-2">
          Nenhum colaborador de governança cadastrado.
        </p>
      ) : (
        <div className="space-y-0.5 mb-3">
          {staff.map((s) => {
            const count = activeAssignments.filter((a) => a.assignedToId === s.id).length
            return (
              <div key={s.id} className="flex items-center gap-2 py-1.5 border-b border-slate-100 last:border-0">
                <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
                  <span className="text-[10px] font-bold text-slate-500">
                    {s.full_name.split(' ').filter(Boolean).map((n) => n[0]).join('').slice(0, 2).toUpperCase()}
                  </span>
                </div>
                <span className="text-[12px] font-medium text-slate-700 flex-1 truncate">{s.full_name}</span>
                {count > 0 && (
                  <span className="text-[10px] font-bold text-violet-700 bg-violet-50 border border-violet-100 rounded-full px-1.5 py-0.5 shrink-0">
                    {count}
                  </span>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Assign form */}
      {availableRooms.length > 0 && staff.length > 0 && (
        <div className="space-y-2 pt-3 border-t border-slate-100">
          <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">Atribuir quarto</p>

          <select
            value={staffId}
            onChange={(e) => setStaffId(e.target.value)}
            disabled={isPending}
            className="w-full border border-admin-border rounded-lg px-2.5 py-2 text-[12px] text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-admin-sidebar-act/30 disabled:opacity-50"
          >
            <option value="">Colaborador…</option>
            {staff.map((s) => (
              <option key={s.id} value={s.id}>{s.full_name}</option>
            ))}
          </select>

          <select
            value={roomId}
            onChange={(e) => setRoomId(e.target.value)}
            disabled={isPending}
            className="w-full border border-admin-border rounded-lg px-2.5 py-2 text-[12px] text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-admin-sidebar-act/30 disabled:opacity-50"
          >
            <option value="">Quarto…</option>
            {availableRooms.map((r) => (
              <option key={r.id} value={r.id}>
                {r.roomNumber ? `#${r.roomNumber} ` : ''}{r.name}
              </option>
            ))}
          </select>

          <input
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Observação (opcional)"
            disabled={isPending}
            className="w-full border border-admin-border rounded-lg px-2.5 py-2 text-[12px] text-slate-700 placeholder:text-slate-400 bg-white focus:outline-none focus:ring-2 focus:ring-admin-sidebar-act/30 disabled:opacity-50"
          />

          <button
            type="button"
            onClick={handleAssign}
            disabled={!staffId || !roomId || isPending}
            className="w-full py-2 rounded-xl text-[12px] font-bold bg-admin-sidebar text-white hover:bg-admin-sidebar-act transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {isPending ? 'Atribuindo…' : 'Atribuir quarto'}
          </button>

          {feedback && (
            <p className={`text-[11px] font-medium ${feedback.kind === 'error' ? 'text-red-600' : 'text-emerald-600'}`}>
              {feedback.text}
            </p>
          )}
        </div>
      )}
    </div>
  )
}

// ── Root export ───────────────────────────────────────────────────────────────

export function AssignmentPanel({
  isSupervisor,
  currentAdminId,
  staff,
  activeAssignments,
  availableRooms,
}: Props) {
  if (isSupervisor) {
    return (
      <SupervisorAssignPanel
        staff={staff}
        activeAssignments={activeAssignments}
        availableRooms={availableRooms}
      />
    )
  }
  return (
    <StaffTasksPanel
      currentAdminId={currentAdminId}
      activeAssignments={activeAssignments}
    />
  )
}
