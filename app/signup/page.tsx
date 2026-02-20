'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Eye, EyeOff, Loader2, Pill, User, HeartHandshake } from 'lucide-react'
import toast from 'react-hot-toast'
import { createClient } from '@/lib/supabase/client'
import { signUpSchema, type SignUpFormData } from '@/lib/validations'
import type { UserRole } from '@/types'

export default function SignUpPage() {
  const router = useRouter()
  const [showPw, setShowPw] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const { register, handleSubmit, setValue, watch, formState: { errors, isSubmitting } } =
    useForm<SignUpFormData>({
      resolver: zodResolver(signUpSchema),
      defaultValues: { role: 'patient' },
    })

  const selectedRole = watch('role')

  const onSubmit = async (data: SignUpFormData) => {
    const supabase = createClient()
    const { error } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
        data: { role: data.role },
      },
    })
    if (error) {
      toast.error(
        error.message.includes('already registered')
          ? 'This email is already registered. Please sign in.'
          : error.message
      )
      return
    }
    toast.success('Account created! Welcome to MedsBuddy.')
    router.push(data.role === 'caretaker' ? '/caretaker' : '/dashboard')
    router.refresh()
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 via-white to-blue-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center mb-8">
          <div className="bg-gradient-to-br from-sky-500 to-blue-600 p-3.5 rounded-2xl shadow-xl shadow-sky-200 mb-4">
            <Pill className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">MedsBuddy</h1>
          <p className="text-gray-400 text-sm mt-1">Your daily medication companion</p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-xl shadow-sky-50 p-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Create your account</h2>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>

            {/* Role selector */}
            <div>
              <label className="label">I am signing up as a</label>
              <div className="grid grid-cols-2 gap-3">
                {([
                  { value: 'patient',   label: 'Patient',   icon: User,           desc: 'I take medications daily' },
                  { value: 'caretaker', label: 'Caretaker', icon: HeartHandshake, desc: "I monitor someone's meds" },
                ] as { value: UserRole; label: string; icon: React.ElementType; desc: string }[]).map(({ value, label, icon: Icon, desc }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setValue('role', value)}
                    className={`flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all text-center
                      ${selectedRole === value
                        ? 'border-sky-500 bg-sky-50 text-sky-700'
                        : 'border-gray-100 hover:border-gray-200 text-gray-500'}`}
                  >
                    <Icon className="w-6 h-6" />
                    <span className="font-semibold text-sm">{label}</span>
                    <span className="text-xs opacity-60">{desc}</span>
                  </button>
                ))}
              </div>
              {errors.role && <p className="error-msg">{errors.role.message}</p>}
              <input type="hidden" {...register('role')} />
            </div>

            <div>
              <label htmlFor="email" className="label">Email address</label>
              <input id="email" type="email" autoComplete="email" {...register('email')}
                className={`input ${errors.email ? 'input-error' : ''}`}
                placeholder="you@example.com" />
              {errors.email && <p className="error-msg">{errors.email.message}</p>}
            </div>

            <div>
              <label htmlFor="password" className="label">Password</label>
              <div className="relative">
                <input id="password" type={showPw ? 'text' : 'password'} autoComplete="new-password"
                  {...register('password')}
                  className={`input pr-10 ${errors.password ? 'input-error' : ''}`}
                  placeholder="Min. 8 chars, 1 uppercase, 1 number" />
                <button type="button" onClick={() => setShowPw(!showPw)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-300 hover:text-gray-500">
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && <p className="error-msg">{errors.password.message}</p>}
            </div>

            <div>
              <label htmlFor="confirmPassword" className="label">Confirm password</label>
              <div className="relative">
                <input id="confirmPassword" type={showConfirm ? 'text' : 'password'} autoComplete="new-password"
                  {...register('confirmPassword')}
                  className={`input pr-10 ${errors.confirmPassword ? 'input-error' : ''}`}
                  placeholder="Re-enter your password" />
                <button type="button" onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-300 hover:text-gray-500">
                  {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.confirmPassword && <p className="error-msg">{errors.confirmPassword.message}</p>}
            </div>

            <button type="submit" disabled={isSubmitting} className="btn-primary w-full py-2.5 mt-2">
              {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
              {isSubmitting
                ? 'Creating account…'
                : `Sign up as ${selectedRole === 'caretaker' ? 'Caretaker' : 'Patient'}`}
            </button>
          </form>

          <p className="mt-5 text-center text-sm text-gray-400">
            Already have an account?{' '}
            <Link href="/login" className="text-sky-600 hover:text-sky-700 font-semibold">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
