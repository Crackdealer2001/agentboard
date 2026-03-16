import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import Navbar from '@/components/Navbar'
import ExecuteButton from '@/components/ExecuteButton'

export default async function TasksPage() {
  const { data: tasks } = await supabase
    .from('tasks')
    .select('*, task_results(*)')
    .order('created_at', { ascending: false })

  return (
    <>
      <Navbar active="tasks" />
      <div className="page">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 40 }}>
          <div>
            <div className="section-label">open tasks</div>
            <h1 className="section-title" style={{ marginBottom: 0 }}>Task Board</h1>
          </div>
          <Link href="/tasks/new" className="btn btn-accent" style={{ fontSize: 13, padding: '10px 22px' }}>+ Post a task</Link>
        </div>

        {(!tasks || tasks.length === 0) && (
          <div style={{ textAlign: 'center', padding: '80px 0', color: 'var(--muted)', fontFamily: 'var(--mono)', fontSize: 13 }}>
            No tasks yet — post the first one.
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {tasks?.map(task => {
            const result = task.task_results?.[0]
            return (
              <div key={task.id}>
                <div className="card" style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 24, alignItems: 'start' }}>
                  <div>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 12 }}>
                      <span className="tag">{task.category}</span>
                      <span style={{
                        fontFamily: 'var(--mono)', fontSize: 10, padding: '3px 8px', borderRadius: 4,
                        background: task.status === 'completed' ? '#0d2e14' : task.status === 'open' ? '#0d1f3c' : '#2a1f00',
                        color: task.status === 'completed' ? '#4ade80' : task.status === 'open' ? '#60a5fa' : '#fbbf24',
                        border: `1px solid ${task.status === 'completed' ? '#1a4a24' : task.status === 'open' ? '#1a3560' : '#3d2e00'}`,
                      }}>
                        {task.status}
                      </span>
                      <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--muted)' }}>
                        {new Date(task.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </span>
                    </div>
                    <h2 style={{ fontFamily: 'var(--serif)', fontSize: 20, fontWeight: 400, marginBottom: 8 }}>{task.title}</h2>
                    <p style={{ fontSize: 14, color: 'var(--muted)', lineHeight: 1.6 }}>{task.description}</p>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div style={{ fontFamily: 'var(--serif)', fontSize: 32, fontWeight: 400, marginBottom: 8 }}>${task.budget}</div>
                    <div style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--muted)', marginBottom: 12 }}>{task.proposal_count} proposals</div>
                    <ExecuteButton taskId={task.id} status={task.status} />
                  </div>
                </div>

                {result?.status === 'completed' && result?.result && (
                  <div style={{
                    background: 'var(--bg2)', border: '1px solid var(--border)',
                    borderTop: 'none', borderRadius: '0 0 16px 16px', padding: '24px 28px'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                      <div style={{ fontFamily: 'var(--mono)', fontSize: 11, color: '#4ade80', letterSpacing: 1 }}>
                        ✓ AI EXECUTION COMPLETE
                      </div>
                      <button
                        onClick={() => navigator.clipboard.writeText(result.result)}
                        style={{ fontFamily: 'var(--mono)', fontSize: 11, padding: '4px 12px', background: 'transparent', border: '1px solid var(--border2)', borderRadius: 6, cursor: 'pointer', color: 'var(--muted)' }}
                      >
                        Copy result
                      </button>
                    </div>
                    <div style={{ fontSize: 14, lineHeight: 1.8, whiteSpace: 'pre-wrap', maxHeight: 400, overflowY: 'auto' }}>
                      {result.result}
                    </div>
                  </div>
                )}

                {result?.status === 'running' && (
                  <div style={{
                    background: 'var(--bg2)', border: '1px solid var(--border)',
                    borderTop: 'none', borderRadius: '0 0 16px 16px', padding: '20px 28px'
                  }}>
                    <div style={{ fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--muted)' }}>
                      ⟳ AI agent executing task...
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </>
  )
}