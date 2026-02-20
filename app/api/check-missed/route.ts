// import { NextRequest, NextResponse } from 'next/server'
// import { createAdminClient } from '@/lib/supabase/admin'
// import { getTodayString, isMissed } from '@/lib/utils'

// // Called hourly by Vercel Cron (see vercel.json)
// // Protected by CRON_SECRET header

// export async function POST(req: NextRequest) {
//   const auth = req.headers.get('authorization')
//   if (!process.env.CRON_SECRET || auth !== `Bearer ${process.env.CRON_SECRET}`) {
//     return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
//   }

//   const supabase = createAdminClient()
//   const today = getTodayString()

//   // Get all active medications for users who have a caretaker email
//   const { data: medications, error } = await supabase
//     .from('medications')
//     .select(`id, name, dosage, scheduled_time, user_id,
//       profiles!inner(email, caretaker_email, notification_window_minutes)`)
//     .eq('is_active', true)
//     .not('profiles.caretaker_email', 'is', null)

//   if (error) return NextResponse.json({ error: error.message }, { status: 500 })
//   if (!medications?.length) return NextResponse.json({ message: 'Nothing to check', notified: 0 })

//   // Get today's logs for these medications
//   const ids = medications.map(m => m.id)
//   const { data: logs } = await supabase.from('medication_logs')
//     .select('medication_id').in('medication_id', ids).eq('date', today)

//   const takenIds = new Set(logs?.map(l => l.medication_id) ?? [])

//   // Find missed ones
//   const missed = medications.filter(med => {
//     if (takenIds.has(med.id)) return false
//     const profile = Array.isArray(med.profiles) ? med.profiles[0] : med.profiles
//     return profile && isMissed(med.scheduled_time, profile.notification_window_minutes)
//   })

//   // Group by user and send emails
//   type UserData = { patientEmail: string; caretakerEmail: string; meds: { name: string; dosage: string; time: string }[] }
//   const byUser: Record<string, UserData> = {}

//   for (const med of missed) {
//     const profile = Array.isArray(med.profiles) ? med.profiles[0] : med.profiles
//     if (!profile?.caretaker_email) continue
//     if (!byUser[med.user_id]) {
//       byUser[med.user_id] = { patientEmail: profile.email, caretakerEmail: profile.caretaker_email, meds: [] }
//     }
//     byUser[med.user_id].meds.push({ name: med.name, dosage: med.dosage, time: med.scheduled_time })
//   }

//   let notified = 0
//   for (const [, ud] of Object.entries(byUser)) {
//     const medList = ud.meds.map(m => `• ${m.name} (${m.dosage}) — scheduled ${m.time}`).join('\n')
//     console.log(`[ALERT] To: ${ud.caretakerEmail} | Patient: ${ud.patientEmail} | Date: ${today}`)
//     console.log(`Missed:\n${medList}`)

//     // ---- Uncomment below to send real emails via Resend ----
//     // import { Resend } from 'resend'
//     // const resend = new Resend(process.env.RESEND_API_KEY)
//     // await resend.emails.send({
//     //   from: 'MedsBuddy <alerts@yourdomain.com>',
//     //   to: ud.caretakerEmail,
//     //   subject: `⚠️ Missed Medication Alert — ${ud.patientEmail}`,
//     //   text: `Patient ${ud.patientEmail} has not taken:\n\n${medList}\n\nDate: ${today}`,
//     // })

//     notified++
//   }

//   return NextResponse.json({ checked: medications.length, missed: missed.length, notified })
// }
import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getTodayString, isMissed } from '@/lib/utils'
import nodemailer from 'nodemailer'

const transporter = nodemailer.createTransport({
  host: process.env.MAIL_HOST ?? 'smtp.gmail.com',
  port: Number(process.env.MAIL_PORT ?? 587),
  secure: false, // STARTTLS — works on Vercel unlike port 465
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS,
  },
})


export async function POST(req: NextRequest) {
  const auth = req.headers.get('authorization')
  if (!process.env.CRON_SECRET || auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createAdminClient()
  const today = getTodayString()

  const { data: medications, error } = await supabase
    .from('medications')
    .select(`id, name, dosage, scheduled_time, user_id,
      profiles!inner(email, caretaker_email, notification_window_minutes)`)
    .eq('is_active', true)
    .not('profiles.caretaker_email', 'is', null)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (!medications?.length) return NextResponse.json({ message: 'Nothing to check', notified: 0 })

  const ids = medications.map(m => m.id)
  const { data: logs } = await supabase
    .from('medication_logs')
    .select('medication_id')
    .in('medication_id', ids)
    .eq('date', today)

  const takenIds = new Set(logs?.map(l => l.medication_id) ?? [])

  const missed = medications.filter(med => {
    if (takenIds.has(med.id)) return false
    const profile = Array.isArray(med.profiles) ? med.profiles[0] : med.profiles
    return profile && isMissed(med.scheduled_time, profile.notification_window_minutes)
  })

  type UserData = {
    patientEmail: string
    caretakerEmail: string
    meds: { name: string; dosage: string; time: string }[]
  }
  const byUser: Record<string, UserData> = {}

  for (const med of missed) {
    const profile = Array.isArray(med.profiles) ? med.profiles[0] : med.profiles
    if (!profile?.caretaker_email) continue
    if (!byUser[med.user_id]) {
      byUser[med.user_id] = {
        patientEmail: profile.email,
        caretakerEmail: profile.caretaker_email,
        meds: [],
      }
    }
    byUser[med.user_id].meds.push({
      name: med.name,
      dosage: med.dosage,
      time: med.scheduled_time,
    })
  }

  let notified = 0

  for (const [, ud] of Object.entries(byUser)) {
    const medListText = ud.meds
      .map(m => `• ${m.name} (${m.dosage}) — scheduled at ${m.time}`)
      .join('\n')

    const medListHtml = ud.meds
      .map(m => `<li><strong>${m.name}</strong> (${m.dosage}) — scheduled at ${m.time}</li>`)
      .join('')

    try {
      await transporter.sendMail({
        from: `"MedsBuddy" <${process.env.MAIL_USER}>`,
        to: ud.caretakerEmail,
        subject: `⚠️ Missed Medication Alert — ${ud.patientEmail}`,
        text: `Hi,\n\nYour patient ${ud.patientEmail} has not taken the following medication(s) today:\n\n${medListText}\n\nDate: ${today}\n\n— MedsBuddy`,
        html: `
          <div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:24px;background:#f9fafb;border-radius:12px;">
            <h2 style="color:#b45309;margin-bottom:8px;">⚠️ Missed Medication Alert</h2>
            <p style="color:#374151;">Your patient <strong>${ud.patientEmail}</strong> has not taken the following medication(s) today:</p>
            <ul style="background:#fff;border:1px solid #e5e7eb;border-radius:8px;padding:16px 16px 16px 32px;color:#374151;line-height:1.8;">
              ${medListHtml}
            </ul>
            <p style="color:#6b7280;font-size:14px;">Date: ${today}</p>
            <p style="color:#6b7280;font-size:13px;margin-top:24px;border-top:1px solid #e5e7eb;padding-top:12px;">— MedsBuddy Alerts</p>
          </div>
        `,
      })
      notified++
    } catch (mailError) {
      console.error(`Failed to send email to ${ud.caretakerEmail}:`, mailError)
    }
  }

  return NextResponse.json({ checked: medications.length, missed: missed.length, notified })
}