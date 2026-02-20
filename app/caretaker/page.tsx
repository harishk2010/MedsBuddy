import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import CaretakerNavbar from '@/app/components/CaretakerNavbar'
import CaretakerDashboard from '@/app/components/CaretakerDashboard'

export default async function CaretakerPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, email')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'caretaker') redirect('/dashboard')

  return (
    <div className="min-h-screen bg-slate-950">
      <CaretakerNavbar />
      <main className="max-w-6xl mx-auto px-4 py-8">
        <CaretakerDashboard caretakerEmail={profile.email} userId={user.id} />
      </main>
    </div>
  )
}
