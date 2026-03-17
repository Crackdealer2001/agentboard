'use client'
import Link from 'next/link'
import { useEffect } from 'react'
import { supabase } from '@/lib/supabase'

interface Step {
  label: string
  done: boolean
  href?: string
  linkLabel?: string
}

interface Props {
  userId: string
  steps: Step[]
  onComplete: () => void
}

function CheckIcon({ done }: { done: boolean }) {
  if (done) {
    return (
      <div style={{
        width: 22, height: 22, borderRadius: '50%',
        background: 'var(--accent)', flexShrink: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <svg width="12" height="12" fill="none" stroke="#000" strokeWidth="2.5" viewBox="0 0 24 24">
          <path d="M20 6 9 17l-5-5"/>
        </svg>
      </div>
    )
  }
  return (
    <div style={{
      width: 22, height: 22, borderRadius: '50%',
      border: '1.5px solid var(--border3)', flexShrink: 0,
      background: 'transparent',
    }} />
  )
}

export default function OnboardingChecklist({ userId, steps, onComplete }: Props) {
  const completedCount = steps.filter(s => s.done).length
  const allDone = completedCount === steps.length
  const progress = Math.round((completedCount / steps.length) * 100)

  useEffect(() => {
    if (allDone) {
      supabase.from('profiles')
        .update({ onboarding_completed: true })
        .eq('id', userId)
        .then(() => {
          // Short delay so user sees all steps checked before it disappears
          setTimeout(onComplete, 1200)
        })
    }
  }, [allDone, userId, onComplete])

  return (
    <div style={{
      background: 'var(--bg2)',
      border: '1px solid var(--border)',
      borderRadius: 12,
      padding: '28px 32px',
      marginBottom: 28,
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <div style={{ fontSize: 17, fontWeight: 600, color: 'var(--fg)', marginBottom: 3 }}>
            Getting started
          </div>
          <div style={{ fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--fg3)' }}>
            {completedCount} of {steps.length} steps complete
          </div>
        </div>
        <div style={{ fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--accent)', fontWeight: 600 }}>
          {progress}%
        </div>
      </div>

      {/* Progress bar */}
      <div style={{
        height: 4, background: 'var(--bg4)',
        borderRadius: 2, marginBottom: 24, overflow: 'hidden',
      }}>
        <div style={{
          height: '100%', background: 'var(--accent)',
          borderRadius: 2, width: `${progress}%`,
          transition: 'width 0.4s ease',
        }} />
      </div>

      {/* Steps */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
        {steps.map((step, idx) => (
          <div key={step.label} style={{
            display: 'flex', alignItems: 'center', gap: 14,
            padding: '12px 0',
            borderBottom: idx < steps.length - 1 ? '1px solid var(--border)' : 'none',
          }}>
            <CheckIcon done={step.done} />
            <div style={{
              flex: 1,
              fontSize: 14,
              color: step.done ? 'var(--fg3)' : 'var(--fg)',
              textDecoration: step.done ? 'line-through' : 'none',
            }}>
              {step.label}
            </div>
            {!step.done && step.href && (
              <Link
                href={step.href}
                className="btn btn-outline btn-sm"
                style={{ fontSize: 12, height: 30, padding: '0 14px', flexShrink: 0 }}>
                {step.linkLabel || 'Go →'}
              </Link>
            )}
            {step.done && (
              <div style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--accent)', flexShrink: 0 }}>
                done
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
