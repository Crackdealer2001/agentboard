'use client'
import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Navbar from '@/components/Navbar'

const STEPS = ['Business', 'Purpose', 'Personality', 'Your Agent']

const TASKS = [
  'Customer support', 'Email management', 'Order tracking',
  'Appointment booking', 'FAQ answering', 'Lead generation',
  'Invoice handling', 'Social media replies', 'Product recommendations'
]

export default function BuildPage() {
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [activeTab, setActiveTab] = useState('overview')
  const [form, setForm] = useState({
    businessName: '', industry: '', description: '',
    tasks: [] as string[], agentName: '', tone: 'professional', extraInfo: '',
  })

  const update = (key: string, val: any) => setForm(f => ({ ...f, [key]: val }))
  const toggleTask = (task: string) => setForm(f => ({
    ...f,
    tasks: f.tasks.includes(task) ? f.tasks.filter(t => t !== task) : [...f.tasks, task]
  }))

  const generate = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/generate-agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await response.json()
      if (data.error) { console.error(data.error); setLoading(false); return }
      setResult(data)
      setStep(3)
    } catch (err) {
      console.error(err)
    }
    setLoading(false)
  }

  const saveAgent = async () => {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/auth'); return }
    await supabase.from('agents').insert({
      user_id: user.id,
      name: result.name,
      description: result.description,
      category: result.category,
      tags: result.tags,
      price_label: 'Contact for pricing',
      price_amount: 0,
      is_active: true,
      badge: 'new',
    })
    setDone(true)
    setLoading(false)
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    alert('Copied to clipboard!')
  }

  const inputStyle = {
    width: '100%', padding: '11px 16px',
    border: '1px solid var(--border2)', borderRadius: 10,
    fontFamily: 'var(--sans)', fontSize: 14,
    background: 'var(--bg2)', color: 'var(--fg)', outline: 'none',
  }

  const tabStyle = (tab: string) => ({
    fontFamily: 'var(--mono)', fontSize: 12, padding: '8px 16px',
    borderRadius: 8, cursor: 'pointer', border: 'none',
    background: activeTab === tab ? 'var(--fg)' : 'transparent',
    color: activeTab === tab ? 'var(--bg)' : 'var(--muted)',
    transition: 'all 0.15s',
  })

  if (done) return (
    <>
      <Navbar />
      <div className="page" style={{ textAlign: 'center', paddingTop: 80 }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>🎉</div>
        <h1 style={{ fontFamily: 'var(--serif)', fontSize: 40, fontWeight: 400, marginBottom: 12 }}>Your agent is live!</h1>
        <p style={{ color: 'var(--muted)', fontSize: 16, marginBottom: 32 }}>{result?.name} has been listed on AgentBoard.</p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
          <button onClick={() => router.push('/agents')} className="btn btn-accent" style={{ fontSize: 13, padding: '12px 28px' }}>View on marketplace →</button>
          <button onClick={() => router.push('/dashboard')} className="btn btn-outline" style={{ fontSize: 13, padding: '12px 28px' }}>Go to dashboard</button>
        </div>
      </div>
    </>
  )

  return (
    <>
      <Navbar active="builder" />
      <div className="page" style={{ maxWidth: 720 }}>

        <div style={{ marginBottom: 40 }}>
          <div className="section-label">agent builder</div>
          <h1 style={{ fontFamily: 'var(--serif)', fontSize: 40, fontWeight: 400, marginBottom: 8 }}>Build your AI agent</h1>
          <p style={{ color: 'var(--muted)', fontSize: 15 }}>Answer a few questions and get a complete AI agent package for your business.</p>
        </div>

        {/* Progress bar */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 40 }}>
          {STEPS.map((s, i) => (
            <div key={s} style={{ flex: 1 }}>
              <div style={{ height: 3, borderRadius: 2, background: i <= step ? 'var(--accent)' : 'var(--border2)', marginBottom: 6, transition: 'background 0.3s' }} />
              <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: i <= step ? 'var(--fg)' : 'var(--muted)' }}>{s}</div>
            </div>
          ))}
        </div>

        {/* Step 0 — Business */}
        {step === 0 && (
          <div>
            <div className="form-group">
              <label className="label">business name</label>
              <input style={inputStyle} placeholder="e.g. Sunrise Bakery" value={form.businessName} onChange={e => update('businessName', e.target.value)} />
            </div>
            <div className="form-group">
              <label className="label">industry</label>
              <select style={inputStyle} value={form.industry} onChange={e => update('industry', e.target.value)}>
                <option value="">Select your industry</option>
                {['E-commerce', 'Food & Beverage', 'Healthcare', 'Legal', 'Real Estate', 'Education', 'Finance', 'Retail', 'Technology', 'Hospitality', 'Other'].map(i => <option key={i}>{i}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="label">what does your business do?</label>
              <textarea style={{ ...inputStyle, resize: 'vertical' }} rows={3}
                placeholder="e.g. We sell handmade cakes and pastries online and in-store"
                value={form.description} onChange={e => update('description', e.target.value)} />
            </div>
            <button className="btn btn-accent" style={{ fontSize: 13, padding: '12px 28px', opacity: (!form.businessName || !form.industry || !form.description) ? 0.4 : 1 }}
              disabled={!form.businessName || !form.industry || !form.description} onClick={() => setStep(1)}>Next →</button>
          </div>
        )}

        {/* Step 1 — Purpose */}
        {step === 1 && (
          <div>
            <div className="form-group">
              <label className="label">what should your agent help with?</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginTop: 8 }}>
                {TASKS.map(task => (
                  <button key={task} onClick={() => toggleTask(task)} style={{
                    fontFamily: 'var(--mono)', fontSize: 12, padding: '8px 16px', borderRadius: 20, cursor: 'pointer',
                    background: form.tasks.includes(task) ? 'var(--accent)' : 'var(--bg3)',
                    color: form.tasks.includes(task) ? '#0a0a0a' : 'var(--muted)',
                    border: `1px solid ${form.tasks.includes(task) ? 'var(--accent)' : 'var(--border2)'}`,
                  }}>{task}</button>
                ))}
              </div>
            </div>
            <div className="form-group">
              <label className="label">anything else? (optional)</label>
              <textarea style={{ ...inputStyle, resize: 'vertical' }} rows={3}
                placeholder="e.g. Reply in Spanish, notify me for orders over $500..."
                value={form.extraInfo} onChange={e => update('extraInfo', e.target.value)} />
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button className="btn btn-outline" style={{ fontSize: 13, padding: '12px 28px' }} onClick={() => setStep(0)}>← Back</button>
              <button className="btn btn-accent" style={{ fontSize: 13, padding: '12px 28px', opacity: form.tasks.length === 0 ? 0.4 : 1 }}
                disabled={form.tasks.length === 0} onClick={() => setStep(2)}>Next →</button>
            </div>
          </div>
        )}

        {/* Step 2 — Personality */}
        {step === 2 && (
          <div>
            <div className="form-group">
              <label className="label">agent name</label>
              <input style={inputStyle} placeholder="e.g. Aria, Max, Nova..." value={form.agentName} onChange={e => update('agentName', e.target.value)} />
            </div>
            <div className="form-group">
              <label className="label">tone & personality</label>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 8 }}>
                {['Professional', 'Friendly', 'Casual', 'Formal', 'Enthusiastic', 'Empathetic'].map(tone => (
                  <button key={tone} onClick={() => update('tone', tone.toLowerCase())} style={{
                    fontFamily: 'var(--mono)', fontSize: 12, padding: '8px 16px', borderRadius: 20, cursor: 'pointer',
                    background: form.tone === tone.toLowerCase() ? 'var(--accent)' : 'var(--bg3)',
                    color: form.tone === tone.toLowerCase() ? '#0a0a0a' : 'var(--muted)',
                    border: `1px solid ${form.tone === tone.toLowerCase() ? 'var(--accent)' : 'var(--border2)'}`,
                  }}>{tone}</button>
                ))}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button className="btn btn-outline" style={{ fontSize: 13, padding: '12px 28px' }} onClick={() => setStep(1)}>← Back</button>
              <button className="btn btn-accent" style={{ fontSize: 13, padding: '12px 28px', opacity: (loading || !form.agentName) ? 0.6 : 1 }}
                disabled={loading || !form.agentName} onClick={generate}>
                {loading ? 'Generating your agent...' : 'Generate Agent ✦'}
              </button>
            </div>
          </div>
        )}

        {/* Step 3 — Full Result */}
        {step === 3 && result && (
          <div>
            {/* Agent header */}
            <div style={{ background: 'var(--fg)', color: 'var(--bg)', borderRadius: 16, padding: '28px 32px', marginBottom: 24 }}>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 11, opacity: 0.5, marginBottom: 8, letterSpacing: 1 }}>YOUR AI AGENT IS READY</div>
              <h2 style={{ fontFamily: 'var(--serif)', fontSize: 36, fontWeight: 400, marginBottom: 8 }}>{result.name}</h2>
              <p style={{ fontSize: 15, opacity: 0.7, lineHeight: 1.6, marginBottom: 16 }}>{result.description}</p>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {result.tags?.map((tag: string) => (
                  <span key={tag} style={{ fontFamily: 'var(--mono)', fontSize: 11, padding: '4px 10px', borderRadius: 20, background: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.7)' }}>{tag}</span>
                ))}
              </div>
            </div>

            {/* Tabs */}
            <div style={{ display: 'flex', gap: 6, marginBottom: 24, background: 'var(--bg2)', padding: 6, borderRadius: 10, border: '1px solid var(--border)' }}>
              {['overview', 'setup', 'use cases', 'emails', 'tips'].map(tab => (
                <button key={tab} style={tabStyle(tab)} onClick={() => setActiveTab(tab)}>{tab}</button>
              ))}
            </div>

            {/* Overview tab */}
            {activeTab === 'overview' && (
              <div>
                <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 16, padding: 24, marginBottom: 16 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                    <div className="label">system prompt</div>
                    <button onClick={() => copyToClipboard(result.systemPrompt)} className="btn btn-outline" style={{ fontSize: 11, padding: '5px 12px' }}>Copy →</button>
                  </div>
                  <div style={{ background: 'var(--bg3)', border: '1px solid var(--border2)', borderRadius: 10, padding: 16, fontFamily: 'var(--mono)', fontSize: 12, lineHeight: 1.8, color: 'var(--muted)', whiteSpace: 'pre-wrap', maxHeight: 300, overflowY: 'auto' }}>
                    {result.systemPrompt}
                  </div>
                </div>
                <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 12, padding: 20 }}>
                  <div className="label" style={{ marginBottom: 8 }}>how to use this prompt</div>
                  <p style={{ fontSize: 14, color: 'var(--muted)', lineHeight: 1.7 }}>
                    Copy the system prompt above and paste it into any AI tool — ChatGPT, Claude, Gemini, or any other. This tells the AI exactly how to behave for your business. You can then start chatting with it to handle your tasks.
                  </p>
                </div>
              </div>
            )}

            {/* Setup tab */}
            {activeTab === 'setup' && (
              <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 16, padding: 24 }}>
                <div className="label" style={{ marginBottom: 16 }}>step by step setup guide</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {result.setupSteps?.map((step: string, i: number) => (
                    <div key={i} style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
                      <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--accent)', color: '#0a0a0a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--mono)', fontSize: 12, fontWeight: 500, flexShrink: 0 }}>{i + 1}</div>
                      <p style={{ fontSize: 14, lineHeight: 1.7, paddingTop: 4 }}>{step}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Use cases tab */}
            {activeTab === 'use cases' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {result.useCases?.map((uc: any, i: number) => (
                  <div key={i} style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 16, padding: 24 }}>
                    <h3 style={{ fontFamily: 'var(--serif)', fontSize: 18, fontWeight: 400, marginBottom: 8 }}>{uc.task}</h3>
                    <p style={{ fontSize: 14, color: 'var(--muted)', lineHeight: 1.7, marginBottom: 16 }}>{uc.howTo}</p>
                    <div className="label" style={{ marginBottom: 8 }}>example prompt to use</div>
                    <div style={{ background: 'var(--bg3)', border: '1px solid var(--border2)', borderRadius: 10, padding: 14, fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--muted)', lineHeight: 1.7, marginBottom: 10 }}>
                      {uc.examplePrompt}
                    </div>
                    <button onClick={() => copyToClipboard(uc.examplePrompt)} className="btn btn-outline" style={{ fontSize: 11, padding: '5px 12px' }}>Copy prompt →</button>
                  </div>
                ))}
              </div>
            )}

            {/* Emails tab */}
            {activeTab === 'emails' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {result.emailTemplates?.map((email: any, i: number) => (
                  <div key={i} style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 16, padding: 24 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                      <div>
                        <div className="label" style={{ marginBottom: 4 }}>{email.useCase}</div>
                        <h3 style={{ fontFamily: 'var(--serif)', fontSize: 18, fontWeight: 400 }}>Subject: {email.subject}</h3>
                      </div>
                      <button onClick={() => copyToClipboard(`Subject: ${email.subject}\n\n${email.body}`)} className="btn btn-outline" style={{ fontSize: 11, padding: '5px 12px' }}>Copy →</button>
                    </div>
                    <div style={{ background: 'var(--bg3)', border: '1px solid var(--border2)', borderRadius: 10, padding: 16, fontSize: 14, lineHeight: 1.8, color: 'var(--muted)', whiteSpace: 'pre-wrap' }}>
                      {email.body}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Tips tab */}
            {activeTab === 'tips' && (
              <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 16, padding: 24 }}>
                <div className="label" style={{ marginBottom: 16 }}>pro tips for your agent</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {result.tips?.map((tip: string, i: number) => (
                    <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                      <span style={{ color: 'var(--accent)', fontFamily: 'var(--mono)', fontSize: 14, flexShrink: 0 }}>✦</span>
                      <p style={{ fontSize: 14, lineHeight: 1.7 }}>{tip}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Actions */}
            <div style={{ display: 'flex', gap: 10, marginTop: 24 }}>
              <button className="btn btn-accent" style={{ fontSize: 13, padding: '12px 28px', opacity: loading ? 0.6 : 1 }}
                disabled={loading} onClick={saveAgent}>
                {loading ? 'Saving...' : 'List on AgentBoard →'}
              </button>
              <button className="btn btn-outline" style={{ fontSize: 13, padding: '12px 28px' }} onClick={() => setStep(2)}>
                Regenerate
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  )
}