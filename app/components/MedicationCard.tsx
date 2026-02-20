'use client'

import { useState } from 'react'
import { CheckCircle2, Circle, Clock, Trash2, Loader2, AlertCircle } from 'lucide-react'
import type { MedicationWithStatus } from '@/types'
import { formatTime, formatFrequency } from '@/lib/utils'

type Props = {
  medication: MedicationWithStatus
  onMarkTaken: (id: string) => Promise<void>
  onDelete: (id: string) => Promise<void>
}

export default function MedicationCard({ medication, onMarkTaken, onDelete }: Props) {
  const [marking, setMarking] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  const handleMark = async () => {
    if (medication.takenToday || marking) return
    setMarking(true)
    try { await onMarkTaken(medication.id) } finally { setMarking(false) }
  }

  const handleDelete = async () => {
    setDeleting(true)
    try { await onDelete(medication.id) } finally { setDeleting(false); setConfirmDelete(false) }
  }

  return (
    <div className={`bg-white rounded-2xl border shadow-sm p-5 transition-all duration-200
      ${medication.takenToday
        ? 'border-emerald-200 bg-gradient-to-br from-emerald-50 to-teal-50'
        : 'border-gray-100 hover:border-sky-200 hover:shadow-md'}`}>
      <div className="flex items-start justify-between gap-4">
        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-2">
            <h3 className="font-semibold text-gray-900 text-base">{medication.name}</h3>
            {medication.takenToday && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700">
                <CheckCircle2 className="w-3 h-3" />Taken
              </span>
            )}
          </div>
          <div className="space-y-1 text-sm text-gray-500">
            <p><span className="font-medium text-gray-700">Dosage:</span> {medication.dosage}</p>
            <p><span className="font-medium text-gray-700">Frequency:</span> {formatFrequency(medication.frequency)}</p>
            <p className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-sky-400" />
              <span>{formatTime(medication.scheduled_time)}</span>
            </p>
            {medication.notes && <p className="italic text-gray-400">{medication.notes}</p>}
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-2 flex-shrink-0">
          <button onClick={handleMark} disabled={medication.takenToday || marking}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold transition-all
              ${medication.takenToday
                ? 'bg-emerald-100 text-emerald-700 cursor-default'
                : 'bg-gradient-to-r from-sky-500 to-blue-600 text-white shadow-sm shadow-sky-200 hover:shadow-sky-300 hover:from-sky-600 hover:to-blue-700 disabled:opacity-50'}`}>
            {marking ? <Loader2 className="w-4 h-4 animate-spin" />
              : medication.takenToday ? <CheckCircle2 className="w-4 h-4" />
              : <Circle className="w-4 h-4" />}
            {medication.takenToday ? 'Done' : 'Mark Taken'}
          </button>

          {!confirmDelete ? (
            <button onClick={() => setConfirmDelete(true)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium text-gray-400 hover:bg-red-50 hover:text-red-500 transition-all">
              <Trash2 className="w-4 h-4" />Delete
            </button>
          ) : (
            <div className="space-y-1.5">
              <p className="text-xs text-red-500 font-medium flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />Confirm?
              </p>
              <div className="flex gap-1">
                <button onClick={handleDelete} disabled={deleting}
                  className="flex-1 px-2 py-1.5 bg-red-500 text-white rounded-lg text-xs font-semibold hover:bg-red-600 disabled:opacity-50 transition-colors">
                  {deleting ? <Loader2 className="w-3 h-3 animate-spin mx-auto" /> : 'Yes'}
                </button>
                <button onClick={() => setConfirmDelete(false)}
                  className="flex-1 px-2 py-1.5 bg-gray-100 text-gray-600 rounded-lg text-xs font-semibold hover:bg-gray-200 transition-colors">
                  No
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
