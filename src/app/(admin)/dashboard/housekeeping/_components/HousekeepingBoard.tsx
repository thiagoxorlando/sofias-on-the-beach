'use client'

import { useState, useTransition } from 'react'
import { HandoffRequestCard, type HandoffRow } from '@/components/admin/HandoffRequestCard'
import { GovRoomCard } from './GovRoomCard'
import { AssignmentPanel } from './AssignmentPanel'
import type { StaffMember, AssignmentItem, AssignableRoom } from './AssignmentPanel'
import { updateHousekeepingStatusAction } from '../actions'

// ── Shared room type ──────────────────────────────────────────────────────────

export type RoomBoardItem = {
  id: string
  name: string
  roomNumber: string | null
  categoryName: string
  status: string
  lastCheckout: { token: string; guestName: string; date: string } | null
  nextArrival:  { token: string; guestName: string; date: string } | null
  latestLog: {
    toStatus: string
    note: string | null
    authorName: string | null
    createdAt: string
  } | null
  assignment: {
    id: string
    assignedToId: string
    assignedToName: string
    status: string
  } | null
}

// ── Board props ───────────────────────────────────────────────────────────────

type Props = {
  dirty:    RoomBoardItem[]
  cleaning: RoomBoardItem[]
  awaiting: RoomBoardItem[]   // clean + inspected
  ready:    RoomBoardItem[]
  handoffRequests: HandoffRow[]
  isSupervisor: boolean
  today: string               // formatted "DD/MM/YYYY"
  currentAdminId: string
  staff: StaffMember[]
  activeAssignments: AssignmentItem[]
  availableRooms: AssignableRoom[]
}

// ── Column style maps ─────────────────────────────────────────────────────────

const COL_BG: Record<string, string> = {
  dirty:    'bg-red-50/60 border-red-100',
  cleaning: 'bg-amber-50/60 border-amber-100',
  awaiting: 'bg-sky-50/60 border-sky-100',
  ready:    'bg-emerald-50/60 border-emerald-100',
}

const COL_DOT: Record<string, string> = {
  dirty:    'bg-red-500',
  cleaning: 'bg-amber-500',
  awaiting: 'bg-sky-500',
  ready:    'bg-emerald-500',
}

const COL_COUNT: Record<string, string> = {
  dirty:    'text-red-700 bg-red-100',
  cleaning: 'text-amber-700 bg-amber-100',
  awaiting: 'text-sky-700 bg-sky-100',
  ready:    'text-emerald-700 bg-emerald-100',
}

// ── Root board — routes to supervisor or staff view ───────────────────────────

export function HousekeepingBoard({
  dirty, cleaning, awaiting, ready,
  handoffRequests, isSupervisor, today,
  currentAdminId, staff, activeAssignments, availableRooms,
}: Props) {
  if (!isSupervisor) {
    return (
      <StaffWorkScreen
        dirty={dirty}
        cleaning={cleaning}
        awaiting={awaiting}
        handoffRequests={handoffRequests}
        currentAdminId={currentAdminId}
        today={today}
      />
    )
  }

  return (
    <SupervisorBoard
      dirty={dirty}
      cleaning={cleaning}
      awaiting={awaiting}
      ready={ready}
      handoffRequests={handoffRequests}
      today={today}
      currentAdminId={currentAdminId}
      staff={staff}
      activeAssignments={activeAssignments}
      availableRooms={availableRooms}
    />
  )
}

// ── SUPERVISOR BOARD ──────────────────────────────────────────────────────────

