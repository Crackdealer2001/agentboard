'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import Sidebar from '@/components/Sidebar'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function DashboardPage() {
  const router = useRouter()
  const [businessAgents, setBusinessAgents] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [deleteModal, setDeleteModal] = useState<{ id: string; name: string } | null>(null)
  const [deleteConfirmText, setDeleteConfirmText] = useState('')
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/auth'); return }
      setUser(user)
      const { data: ba } = await supabase
        .from('business_agents')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
      setBusinessAgents(ba || [])
      setLoading(false)
    }
    load()
  }, [])

  const confirmDelete = async () => {
    if (!deleteModal || deleteConfirmText !== 'delete') return
    setDeleteLoading(true)
    await supabase.from('business_agents').delete().eq('id', deleteModal.id)
    setBusinessAgents(prev => prev.filter(a => a.id !== deleteModal.id))
    setDeleteModal(null)
    setDeleteConfirmText('')
    setDeleteLoading(false)
  }

  if (loading) return (
    <div className="app-layout">
      <Sidebar />
      <main className="app-main">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
          <span style={{ fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--fg3)' }}>Loading...</span>
        </div>
      </main>
    </div>
  )

  return (
    <div className="app-layout">
      <Sidebar />

      {deleteModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <span className="modal-title">Delete agent</span>
              <button onClick={() => { setDeleteModal(null); setDeleteConfirmText('') }} className="btn btn-ghost btn-sm">
                <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M18 6 6 18M6 6l12 12"/></svg>
              </button>
            </div>
            <div className="modal-body">
              <p style={{ fontSize: 13, color: 'var(--fg2)', lineHeight: 1.6, marginBottom: 16 }}>
                You are about to permanently delete <strong style={{ color: 'var(--fg)' }}>{deleteModal.name}</strong>. This will delete all automations, memory, knowledge base, and history. This cannot be undone.
              </p>
              <div className="label">Type <span style={{ color: 'var(--red)' }}>delete</span> to confirm</div>
              <input
                className="input"
                style={{ color: 'var(--red)' }}
                value={deleteConfirmText}
                onChange={e => setDeleteConfirmText(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && confirmDelete()}
                placeholder="delete"
                autoFocus
              />
            </div>
            <div className="modal-footer">
              <button onClick={() => { setDeleteModal(null); setDeleteConfirmText('') }} className="btn btn-outline">Cancel</button>
              <button onClick={confirmDelete} disabled={deleteConfirmText !== 'delete' || deleteLoading} className="btn btn-danger">
                {deleteLoading ? 'Deleting...' : 'Delete permanently'}
              </button>
            </div>
          </div>
        </div>
      )}

      <main className="app-main">
        <div className="app-header">
          <span className="page-title">Dashboard</span>
        </div>

        <div style={{ width: '100%', padding: '32px 40px' }}>

          {/* Welcome banner — full width */}
          <div style={{
            width: '100%',
            background: 'var(--bg2)',
            border: '1px solid var(--border)',
            borderRadius: 12,
            padding: '28px 36px',
            marginBottom: 24,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 16,
          }}>
            <div>
              <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.5px', marginBottom: 6, color: 'var(--fg)' }}>
                Welcome back{user?.user_metadata?.full_name ? `, ${user.user_metadata.full_name.split(' ')[0]}` : ''} 👋
              </div>
              <div style={{ fontSize: 14, color: 'var(--fg3)' }}>
                {businessAgents.length === 0
                  ? 'Build your first AI agent to get started.'
                  : `You have ${businessAgents.length} active AI agent${businessAgents.length > 1 ? 's' : ''} running.`}
              </div>
            </div>
            <Link href="/builder" className="btn btn-accent btn-lg">
              + Build new agent
            </Link>
          </div>

          {/* Stats — full width 4 columns */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: 16,
            marginBottom: 32,
          }}>
            {[
              {
                label: 'AI Agents',
                value: businessAgents.length,
                color: 'var(--accent)',
                icon: <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M12 8v4l3 3"/></svg>,
              },
              {
                label: 'Plan',
                value: 'Free',
                color: 'var(--blue)',
                icon: <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><rect x="1" y="4" width="22" height="16" rx="2"/><path d="M1 10h22"/></svg>,
              },
              {
                label: 'Status',
                value: 'Active',
                color: 'var(--green)',
                icon: <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>,
              },
              {
                label: 'Member since',
                value: user?.created_at ? new Date(user.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : '—',
                color: 'var(--fg2)',
                icon: <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>,
              },
            ].map(stat => (
              <div key={stat.label} style={{
                background: 'var(--bg2)',
                border: '1px solid var(--border)',
                borderRadius: 10,
                padding: '20px 24px',
                display: 'flex',
                alignItems: 'center',
                gap: 16,
              }}>
                <div style={{
                  width: 44, height: 44, borderRadius: 10,
                  background: 'var(--bg3)', border: '1px solid var(--border2)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: stat.color, flexShrink: 0,
                }}>
                  {stat.icon}
                </div>
                <div>
                  <div style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--fg3)', marginBottom: 4 }}>
                    {stat.label}
                  </div>
                  <div style={{ fontSize: 22, fontWeight: 700, color: stat.color, lineHeight: 1 }}>
                    {stat.value}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Agents section — full width */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 16,
          }}>
            <div>
              <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--fg)', marginBottom: 2 }}>My AI Agents</div>
              <div style={{ fontSize: 13, color: 'var(--fg3)' }}>{businessAgents.length} agent{businessAgents.length !== 1 ? 's' : ''} total</div>
            </div>
          </div>

          {businessAgents.length === 0 ? (
            <div style={{
              width: '100%',
              background: 'var(--bg2)',
              border: '1px solid var(--border)',
              borderRadius: 12,
              padding: '80px 40px',
              textAlign: 'center',
            }}>
              <div style={{
                width: 52, height: 52, borderRadius: 12,
                background: 'var(--bg3)', border: '1px solid var(--border2)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'var(--fg3)', margin: '0 auto 20px',
              }}>
                <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="10"/><path d="M12 8v4l3 3"/>
                </svg>
              </div>
              <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--fg2)', marginBottom: 8 }}>No agents yet</div>
              <div style={{ fontSize: 14, color: 'var(--fg3)', marginBottom: 24, maxWidth: 360, margin: '0 auto 24px' }}>
                Build your first AI agent and put your business on autopilot in minutes.
              </div>
              <Link href="/builder" className="btn btn-accent btn-lg">
                Build first agent →
              </Link>
            </div>
          ) : (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
              gap: 16,
            }}>
              {businessAgents.map(ba => (
                <div key={ba.id}
                  style={{
                    background: 'var(--bg2)',
                    border: '1px solid var(--border)',
                    borderRadius: 12,
                    padding: '20px 24px',
                    cursor: 'pointer',
                    transition: 'border-color 0.15s',
                  }}
                  onClick={() => router.push(`/agent/${ba.id}`)}
                  onMouseEnter={e => (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--border3)'}
                  onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--border)'}>

                  {/* Agent header */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16 }}>
                    <div style={{
                      width: 44, height: 44, borderRadius: 10,
                      background: 'var(--bg4)', border: '1px solid var(--border2)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontFamily: 'var(--mono)', fontSize: 18, color: 'var(--fg)', flexShrink: 0, fontWeight: 600,
                    }}>
                      {ba.agent_name?.[0]}
                    </div>
                    <div style={{ flex: 1, overflow: 'hidden' }}>
                      <div style={{ fontSize: 15, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: 2 }}>
                        {ba.agent_name}
                      </div>
                      <div style={{ fontSize: 13, color: 'var(--fg3)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {ba.business_name}
                      </div>
                    </div>
                    <div className="badge badge-green" style={{ flexShrink: 0 }}>
                      <span className="status-dot green" />
                      active
                    </div>
                  </div>

                  {/* Meta row */}
                  <div style={{
                    display: 'flex', gap: 20, marginBottom: 16,
                    padding: '12px 16px',
                    background: 'var(--bg3)', borderRadius: 8,
                    border: '1px solid var(--border)',
                  }}>
                    {[
                      { label: 'Industry', value: ba.industry || '—' },
                      { label: 'Tone', value: ba.tone || '—' },
                      { label: 'Automations', value: ba.automations?.length || 0 },
                    ].map(item => (
                      <div key={item.label} style={{ flex: 1 }}>
                        <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--fg3)', marginBottom: 3, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                          {item.label}
                        </div>
                        <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--fg2)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {item.value}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Actions */}
                  <div style={{
                    display: 'flex', gap: 8,
                    paddingTop: 14, borderTop: '1px solid var(--border)',
                  }} onClick={e => e.stopPropagation()}>
                    <button
                      onClick={() => router.push(`/agent/${ba.id}`)}
                      className="btn btn-primary btn-sm"
                      style={{ flex: 1, fontSize: 12 }}>
                      Open agent
                    </button>
                    <Link
                      href={`/agent/${ba.id}/manage`}
                      className="btn btn-outline btn-sm"
                      style={{ flex: 1, fontSize: 12, textAlign: 'center' }}
                      onClick={e => e.stopPropagation()}>
                      Manage
                    </Link>
                    <Link
                      href={`/agent/${ba.id}/analytics`}
                      className="btn btn-outline btn-sm"
                      style={{ flex: 1, fontSize: 12, textAlign: 'center' }}
                      onClick={e => e.stopPropagation()}>
                      Analytics
                    </Link>
                    <button
                      onClick={e => { e.stopPropagation(); setDeleteModal({ id: ba.id, name: ba.agent_name }); setDeleteConfirmText('') }}
                      className="btn btn-ghost btn-sm"
                      style={{ color: 'var(--red)', fontSize: 12, flexShrink: 0 }}>
                      Delete
                    </button>
                  </div>
                </div>
              ))}

              {/* New agent card */}
              <Link href="/builder" style={{
                display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center',
                border: '1px dashed var(--border2)', borderRadius: 12,
                padding: 32, textDecoration: 'none',
                color: 'var(--fg3)', gap: 10,
                transition: 'all 0.15s', minHeight: 180,
              }}
                onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.borderColor = 'var(--border3)'; (e.currentTarget as HTMLAnchorElement).style.color = 'var(--fg2)' }}
                onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.borderColor = 'var(--border2)'; (e.currentTarget as HTMLAnchorElement).style.color = 'var(--fg3)' }}>
                <div style={{
                  width: 44, height: 44, borderRadius: 10,
                  border: '1px dashed var(--border3)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                    <path d="M12 5v14M5 12h14"/>
                  </svg>
                </div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 500, textAlign: 'center', marginBottom: 4 }}>New agent</div>
                  <div style={{ fontFamily: 'var(--mono)', fontSize: 11, textAlign: 'center' }}>Build in 5 minutes</div>
                </div>
              </Link>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}