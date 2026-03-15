'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import Navbar from '@/components/Navbar'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function DashboardPage() {
  const router = useRouter()
  const [agents, setAgents] = useState<any[]>([])
  const [tasks, setTasks] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/auth'); return }

      const [{ data: a }, { data: t }] = await Promise.all([
        supabase.from('agents').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
        supabase.from('tasks').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
      ])

      setAgents(a || [])
      setTasks(t || [])
      setLoading(false)
    }
    load()
  }, [])

  if (loading) return (
    <>
      <Navbar active="dashboard" />
      <div className="page" style={{ textAlign: 'center', paddingTop: 80 }}>
        <p style={{ fontFamily: 'var(--mono)', fontSize: 13, color: 'var(--muted)' }}>Loading...</p>
      </div>
    </>
  )

  return (
    <>
      <Navbar active="dashboard" />
      <div className="page">
        <div style={{ marginBottom: 48 }}>
          <div className="section-label">account</div>
          <h1 style={{ fontFamily: 'var(--serif)', fontSize: 48, fontWeight: 400, marginBottom: 8 }}>My Dashboard</h1>
          <p style={{ color: 'var(--muted)', fontSize: 15 }}>Your listed agents and posted tasks.</p>
        </div>

        {/* My Agents */}
        <div style={{ marginBottom: 56 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
            <h2 style={{ fontFamily: 'var(--serif)', fontSize: 28, fontWeight: 400 }}>My Agents</h2>
            <Link href="/agents/new" className="btn btn-accent" style={{ fontSize: 12, padding: '8px 18px' }}>+ List agent</Link>
          </div>

          {agents.length === 0 ? (
            <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 16, padding: 40, textAlign: 'center' }}>
              <p style={{ color: 'var(--muted)', fontFamily: 'var(--mono)', fontSize: 13, marginBottom: 16 }}>You haven't listed any agents yet.</p>
              <Link href="/agents/new" className="btn btn-outline" style={{ fontSize: 13 }}>List your first agent →</Link>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
              {agents.map(agent => (
                <div key={agent.id} className="card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                    <span className="tag">{agent.category}</span>
                    <span style={{ fontFamily: 'var(--mono)', fontSize: 10, padding: '3px 8px', borderRadius: 4, background: '#0d2e14', color: '#4ade80', border: '1px solid #1a4a24' }}>active</span>
                  </div>
                  <h3 style={{ fontFamily: 'var(--serif)', fontSize: 18, fontWeight: 400, marginBottom: 6 }}>{agent.name}</h3>
                  <p style={{ fontSize: 13, color: 'var(--muted)', lineHeight: 1.5, marginBottom: 16 }}>{agent.description}</p>
                  <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 14, borderTop: '1px solid var(--border)' }}>
                    <span style={{ fontFamily: 'var(--mono)', fontSize: 13, fontWeight: 500 }}>{agent.price_label}</span>
                    <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--muted)' }}>★ {agent.rating || '—'}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <hr className="divider" />

        {/* My Tasks */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
            <h2 style={{ fontFamily: 'var(--serif)', fontSize: 28, fontWeight: 400 }}>My Tasks</h2>
            <Link href="/tasks/new" className="btn btn-accent" style={{ fontSize: 12, padding: '8px 18px' }}>+ Post task</Link>
          </div>

          {tasks.length === 0 ? (
            <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 16, padding: 40, textAlign: 'center' }}>
              <p style={{ color: 'var(--muted)', fontFamily: 'var(--mono)', fontSize: 13, marginBottom: 16 }}>You haven't posted any tasks yet.</p>
              <Link href="/tasks/new" className="btn btn-outline" style={{ fontSize: 13 }}>Post your first task →</Link>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {tasks.map(task => (
                <div key={task.id} className="card" style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 24, alignItems: 'center' }}>
                  <div>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 10 }}>
                      <span className="tag">{task.category}</span>
                      <span style={{ fontFamily: 'var(--mono)', fontSize: 10, padding: '3px 8px', borderRadius: 4, background: '#0d2e14', color: '#4ade80', border: '1px solid #1a4a24' }}>
                        {task.status}
                      </span>
                      <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--muted)' }}>
                        {new Date(task.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </span>
                    </div>
                    <h3 style={{ fontFamily: 'var(--serif)', fontSize: 18, fontWeight: 400, marginBottom: 6 }}>{task.title}</h3>
                    <p style={{ fontSize: 13, color: 'var(--muted)', lineHeight: 1.5 }}>{task.description}</p>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div style={{ fontFamily: 'var(--serif)', fontSize: 28, fontWeight: 400, marginBottom: 4 }}>${task.budget}</div>
                    <div style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--muted)' }}>{task.proposal_count} proposals</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  )
}