import { format, isToday, parseISO } from 'date-fns'

export function getTodayString(): string {
  return format(new Date(), 'yyyy-MM-dd')
}

export function formatTime(time: string): string {
  const [h, m] = time.split(':').map(Number)
  const d = new Date()
  d.setHours(h, m)
  return format(d, 'h:mm a')
}

export function formatFrequency(freq: string): string {
  const map: Record<string, string> = {
    once_daily: 'Once Daily',
    twice_daily: 'Twice Daily',
    three_times_daily: '3× Daily',
    as_needed: 'As Needed',
  }
  return map[freq] ?? freq
}

export function sanitize(input: string): string {
  return input.trim().replace(/[<>]/g, '')
}

export function isMissed(scheduledTime: string, windowMinutes: number): boolean {
  const now = new Date()
  const [h, m] = scheduledTime.split(':').map(Number)
  const scheduled = new Date()
  scheduled.setHours(h, m, 0, 0)
  const deadline = new Date(scheduled.getTime() + windowMinutes * 60_000)
  return now > deadline
}

export function getGreeting(): string {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

export function formatDate(iso: string): string {
  try {
    const d = parseISO(iso)
    if (isToday(d)) return 'Today'
    return format(d, 'MMM d, yyyy')
  } catch {
    return iso
  }
}
