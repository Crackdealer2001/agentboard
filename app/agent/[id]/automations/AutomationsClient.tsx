'use client'
import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import Navbar from '@/components/Navbar'
import { useRouter } from 'next/navigation'

const AUTOMATION_TEMPLATES = [
  { name: 'Weekly Business Summary', description: 'Get a summary of your business activity every Monday', prompt: 'Generate a comprehensive weekly business summary. Include: key activities this week, any patterns you notice, recommendations for next week, and action items. Keep it concise and actionable.', schedule: 'weekly', schedule_day: 'monday', schedule_time: '09:00' },
  { name: 'Daily Calendar Briefing', description: 'Start each day knowing what\'s ahead', prompt: 'Generate a daily briefing for today. Include: upcoming calendar events today, any deadlines, recommended priorities, and a motivational note. Be brief and practical.', schedule: 'daily', schedule_day: '', schedule_time: '08:00' },
  { name: 'Friday Invoice Reminder', description: 'Check for unpaid invoices every Friday', prompt: 'Review outstanding invoices and generate reminder messages for any that are overdue or due soon. List each unpaid invoice, days overdue, and a professional reminder message to send to each client.', schedule: 'weekly', schedule_day: 'friday', schedule_time: '10:00' },
  { name: 'Monthly Business Report', description: 'Full monthly performance report on the 1st', prompt: 'Generate a comprehensive monthly business report. Include: month overview, key achievements, challenges faced, financial summary if available, client activity, and goals for next month. Format professionally.', schedule: 'monthly', schedule_day: '1', schedule_time: '09:00' },
  { name: 'Weekly Social Media Plan', description: 'Get content ideas every Sunday evening', prompt: 'Generate a weekly social media content plan for the coming week. Create 5 post ideas with captions, suggested posting times, and hashtags relevant to our business. Make content engaging and on-brand.', schedule: 'weekly', schedule_day: 'sunday', schedule_time: '18:00' },
  { name: 'Custom Automation', description: 'Build your own automated task', prompt: '', schedule: 'daily', schedule_day: '', schedule_time: '09:00' },
]

const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']