function SupervisorBoard({
  dirty, cleaning, awaiting, ready,
  handoffRequests, today,
  currentAdminId, staff, activeAssignments, availableRooms,
}: Omit<Props, 'isSupervisor'>) {
  const total = dirty.length + cleaning.length + awaiting.length + ready.length

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-7 w-full space-y-5">

      {/* Page header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.12em]">Operação diária</p>
          <h1 className="text-[22px] font-bold text-admin-sidebar mt-0.5">Governança</h1>
          <p className="text-[13px] text-slate-400 mt-0.5">
            Controle operacional · {today}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <StatPill value={dirty.length}    label="sujos"        color="red" />
          <StatPill value={cleaning.length} label="em limpeza"   color="amber" />
          <StatPill value={awaiting.length} label="ag. inspeção" color="sky" />
          <StatPill value={ready.length}    label="prontos"      color="emerald" />
          {handoffRequests.length > 0 && (
            <StatPill value={handoffRequests.length} label="solicitações" color="violet" />
          )}
        </div>
      </div>

      {/* Main 2-panel layout */}
      <div className="flex flex-col xl:flex-row gap-5 items-start">

        {/* Kanban board */}
        <div className="flex-1 min-w-0 w-full">
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
            <KanbanColumn colKey="dirty"    title="Sujos"                rooms={dirty}    isSupervisor currentAdminId={currentAdminId} />
            <KanbanColumn colKey="cleaning" title="Em limpeza"           rooms={cleaning} isSupervisor currentAdminId={currentAdminId} />
            <KanbanColumn colKey="awaiting" title="Aguardando inspeção"  rooms={awaiting} isSupervisor currentAdminId={currentAdminId} />
            <KanbanColumn colKey="ready"    title="Prontos"              rooms={ready}    isSupervisor currentAdminId={currentAdminId} />
          </div>
        </div>

        {/* Right supervisor panel */}
        <div className="w-full xl:w-[280px] shrink-0 space-y-4">

          <SummaryPanel
            dirty={dirty.length}
            cleaning={cleaning.length}
            awaiting={awaiting.length}
            ready={ready.length}
            total={total}
          />

          {awaiting.length > 0 && (
            <InspectionPanel rooms={awaiting} />
          )}

          <AssignmentPanel
            isSupervisor
            currentAdminId={currentAdminId}
            staff={staff}
            activeAssignments={activeAssignments}
            availableRooms={availableRooms}
          />

          {handoffRequests.length > 0 && (
            <HandoffPanel requests={handoffRequests} />
          )}

        </div>
      </div>
    </div>
  )
}

// ── STAFF WORK SCREEN ─────────────────────────────────────────────────────────

function StaffWorkScreen({
  dirty, cleaning, awaiting,
  handoffRequests,
  currentAdminId,
  today,
}: {
  dirty: RoomBoardItem[]
  cleaning: RoomBoardItem[]
  awaiting: RoomBoardItem[]
  handoffRequests: HandoffRow[]
  currentAdminId: string
  today: string
}) {
  // My tasks: rooms assigned to this staff member (in any pre-ready state)
  const allActive = [...dirty, ...cleaning, ...awaiting]
  const myTasks = allActive.filter((r) => r.assignment?.assignedToId === currentAdminId)

  // Available: dirty rooms with no active assignment (staff can self-pick)
  const available = dirty.filter((r) => !r.assignment)

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-7 w-full space-y-5">

      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.12em]">Área de trabalho</p>
          <h1 className="text-[22px] font-bold text-admin-sidebar mt-0.5">Governança</h1>
          <p className="text-[13px] text-slate-400 mt-0.5">
            {today}
            <span className="ml-2 text-[10px] font-bold text-sky-700 bg-sky-50 border border-sky-100 rounded-full px-2 py-0.5">
              Colaborador
            </span>
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <StatPill value={myTasks.length}  label="minha(s) tarefa(s)"  color="violet" />
          <StatPill value={available.length} label="disponível(is)"     color="amber" />
          {handoffRequests.length > 0 && (
            <StatPill value={handoffRequests.length} label="solicitações" color="sky" />
          )}
        </div>
      </div>

      {/* Two-column on desktop, stacked on mobile */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-5 items-start">

        {/* Main column — tasks */}
        <div className="space-y-6">

          {/* My tasks */}
          <section>
            <StaffSectionHeader title="Minhas tarefas" count={myTasks.length} dot="bg-violet-500" />
            {myTasks.length === 0 ? (
              <div className="rounded-2xl border border-admin-border bg-slate-50 px-5 py-10 text-center text-[13px] text-slate-400">
                Nenhuma tarefa atribuída a você ainda.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {myTasks.map((room) => (
                  <GovRoomCard key={room.id} room={room} isSupervisor={false} currentAdminId={currentAdminId} />
                ))}
              </div>
            )}
          </section>

          {/* Available to self-pick */}
          {available.length > 0 && (
            <section>
              <StaffSectionHeader title="Disponíveis para limpar" count={available.length} dot="bg-red-500" />
              <p className="text-[11px] text-slate-400 mb-3">
                Clique em &ldquo;Assumir limpeza&rdquo; para iniciar um quarto sem atribuição.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {available.map((room) => (
                  <GovRoomCard key={room.id} room={room} isSupervisor={false} currentAdminId={currentAdminId} selfAssignMode />
                ))}
              </div>
            </section>
          )}

          {myTasks.length === 0 && available.length === 0 && (
            <div className="rounded-2xl border border-admin-border bg-slate-50 px-5 py-12 text-center text-[13px] text-slate-400">
              Nenhum quarto para limpar no momento.
            </div>
          )}

        </div>

        {/* Side column — reception requests */}
        <div className="space-y-4">
          {handoffRequests.length > 0 ? (
            <div className="bg-white rounded-2xl border border-admin-border shadow-sm p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-[13px] font-bold text-slate-800">Solicitações da recepção</h3>
                <span className="text-[11px] font-bold text-amber-700 bg-amber-100 rounded-full px-2 py-0.5">
                  {handoffRequests.length}
                </span>
              </div>
              <div className="space-y-3 max-h-[500px] overflow-y-auto pr-0.5">
                {handoffRequests.map((req) => (
                  <HandoffRequestCard key={req.id} request={req} />
                ))}
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-admin-border shadow-sm p-4 text-center py-6">
              <p className="text-[12px] text-slate-400">Nenhuma solicitação da recepção.</p>
            </div>
          )}
        </div>

      </div>
    </div>
  )
}

