'use server'

import { revalidatePath } from 'next/cache'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireModule } from '@/lib/auth'

export type ActionState = { error: string } | { success: true } | undefined

function str(formData: FormData, key: string): string {
  return ((formData.get(key) as string) ?? '').trim()
}

// ── Internal notes ────────────────────────────────────────────────────────────
// guests.notes is a single free-text field — "internal admin notes, never
// shown to guest" — so this overwrites it rather than appending entries
// (unlike reservation_notes, which is a list).

export async function updateGuestNotesAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireModule('guests')
  const guestId = str(formData, 'guest_id')
  const notes = str(formData, 'notes')

  if (!guestId) return { error: 'Hóspede inválido.' }

  const db = createAdminClient()
  const { error } = await db
    .from('guests')
    .update({ notes: notes || null })
    .eq('id', guestId)

  if (error) {
    console.error('[guests] failed to update notes:', error)
    return { error: 'Erro ao salvar as notas. Tente novamente.' }
  }

  revalidatePath(`/dashboard/guests/${guestId}`)
  return { success: true }
}
