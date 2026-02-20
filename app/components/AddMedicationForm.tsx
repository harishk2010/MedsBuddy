'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { X, Loader2 } from 'lucide-react'
import { addMedicationSchema, type AddMedicationFormData } from '@/lib/validations'

const FREQUENCIES = [
  { value: 'once_daily',       label: 'Once Daily' },
  { value: 'twice_daily',      label: 'Twice Daily' },
  { value: 'three_times_daily',label: 'Three Times Daily' },
  { value: 'as_needed',        label: 'As Needed' },
] as const

type Props = {
  onSubmit: (data: AddMedicationFormData) => Promise<void>
  onCancel: () => void
}

export default function AddMedicationForm({ onSubmit, onCancel }: Props) {
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } =
    useForm<AddMedicationFormData>({
      resolver: zodResolver(addMedicationSchema),
      defaultValues: { frequency: 'once_daily', scheduled_time: '08:00' },
    })

  const handleFormSubmit = async (data: AddMedicationFormData) => {
    await onSubmit(data)
    reset()
  }

  return (
    <div className="card border-blue-200">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-900">Add New Medication</h3>
        <button onClick={onCancel} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
      </div>

      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4" noValidate>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="name" className="label">Name <span className="text-red-500">*</span></label>
            <input id="name" type="text" {...register('name')}
              className={`input ${errors.name ? 'input-error' : ''}`}
              placeholder="e.g. Metformin" />
            {errors.name && <p className="error-msg">{errors.name.message}</p>}
          </div>
          <div>
            <label htmlFor="dosage" className="label">Dosage <span className="text-red-500">*</span></label>
            <input id="dosage" type="text" {...register('dosage')}
              className={`input ${errors.dosage ? 'input-error' : ''}`}
              placeholder="e.g. 500mg" />
            {errors.dosage && <p className="error-msg">{errors.dosage.message}</p>}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="frequency" className="label">Frequency <span className="text-red-500">*</span></label>
            <select id="frequency" {...register('frequency')}
              className={`input ${errors.frequency ? 'input-error' : ''}`}>
              {FREQUENCIES.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
            </select>
            {errors.frequency && <p className="error-msg">{errors.frequency.message}</p>}
          </div>
          <div>
            <label htmlFor="scheduled_time" className="label">Scheduled Time <span className="text-red-500">*</span></label>
            <input id="scheduled_time" type="time" {...register('scheduled_time')}
              className={`input ${errors.scheduled_time ? 'input-error' : ''}`} />
            {errors.scheduled_time && <p className="error-msg">{errors.scheduled_time.message}</p>}
          </div>
        </div>

        <div>
          <label htmlFor="notes" className="label">Notes <span className="text-gray-400 font-normal">(optional)</span></label>
          <textarea id="notes" {...register('notes')} rows={2}
            className={`input resize-none ${errors.notes ? 'input-error' : ''}`}
            placeholder="e.g. Take with food" />
          {errors.notes && <p className="error-msg">{errors.notes.message}</p>}
        </div>

        <div className="flex gap-3 pt-1">
          <button type="submit" disabled={isSubmitting} className="btn-primary">
            {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
            {isSubmitting ? 'Adding...' : 'Add Medication'}
          </button>
          <button type="button" onClick={onCancel} className="btn-secondary">Cancel</button>
        </div>
      </form>
    </div>
  )
}
