'use client'

import { useState, useEffect, useCallback } from 'react'
import { Plus, Pill, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { createClient } from '@/lib/supabase/client'
import MedicationCard from './MedicationCard'
import AddMedicationForm from './AddMedicationForm'
import { getTodayString, sanitize } from '@/lib/utils'
import type { MedicationWithStatus } from '@/types'
import type { AddMedicationFormData } from '@/lib/validations'

export default function MedicationsManager({ userId }: { userId: string }) {
  const [meds, setMeds] = useState<MedicationWithStatus[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const supabase = createClient()

  const fetchMeds = useCallback(async () => {
    const today = getTodayString()
    const [medsRes, logsRes] = await Promise.all([
      supabase.from('medications').select('*').eq('user_id', userId).eq('is_active', true).order('scheduled_time'),
      supabase.from('medication_logs').select('medication_id, id').eq('user_id', userId).eq('date', today),
    ])
    if (medsRes.error) { toast.error('Failed to load medications'); return }
    const takenSet = new Set(logsRes.data?.map(l => l.medication_id) ?? [])
    setMeds((medsRes.data ?? []).map(m => ({
      ...m,
      takenToday: takenSet.has(m.id),
      logId: logsRes.data?.find(l => l.medication_id === m.id)?.id,
    })))
    setLoading(false)
  }, [userId])

  useEffect(() => { fetchMeds() }, [fetchMeds])

  const addMedication = async (data: AddMedicationFormData) => {
    const { error } = await supabase.from('medications').insert({
      user_id: userId,
      name: sanitize(data.name),
      dosage: sanitize(data.dosage),
      frequency: data.frequency,
      scheduled_time: data.scheduled_time,
      notes: data.notes ? sanitize(data.notes) : null,
      is_active: true,
    })
    if (error) { toast.error('Failed to add medication: ' + error.message); throw error }
    toast.success(`${data.name} added!`)
    setShowForm(false)
    await fetchMeds()
  }

  const markTaken = async (id: string) => {
    setMeds(prev => prev.map(m => m.id === id ? { ...m, takenToday: true } : m))
    const { error } = await supabase.from('medication_logs').insert({
      medication_id: id, user_id: userId, date: getTodayString(), taken_at: new Date().toISOString(),
    })
    if (error) {
      setMeds(prev => prev.map(m => m.id === id ? { ...m, takenToday: false } : m))
      toast.error('Failed to mark as taken')
      return
    }
    toast.success(`${meds.find(m => m.id === id)?.name ?? 'Medication'} marked as taken! ✓`)
  }

  const deleteMed = async (id: string) => {
    const name = meds.find(m => m.id === id)?.name ?? 'Medication'
    const { error } = await supabase.from('medications').update({ is_active: false }).eq('id', id).eq('user_id', userId)
    if (error) { toast.error('Failed to delete'); return }
    setMeds(prev => prev.filter(m => m.id !== id))
    toast.success(`${name} removed`)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Medications</h1>
          <p className="text-gray-500 mt-1">Manage your medication list</p>
        </div>
        {!showForm && (
          <button onClick={() => setShowForm(true)} className="btn-primary">
            <Plus className="w-4 h-4" />Add Medication
          </button>
        )}
      </div>

      {showForm && <AddMedicationForm onSubmit={addMedication} onCancel={() => setShowForm(false)} />}

      {loading ? (
        <div className="flex items-center justify-center py-16 gap-3 text-gray-400">
          <Loader2 className="w-6 h-6 animate-spin" />Loading…
        </div>
      ) : meds.length === 0 && !showForm ? (
        <div className="card flex flex-col items-center py-16 text-center">
          <div className="bg-blue-50 p-4 rounded-2xl mb-4"><Pill className="w-10 h-10 text-blue-400" /></div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No medications yet</h3>
          <p className="text-gray-500 text-sm max-w-xs mb-6">Add your first medication to start tracking your daily doses.</p>
          <button onClick={() => setShowForm(true)} className="btn-primary"><Plus className="w-4 h-4" />Add Medication</button>
        </div>
      ) : (
        <div className="space-y-4">
          {meds.length > 0 && (
            <p className="text-sm text-gray-500">{meds.length} active {meds.length === 1 ? 'medication' : 'medications'}</p>
          )}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {meds.map(med => (
              <MedicationCard key={med.id} medication={med} onMarkTaken={markTaken} onDelete={deleteMed} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
