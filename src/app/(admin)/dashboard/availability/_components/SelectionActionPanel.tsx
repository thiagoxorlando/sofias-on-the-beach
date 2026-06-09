'use client'

import { useState } from 'react'
import { useActionState } from 'react'
import {
  setManualBlockRangeAction,
  clearManualBlockRangeAction,
  setCustomRateRangeAction,
  clearCustomRateRangeAction,
  type ActionState,
} from '../actions'
import { formatDateFull } from './RoomCalendarPanel'

export type SelectionRange = {
  roomId: string
  startDate: string  // inclusive — first night
  endDate: string    // exclusive — [start_date, end_date), used by server actions
  lastNight: string  // inclusive — last night, for display
  nights: number
}

const CARD = 'bg-white rounded-2xl border border-admin-border shadow-sm overflow-hidden'

const INPUT =
  'w-full border border-admin-border rounded-xl px-3.5 py-2.5 text-[13px] text-slate-800 placeholder:text-slate-400 bg-white ' +
  'focus:outline-none focus:ring-2 focus:ring-admin-sidebar-act/30 focus:border-admin-sidebar-act/40'

const SELECT = INPUT

const BTN_PRIMARY =
  'inline-flex items-center justify-center rounded-xl bg-admin-sidebar text-white px-5 py-2.5 ' +
  'text-[12px] font-bold uppercase tracking-[0.08em] hover:bg-admin-sidebar-act transition-colors disabled:opacity-50 disabled:cursor-not-allowed'

const REASON_PRESETS = [
  { value: 'Manutenção',                    label: 'Manutenção' },
  { value: 'Uso do proprietário',           label: 'Uso do proprietário' },
  { value: 'Limpeza',                       label: 'Limpeza' },
  { value: 'Indisponível temporariamente',  label: 'Indisponível temporariamente' },
  { value: 'custom',                        label: 'Outro' },
]

type ActionMode = 'available' | 'block' | 'rate' | 'reset_rate'

const ACTION_TABS: { mode: ActionMode; label: string }[] = [
  { mode: 'available',   label: 'Disponibilizar' },
  { mode: 'block',       label: 'Bloquear' },
  { mode: 'rate',        label: 'Alterar tarifa' },
  { mode: 'reset_rate',  label: 'Restaurar tarifa base' },
]

export type ManualBlockBrief = { date: string; reason: string }

export function SelectionActionPanel({
  range,
  manualBlocks,
  onCancel,
}: {
  range: SelectionRange
  manualBlocks: ManualBlockBrief[]
  onCancel: () => void
}) {
  const [mode, setMode] = useState<ActionMode>('available')

  return (
    <div className={CARD}>
      <div className="px-5 md:px-7 py-5 border-b border-admin-border flex items-start justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-[18px] font-bold text-admin-sidebar">O que deseja fazer com este período?</h2>
          <p className="text-[13px] text-slate-600 mt-1">
            {formatDateFull(range.startDate)} até {formatDateFull(range.lastNight)}
            {' · '}{range.nights} noite{range.nights !== 1 ? 's' : ''}
          </p>
        </div>
        <button type="button" onClick={onCancel} className="text-[12px] font-semibold text-admin-sidebar-act hover:text-admin-sidebar transition-colors shrink-0">
          Limpar seleção
        </button>
      </div>

      {manualBlocks.length > 0 && (
        <div className="px-5 md:px-7 pt-5">
          <ManualBlocksBriefing blocks={manualBlocks} />
        </div>
      )}

      <div className="px-5 md:px-7 pt-5 flex flex-wrap gap-2">
        {ACTION_TABS.map((tab) => (
          <ActionTab key={tab.mode} active={mode === tab.mode} onClick={() => setMode(tab.mode)}>
            {tab.label}
          </ActionTab>
        ))}
      </div>

      <div className="p-5 md:p-7">
        {mode === 'available'  && <AvailableAction range={range} />}
        {mode === 'block'      && <BlockAction range={range} />}
        {mode === 'rate'       && <RateAction range={range} />}
        {mode === 'reset_rate' && <ResetRateAction range={range} />}
      </div>
    </div>
  )
}

// ── A) Disponibilizar ─────────────────────────────────────────────────────────

function AvailableAction({ range }: { range: SelectionRange }) {
  const [state, action, pending] = useActionState<ActionState, FormData>(clearManualBlockRangeAction, undefined)

  return (
    <form action={action} className="space-y-4 max-w-md">
      <input type="hidden" name="room_id" value={range.roomId} />
      <input type="hidden" name="start_date" value={range.startDate} />
      <input type="hidden" name="end_date" value={range.endDate} />

      <p className="text-[13px] text-slate-600 leading-relaxed">
        Remove bloqueios manuais deste período. Reservas não serão alteradas.
      </p>

      <SubmitButton pending={pending} label="Marcar como disponível" pendingLabel="Liberando…" />

      {state && 'error' in state && <ErrorMsg>{state.error}</ErrorMsg>}
      {state && 'success' in state && <SuccessMsg>Bloqueio manual removido.</SuccessMsg>}
    </form>
  )
}

// ── B) Bloquear ───────────────────────────────────────────────────────────────

