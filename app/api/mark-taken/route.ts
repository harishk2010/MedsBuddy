import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { getTodayString } from '@/lib/utils'

const schema = z.object({
  medication_id: z.string().uuid('Invalid medication ID'),
})

export async function POST(req: NextRequest) {
  const supabase = createClient()
  const { data: { user }, error: authErr } = await supabase.auth.getUser()
  if (authErr || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let body: unknown
  try { body = await req.json() } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }) }

  const result = schema.safeParse(body)
  if (!result.success) return NextResponse.json({ error: 'Validation failed' }, { status: 422 })

  const { medication_id } = result.data
  const today = getTodayString()

  // Verify ownership
  const { data: med, error: medErr } = await supabase.from('medications').select('id')
    .eq('id', medication_id).eq('user_id', user.id).eq('is_active', true).single()
  if (medErr || !med) return NextResponse.json({ error: 'Medication not found' }, { status: 404 })

  // Prevent duplicate
  const { data: existing } = await supabase.from('medication_logs').select('id')
    .eq('medication_id', medication_id).eq('user_id', user.id).eq('date', today).single()
  if (existing) return NextResponse.json({ error: 'Already marked today' }, { status: 409 })

  const { data, error } = await supabase.from('medication_logs').insert({
    medication_id, user_id: user.id, date: today, taken_at: new Date().toISOString(),
  }).select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data }, { status: 201 })
}
