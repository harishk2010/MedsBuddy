import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import PatientNavbar from '@/app/components/PatientNavbar'
import MedicationsManager from '@/app/components/MedicationsManager'

export default async function MedicationsPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-50 via-white to-gray-50">
      <PatientNavbar />
      <main className="max-w-5xl mx-auto px-4 py-8">
        <MedicationsManager userId={user.id} />
      </main>
    </div>
  )
}