function BlockAction({ range }: { range: SelectionRange }) {
  const [reasonPreset, setReasonPreset] = useState<string>(REASON_PRESETS[0].value)
  const [state, action, pending] = useActionState<ActionState, FormData>(setManualBlockRangeAction, undefined)

  return (
    <form action={action} className="space-y-4 max-w-md">
      <input type="hidden" name="room_id" value={range.roomId} />
      <input type="hidden" name="start_date" value={range.startDate} />
      <input type="hidden" name="end_date" value={range.endDate} />

      <Field label="Motivo">
        <select
          name="reason_preset"
          value={reasonPreset}
          onChange={(e) => setReasonPreset(e.target.value)}
          className={SELECT}
        >
          {REASON_PRESETS.map((p) => (
            <option key={p.value} value={p.value}>{p.label}</option>
          ))}
        </select>
      </Field>

      {reasonPreset === 'custom' && (
        <Field label="Descreva o motivo">
          <input type="text" name="reason_custom" required placeholder="Ex.: Reforma do banheiro…" className={INPUT} />
        </Field>
      )}

      <SubmitButton pending={pending} label="Bloquear período" pendingLabel="Bloqueando…" />

      {state && 'error' in state && <ErrorMsg>{state.error}</ErrorMsg>}
      {state && 'success' in state && <SuccessMsg>Período bloqueado com sucesso.</SuccessMsg>}
    </form>
  )
}

// ── C) Alterar tarifa ─────────────────────────────────────────────────────────

function RateAction({ range }: { range: SelectionRange }) {
  const [state, action, pending] = useActionState<ActionState, FormData>(setCustomRateRangeAction, undefined)

  return (
    <form action={action} className="space-y-4 max-w-md">
      <input type="hidden" name="room_id" value={range.roomId} />
      <input type="hidden" name="start_date" value={range.startDate} />
      <input type="hidden" name="end_date" value={range.endDate} />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Field label="Valor da diária (R$)">
          <input type="number" name="price_per_night" required min={1} step={1} placeholder="Ex.: 850" className={INPUT} />
        </Field>
        <Field label="Mínimo de noites">
          <input type="number" name="min_nights" min={1} step={1} defaultValue={1} className={INPUT} />
        </Field>
      </div>

      <Field label="Nome da tarifa/regra">
        <input type="text" name="name" placeholder="Ex.: Alta temporada, Réveillon, Fim de semana…" className={INPUT} />
      </Field>

      <p className="text-[11px] text-slate-400 leading-relaxed">
        Substitui qualquer tarifa personalizada já existente que se sobreponha a este período.
      </p>

      <SubmitButton pending={pending} label="Aplicar tarifa personalizada" pendingLabel="Aplicando…" />

      {state && 'error' in state && <ErrorMsg>{state.error}</ErrorMsg>}
      {state && 'success' in state && <SuccessMsg>Tarifa aplicada com sucesso.</SuccessMsg>}
    </form>
  )
}

// ── D) Restaurar tarifa base ──────────────────────────────────────────────────

function ResetRateAction({ range }: { range: SelectionRange }) {
  const [state, action, pending] = useActionState<ActionState, FormData>(clearCustomRateRangeAction, undefined)

  return (
    <form action={action} className="space-y-4 max-w-md">
      <input type="hidden" name="room_id" value={range.roomId} />
      <input type="hidden" name="start_date" value={range.startDate} />
      <input type="hidden" name="end_date" value={range.endDate} />

      <p className="text-[13px] text-slate-600 leading-relaxed">
        Remove tarifas personalizadas deste período e volta para a tarifa base do quarto.
      </p>

      <SubmitButton pending={pending} label="Restaurar tarifa base" pendingLabel="Restaurando…" />

      {state && 'error' in state && <ErrorMsg>{state.error}</ErrorMsg>}
      {state && 'success' in state && <SuccessMsg>Tarifa base restaurada.</SuccessMsg>}
    </form>
  )
}

// ── Manual block briefing ─────────────────────────────────────────────────────

function ManualBlocksBriefing({ blocks }: { blocks: ManualBlockBrief[] }) {
  return (
    <div className="rounded-xl border border-rose-100 bg-rose-50/60 px-4 py-3.5">
      <p className="text-[11px] font-bold text-rose-700 uppercase tracking-[0.10em] mb-2">
        Bloqueios manuais neste período
      </p>
      <ul className="space-y-1">
        {blocks.map((b) => (
          <li key={b.date} className="text-[12.5px] text-rose-700 leading-snug">
            <span className="font-semibold">{formatDateFull(b.date)}</span>
            {' — '}{b.reason}
          </li>
        ))}
      </ul>
    </div>
  )
}

// ── Shared bits ────────────────────────────────────────────────────────────────

function ActionTab({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        active
          ? 'rounded-xl px-4 py-2.5 text-[12.5px] font-bold bg-admin-sidebar text-white transition-colors'
          : 'rounded-xl px-4 py-2.5 text-[12.5px] font-semibold bg-slate-50 text-slate-600 hover:bg-slate-100 transition-colors'
      }
    >
      {children}
    </button>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-[0.10em] mb-1.5">
        {label}
      </label>
      {children}
    </div>
  )
}

function SubmitButton({ pending, label, pendingLabel }: { pending: boolean; label: string; pendingLabel: string }) {
  return (
    <button type="submit" disabled={pending} className={BTN_PRIMARY}>
      {pending ? pendingLabel : label}
    </button>
  )
}

function ErrorMsg({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[12px] font-medium text-red-600 bg-red-50 border border-red-100 rounded-xl px-4 py-2.5">
      {children}
    </p>
  )
}

function SuccessMsg({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[12px] font-medium text-emerald-600 bg-emerald-50 border border-emerald-100 rounded-xl px-4 py-2.5">
      {children}
    </p>
  )
}
