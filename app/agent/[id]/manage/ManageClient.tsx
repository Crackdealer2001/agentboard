'use client'
import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import Navbar from '@/components/Navbar'
import { useRouter } from 'next/navigation'

export default function ManageClient({
  agent, knowledge, contacts, memories, team
}: {
  agent: Record<string, unknown>
  knowledge: Record<string, unknown>[]
  contacts: Record<string, unknown>[]
  memories: Record<string, unknown>[]
  team: Record<string, unknown>[]
}) {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<'knowledge' | 'contacts' | 'memory' | 'team'>('knowledge')
  const [kb, setKb] = useState(knowledge)
  const [cts, setCts] = useState(contacts)
  const [mem, setMem] = useState(memories)
  const [tm, setTm] = useState(team)

  const [newKb, setNewKb] = useState({ title: '', content: '', type: 'general' })
  const [newContact, setNewContact] = useState({ name: '', email: '', phone: '', company: '', notes: '' })
  const [newTeam, setNewTeam] = useState({ email: '', role: 'member' })
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')

  const inputStyle = {
    width: '100%', padding: '10px 14px',
    border: '1px solid var(--border2)', borderRadius: 8,
    fontFamily: 'var(--sans)', fontSize: 13,
    background: 'var(--bg2)', color: 'var(--fg)', outline: 'none',
  }

  const saveKb = async () => {
    if (!newKb.title || !newKb.content) return
    setSaving(true)
    const { data } = await supabase.from('knowledge_base').insert({
      business_agent_id: agent.id,
      title: newKb.title,
      content: newKb.content,
      type: newKb.type,
    }).select().single()
    if (data) { setKb(prev => [data, ...prev]); setNewKb({ title: '', content: '', type: 'general' }); setMsg('Knowledge saved!') }
    setSaving(false)
    setTimeout(() => setMsg(''), 2000)
  }

  const deleteKb = async (id: string) => {
    await supabase.from('knowledge_base').delete().eq('id', id)
    setKb(prev => prev.filter(k => k.id !== id))
  }

  const saveContact = async () => {
    if (!newContact.name) return
    setSaving(true)
    const { data } = await supabase.from('contacts').insert({
      business_agent_id: agent.id,
      ...newContact,
    }).select().single()
    if (data) { setCts(prev => [data, ...prev]); setNewContact({ name: '', email: '', phone: '', company: '', notes: '' }); setMsg('Contact saved!') }
    setSaving(false)
    setTimeout(() => setMsg(''), 2000)
  }

  const deleteContact = async (id: string) => {
    await supabase.from('contacts').delete().eq('id', id)
    setCts(prev => prev.filter(c => c.id !== id))
  }

  const deleteMemory = async (id: string) => {
    await supabase.from('agent_memory').delete().eq('id', id)
    setMem(prev => prev.filter(m => m.id !== id))
  }

  const inviteTeam = async () => {
    if (!newTeam.email) return
    setSaving(true)
    const { data } = await supabase.from('team_members').insert({
      business_agent_id: agent.id,
      email: newTeam.email,
      role: newTeam.role,
    }).select().single()
    if (data) { setTm(prev => [data, ...prev]); setNewTeam({ email: '', role: 'member' }); setMsg('Team member invited!') }
    setSaving(false)
    setTimeout(() => setMsg(''), 2000)
  }

  const removeTeam = async (id: string) => {
    await supabase.from('team_members').delete().eq('id', id)
    setTm(prev => prev.filter(t => t.id !== id))
  }

  const tabStyle = (tab: string) => ({
    fontFamily: 'var(--mono)', fontSize: 12, padding: '8px 18px',
    borderRadius: 8, cursor: 'pointer', border: 'none',
    background: activeTab === tab ? 'var(--fg)' : 'transparent',
    color: activeTab === tab ? 'var(--bg)' : 'var(--muted)',
    transition: 'all 0.15s',
  })

  return (
    <>
      <Navbar />
      <div style={{ maxWidth: 900, margin: '0 auto', padding: '32px 24px' }}>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
          <div>
            <div className="section-label">agent settings</div>
            <h1 style={{ fontFamily: 'var(--serif)', fontSize: 32, fontWeight: 400 }}>{agent.agent_name as string}</h1>
            <p style={{ color: 'var(--muted)', fontSize: 14 }}>{agent.business_name as string}</p>
          </div>
          <button onClick={() => router.push(`/agent/${agent.id as string}`)} className="btn btn-accent" style={{ fontSize: 12 }}>
            ← Back to Agent
          </button>
        </div>

        {msg && (
          <div style={{ background: '#0d2e14', border: '1px solid #1a4a24', borderRadius: 8, padding: '10px 16px', marginBottom: 20, fontFamily: 'var(--mono)', fontSize: 12, color: '#4ade80' }}>
            ✓ {msg}
          </div>
        )}

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 6, marginBottom: 28, background: 'var(--bg2)', padding: 6, borderRadius: 10, border: '1px solid var(--border)', width: 'fit-content' }}>
          <button style={tabStyle('knowledge')} onClick={() => setActiveTab('knowledge')}>📚 Knowledge Base</button>
          <button style={tabStyle('contacts')} onClick={() => setActiveTab('contacts')}>👥 Contacts ({cts.length})</button>
          <button style={tabStyle('memory')} onClick={() => setActiveTab('memory')}>🧠 Memory ({mem.length})</button>
          <button style={tabStyle('team')} onClick={() => setActiveTab('team')}>🏢 Team ({tm.length})</button>
        </div>

        {/* KNOWLEDGE BASE */}
        {activeTab === 'knowledge' && (
          <div>
            <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 16, padding: 24, marginBottom: 24 }}>
              <div className="label" style={{ marginBottom: 16 }}>Add knowledge</div>
              <p style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 16 }}>
                Add your pricing, FAQs, policies, products — anything your agent should know about your business.
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
                <div>
                  <label className="label">Title</label>
                  <input style={inputStyle} placeholder="e.g. Standard Pricing List" value={newKb.title} onChange={e => setNewKb({ ...newKb, title: e.target.value })} />
                </div>
                <div>
                  <label className="label">Type</label>
                  <select style={inputStyle} value={newKb.type} onChange={e => setNewKb({ ...newKb, type: e.target.value })}>
                    <option value="general">General</option>
                    <option value="pricing">Pricing</option>
                    <option value="faq">FAQ</option>
                    <option value="policy">Policy</option>
                    <option value="product">Product/Service</option>
                  </select>
                </div>
              </div>
              <div style={{ marginBottom: 12 }}>
                <label className="label">Content</label>
                <textarea style={{ ...inputStyle, resize: 'vertical' }} rows={4}
                  placeholder="e.g. Our standard hourly rate is $150. We offer discounts for projects over $5,000..."
                  value={newKb.content} onChange={e => setNewKb({ ...newKb, content: e.target.value })} />
              </div>
              <button onClick={saveKb} disabled={saving} className="btn btn-accent" style={{ fontSize: 13 }}>
                {saving ? 'Saving...' : 'Add to Knowledge Base →'}
              </button>
            </div>

            {kb.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px', color: 'var(--muted)', fontFamily: 'var(--mono)', fontSize: 13 }}>
                No knowledge added yet. Add your first entry above.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {kb.map(k => (
                  <div key={k.id as string} style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 12, padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16 }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 6 }}>
                        <span className="tag">{k.type as string}</span>
                        <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--muted)' }}>{k.title as string}</span>
                      </div>
                      <p style={{ fontSize: 13, color: 'var(--muted)', lineHeight: 1.6 }}>{(k.content as string)?.slice(0, 120)}{(k.content as string)?.length > 120 ? '...' : ''}</p>
                    </div>
                    <button onClick={() => deleteKb(k.id as string)} style={{ background: 'none', border: '1px solid var(--border2)', color: 'var(--muted)', padding: '4px 10px', borderRadius: 6, cursor: 'pointer', fontFamily: 'var(--mono)', fontSize: 11, flexShrink: 0 }}>
                      Delete
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* CONTACTS */}
        {activeTab === 'contacts' && (
          <div>
            <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 16, padding: 24, marginBottom: 24 }}>
              <div className="label" style={{ marginBottom: 16 }}>Add contact</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
                <div>
                  <label className="label">Name *</label>
                  <input style={inputStyle} placeholder="John Smith" value={newContact.name} onChange={e => setNewContact({ ...newContact, name: e.target.value })} />
                </div>
                <div>
                  <label className="label">Email</label>
                  <input style={inputStyle} placeholder="john@example.com" value={newContact.email} onChange={e => setNewContact({ ...newContact, email: e.target.value })} />
                </div>
                <div>
                  <label className="label">Phone</label>
                  <input style={inputStyle} placeholder="+1 234 567 8900" value={newContact.phone} onChange={e => setNewContact({ ...newContact, phone: e.target.value })} />
                </div>
                <div>
                  <label className="label">Company</label>
                  <input style={inputStyle} placeholder="ABC Corp" value={newContact.company} onChange={e => setNewContact({ ...newContact, company: e.target.value })} />
                </div>
              </div>
              <div style={{ marginBottom: 12 }}>
                <label className="label">Notes</label>
                <input style={inputStyle} placeholder="VIP client, prefers email contact..." value={newContact.notes} onChange={e => setNewContact({ ...newContact, notes: e.target.value })} />
              </div>
              <button onClick={saveContact} disabled={saving} className="btn btn-accent" style={{ fontSize: 13 }}>
                {saving ? 'Saving...' : 'Add Contact →'}
              </button>
            </div>

            {cts.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px', color: 'var(--muted)', fontFamily: 'var(--mono)', fontSize: 13 }}>
                No contacts yet. Add your first customer above.
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
                {cts.map(c => (
                  <div key={c.id as string} style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 12, padding: '16px 20px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                      <div style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--fg)', color: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--serif)', fontSize: 16 }}>
                        {(c.name as string)?.[0]}
                      </div>
                      <button onClick={() => deleteContact(c.id as string)} style={{ background: 'none', border: '1px solid var(--border2)', color: 'var(--muted)', padding: '3px 8px', borderRadius: 6, cursor: 'pointer', fontFamily: 'var(--mono)', fontSize: 10 }}>
                        Remove
                      </button>
                    </div>
                    <div style={{ fontFamily: 'var(--serif)', fontSize: 16, fontWeight: 400, marginBottom: 2 }}>{c.name as string}</div>
                    {c.company && <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 4 }}>{c.company as string}</div>}
                    {c.email && <div style={{ fontSize: 12, color: 'var(--muted)' }}>{c.email as string}</div>}
                    {c.phone && <div style={{ fontSize: 12, color: 'var(--muted)' }}>{c.phone as string}</div>}
                    {c.notes && <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 6, fontStyle: 'italic' }}>{c.notes as string}</div>}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* MEMORY */}
        {activeTab === 'memory' && (
          <div>
            <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 12, padding: 20, marginBottom: 20 }}>
              <p style={{ fontSize: 13, color: 'var(--muted)', lineHeight: 1.7 }}>
                These are facts your agent has learned automatically from your conversations. The agent uses this memory in every response. You can delete any memory that is incorrect.
              </p>
            </div>

            {mem.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px', color: 'var(--muted)', fontFamily: 'var(--mono)', fontSize: 13 }}>
                No memories yet. Chat with your agent and it will start remembering key information automatically.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {mem.map(m => (
                  <div key={m.id as string} style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 10, padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16 }}>
                    <div style={{ flex: 1 }}>
                      <span className="tag" style={{ marginRight: 8 }}>{m.category as string}</span>
                      <span style={{ fontSize: 13, fontWeight: 500 }}>{m.key as string}:</span>
                      <span style={{ fontSize: 13, color: 'var(--muted)', marginLeft: 6 }}>{m.value as string}</span>
                    </div>
                    <button onClick={() => deleteMemory(m.id as string)} style={{ background: 'none', border: '1px solid var(--border2)', color: 'var(--muted)', padding: '3px 8px', borderRadius: 6, cursor: 'pointer', fontFamily: 'var(--mono)', fontSize: 10, flexShrink: 0 }}>
                      Delete
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TEAM */}
        {activeTab === 'team' && (
          <div>
            <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 16, padding: 24, marginBottom: 24 }}>
              <div className="label" style={{ marginBottom: 16 }}>Invite team member</div>
              <p style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 16 }}>
                Invite staff to use this agent. They can chat with the agent and run automations.
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr auto auto', gap: 12, alignItems: 'flex-end' }}>
                <div>
                  <label className="label">Email address</label>
                  <input style={inputStyle} placeholder="staff@yourbusiness.com" value={newTeam.email} onChange={e => setNewTeam({ ...newTeam, email: e.target.value })} />
                </div>
                <div>
                  <label className="label">Role</label>
                  <select style={{ ...inputStyle, width: 'auto' }} value={newTeam.role} onChange={e => setNewTeam({ ...newTeam, role: e.target.value })}>
                    <option value="member">Member</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
                <button onClick={inviteTeam} disabled={saving} className="btn btn-accent" style={{ fontSize: 13 }}>
                  {saving ? 'Inviting...' : 'Invite →'}
                </button>
              </div>
            </div>

            {tm.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px', color: 'var(--muted)', fontFamily: 'var(--mono)', fontSize: 13 }}>
                No team members yet. Invite your staff above.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {tm.map(t => (
                  <div key={t.id as string} style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 12, padding: '14px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--bg3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--muted)' }}>
                        {(t.email as string)?.[0]?.toUpperCase()}
                      </div>
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 500 }}>{t.email as string}</div>
                        <div style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--muted)' }}>{t.role as string} · {t.status as string}</div>
                      </div>
                    </div>
                    <button onClick={() => removeTeam(t.id as string)} style={{ background: 'none', border: '1px solid var(--border2)', color: 'var(--muted)', padding: '4px 10px', borderRadius: 6, cursor: 'pointer', fontFamily: 'var(--mono)', fontSize: 11 }}>
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </>
  )
}