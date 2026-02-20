import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import PatientNavbar from '@/app/components/PatientNavbar'
import CaretakerNavbar from '@/app/components/CaretakerNavbar'
import SettingsForm from '@/app/components/SettingsForm'

export default async function SettingsPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  const isCaretaker = profile?.role === 'caretaker'

  return (
    <div className={`min-h-screen ${isCaretaker ? 'bg-slate-950' : 'bg-gradient-to-b from-sky-50 via-white to-gray-50'}`}>
      {isCaretaker ? <CaretakerNavbar /> : <PatientNavbar />}
      <main className="max-w-5xl mx-auto px-4 py-8">
        <SettingsForm userId={user.id} userEmail={user.email ?? ''} />
      </main>
    </div>
  )
}
