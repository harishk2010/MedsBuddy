'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { HeartHandshake, Settings, LogOut, Menu, X, Shield } from 'lucide-react'
import toast from 'react-hot-toast'
import { createClient } from '@/lib/supabase/client'

const NAV = [
  { href: '/caretaker', label: 'Overview',  icon: HeartHandshake },
  // { href: '/settings',  label: 'Settings',  icon: Settings },
]

export default function CaretakerNavbar() {
  const pathname = usePathname()
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [signingOut, setSigningOut] = useState(false)

  const handleSignOut = async () => {
    setSigningOut(true)
    const supabase = createClient()
    const { error } = await supabase.auth.signOut()
    if (error) { toast.error('Failed to sign out'); setSigningOut(false); return }
    toast.success('Signed out')
    router.push('/login')
    router.refresh()
  }

  return (
    <nav className="bg-slate-900 border-b border-slate-700/60 sticky top-0 z-50 shadow-lg">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/caretaker" className="flex items-center gap-3">
            <div className="bg-gradient-to-br from-violet-500 to-indigo-600 p-2 rounded-xl shadow-md">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div className="leading-tight">
              <span className="font-bold text-white text-lg">MedsBuddy</span>
              <span className="ml-2 text-xs px-2 py-0.5 rounded-full font-semibold bg-violet-500/20 text-violet-300 border border-violet-500/30">
                Caretaker
              </span>
            </div>
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-1">
            {NAV.map(({ href, label, icon: Icon }) => (
              <Link key={href} href={href}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all
                  ${pathname.startsWith(href) && href !== '/settings' || (href === '/settings' && pathname === '/settings')
                    ? 'bg-slate-700 text-white'
                    : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'}`}>
                <Icon className="w-4 h-4" />{label}
              </Link>
            ))}
            <div className="w-px h-5 bg-slate-700 mx-2" />
            <button onClick={handleSignOut} disabled={signingOut}
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-slate-400 hover:bg-red-900/30 hover:text-red-400 transition-all disabled:opacity-50">
              <LogOut className="w-4 h-4" />Sign out
            </button>
          </div>

          {/* Mobile toggle */}
          <button onClick={() => setOpen(!open)} className="md:hidden p-2 rounded-lg text-slate-400 hover:bg-slate-800">
            {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden border-t border-slate-700 bg-slate-900 px-4 py-3 space-y-1">
          {NAV.map(({ href, label, icon: Icon }) => (
            <Link key={href} href={href} onClick={() => setOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all
                ${pathname.startsWith(href) ? 'bg-slate-700 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'}`}>
              <Icon className="w-4 h-4" />{label}
            </Link>
          ))}
          <div className="border-t border-slate-700 pt-2 mt-2">
            <button onClick={handleSignOut} disabled={signingOut}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-red-400 hover:bg-red-900/30 w-full disabled:opacity-50">
              <LogOut className="w-4 h-4" />Sign out
            </button>
          </div>
        </div>
      )}
    </nav>
  )
}
