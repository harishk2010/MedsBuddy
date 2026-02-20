'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import {
  CheckCircle2, Circle, AlertCircle, Plus, Pill,
  Loader2, Clock, Sparkles, TrendingUp,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { createClient } from '@/lib/supabase/client'
import MedicationCard from './MedicationCard'
import { getTodayString, getGreeting, formatTime, formatFrequency } from '@/lib/utils'
import type { MedicationWithStatus } from '@/types'

export default function Dashboard({ userId }: { userId: string }) {
  const [meds, setMeds] = useState<MedicationWithStatus[]>([])
  const [loading, setLoading] = useState(true)
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
    const name = meds.find(m => m.id === id)?.name ?? 'Medication'
    toast.success(`${name} marked as taken! ✓`)
  }

  const deleteMed = async (id: string) => {
    const name = meds.find(m => m.id === id)?.name ?? 'Medication'
    const { error } = await supabase.from('medications').update({ is_active: false }).eq('id', id).eq('user_id', userId)
    if (error) { toast.error('Failed to delete'); return }
    setMeds(prev => prev.filter(m => m.id !== id))
    toast.success(`${name} removed`)
  }

  const taken = meds.filter(m => m.takenToday).length
  const remaining = meds.length - taken
  const pct = meds.length > 0 ? Math.round((taken / meds.length) * 100) : 0

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{getGreeting()}! 👋</h1>
          <p className="text-gray-400 mt-0.5 text-sm">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </p>
        </div>
        <Link href="/medications"
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-sky-500 to-blue-600 text-white rounded-xl text-sm font-semibold shadow-md shadow-sky-200 hover:shadow-sky-300 hover:from-sky-600 hover:to-blue-700 transition-all self-start">
          <Plus className="w-4 h-4" />Add Medication
        </Link>
      </div>

      {/* Progress card */}
      {meds.length > 0 && (
        <div className={`rounded-2xl p-5 border ${remaining === 0
          ? 'bg-gradient-to-r from-emerald-50 to-teal-50 border-emerald-200'
          : 'bg-gradient-to-r from-sky-50 to-blue-50 border-sky-200'}`}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              {remaining === 0
                ? <Sparkles className="w-5 h-5 text-emerald-500" />
                : <TrendingUp className="w-5 h-5 text-sky-500" />}
              <span className={`font-semibold text-sm ${remaining === 0 ? 'text-emerald-700' : 'text-sky-700'}`}>
                {remaining === 0 ? 'All done for today! 🎉' : "Today's Progress"}
              </span>
            </div>
            <span className={`text-2xl font-bold ${remaining === 0 ? 'text-emerald-600' : 'text-sky-600'}`}>
              {pct}%
            </span>
          </div>
          <div className="w-full bg-white/60 rounded-full h-2.5 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-700 ${remaining === 0
                ? 'bg-gradient-to-r from-emerald-400 to-teal-500'
                : 'bg-gradient-to-r from-sky-400 to-blue-500'}`}
              style={{ width: `${pct}%` }}
            />
          </div>
          {remaining > 0 && (
            <p className="text-sky-600 text-xs mt-2">
              {remaining} {remaining === 1 ? 'medication' : 'medications'} remaining today
            </p>
          )}
        </div>
      )}

      {/* Alert */}
      {remaining > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0" />
          <p className="text-amber-700 text-sm">
            <span className="font-semibold">Reminder:</span> You have{' '}
            <span className="font-semibold">{remaining}</span>{' '}
            {remaining === 1 ? 'medication' : 'medications'} left to take today.
          </p>
        </div>
      )}

      {/* Stat cards */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Total',     value: meds.length, icon: Pill,         color: 'text-blue-500',   bg: 'bg-blue-50',   ring: 'ring-blue-100' },
          { label: 'Taken',     value: taken,         icon: CheckCircle2, color: 'text-emerald-500', bg: 'bg-emerald-50', ring: 'ring-emerald-100' },
          { label: 'Remaining', value: remaining,     icon: Circle,       color: 'text-amber-500',  bg: 'bg-amber-50',  ring: 'ring-amber-100' },
        ].map(({ label, value, icon: Icon, color, bg, ring }) => (
          <div key={label} className={`bg-white rounded-2xl border border-gray-100 shadow-sm p-4 ring-1 ${ring}`}>
            <div className={`w-9 h-9 ${bg} rounded-xl flex items-center justify-center mb-3`}>
              <Icon className={`w-5 h-5 ${color}`} />
            </div>
            <p className="text-2xl font-bold text-gray-900">{value}</p>
            <p className="text-xs text-gray-400 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Medication list */}
      <div>
        <h2 className="text-base font-semibold text-gray-700 mb-3 flex items-center gap-2">
          <Clock className="w-4 h-4 text-sky-500" />Today&apos;s Schedule
        </h2>

        {loading ? (
          <div className="flex items-center justify-center py-16 gap-3 text-gray-300">
            <Loader2 className="w-6 h-6 animate-spin" /><span className="text-sm">Loading medications…</span>
          </div>
        ) : meds.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm flex flex-col items-center py-16 text-center px-6">
            <div className="bg-sky-50 p-4 rounded-2xl mb-4 ring-1 ring-sky-100">
              <Pill className="w-10 h-10 text-sky-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No medications yet</h3>
            <p className="text-gray-400 text-sm max-w-xs mb-6">
              Add your daily medications to start tracking your doses here.
            </p>
            <Link href="/medications"
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-sky-500 to-blue-600 text-white rounded-xl text-sm font-semibold shadow-md shadow-sky-200 hover:shadow-sky-300 transition-all">
              <Plus className="w-4 h-4" />Add Your First Medication
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {meds.map(med => (
              <MedicationCard key={med.id} medication={med} onMarkTaken={markTaken} onDelete={deleteMed} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
