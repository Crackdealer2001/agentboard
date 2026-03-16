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

        <div className="app-content">

          <div style={{ marginBottom: 28 }}>
            <h1 style={{ fontSize: 20, fontWeight: 600, letterSpacing: '-0.3px', marginBottom: 4 }}>
              Welcome back{user?.user_metadata?.full_name ? `, ${user.user_metadata.full_name.split(' ')[0]}` : ''}
            </h1>
            <p style={{ fontSize: 13, color: 'var(--fg3)' }}>
              {businessAgents.length === 0
                ? 'Build your first AI agent to get started.'
                : `You have ${businessAgents.length} active AI agent${businessAgents.length > 1 ? 's' : ''}.`}
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 10, marginBottom: 32 }}>
            {[
              { label: 'AI Agents', value: businessAgents.length, color: 'var(--accent)' },
              { label: 'Plan', value: 'Free', color: 'var(--blue)' },
              { label: 'Status', value: 'Active', color: 'var(--green)' },
              { label: 'Member since', value: user?.created_at ? new Date(user.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : '—', color: 'var(--fg2)' },
            ].map(stat => (
              <div key={stat.label} className="card-sm">
                <div style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--fg3)', marginBottom: 6 }}>{stat.label}</div>
                <div style={{ fontSize: 18, fontWeight: 600, color: stat.color }}>{stat.value}</div>
              </div>
            ))}
          </div>

          <div style={{ marginBottom: 12 }}>
            <span className="section-title">My AI Agents</span>
          </div>

          {businessAgents.length === 0 ? (
            <div className="card">
              <div className="empty-state">
                <div className="empty-state-icon">
                  <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                    <circle cx="12" cy="12" r="10"/><path d="M12 8v4l3 3"/>
                  </svg>
                </div>
                <div className="empty-state-title">No agents yet</div>
                <div className="empty-state-desc">Build your first AI agent and put your business on autopilot in minutes.</div>
                <Link href="/builder" className="btn btn-accent" style={{ marginTop: 4 }}>
                  Build first agent →
                </Link>
              </div>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 10 }}>
              {businessAgents.map(ba => (
                <div key={ba.id} className="card" style={{ cursor: 'pointer' }}
                  onClick={() => router.push(`/agent/${ba.id}`)}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                    <div style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--bg4)', border: '1px solid var(--border2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--mono)', fontSize: 13, color: 'var(--fg2)', flexShrink: 0 }}>
                      {ba.agent_name?.[0]}
                    </div>
                    <div style={{ flex: 1, overflow: 'hidden' }}>
                      <div style={{ fontSize: 13, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ba.agent_name}</div>
                      <div style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--fg3)' }}>{ba.industry}</div>
                    </div>
                    <div className="badge badge-green">
                      <span className="status-dot green" />
                      active
                    </div>
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--fg3)', marginBottom: 12 }}>{ba.business_name}</div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 10, borderTop: '1px solid var(--border)' }}>
                    <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--fg3)' }}>
                      {ba.automations?.length || 0} automations
                    </span>
                    <div style={{ display: 'flex', gap: 4 }} onClick={e => e.stopPropagation()}>
                      <Link href={`/agent/${ba.id}/manage`} className="btn btn-ghost btn-sm" style={{ fontSize: 11 }} onClick={e => e.stopPropagation()}>
                        Manage
                      </Link>
                      <button onClick={e => { e.stopPropagation(); setDeleteModal({ id: ba.id, name: ba.agent_name }); setDeleteConfirmText('') }} className="btn btn-ghost btn-sm" style={{ color: 'var(--red)', fontSize: 11 }}>
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}

              <Link href="/builder" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', border: '1px dashed var(--border2)', borderRadius: 8, padding: 24, textDecoration: 'none', color: 'var(--fg3)', gap: 6, transition: 'all 0.15s', minHeight: 120 }}
                onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.borderColor = 'var(--border3)'; (e.currentTarget as HTMLAnchorElement).style.color = 'var(--fg2)' }}
                onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.borderColor = 'var(--border2)'; (e.currentTarget as HTMLAnchorElement).style.color = 'var(--fg3)' }}>
                <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>
                <span style={{ fontFamily: 'var(--mono)', fontSize: 11 }}>New agent</span>
              </Link>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}