'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  CheckCircle2, Circle, AlertCircle, Clock, Pill,
  Loader2, User, RefreshCw, Activity, BarChart3, ShieldCheck,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { formatTime, formatFrequency, getTodayString } from '@/lib/utils'
import type { MedicationWithStatus, Profile } from '@/types'

type PatientData = {
  profile: Profile
  medications: MedicationWithStatus[]
}

export default function CaretakerDashboard({
  caretakerEmail,
  userId,
}: {
  caretakerEmail: string
  userId: string
}) {
  const [patientData, setPatientData] = useState<PatientData | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [noPatient, setNoPatient] = useState(false)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const supabase = createClient()

  const fetchPatientData = useCallback(async (isManual = false) => {
    if (isManual) setRefreshing(true)
    else setLoading(true)

    const today = getTodayString()

    const { data: patientProfile, error: profileErr } = await supabase
      .from('profiles')
      .select('*')
      .eq('caretaker_email', caretakerEmail)
      .eq('role', 'patient')
      .single()

    if (profileErr || !patientProfile) {
      setNoPatient(true)
      setLoading(false)
      setRefreshing(false)
      return
    }

    const [medsRes, logsRes] = await Promise.all([
      supabase.from('medications').select('*')
        .eq('user_id', patientProfile.id).eq('is_active', true).order('scheduled_time'),
      supabase.from('medication_logs').select('medication_id, id')
        .eq('user_id', patientProfile.id).eq('date', today),
    ])

    const takenSet = new Set(logsRes.data?.map(l => l.medication_id) ?? [])
    const medications: MedicationWithStatus[] = (medsRes.data ?? []).map(m => ({
      ...m,
      takenToday: takenSet.has(m.id),
      logId: logsRes.data?.find(l => l.medication_id === m.id)?.id,
    }))

    setPatientData({ profile: patientProfile, medications })
    setLastUpdated(new Date())
    setLoading(false)
    setRefreshing(false)
  }, [caretakerEmail])

  useEffect(() => {
    fetchPatientData()
    const interval = setInterval(() => fetchPatientData(), 60_000)
    return () => clearInterval(interval)
  }, [fetchPatientData])

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-4 text-slate-500">
        <div className="bg-slate-800 p-4 rounded-2xl">
          <Loader2 className="w-8 h-8 animate-spin text-violet-400" />
        </div>
        <p className="text-sm">Loading patient data…</p>
      </div>
    )
  }

  if (noPatient) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Caretaker Dashboard</h1>
          <p className="text-slate-400 mt-1 text-sm">No patient linked to your account yet</p>
        </div>
        <div className="bg-slate-800 border border-slate-700 rounded-2xl flex flex-col items-center py-16 text-center px-8">
          <div className="bg-violet-500/10 border border-violet-500/20 p-5 rounded-2xl mb-5">
            <User className="w-10 h-10 text-violet-400" />
          </div>
          <h3 className="text-lg font-semibold text-white mb-2">No patient linked yet</h3>
          <p className="text-slate-400 text-sm max-w-sm mb-1">
            Ask your patient to open their <span className="text-violet-300 font-medium">Settings</span> page and enter:
          </p>
          <div className="bg-slate-900 border border-slate-600 rounded-xl px-4 py-2 my-3">
            <code className="text-violet-300 text-sm font-mono">{caretakerEmail}</code>
          </div>
          <p className="text-slate-500 text-xs mb-6">as their caretaker email address</p>
          <button
            onClick={() => fetchPatientData(true)}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-violet-600 hover:bg-violet-500 text-white rounded-xl text-sm font-medium transition-colors">
            <RefreshCw className="w-4 h-4" />Check Again
          </button>
        </div>
      </div>
    )
  }

  const { profile: patient, medications } = patientData!
  const taken     = medications.filter(m => m.takenToday).length
  const remaining = medications.length - taken
  const allDone   = medications.length > 0 && remaining === 0
  const pct       = medications.length > 0 ? Math.round((taken / medications.length) * 100) : 0
  const today     = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Activity className="w-6 h-6 text-violet-400" />
            Patient Overview
          </h1>
          <p className="text-slate-400 mt-1 text-sm">{today}</p>
        </div>
        <div className="flex items-center gap-2">
          {lastUpdated && (
            <span className="text-slate-500 text-xs">
              Updated {lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          )}
          <button
            onClick={() => fetchPatientData(true)}
            disabled={refreshing}
            className="inline-flex items-center gap-2 px-3.5 py-2 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-xl text-xs font-medium transition-colors disabled:opacity-50">
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Patient card */}
      <div className="bg-gradient-to-r from-violet-900/40 to-indigo-900/40 border border-violet-700/40 rounded-2xl p-5 flex items-center gap-4">
        <div className="bg-violet-500/20 border border-violet-500/30 p-3 rounded-2xl">
          <User className="w-6 h-6 text-violet-300" />
        </div>
        <div>
          <p className="text-violet-400 text-xs font-semibold uppercase tracking-widest mb-0.5">Monitoring</p>
          <p className="text-white font-semibold">{patient.email}</p>
        </div>
        <div className={`ml-auto flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold border
          ${allDone
            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
            : remaining > 0
              ? 'bg-amber-500/10 border-amber-500/30 text-amber-400'
              : 'bg-slate-700 border-slate-600 text-slate-400'}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${allDone ? 'bg-emerald-400' : remaining > 0 ? 'bg-amber-400 animate-pulse' : 'bg-slate-400'}`} />
          {allDone ? 'On Track' : remaining > 0 ? 'Attention Needed' : 'No Meds'}
        </div>
      </div>

      {/* Status banner */}
      {allDone ? (
        <div className="bg-emerald-900/30 border border-emerald-700/40 rounded-2xl p-4 flex items-start gap-3">
          <ShieldCheck className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-emerald-300">All medications taken today ✅</p>
            <p className="text-sm text-emerald-500/80 mt-0.5">Your patient is fully on track — no action needed.</p>
          </div>
        </div>
      ) : remaining > 0 ? (
        <div className="bg-amber-900/20 border border-amber-700/40 rounded-2xl p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-amber-300">
              {remaining} medication{remaining > 1 ? 's' : ''} not yet taken
            </p>
            <p className="text-sm text-amber-500/80 mt-0.5">
              Patient still needs to mark {remaining === 1 ? 'it' : 'them'} as taken.
            </p>
          </div>
        </div>
      ) : (
        <div className="bg-slate-800 border border-slate-700 rounded-2xl p-4 flex items-center gap-3">
          <Pill className="w-5 h-5 text-slate-500 flex-shrink-0" />
          <p className="text-slate-400 text-sm">No medications added for this patient yet.</p>
        </div>
      )}

      {/* Stats + progress */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Total',     value: medications.length, icon: BarChart3,   color: 'text-blue-400',    bg: 'bg-blue-500/10',    border: 'border-blue-500/20' },
          { label: 'Taken',     value: taken,              icon: CheckCircle2, color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
          { label: 'Remaining', value: remaining,          icon: Circle,       color: 'text-amber-400',   bg: 'bg-amber-500/10',   border: 'border-amber-500/20' },
        ].map(({ label, value, icon: Icon, color, bg, border }) => (
          <div key={label} className={`bg-slate-800 rounded-2xl border ${border} p-4`}>
            <div className={`w-9 h-9 ${bg} rounded-xl flex items-center justify-center mb-3`}>
              <Icon className={`w-5 h-5 ${color}`} />
            </div>
            <p className="text-2xl font-bold text-white">{value}</p>
            <p className="text-xs text-slate-500 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Progress bar */}
      {medications.length > 0 && (
        <div className="bg-slate-800 border border-slate-700 rounded-2xl p-5">
          <div className="flex justify-between items-center mb-3">
            <span className="text-slate-400 text-sm font-medium">Completion</span>
            <span className="text-white font-bold text-lg">{pct}%</span>
          </div>
          <div className="w-full bg-slate-700 rounded-full h-3 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-700 ${allDone
                ? 'bg-gradient-to-r from-emerald-500 to-teal-400'
                : 'bg-gradient-to-r from-violet-500 to-indigo-400'}`}
              style={{ width: `${pct}%` }}
            />
          </div>
          <p className="text-slate-500 text-xs mt-2">{taken} of {medications.length} medications taken</p>
        </div>
      )}

      {/* Medication list (read-only) */}
      {medications.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
            <Clock className="w-3.5 h-3.5" />Today&apos;s Schedule
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            {medications.map(med => (
              <div key={med.id}
                className={`rounded-2xl border p-5 transition-all ${med.takenToday
                  ? 'bg-emerald-900/20 border-emerald-700/40'
                  : 'bg-slate-800 border-slate-700'}`}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-2">
                      <h3 className="font-semibold text-white">{med.name}</h3>
                      {med.takenToday
                        ? <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/25">
                            <CheckCircle2 className="w-3 h-3" />Taken
                          </span>
                        : <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-500/15 text-amber-400 border border-amber-500/25">
                            <Circle className="w-3 h-3" />Pending
                          </span>}
                    </div>
                    <div className="space-y-1 text-sm text-slate-400">
                      <p><span className="text-slate-500">Dosage:</span> {med.dosage}</p>
                      <p><span className="text-slate-500">Frequency:</span> {formatFrequency(med.frequency)}</p>
                      <p className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-slate-500" />{formatTime(med.scheduled_time)}
                      </p>
                      {med.notes && <p className="italic text-slate-500">{med.notes}</p>}
                    </div>
                  </div>
                  <div className={`p-2.5 rounded-2xl flex-shrink-0 ${med.takenToday ? 'bg-emerald-500/15' : 'bg-slate-700'}`}>
                    {med.takenToday
                      ? <CheckCircle2 className="w-6 h-6 text-emerald-400" />
                      : <Circle className="w-6 h-6 text-slate-500" />}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Email alert notice */}
      <div className="bg-violet-900/20 border border-violet-700/30 rounded-2xl p-4">
        <p className="text-violet-300 font-medium text-sm mb-1">📧 Automated Alerts</p>
        <p className="text-violet-400/70 text-sm">
          You&apos;ll receive an email if your patient misses any medication past their scheduled notification window.
          Configure alert timing under Settings.
        </p>
      </div>
    </div>
  )
}
