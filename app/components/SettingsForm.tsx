'use client'

import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Bell, Mail, Clock, Info, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { createClient } from '@/lib/supabase/client'
import { profileSchema, type ProfileFormData } from '@/lib/validations'
import type { Profile } from '@/types'

export default function SettingsForm({ userId, userEmail }: { userId: string; userEmail: string }) {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [fetchingProfile, setFetchingProfile] = useState(true)
  const supabase = createClient()

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } =
    useForm<ProfileFormData>({
      resolver: zodResolver(profileSchema),
      defaultValues: { caretaker_email: '', notification_window_minutes: 60 },
    })

  useEffect(() => {
    const loadProfile = async () => {
      const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).single()
      if (error && error.code === 'PGRST116') {
        // Create profile if missing
        const { data: newProfile } = await supabase.from('profiles')
          .insert({ id: userId, email: userEmail, notification_window_minutes: 60 })
          .select().single()
        if (newProfile) { setProfile(newProfile); reset({ caretaker_email: '', notification_window_minutes: 60 }) }
      } else if (data) {
        setProfile(data)
        reset({ caretaker_email: data.caretaker_email ?? '', notification_window_minutes: data.notification_window_minutes })
      }
      setFetchingProfile(false)
    }
    loadProfile()
  }, [userId, userEmail, reset])

  const onSubmit = async (data: ProfileFormData) => {
    const { error } = await supabase.from('profiles')
      .update({ caretaker_email: data.caretaker_email || null, notification_window_minutes: data.notification_window_minutes, updated_at: new Date().toISOString() })
      .eq('id', userId)
    if (error) { toast.error('Failed to save: ' + error.message); return }
    toast.success('Settings saved!')
  }

  if (fetchingProfile) {
    return <div className="flex items-center justify-center py-16 gap-3 text-gray-400"><Loader2 className="w-6 h-6 animate-spin" />Loading…</div>
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-500 mt-1">Configure caretaker notifications and preferences</p>
      </div>

      {/* Account card */}
      <div className="card">
        <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Mail className="w-5 h-5 text-gray-500" />Account
        </h2>
        <p className="text-sm text-gray-500">Signed in as</p>
        <p className="font-medium text-gray-900">{userEmail}</p>
      </div>

      {/* Caretaker card */}
      <div className="card">
        <h2 className="font-semibold text-gray-900 mb-1 flex items-center gap-2">
          <Bell className="w-5 h-5 text-gray-500" />Caretaker Notifications
        </h2>
        <p className="text-sm text-gray-500 mb-6">If a medication is missed, your caretaker gets an email alert.</p>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
          <div>
            <label htmlFor="caretaker_email" className="label">Caretaker Email</label>
            <input id="caretaker_email" type="email" {...register('caretaker_email')}
              className={`input ${errors.caretaker_email ? 'input-error' : ''}`}
              placeholder="caretaker@example.com" />
            {errors.caretaker_email && <p className="error-msg">{errors.caretaker_email.message}</p>}
            <p className="text-xs text-gray-400 mt-1">Leave blank to disable notifications</p>
          </div>

          <div>
            <label htmlFor="window" className="label flex items-center gap-1">
              <Clock className="w-4 h-4" />Notification Window (minutes)
            </label>
            <input id="window" type="number" min={15} max={480}
              {...register('notification_window_minutes', { valueAsNumber: true })}
              className={`input max-w-xs ${errors.notification_window_minutes ? 'input-error' : ''}`} />
            {errors.notification_window_minutes && <p className="error-msg">{errors.notification_window_minutes.message}</p>}
            <p className="text-xs text-gray-400 mt-1">How many minutes after scheduled time to wait before alerting (15–480)</p>
          </div>

          <div className="bg-blue-50 rounded-lg p-4 flex gap-3">
            <Info className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-700">
              <p className="font-medium mb-1">How it works</p>
              <p>A cron job runs every hour and checks if any medications have not been marked as taken after their notification window. If so, an email alert is sent to the caretaker.</p>
            </div>
          </div>

          <button type="submit" disabled={isSubmitting} className="btn-primary">
            {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
            {isSubmitting ? 'Saving…' : 'Save Settings'}
          </button>
        </form>
      </div>
    </div>
  )
}
