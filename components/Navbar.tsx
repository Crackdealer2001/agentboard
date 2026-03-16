'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function Navbar({ active }: { active?: string }) {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => setUser(user))
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })
    return () => listener.subscription.unsubscribe()
  }, [])

  const signOut = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  return (
    <nav className="nav">
      <Link href="/" className="nav-logo">
        <span className="nav-logo-dot" />
        AgentBoard
      </Link>

      <div className="nav-links">
        <Link href="/#how-it-works" className={`nav-link ${active === 'how' ? 'active' : ''}`}>
          how it works
        </Link>
        <Link href="/builder" className={`nav-link ${active === 'builder' ? 'active' : ''}`}>
          builder
        </Link>

        {user ? (
          <>
            <Link href="/dashboard" className={`nav-link ${active === 'dashboard' ? 'active' : ''}`}>
              {user.email?.split('@')[0]}
            </Link>
            <button onClick={signOut} className="btn btn-outline" style={{ fontSize: 12 }}>
              sign out
            </button>
          </>
        ) : (
          <>
            <Link href="/auth" className="btn btn-outline" style={{ fontSize: 12 }}>
              sign in
            </Link>
            <Link href="/builder" className="btn btn-accent" style={{ fontSize: 12 }}>
              get started →
            </Link>
          </>
        )}
      </div>
    </nav>
  )
}