// ── Staff section header ──────────────────────────────────────────────────────

function StaffSectionHeader({ title, count, dot }: { title: string; count: number; dot: string }) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <span className={`w-2 h-2 rounded-full ${dot} shrink-0`} />
      <h2 className="text-[13px] font-bold text-slate-700 flex-1">{title}</h2>
      <span className="text-[11px] font-bold text-slate-500 bg-slate-100 rounded-full px-2 py-0.5">{count}</span>
    </div>
  )
}

// ── Kanban column ─────────────────────────────────────────────────────────────

function KanbanColumn({
  colKey, title, rooms, isSupervisor, currentAdminId,
}: {
  colKey: string
  title: string
  rooms: RoomBoardItem[]
  isSupervisor: boolean
  currentAdminId: string
}) {
  // Rooms assigned to current user float to the top
  const sorted = [...rooms].sort((a, b) => {
    const aMine = a.assignment?.assignedToId === currentAdminId ? 0 : 1
    const bMine = b.assignment?.assignedToId === currentAdminId ? 0 : 1
    return aMine - bMine
  })

  return (
    <div className={`rounded-2xl border ${COL_BG[colKey]} p-3`}>
      <div className="flex items-center gap-2 mb-3 px-0.5">
        <span className={`w-2 h-2 rounded-full ${COL_DOT[colKey]} shrink-0`} />
        <span className="text-[12px] font-bold text-slate-700 flex-1 truncate">{title}</span>
        <span className={`text-[11px] font-bold rounded-full px-2 py-0.5 shrink-0 ${COL_COUNT[colKey]}`}>
          {rooms.length}
        </span>
      </div>

      {sorted.length === 0 ? (
        <div className="text-center text-[12px] text-slate-400 py-8 font-medium">
          Nenhum quarto
        </div>
      ) : (
        <div className="space-y-2.5">
          {sorted.map((room) => (
            <GovRoomCard
              key={room.id}
              room={room}
              isSupervisor={isSupervisor}
              currentAdminId={currentAdminId}
            />
          ))}
        </div>
      )}
    </div>
  )
}

// ── Stat pill ─────────────────────────────────────────────────────────────────

