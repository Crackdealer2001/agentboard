'use client'
import { useState } from 'react'

export default function ExecuteButton({ taskId, status }: { taskId: string, status: string }) {
  const [running, setRunning] = useState(false)
  const [done, setDone] = useState(false)
  const [result, setResult] = useState('')
  const [error, setError] = useState('')

  const execute = async () => {
    setRunning(true)
    setError('')
    try {
      const res = await fetch('/api/run-agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ taskId }),
      })
      const data = await res.json()
      if (data.result) {
        setResult(data.result)
        setDone(true)
      } else {
        setError(data.error || 'Something went wrong')
      }
    } catch (err) {
      setError(String(err))
    }
    setRunning(false)
  }

  const copy = () => {
    navigator.clipboard.writeText(result)
    alert('Copied!')
  }

  if (status === 'completed' && !done) return (
    <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: '#4ade80' }}>✓ completed</span>
  )

  return (
    <div>
      {!done && (
        <button onClick={execute} disabled={running} className="btn btn-accent"
          style={{ fontSize: 12, opacity: running ? 0.6 : 1 }}>
          {running ? '⟳ executing...' : '⚡ Execute with AI'}
        </button>
      )}

      {error && (
        <p style={{ fontFamily: 'var(--mono)', fontSize: 12, color: '#f87171', marginTop: 8 }}>{error}</p>
      )}

      {done && result && (
        <div style={{ marginTop: 16, background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 12, padding: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: '#4ade80' }}>✓ AI EXECUTION COMPLETE</span>
            <button onClick={copy} style={{ fontFamily: 'var(--mono)', fontSize: 11, padding: '4px 12px', background: 'transparent', border: '1px solid var(--border2)', borderRadius: 6, cursor: 'pointer', color: 'var(--muted)' }}>
              Copy
            </button>
          </div>
          <div style={{ fontSize: 14, lineHeight: 1.8, whiteSpace: 'pre-wrap', maxHeight: 400, overflowY: 'auto' }}>
            {result}
          </div>
        </div>
      )}
    </div>
  )
}