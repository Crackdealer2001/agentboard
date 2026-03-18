'use client'
import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import Sidebar from '@/components/Sidebar'
import { useRouter } from 'next/navigation'

const SCHEDULE_PRESETS = [
  { label: 'Every day', schedule: 'daily', day: '', time: '09:00' },
  { label: 'Every Monday', schedule: 'weekly', day: 'monday', time: '09:00' },
  { label: 'Every Friday', schedule: 'weekly', day: 'friday', time: '09:00' },
  { label: 'Every Sunday', schedule: 'weekly', day: 'sunday', time: '18:00' },
  { label: 'Monthly on 1st', schedule: 'monthly', day: '1', time: '09:00' },
  { label: 'Custom', schedule: 'daily', day: '', time: '09:00' },
]

const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']

const EXAMPLES = [
  'Send me a summary of this week\'s activity every Monday morning',
  'Check my calendar and brief me on today\'s schedule every day at 8am',
  'Generate a social media post idea every Sunday evening',
  'Send invoice reminders to unpaid clients every Friday',
  'Create a monthly business performance report on the 1st',
  'Email my top 3 priorities for the week every Monday',
]

export default function AutomationsClient({ agent, automations, results }: {
  agent: Record<string, unknown>
  automations: Record<string, unknown>[]
  results: Record<string, unknown>[]
}) {
  const router = useRouter()
  const [autos, setAutos] = useState(automations)
  const [res, setRes] = useState(results)
  const [showNew, setShowNew] = useState(false)
  const [saving, setSaving] = useState(false)
  const [running, setRunning] = useState<string | null>(null)
  const [runResult, setRunResult] = useState<{ id: string; result: string } | null>(null)
  const [msg, setMsg] = useState('')
  const [selectedPreset, setSelectedPreset] = useState(0)
  const [customSchedule, setCustomSchedule] = useState(false)

  const [form, setForm] = useState({
    name: '',
    prompt: '',
    schedule: 'daily',
    schedule_day: '',
    schedule_time: '09:00',
    notify_email: '',
    enabled: true,
  })

  const inputStyle = {
    width: '100%', padding: '10px 14px',
    border: '1px solid var(--border2)', borderRadius: 8,
    fontFamily: 'var(--sidebar-font)', fontSize: 13,
    background: 'var(--bg3)', color: 'var(--fg)', outline: 'none',
  }

  const applyPreset = (idx: number) => {
    setSelectedPreset(idx)
    const p = SCHEDULE_PRESETS[idx]
    if (p.label === 'Custom') {
      setCustomSchedule(true)
    } else {
      setCustomSchedule(false)
      setForm(prev => ({ ...prev, schedule: p.schedule, schedule_day: p.day, schedule_time: p.time }))
    }
  }

  const calculateNextRun = (schedule: string, day: string, time: string) => {
    const now = new Date()
    const [hours, minutes] = time.split(':').map(Number)
    const next = new Date()
    next.setHours(hours, minutes, 0, 0)
    if (schedule === 'daily') {
      if (next <= now) next.setDate(next.getDate() + 1)
    } else if (schedule === 'weekly') {
      const days: Record<string, number> = { sunday: 0, monday: 1, tuesday: 2, wednesday: 3, thursday: 4, friday: 5, saturday: 6 }
      const targetDay = days[day?.toLowerCase()] ?? 1
      const currentDay = now.getDay()
      let daysUntil = targetDay - currentDay
      if (daysUntil < 0 || (daysUntil === 0 && next <= now)) daysUntil += 7
      next.setDate(next.getDate() + daysUntil)
    } else if (schedule === 'monthly') {
      const targetDate = parseInt(day) || 1
      next.setDate(targetDate)
      if (next <= now) { next.setMonth(next.getMonth() + 1); next.setDate(targetDate) }
    }
    return next.toISOString()
  }

  const saveAutomation = async () => {
    if (!form.name || !form.prompt) return
    setSaving(true)
    const nextRun = calculateNextRun(form.schedule, form.schedule_day, form.schedule_time)
    const { data } = await supabase.from('scheduled_automations').insert({
      business_agent_id: agent.id,
      name: form.name,
      description: '',
      prompt: form.prompt,
      schedule: form.schedule,
      schedule_day: form.schedule_day,
      schedule_time: form.schedule_time,
      notify_email: form.notify_email,
      enabled: form.enabled,
      next_run: nextRun,
    }).select().single()
    if (data) {
      setAutos(prev => [data, ...prev])
      setShowNew(false)
      setForm({ name: '', prompt: '', schedule: 'daily', schedule_day: '', schedule_time: '09:00', notify_email: '', enabled: true })
      setSelectedPreset(0)
      setCustomSchedule(false)
      setMsg('Automation created!')
      setTimeout(() => setMsg(''), 3000)
    }
    setSaving(false)
  }

  const toggleEnabled = async (id: string, enabled: boolean) => {
    await supabase.from('scheduled_automations').update({ enabled: !enabled }).eq('id', id)
    setAutos(prev => prev.map(a => a.id === id ? { ...a, enabled: !enabled } : a))
  }

  const deleteAutomation = async (id: string) => {
    await supabase.from('scheduled_automations').delete().eq('id', id)
    setAutos(prev => prev.filter(a => a.id !== id))
  }

  const runNow = async (id: string) => {
    setRunning(id)
    const r = await fetch('/api/run-automation', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ automationId: id }),
    })
    const data = await r.json()
    if (data.result) {
      setRunResult({ id, result: data.result })
      const { data: newResult } = await supabase
        .from('automation_results')
        .select('*')
        .eq('automation_id', id)
        .order('ran_at', { ascending: false })
        .limit(1)
        .single()
      if (newResult) setRes(prev => [newResult, ...prev])
    }
    setRunning(null)
  }

  const formatSchedule = (auto: Record<string, unknown>) => {
    if (auto.schedule === 'daily') return `Every day at ${auto.schedule_time}`
    if (auto.schedule === 'weekly') return `Every ${auto.schedule_day} at ${auto.schedule_time}`
    if (auto.schedule === 'monthly') return `Monthly on the ${auto.schedule_day} at ${auto.schedule_time}`
    return ''
  }

  const timeAgo = (date: string) => {
    const s = Math.floor((new Date().getTime() - new Date(date).getTime()) / 1000)
    if (s < 60) return 'just now'
    if (s < 3600) return `${Math.floor(s / 60)}m ago`
    if (s < 86400) return `${Math.floor(s / 3600)}h ago`
    return `${Math.floor(s / 86400)}d ago`
  }

  return (
    <div className="app-layout">
      <Sidebar />

      {/* Run result modal */}
      {runResult && (
        <div className="modal-overlay">
          <div style={{ background: 'var(--bg2)', border: '1px solid var(--border2)', borderRadius: 16, width: '100%', maxWidth: 600, maxHeight: '80vh', overflow: 'auto', padding: '36px 40px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <div style={{ fontFamily: 'var(--sidebar-font)', fontSize: 14, color: '#4ade80', fontWeight: 600 }}>✓ Automation complete</div>
              <button onClick={() => setRunResult(null)} className="btn btn-outline btn-sm">Close</button>
            </div>
            <div style={{ fontSize: 14, lineHeight: 1.8, whiteSpace: 'pre-wrap', color: 'var(--fg)', fontFamily: 'var(--sidebar-font)' }}>
              {runResult.result}
            </div>
          </div>
        </div>
      )}

      {/* New automation modal */}
      {showNew && (
        <div className="modal-overlay">
          <div style={{ background: 'var(--bg2)', border: '1px solid var(--border2)', borderRadius: 20, width: '100%', maxWidth: 600, maxHeight: '90vh', overflow: 'auto', padding: '36px 40px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }}>
              <div>
                <div style={{ fontFamily: 'var(--sidebar-font)', fontSize: 20, fontWeight: 700, color: 'var(--fg)', marginBottom: 4 }}>New automation</div>
                <div style={{ fontFamily: 'var(--sidebar-font)', fontSize: 13, color: 'var(--fg3)' }}>Tell your agent what to do automatically</div>
              </div>
              <button onClick={() => { setShowNew(false); setCustomSchedule(false); setSelectedPreset(0) }} className="btn btn-ghost btn-sm">
                <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M18 6 6 18M6 6l12 12"/></svg>
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

              {/* Name */}
              <div>
                <label style={{ fontFamily: 'var(--sidebar-font)', fontSize: 12, color: 'var(--fg3)', fontWeight: 600, display: 'block', marginBottom: 8, letterSpacing: 0.5, textTransform: 'uppercase' }}>
                  Automation name
                </label>
                <input
                  style={inputStyle}
                  value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. Weekly Summary, Daily Briefing..."
                />
              </div>

              {/* Prompt */}
              <div>
                <label style={{ fontFamily: 'var(--sidebar-font)', fontSize: 12, color: 'var(--fg3)', fontWeight: 600, display: 'block', marginBottom: 8, letterSpacing: 0.5, textTransform: 'uppercase' }}>
                  What should your agent do?
                </label>
                <textarea
                  style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.6, minHeight: 100 }}
                  rows={4}
                  value={form.prompt}
                  onChange={e => setForm({ ...form, prompt: e.target.value })}
                  placeholder="Describe in plain English what you want your agent to do automatically..."
                />
                {/* Example prompts */}
                <div style={{ marginTop: 10 }}>
                  <div style={{ fontFamily: 'var(--sidebar-font)', fontSize: 11, color: 'var(--fg3)', marginBottom: 8 }}>Examples — click to use:</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {EXAMPLES.map((ex, i) => (
                      <button key={i} onClick={() => setForm({ ...form, prompt: ex })}
                        style={{ textAlign: 'left', padding: '8px 12px', background: 'var(--bg4)', border: '1px solid var(--border)', borderRadius: 6, cursor: 'pointer', fontFamily: 'var(--sidebar-font)', fontSize: 12, color: 'var(--fg3)', transition: 'all 0.1s', lineHeight: 1.4 }}
                        onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = 'var(--fg)'; (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--border2)' }}
                        onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = 'var(--fg3)'; (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--border)' }}>
                        {ex}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Schedule presets */}
              <div>
                <label style={{ fontFamily: 'var(--sidebar-font)', fontSize: 12, color: 'var(--fg3)', fontWeight: 600, display: 'block', marginBottom: 8, letterSpacing: 0.5, textTransform: 'uppercase' }}>
                  When to run
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 12 }}>
                  {SCHEDULE_PRESETS.map((preset, i) => (
                    <button key={i} onClick={() => applyPreset(i)}
                      style={{ padding: '10px 12px', background: selectedPreset === i ? 'var(--fg)' : 'var(--bg3)', border: `1px solid ${selectedPreset === i ? 'var(--fg)' : 'var(--border2)'}`, borderRadius: 8, cursor: 'pointer', fontFamily: 'var(--sidebar-font)', fontSize: 12, color: selectedPreset === i ? 'var(--bg)' : 'var(--fg3)', fontWeight: selectedPreset === i ? 600 : 400, transition: 'all 0.1s', textAlign: 'center' }}>
                      {preset.label}
                    </button>
                  ))}
                </div>

                {/* Custom schedule */}
                {customSchedule && (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, padding: '16px', background: 'var(--bg3)', borderRadius: 10, border: '1px solid var(--border)' }}>
                    <div>
                      <label style={{ fontFamily: 'var(--sidebar-font)', fontSize: 11, color: 'var(--fg3)', display: 'block', marginBottom: 6 }}>Frequency</label>
                      <select style={{ ...inputStyle, padding: '8px 10px' }} value={form.schedule} onChange={e => setForm({ ...form, schedule: e.target.value })}>
                        <option value="daily">Daily</option>
                        <option value="weekly">Weekly</option>
                        <option value="monthly">Monthly</option>
                      </select>
                    </div>
                    {form.schedule === 'weekly' && (
                      <div>
                        <label style={{ fontFamily: 'var(--sidebar-font)', fontSize: 11, color: 'var(--fg3)', display: 'block', marginBottom: 6 }}>Day</label>
                        <select style={{ ...inputStyle, padding: '8px 10px' }} value={form.schedule_day} onChange={e => setForm({ ...form, schedule_day: e.target.value })}>
                          {DAYS.map(d => <option key={d} value={d}>{d.charAt(0).toUpperCase() + d.slice(1)}</option>)}
                        </select>
                      </div>
                    )}
                    {form.schedule === 'monthly' && (
                      <div>
                        <label style={{ fontFamily: 'var(--sidebar-font)', fontSize: 11, color: 'var(--fg3)', display: 'block', marginBottom: 6 }}>Day of month</label>
                        <select style={{ ...inputStyle, padding: '8px 10px' }} value={form.schedule_day} onChange={e => setForm({ ...form, schedule_day: e.target.value })}>
                          {Array.from({ length: 28 }, (_, i) => i + 1).map(d => <option key={d} value={String(d)}>{d}</option>)}
                        </select>
                      </div>
                    )}
                    <div>
                      <label style={{ fontFamily: 'var(--sidebar-font)', fontSize: 11, color: 'var(--fg3)', display: 'block', marginBottom: 6 }}>Time</label>
                      <input type="time" style={{ ...inputStyle, padding: '8px 10px' }} value={form.schedule_time} onChange={e => setForm({ ...form, schedule_time: e.target.value })} />
                    </div>
                  </div>
                )}

                {/* Show selected schedule summary */}
                {!customSchedule && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ flex: 1, padding: '10px 14px', background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 8, fontFamily: 'var(--sidebar-font)', fontSize: 13, color: 'var(--fg2)' }}>
                      {SCHEDULE_PRESETS[selectedPreset].schedule === 'daily' && `Runs every day`}
                      {SCHEDULE_PRESETS[selectedPreset].schedule === 'weekly' && `Runs every ${SCHEDULE_PRESETS[selectedPreset].day}`}
                      {SCHEDULE_PRESETS[selectedPreset].schedule === 'monthly' && `Runs monthly on the ${SCHEDULE_PRESETS[selectedPreset].day}st`}
                    </div>
                    <span style={{ fontFamily: 'var(--sidebar-font)', fontSize: 13, color: 'var(--fg3)' }}>at</span>
                    <input
                      type="time"
                      style={{ ...inputStyle, width: 130, padding: '10px 12px' }}
                      value={form.schedule_time}
                      onChange={e => setForm({ ...form, schedule_time: e.target.value })}
                    />
                  </div>
                )}
              </div>

              {/* Notify email */}
              <div>
                <label style={{ fontFamily: 'var(--sidebar-font)', fontSize: 12, color: 'var(--fg3)', fontWeight: 600, display: 'block', marginBottom: 8, letterSpacing: 0.5, textTransform: 'uppercase' }}>
                  Email results to (optional)
                </label>
                <input
                  type="email"
                  style={inputStyle}
                  value={form.notify_email}
                  onChange={e => setForm({ ...form, notify_email: e.target.value })}
                  placeholder="owner@yourbusiness.com"
                />
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', gap: 10, paddingTop: 8 }}>
                <button
                  onClick={saveAutomation}
                  disabled={saving || !form.name || !form.prompt}
                  className="btn btn-accent"
                  style={{ flex: 1, fontSize: 14, height: 44, fontFamily: 'var(--sidebar-font)', fontWeight: 600, opacity: (!form.name || !form.prompt) ? 0.5 : 1 }}>
                  {saving ? 'Creating...' : 'Create automation →'}
                </button>
                <button
                  onClick={() => { setShowNew(false); setCustomSchedule(false); setSelectedPreset(0) }}
                  className="btn btn-outline"
                  style={{ fontSize: 13, fontFamily: 'var(--sidebar-font)' }}>
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <main className="app-main">
        <div className="app-header">
          <button onClick={() => router.push(`/agent/${agent.id as string}`)} className="btn btn-ghost btn-sm">
            <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
            Back
          </button>
          <div style={{ width: 1, height: 16, background: 'var(--border2)' }} />
          <span style={{ fontFamily: 'var(--sidebar-font)', fontSize: 14, fontWeight: 600 }}>Automations</span>
          <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--fg3)' }}>{agent.business_name as string}</span>
        </div>

        <div style={{ width: '100%', padding: '40px 48px' }}>

          {msg && (
            <div style={{ background: '#0d2e14', border: '1px solid #1a4a24', borderRadius: 8, padding: '10px 16px', marginBottom: 20, fontFamily: 'var(--sidebar-font)', fontSize: 13, color: '#4ade80' }}>
              ✓ {msg}
            </div>
          )}

          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 32 }}>
            <div>
              <div style={{ fontSize: 26, fontWeight: 700, color: 'var(--fg)', fontFamily: 'var(--sidebar-font)', marginBottom: 6 }}>
                Scheduled Automations
              </div>
              <div style={{ fontSize: 14, color: 'var(--fg3)', fontFamily: 'var(--sidebar-font)' }}>
                Tasks your agent runs automatically — you write it, it executes it.
              </div>
            </div>
            <button onClick={() => setShowNew(true)} className="btn btn-accent" style={{ height: 44, padding: '0 24px', fontSize: 14, fontFamily: 'var(--sidebar-font)', fontWeight: 600 }}>
              + New automation
            </button>
          </div>

          {/* Empty state */}
          {autos.length === 0 ? (
            <div className="card">
              <div className="empty-state">
                <div className="empty-state-icon">
                  <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
                </div>
                <div className="empty-state-title" style={{ fontFamily: 'var(--sidebar-font)', fontSize: 16 }}>No automations yet</div>
                <div className="empty-state-desc" style={{ fontFamily: 'var(--sidebar-font)' }}>
                  Create your first automation. Tell your agent what to do and when — in plain English.
                </div>
                <button onClick={() => setShowNew(true)} className="btn btn-accent" style={{ fontFamily: 'var(--sidebar-font)', fontWeight: 600 }}>
                  + Create first automation
                </button>
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 40 }}>
              {autos.map(auto => (
                <div key={auto.id as string} style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 12, padding: '20px 24px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16 }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                        <div style={{ width: 8, height: 8, borderRadius: '50%', background: auto.enabled ? '#4ade80' : 'var(--fg3)', flexShrink: 0 }} />
                        <div style={{ fontFamily: 'var(--sidebar-font)', fontSize: 16, fontWeight: 600, color: 'var(--fg)' }}>
                          {auto.name as string}
                        </div>
                        <span style={{ fontFamily: 'var(--mono)', fontSize: 10, padding: '2px 8px', borderRadius: 4, background: 'var(--bg4)', color: 'var(--fg3)', border: '1px solid var(--border)' }}>
                          {auto.schedule as string}
                        </span>
                      </div>

                      {/* Show the actual prompt */}
                      <div style={{ fontSize: 13, color: 'var(--fg3)', fontFamily: 'var(--sidebar-font)', marginBottom: 10, lineHeight: 1.5, background: 'var(--bg3)', padding: '8px 12px', borderRadius: 6, borderLeft: '2px solid var(--border2)' }}>
                        {auto.prompt as string}
                      </div>

                      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                        <span style={{ fontFamily: 'var(--sidebar-font)', fontSize: 12, color: 'var(--accent)', fontWeight: 500 }}>
                          {formatSchedule(auto)}
                        </span>
                        {!!auto.next_run && (
                          <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--fg3)' }}>
                            Next: {new Date(auto.next_run as string).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                          </span>
                        )}
                        {!!auto.last_run && (
                          <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--fg3)' }}>
                            Last: {timeAgo(auto.last_run as string)}
                          </span>
                        )}
                        {!!auto.notify_email && (
                          <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--fg3)' }}>
                            → {auto.notify_email as string}
                          </span>
                        )}
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                      <button
                        onClick={() => runNow(auto.id as string)}
                        disabled={running === auto.id}
                        className="btn btn-accent btn-sm"
                        style={{ fontSize: 12, fontFamily: 'var(--sidebar-font)', opacity: running === auto.id ? 0.6 : 1 }}>
                        {running === auto.id ? 'Running...' : '▶ Run now'}
                      </button>
                      <button
                        onClick={() => toggleEnabled(auto.id as string, auto.enabled as boolean)}
                        className="btn btn-outline btn-sm"
                        style={{ fontSize: 12, fontFamily: 'var(--sidebar-font)', color: auto.enabled ? '#fbbf24' : '#4ade80' }}>
                        {auto.enabled ? 'Pause' : 'Resume'}
                      </button>
                      <button
                        onClick={() => deleteAutomation(auto.id as string)}
                        className="btn btn-danger btn-sm"
                        style={{ fontSize: 12, fontFamily: 'var(--sidebar-font)' }}>
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Recent results */}
          {res.length > 0 && (
            <div>
              <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--fg)', fontFamily: 'var(--sidebar-font)', marginBottom: 14 }}>
                Recent results
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {res.slice(0, 5).map(result => (
                  <div key={result.id as string} style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 10, padding: '14px 18px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#4ade80' }} />
                        <span style={{ fontFamily: 'var(--sidebar-font)', fontSize: 12, color: '#4ade80', fontWeight: 600 }}>completed</span>
                      </div>
                      <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--fg3)' }}>{timeAgo(result.ran_at as string)}</span>
                    </div>
                    <p style={{ fontSize: 13, color: 'var(--fg3)', lineHeight: 1.6, fontFamily: 'var(--sidebar-font)' }}>
                      {(result.result as string)?.slice(0, 200)}{(result.result as string)?.length > 200 ? '...' : ''}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}