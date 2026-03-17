'use client'
import { supabase } from '@/lib/supabase'

interface Props {
  userId: string
  onDismiss: () => void
}

export default function OnboardingWelcome({ userId, onDismiss }: Props) {
  const handleDismiss = async () => {
    await supabase.from('profiles').upsert({
      id: userId,
      onboarding_step: 1,
      onboarding_completed: false,
    })
    onDismiss()
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      background: 'rgba(0,0,0,0.85)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 24,
    }}>
      <div style={{
        background: 'var(--bg2)',
        border: '1px solid var(--border2)',
        borderRadius: 16,
        padding: '48px 44px',
        maxWidth: 520,
        width: '100%',
        textAlign: 'center',
      }}>
        {/* Icon */}
        <div style={{
          width: 64, height: 64, borderRadius: 16,
          background: 'var(--accent)', color: '#000',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 28px',
          fontSize: 28, fontFamily: 'var(--serif)',
        }}>
          A
        </div>

        <div style={{ fontSize: 28, fontWeight: 700, letterSpacing: '-0.5px', marginBottom: 12, color: 'var(--fg)', lineHeight: 1.2 }}>
          Welcome to AgentBoard
        </div>
        <div style={{ fontSize: 15, color: 'var(--fg3)', lineHeight: 1.7, marginBottom: 36 }}>
          You&apos;re all set. Build your first AI agent and put your business on autopilot in minutes.
        </div>

        {/* Feature highlights */}
        <div style={{
          background: 'var(--bg3)',
          border: '1px solid var(--border)',
          borderRadius: 12,
          padding: '20px 24px',
          marginBottom: 32,
          textAlign: 'left',
          display: 'flex',
          flexDirection: 'column',
          gap: 14,
        }}>
          {[
            {
              icon: (
                <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                  <path d="M13 2 3 14h9l-1 8 10-12h-9l1-8z"/>
                </svg>
              ),
              label: 'Build an AI agent',
              desc: 'Trained on your business in minutes',
            },
            {
              icon: (
                <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                  <ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M3 5v4c0 1.66 4.03 3 9 3s9-1.34 9-3V5"/><path d="M3 9v4c0 1.66 4.03 3 9 3s9-1.34 9-3V9"/><path d="M3 13v4c0 1.66 4.03 3 9 3s9-1.34 9-3v-4"/>
                </svg>
              ),
              label: 'Add a knowledge base',
              desc: 'FAQs, pricing, services, policies',
            },
            {
              icon: (
                <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
                </svg>
              ),
              label: 'Launch a customer portal',
              desc: 'A branded chat page for your customers',
            },
          ].map(item => (
            <div key={item.label} style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
              <div style={{ color: 'var(--accent)', marginTop: 1, flexShrink: 0 }}>{item.icon}</div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--fg)', marginBottom: 2 }}>{item.label}</div>
                <div style={{ fontSize: 13, color: 'var(--fg3)' }}>{item.desc}</div>
              </div>
            </div>
          ))}
        </div>

        <button
          onClick={handleDismiss}
          className="btn btn-accent"
          style={{ width: '100%', fontSize: 15, padding: '13px', fontWeight: 600 }}>
          Let&apos;s get started →
        </button>

        <div style={{ marginTop: 16, fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--fg3)' }}>
          Free to use · No credit card required
        </div>
      </div>
    </div>
  )
}