function StatPill({ value, label, color }: { value: number; label: string; color: string }) {
  const styles: Record<string, string> = {
    red:    'text-red-700 bg-red-50 border-red-100',
    amber:  'text-amber-700 bg-amber-50 border-amber-100',
    sky:    'text-sky-700 bg-sky-50 border-sky-100',
    emerald:'text-emerald-700 bg-emerald-50 border-emerald-100',
    violet: 'text-violet-700 bg-violet-50 border-violet-100',
  }
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold ${styles[color] ?? styles.sky}`}>
      <span className="font-bold">{value}</span>
      <span className="opacity-70">{label}</span>
    </span>
  )
}

// ── Right panel: summary ──────────────────────────────────────────────────────

function SummaryPanel({ dirty, cleaning, awaiting, ready, total }: {
  dirty: number; cleaning: number; awaiting: number; ready: number; total: number
}) {
  return (
    <div className="bg-white rounded-2xl border border-admin-border shadow-sm p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-[13px] font-bold text-slate-800">Resumo do dia</h3>
        <span className="text-[11px] text-slate-400">{total} quartos</span>
      </div>
      <div className="space-y-2.5">
        <SummaryRow label="Sujos"          value={dirty}    dot="bg-red-500" />
        <SummaryRow label="Em limpeza"     value={cleaning} dot="bg-amber-500" />
        <SummaryRow label="Ag. inspeção"   value={awaiting} dot="bg-sky-500" />
        <SummaryRow label="Prontos"        value={ready}    dot="bg-emerald-500" />
      </div>
      {total > 0 && (
        <div className="mt-3.5 pt-3 border-t border-slate-100">
          <div className="flex h-2 rounded-full overflow-hidden gap-px bg-slate-100">
            {dirty > 0 && (
              <div className="bg-red-400 transition-all" style={{ width: `${(dirty / total) * 100}%` }} />
            )}
            {cleaning > 0 && (
              <div className="bg-amber-400 transition-all" style={{ width: `${(cleaning / total) * 100}%` }} />
            )}
            {awaiting > 0 && (
              <div className="bg-sky-400 transition-all" style={{ width: `${(awaiting / total) * 100}%` }} />
            )}
            {ready > 0 && (
              <div className="bg-emerald-400 transition-all" style={{ width: `${(ready / total) * 100}%` }} />
            )}
          </div>
          <div className="mt-1.5 flex justify-between text-[10px] text-slate-400">
            <span>{total > 0 ? Math.round((ready / total) * 100) : 0}% prontos</span>
            <span>{total - ready} pendentes</span>
          </div>
        </div>
      )}
    </div>
  )
}

function SummaryRow({ label, value, dot }: { label: string; value: number; dot: string }) {
  return (
    <div className="flex items-center gap-2.5">
      <span className={`w-2 h-2 rounded-full ${dot} shrink-0`} />
      <span className="text-[12px] text-slate-600 flex-1">{label}</span>
      <span className="text-[13px] font-bold text-slate-800 tabular-nums">{value}</span>
    </div>
  )
}

// ── Right panel: inspection approvals ─────────────────────────────────────────

function InspectionPanel({ rooms }: { rooms: RoomBoardItem[] }) {
  return (
    <div className="bg-white rounded-2xl border border-admin-border shadow-sm p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-[13px] font-bold text-slate-800">Aprovações de inspeção</h3>
        <span className="text-[11px] font-bold text-sky-700 bg-sky-100 rounded-full px-2 py-0.5">
          {rooms.length}
        </span>
      </div>
      <div className="space-y-0.5">
        {rooms.map((room) => (
          <InspectionApprovalRow key={room.id} room={room} />
        ))}
      </div>
    </div>
  )
}

function InspectionApprovalRow({ room }: { room: RoomBoardItem }) {
  const [isPending, startTransition] = useTransition()
  const [released, setReleased] = useState(false)

  function release() {
    startTransition(async () => {
      const res = await updateHousekeepingStatusAction(room.id, 'ready')
      if (res && 'success' in res) setReleased(true)
    })
  }

  return (
    <div className="flex items-center justify-between gap-2 py-2 border-b border-slate-100 last:border-0">
      <div className="min-w-0">
        <p className="text-[13px] font-bold text-admin-sidebar font-mono leading-none">
          {room.roomNumber ? `#${room.roomNumber}` : room.name}
        </p>
        {room.roomNumber && (
          <p className="text-[10px] text-slate-400 truncate mt-0.5">{room.name}</p>
        )}
        {room.assignment?.assignedToName && (
          <p className="text-[10px] text-violet-600 mt-0.5 truncate">{room.assignment.assignedToName}</p>
        )}
      </div>
      {released ? (
        <span className="text-[11px] font-bold text-emerald-600 shrink-0">Liberado ✓</span>
      ) : (
        <button
          type="button"
          disabled={isPending}
          onClick={release}
          className="shrink-0 text-[11px] font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg px-2.5 py-1.5 transition-colors disabled:opacity-50"
        >
          {isPending ? '…' : 'Liberar →'}
        </button>
      )}
    </div>
  )
}

// ── Right panel: reception requests ──────────────────────────────────────────

function HandoffPanel({ requests }: { requests: HandoffRow[] }) {
  return (
    <div className="bg-white rounded-2xl border border-admin-border shadow-sm p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-[13px] font-bold text-slate-800">Solicitações da recepção</h3>
        <span className="text-[11px] font-bold text-amber-700 bg-amber-100 rounded-full px-2 py-0.5">
          {requests.length}
        </span>
      </div>
      <div className="space-y-3 max-h-[480px] overflow-y-auto pr-0.5">
        {requests.map((req) => (
          <HandoffRequestCard key={req.id} request={req} />
        ))}
      </div>
    </div>
  )
}
