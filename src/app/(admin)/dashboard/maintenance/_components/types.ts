// Shared row types for the maintenance ticket UI.

export type StaffOption = {
  id: string
  full_name: string
}

export type RoomOption = {
  id: string
  name: string
}

export type TicketRow = {
  id: string
  room_id: string | null
  roomName: string | null
  title: string
  description: string | null
  priority: string
  status: string
  photo_paths: string[]
  blocks_room: boolean
  blocked_start_date: string | null
  blocked_end_date: string | null
  reportedByName: string | null
  assigned_to: string | null
  assignedToName: string | null
  resolved_at: string | null
  created_at: string
}
