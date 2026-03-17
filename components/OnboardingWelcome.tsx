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
            { icon: '⚡', label: 'Build an AI agent', desc: 'Trained on your business in minutes' },
            { icon: '🧠', label: 'Add a knowledge base', desc: 'FAQs, pricing, services, policies' },
            { icon: '🌐', label: 'Launch a customer portal', desc: 'A branded chat page for your customers' },
          ].map(item => (
            <div key={item.label} style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
              <div style={{ fontSize: 18, lineHeight: 1, marginTop: 1 }}>{item.icon}</div>
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
