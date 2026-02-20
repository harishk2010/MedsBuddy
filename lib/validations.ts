import { z } from 'zod'

export const signUpSchema = z
  .object({
    email: z.string().min(1, 'Email is required').email('Enter a valid email'),
    password: z
      .string()
      .min(8, 'At least 8 characters')
      .regex(/[A-Z]/, 'Must include an uppercase letter')
      .regex(/[0-9]/, 'Must include a number'),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
    role: z.enum(['patient', 'caretaker'], { required_error: 'Please select a role' }),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })

export const signInSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Enter a valid email'),
  password: z.string().min(1, 'Password is required'),
})

export const addMedicationSchema = z.object({
  name: z
    .string()
    .min(1, 'Medication name is required')
    .max(100, 'Must be under 100 characters')
    .trim(),
  dosage: z
    .string()
    .min(1, 'Dosage is required')
    .max(50, 'Must be under 50 characters')
    .trim(),
  frequency: z.enum(
    ['once_daily', 'twice_daily', 'three_times_daily', 'as_needed'],
    { required_error: 'Select a frequency' }
  ),
  scheduled_time: z
    .string()
    .min(1, 'Scheduled time is required')
    .regex(/^([01]?\d|2[0-3]):[0-5]\d$/, 'Enter a valid time (HH:MM)'),
  notes: z.string().max(500, 'Must be under 500 characters').optional(),
})

export const profileSchema = z.object({
  caretaker_email: z.string().email('Enter a valid email').or(z.literal('')),
  notification_window_minutes: z
    .number()
    .min(15, 'Minimum 15 minutes')
    .max(480, 'Maximum 480 minutes (8 hours)'),
})

export type SignUpFormData = z.infer<typeof signUpSchema>
export type SignInFormData = z.infer<typeof signInSchema>
export type AddMedicationFormData = z.infer<typeof addMedicationSchema>
export type ProfileFormData = z.infer<typeof profileSchema>
