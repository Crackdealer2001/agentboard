'use client'
import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Navbar from '@/components/Navbar'

export default function AuthPage() {
  const router = useRouter()
  const [mode, setMode] = useState<'signin' | 'signup'>('signup')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const redirectTo = typeof window !== 'undefined'
    ? new URLSearchParams(window.location.search).get('redirect') || '/dashboard'
    : '/dashboard'

  const handleAuth = async () => {
    setLoading(true)
    setError('')
    setSuccess('')

    if (mode === 'signup') {
      const { error } = await supabase.auth.signUp({ email, password })
      if (error) {
        setError(error.message)
      } else {
        setSuccess('Account created! Signing you in...')
        const { error: signInError } = await supabase.auth.signInWithPassword({ email, password })
        if (!signInError) router.push(redirectTo)
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) {
        setError(error.message)
      } else {
        router.push(redirectTo)
      }
    }
    setLoading(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleAuth()
  }

  const inputStyle = {
    width: '100%', padding: '12px 16px',
    border: '1px solid var(--border2)', borderRadius: 10,
    fontFamily: 'var(--sans)', fontSize: 14,
    background: 'var(--bg2)', color: 'var(--fg)', outline: 'none',
    transition: 'border-color 0.15s',
  }

  return (
    <>
      <Navbar />
      <div style={{ maxWidth: 460, margin: '0 auto', padding: '72px 24px' }}>

        {/* Header */}
        <div style={{ marginBottom: 36, textAlign: 'center' }}>
          <div style={{
            width: 56, height: 56, borderRadius: 14,
            background: 'var(--fg)', color: 'var(--bg)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 20px',
            fontFamily: 'var(--serif)', fontSize: 22,
          }}>
            A
          </div>
          <h1 style={{ fontFamily: 'var(--serif)', fontSize: 32, fontWeight: 400, marginBottom: 8 }}>
            {mode === 'signup' ? 'Create your account' : 'Welcome back'}
          </h1>
          <p style={{ fontSize: 14, color: 'var(--muted)', lineHeight: 1.7 }}>
            {mode === 'signup'
              ? 'Sign up free and build your AI business agent in minutes.'
              : 'Sign in to access your AI business agents.'}
          </p>
        </div>

        {/* Mode toggle */}
        <div style={{ display: 'flex', background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 10, padding: 4, marginBottom: 28 }}>
          <button
            onClick={() => { setMode('signup'); setError(''); setSuccess('') }}
            style={{
              flex: 1, padding: '9px', borderRadius: 7, border: 'none', cursor: 'pointer',
              fontFamily: 'var(--mono)', fontSize: 12,
              background: mode === 'signup' ? 'var(--fg)' : 'transparent',
              color: mode === 'signup' ? 'var(--bg)' : 'var(--muted)',
              transition: 'all 0.15s',
            }}>
            Sign up
          </button>
          <button
            onClick={() => { setMode('signin'); setError(''); setSuccess('') }}
            style={{
              flex: 1, padding: '9px', borderRadius: 7, border: 'none', cursor: 'pointer',
              fontFamily: 'var(--mono)', fontSize: 12,
              background: mode === 'signin' ? 'var(--fg)' : 'transparent',
              color: mode === 'signin' ? 'var(--bg)' : 'var(--muted)',
              transition: 'all 0.15s',
            }}>
            Sign in
          </button>
        </div>

        {/* Form */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 20 }}>
          <div>
            <label style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--muted)', display: 'block', marginBottom: 8, letterSpacing: 0.5 }}>
              Email address
            </label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="you@example.com"
              style={inputStyle}
              autoFocus
            />
          </div>
          <div>
            <label style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--muted)', display: 'block', marginBottom: 8, letterSpacing: 0.5 }}>
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Min. 6 characters"
              style={inputStyle}
            />
          </div>
        </div>

        {/* Error */}
        {error && (
          <div style={{ background: '#2a0a0a', border: '1px solid #4a1a1a', borderRadius: 8, padding: '10px 14px', marginBottom: 16, fontFamily: 'var(--mono)', fontSize: 12, color: '#f87171' }}>
            ✗ {error}
          </div>
        )}

        {/* Success */}
        {success && (
          <div style={{ background: '#0d2e14', border: '1px solid #1a4a24', borderRadius: 8, padding: '10px 14px', marginBottom: 16, fontFamily: 'var(--mono)', fontSize: 12, color: '#4ade80' }}>
            ✓ {success}
          </div>
        )}

        {/* Submit */}
        <button
          onClick={handleAuth}
          disabled={loading || !email || !password}
          className="btn btn-accent"
          style={{ width: '100%', fontSize: 14, padding: '13px', opacity: (loading || !email || !password) ? 0.5 : 1 }}>
          {loading ? 'Please wait...' : mode === 'signup' ? 'Create account →' : 'Sign in →'}
        </button>

        <p style={{ textAlign: 'center', fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--muted)', marginTop: 20 }}>
          {mode === 'signup' ? 'Already have an account?' : 'Don\'t have an account?'}{' '}
          <button
            onClick={() => { setMode(mode === 'signup' ? 'signin' : 'signup'); setError(''); setSuccess('') }}
            style={{ background: 'none', border: 'none', color: 'var(--fg)', cursor: 'pointer', fontFamily: 'var(--mono)', fontSize: 11, textDecoration: 'underline' }}>
            {mode === 'signup' ? 'Sign in' : 'Sign up free'}
          </button>
        </p>

        <p style={{ textAlign: 'center', fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--muted)', marginTop: 12 }}>
          Free to use · No credit card required
        </p>
      </div>
    </>
  )
}