'use client'
import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import Navbar from '@/components/Navbar'
import { useRouter } from 'next/navigation'

export default function AgentClient({ agent }: { agent: Record<string, unknown> }) {
  const router = useRouter()
  const automations = agent.automations as Record<string, unknown>[]
  const [activeAuto, setActiveAuto] = useState<Record<string, unknown>>(automations?.[0])
  const [input, setInput] = useState('')
  const [customerEmail, setCustomerEmail] = useState('')
  const [output, setOutput] = useState('')
  const [running, setRunning] = useState(false)
  const [emailSent, setEmailSent] = useState(false)
  const [history, setHistory] = useState<Record<string, unknown>[]>([])
  const [status, setStatus] = useState('')

  const runAutomation = async () => {
    if (!input.trim() || !activeAuto) return
    setRunning(true)
    setOutput('')
    setEmailSent(false)
    setStatus('Generating response...')

    const response = await fetch('/api/run-automation', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        promptTemplate: activeAuto.promptTemplate,
        input,
        systemPrompt: agent.system_prompt,
      }),
    })

    const data = await response.json()

    if (data.output) {
      setOutput(data.output)
      setStatus('Response generated!')

      await supabase.from('automation_runs').insert({
        business_agent_id: agent.id,
        automation_type: activeAuto.title,
        input,
        output: data.output,
      })

      setHistory(prev => [{
        automation_type: activeAuto.title,
        input,
        output: data.output,
        created_at: new Date().toISOString()
      }, ...prev])

      if (customerEmail.trim()) {
        setStatus('Sending email to customer...')
        const emailRes = await fetch('/api/send-automation-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            to: customerEmail,
            subject: `${agent.business_name} — ${activeAuto.title}`,
            body: data.output,
            businessName: agent.business_name,
            agentName: agent.agent_name,
          }),
        })
        const emailData = await emailRes.json()
        if (emailData.success) {
          setEmailSent(true)
          setStatus('Done! Email sent to customer automatically.')
        } else {
          setStatus('Response ready. Email could not be sent: ' + emailData.error)
        }
      } else {
        setStatus('Done! Copy the response or add a customer email to send automatically.')
      }
    }

    setRunning(false)
  }

  const copyOutput = () => {
    navigator.clipboard.writeText(output)
    alert('Copied!')
  }

  return (
    <>
      <Navbar />
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '40px 32px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 40 }}>
          <div>
            <div className="section-label">your ai agent</div>
            <h1 style={{ fontFamily: 'var(--serif)', fontSize: 40, fontWeight: 400, marginBottom: 6 }}>{agent.agent_name as string}</h1>
            <p style={{ color: 'var(--muted)', fontSize: 15 }}>{agent.business_name as string} · {agent.industry as string}</p>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => router.push('/dashboard')} className="btn btn-outline" style={{ fontSize: 12 }}>← Dashboard</button>
            <button onClick={() => router.push('/builder')} className="btn btn-accent" style={{ fontSize: 12 }}>+ New Agent</button>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: 24 }}>
          <div>
            <div className="label" style={{ marginBottom: 12 }}>automations</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {automations?.map((auto) => (
                <button key={auto.id as string} onClick={() => { setActiveAuto(auto); setInput(''); setOutput(''); setEmailSent(false); setStatus('') }}
                  style={{
                    textAlign: 'left', padding: '14px 16px', borderRadius: 12, cursor: 'pointer',
                    background: activeAuto?.id === auto.id ? 'var(--fg)' : 'var(--bg2)',
                    color: activeAuto?.id === auto.id ? 'var(--bg)' : 'var(--fg)',
                    border: `1px solid ${activeAuto?.id === auto.id ? 'var(--fg)' : 'var(--border)'}`,
                    transition: 'all 0.15s',
                  }}>
                  <div style={{ fontSize: 20, marginBottom: 4 }}>{auto.icon as string}</div>
                  <div style={{ fontFamily: 'var(--sans)', fontSize: 13, fontWeight: 500 }}>{auto.title as string}</div>
                  <div style={{ fontFamily: 'var(--mono)', fontSize: 11, opacity: 0.6, marginTop: 2 }}>
                    {(auto.description as string)?.slice(0, 50)}...
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div>
            {activeAuto && (
              <div>
                <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 16, padding: 28, marginBottom: 20 }}>
                  <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 20 }}>
                    <span style={{ fontSize: 32 }}>{activeAuto.icon as string}</span>
                    <div>
                      <h2 style={{ fontFamily: 'var(--serif)', fontSize: 24, fontWeight: 400, marginBottom: 4 }}>{activeAuto.title as string}</h2>
                      <p style={{ fontSize: 13, color: 'var(--muted)' }}>{activeAuto.description as string}</p>
                    </div>
                  </div>

                  <div className="label" style={{ marginBottom: 8 }}>{activeAuto.inputLabel as string}</div>
                  <textarea
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    placeholder={activeAuto.inputPlaceholder as string}
                    rows={5}
                    className="input"
                    style={{ marginBottom: 14, fontSize: 14, resize: 'vertical' }}
                  />

                  <div className="label" style={{ marginBottom: 8 }}>customer email <span style={{ color: 'var(--muted)', fontWeight: 400 }}>(optional — agent will send response automatically)</span></div>
                  <input
                    type="email"
                    value={customerEmail}
                    onChange={e => setCustomerEmail(e.target.value)}
                    placeholder="customer@example.com"
                    className="input"
                    style={{ marginBottom: 16, fontSize: 14 }}
                  />

                  <button onClick={runAutomation} disabled={running || !input.trim()}
                    className="btn btn-accent"
                    style={{ fontSize: 13, padding: '11px 28px', opacity: (running || !input.trim()) ? 0.5 : 1 }}>
                    {running ? status || 'Running...' : `Run ${activeAuto.title as string} ✦`}
                  </button>

                  {status && !running && (
                    <p style={{ fontFamily: 'var(--mono)', fontSize: 12, color: emailSent ? '#4ade80' : 'var(--muted)', marginTop: 12 }}>
                      {emailSent ? '✓ ' : ''}{status}
                    </p>
                  )}
                </div>

                {output && (
                  <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 16, padding: 28, marginBottom: 20 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                      <div className="label">{activeAuto.outputLabel as string}</div>
                      <div style={{ display: 'flex', gap: 8 }}>
                        {emailSent && (
                          <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: '#4ade80', padding: '5px 12px', background: '#0d2e14', borderRadius: 6, border: '1px solid #1a4a24' }}>
                            ✓ emailed
                          </span>
                        )}
                        <button onClick={copyOutput} className="btn btn-outline" style={{ fontSize: 11, padding: '5px 12px' }}>Copy →</button>
                      </div>
                    </div>
                    <div style={{ fontSize: 14, lineHeight: 1.8, whiteSpace: 'pre-wrap' }}>{output}</div>
                  </div>
                )}

                {history.length > 0 && (
                  <div>
                    <div className="label" style={{ marginBottom: 12 }}>recent runs</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      {history.slice(0, 5).map((run, i) => (
                        <div key={i} style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 12, padding: '14px 18px', cursor: 'pointer' }}
                          onClick={() => setOutput(run.output as string)}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                            <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--accent)' }}>{run.automation_type as string}</span>
                            <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--muted)' }}>
                              {new Date(run.created_at as string).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          <p style={{ fontSize: 13, color: 'var(--muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{run.input as string}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}