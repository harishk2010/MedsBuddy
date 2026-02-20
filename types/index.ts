// ============================================================
// MedsBuddy — Application Types
// ============================================================

export type UserRole = 'patient' | 'caretaker'

export type MedicationFrequency =
  | 'once_daily'
  | 'twice_daily'
  | 'three_times_daily'
  | 'as_needed'

export type Medication = {
  id: string
  user_id: string
  name: string
  dosage: string
  frequency: MedicationFrequency
  scheduled_time: string // HH:MM
  notes: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export type MedicationLog = {
  id: string
  medication_id: string
  user_id: string
  taken_at: string
  date: string // YYYY-MM-DD
  notes: string | null
  created_at: string
}

export type Profile = {
  id: string
  email: string
  role: UserRole
  caretaker_email: string | null
  notification_window_minutes: number
  created_at: string
  updated_at: string
}

export type MedicationWithStatus = Medication & {
  takenToday: boolean
  logId?: string
}

export type AddMedicationInput = {
  name: string
  dosage: string
  frequency: MedicationFrequency
  scheduled_time: string
  notes?: string
}

export type UpdateProfileInput = {
  caretaker_email: string
  notification_window_minutes: number
}
