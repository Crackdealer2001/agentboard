'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function ExecuteButton({ taskId, status }: { taskId: string, status: string }) {
  const router = useRouter()
  const [running, setRunning] = useState(false)

  const execute = async () => {
    setRunning(true)
    await fetch('/api/run-agent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ taskId }),
    })
    setRunning(false)
    router.refresh()
  }

  if (status === 'completed') return (
    <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: '#4ade80' }}>✓ completed</span>
  )

  return (
    <button
      onClick={execute}
      disabled={running}
      className="btn btn-accent"
      style={{ fontSize: 12, opacity: running ? 0.6 : 1 }}
    >
      {running ? '⟳ executing...' : '⚡ Execute with AI'}
    </button>
  )
}