export default function AutomationsClient({ agent, automations, results }: {
  agent: Record<string, unknown>
  automations: Record<string, unknown>[]
  results: Record<string, unknown>[]
}) {
  const router = useRouter()
  const [autos, setAutos] = useState(automations)
  const [res, setRes] = useState(results)
  const [showNew, setShowNew] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState<typeof AUTOMATION_TEMPLATES[0] | null>(null)
  const [saving, setSaving] = useState(false)
  const [running, setRunning] = useState<string | null>(null)
  const [runResult, setRunResult] = useState<{ id: string; result: string } | null>(null)
  const [msg, setMsg] = useState('')
  const [form, setForm] = useState({
    name: '',
    description: '',
    prompt: '',
    schedule: 'daily',
    schedule_day: 'monday',
    schedule_time: '09:00',
    notify_email: '',
    enabled: true,
  })

  const inputStyle = {
    width: '100%', padding: '10px 14px',
    border: '1px solid var(--border2)', borderRadius: 8,
    fontFamily: 'var(--sans)', fontSize: 13,
    background: 'var(--bg2)', color: 'var(--fg)', outline: 'none',
  }

  const selectTemplate = (template: typeof AUTOMATION_TEMPLATES[0]) => {
    setSelectedTemplate(template)
    setForm({
      name: template.name,
      description: template.description,
      prompt: template.prompt,
      schedule: template.schedule,
      schedule_day: template.schedule_day,
      schedule_time: template.schedule_time,
      notify_email: '',
      enabled: true,
    })
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
      description: form.description,
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
      setSelectedTemplate(null)
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
    const res = await fetch('/api/run-automation', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ automationId: id }),
    })
    const data = await res.json()
    if (data.result) {
      setRunResult({ id, result: data.result })
      const { data: newResult } = await supabase.from('automation_results').select('*').eq('automation_id', id).order('ran_at', { ascending: false }).limit(1).single()
      if (newResult) setRes(prev => [newResult, ...prev])
    }
    setRunning(null)
  }

  const formatSchedule = (auto: Record<string, unknown>) => {
    if (auto.schedule === 'daily') return `Every day at ${auto.schedule_time}`
    if (auto.schedule === 'weekly') return `Every ${auto.schedule_day} at ${auto.schedule_time}`
    if (auto.schedule === 'monthly') return `Monthly on the ${auto.schedule_day}${['1','21','31'].includes(auto.schedule_day as string) ? 'st' : ['2','22'].includes(auto.schedule_day as string) ? 'nd' : ['3','23'].includes(auto.schedule_day as string) ? 'rd' : 'th'} at ${auto.schedule_time}`
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
    <>
      <Navbar />
      <div style={{ maxWidth: 900, margin: '0 auto', padding: '32px 24px' }}>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
          <div>
            <div style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--muted)', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 8 }}>Scheduled Automations</div>
            <h1 style={{ fontFamily: 'var(--serif)', fontSize: 36, fontWeight: 400, marginBottom: 4 }}>{agent.agent_name as string}</h1>
            <p style={{ fontSize: 14, color: 'var(--muted)' }}>Tasks that run automatically on a schedule</p>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => router.push(`/agent/${agent.id as string}`)} className="btn btn-outline" style={{ fontSize: 12 }}>← Back</button>
            <button onClick={() => setShowNew(true)} className="btn btn-accent" style={{ fontSize: 12 }}>+ New automation</button>
          </div>
        </div>

        {msg && (
          <div style={{ background: '#0d2e14', border: '1px solid #1a4a24', borderRadius: 8, padding: '10px 16px', marginBottom: 20, fontFamily: 'var(--mono)', fontSize: 12, color: '#4ade80' }}>
            ✓ {msg}
          </div>
        )}

        {/* New automation modal */}
        {showNew && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, backdropFilter: 'blur(4px)' }}>
            <div style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 20, width: '100%', maxWidth: 640, maxHeight: '90vh', overflow: 'auto', padding: '36px 40px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                <h2 style={{ fontFamily: 'var(--serif)', fontSize: 26, fontWeight: 400 }}>New automation</h2>
                <button onClick={() => { setShowNew(false); setSelectedTemplate(null) }} style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', fontSize: 18 }}>✕</button>
              </div>

              {!selectedTemplate ? (
                <div>
                  <p style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 20 }}>Choose a template or build your own:</p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {AUTOMATION_TEMPLATES.map((template, i) => (
                      <button key={i} onClick={() => selectTemplate(template)}
                        style={{ textAlign: 'left', padding: '16px 20px', background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 12, cursor: 'pointer', transition: 'all 0.15s' }}
                        onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--fg)'}
                        onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--border)'}>
                        <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 4 }}>{template.name}</div>
                        <div style={{ fontSize: 12, color: 'var(--muted)' }}>{template.description}</div>
                        <div style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--accent)', marginTop: 6 }}>
                          {template.schedule === 'daily' ? `Every day at ${template.schedule_time}` : template.schedule === 'weekly' ? `Every ${template.schedule_day} at ${template.schedule_time}` : `Monthly on the ${template.schedule_day}st`}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div>
                    <label style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--muted)', display: 'block', marginBottom: 8 }}>Automation name *</label>
                    <input style={inputStyle} value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="e.g. Weekly Summary" />
                  </div>
                  <div>
                    <label style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--muted)', display: 'block', marginBottom: 8 }}>What should the agent do? *</label>
                    <textarea style={{ ...inputStyle, resize: 'vertical' }} rows={4} value={form.prompt} onChange={e => setForm({ ...form, prompt: e.target.value })} placeholder="Describe exactly what you want the agent to do automatically..." />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
                    <div>
                      <label style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--muted)', display: 'block', marginBottom: 8 }}>Frequency</label>
                      <select style={inputStyle} value={form.schedule} onChange={e => setForm({ ...form, schedule: e.target.value })}>
                        <option value="daily">Daily</option>
                        <option value="weekly">Weekly</option>
                        <option value="monthly">Monthly</option>
                      </select>
                    </div>
                    {form.schedule === 'weekly' && (
                      <div>
                        <label style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--muted)', display: 'block', marginBottom: 8 }}>Day</label>
                        <select style={inputStyle} value={form.schedule_day} onChange={e => setForm({ ...form, schedule_day: e.target.value })}>
                          {DAYS.map(d => <option key={d} value={d}>{d.charAt(0).toUpperCase() + d.slice(1)}</option>)}
                        </select>
                      </div>
                    )}
                    {form.schedule === 'monthly' && (
                      <div>
                        <label style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--muted)', display: 'block', marginBottom: 8 }}>Day of month</label>
                        <select style={inputStyle} value={form.schedule_day} onChange={e => setForm({ ...form, schedule_day: e.target.value })}>
                          {Array.from({ length: 28 }, (_, i) => i + 1).map(d => <option key={d} value={String(d)}>{d}</option>)}
                        </select>
                      </div>
                    )}
                    <div>
                      <label style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--muted)', display: 'block', marginBottom: 8 }}>Time</label>
                      <input type="time" style={inputStyle} value={form.schedule_time} onChange={e => setForm({ ...form, schedule_time: e.target.value })} />
                    </div>
                  </div>
                  <div>
                    <label style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--muted)', display: 'block', marginBottom: 8 }}>Send results to email (optional)</label>
                    <input style={inputStyle} type="email" value={form.notify_email} onChange={e => setForm({ ...form, notify_email: e.target.value })} placeholder="owner@yourbusiness.com" />
                  </div>
                  <div style={{ display: 'flex', gap: 10, paddingTop: 8 }}>
                    <button onClick={saveAutomation} disabled={saving || !form.name || !form.prompt} className="btn btn-accent" style={{ fontSize: 13, flex: 1, opacity: (!form.name || !form.prompt) ? 0.5 : 1 }}>
                      {saving ? 'Creating...' : 'Create automation →'}
                    </button>
                    <button onClick={() => setSelectedTemplate(null)} className="btn btn-outline" style={{ fontSize: 13 }}>← Back</button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Run result modal */}
        {runResult && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, backdropFilter: 'blur(4px)' }}>
            <div style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 20, width: '100%', maxWidth: 600, maxHeight: '80vh', overflow: 'auto', padding: '36px 40px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <div style={{ fontFamily: 'var(--mono)', fontSize: 11, color: '#4ade80', letterSpacing: 1 }}>✓ AUTOMATION COMPLETE</div>
                <button onClick={() => setRunResult(null)} style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', fontSize: 18 }}>✕</button>
              </div>
              <div style={{ fontSize: 14, lineHeight: 1.8, whiteSpace: 'pre-wrap', color: 'var(--fg)' }}>{runResult.result}</div>
            </div>
          </div>
        )}

        {/* Automations list */}
        {autos.length === 0 ? (
          <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 16, padding: '60px 40px', textAlign: 'center', marginBottom: 32 }}>
            <div style={{ fontSize: 40, marginBottom: 16 }}>
              <svg width="48" height="48" fill="none" stroke="var(--muted)" strokeWidth="1" viewBox="0 0 24 24" style={{ margin: '0 auto', display: 'block' }}><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
            </div>
            <h3 style={{ fontFamily: 'var(--serif)', fontSize: 22, fontWeight: 400, marginBottom: 8 }}>No automations yet</h3>
            <p style={{ color: 'var(--muted)', fontSize: 13, marginBottom: 24 }}>Create your first automation to put your agent to work automatically.</p>
            <button onClick={() => setShowNew(true)} className="btn btn-accent" style={{ fontSize: 13 }}>+ Create first automation</button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 40 }}>
            {autos.map(auto => (
              <div key={auto.id as string} style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 14, padding: '20px 24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                      <div style={{ width: 8, height: 8, borderRadius: '50%', background: auto.enabled ? '#4ade80' : 'var(--muted)', flexShrink: 0 }} />
                      <h3 style={{ fontFamily: 'var(--serif)', fontSize: 18, fontWeight: 400 }}>{auto.name as string}</h3>
                      <span style={{ fontFamily: 'var(--mono)', fontSize: 10, padding: '2px 8px', borderRadius: 4, background: 'var(--bg3)', color: 'var(--muted)', border: '1px solid var(--border)' }}>
                        {auto.schedule as string}
                      </span>
                    </div>
                    {auto.description && <p style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 8 }}>{auto.description as string}</p>}
                    <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                      <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--accent)' }}>
                        {formatSchedule(auto)}
                      </span>
                      {auto.next_run && (
                        <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--muted)' }}>
                          Next: {new Date(auto.next_run as string).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </span>
                      )}
                      {auto.last_run && (
                        <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--muted)' }}>
                          Last run: {timeAgo(auto.last_run as string)}
                        </span>
                      )}
                      {auto.notify_email && (
                        <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--muted)' }}>
                          → {auto.notify_email as string}
                        </span>
                      )}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                    <button
                      onClick={() => runNow(auto.id as string)}
                      disabled={running === auto.id}
                      className="btn btn-accent"
                      style={{ fontSize: 11, padding: '6px 14px', opacity: running === auto.id ? 0.6 : 1 }}>
                      {running === auto.id ? 'Running...' : '▶ Run now'}
                    </button>
                    <button
                      onClick={() => toggleEnabled(auto.id as string, auto.enabled as boolean)}
                      style={{ fontFamily: 'var(--mono)', fontSize: 11, padding: '6px 14px', background: 'transparent', border: '1px solid var(--border2)', borderRadius: 8, cursor: 'pointer', color: auto.enabled ? '#fbbf24' : '#4ade80' }}>
                      {auto.enabled ? 'Pause' : 'Enable'}
                    </button>
                    <button
                      onClick={() => deleteAutomation(auto.id as string)}
                      style={{ fontFamily: 'var(--mono)', fontSize: 11, padding: '6px 14px', background: 'transparent', border: '1px solid #4a1a1a', borderRadius: 8, cursor: 'pointer', color: '#f87171' }}>
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
            <div style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--muted)', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 16 }}>Recent results</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {res.slice(0, 5).map(result => (
                <div key={result.id as string} style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 12, padding: '14px 18px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#4ade80' }} />
                      <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: '#4ade80' }}>completed</span>
                    </div>
                    <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--muted)' }}>{timeAgo(result.ran_at as string)}</span>
                  </div>
                  <p style={{ fontSize: 13, color: 'var(--muted)', lineHeight: 1.6 }}>
                    {(result.result as string)?.slice(0, 150)}{(result.result as string)?.length > 150 ? '...' : ''}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  )
}