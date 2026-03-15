import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import Navbar from '@/components/Navbar'

export default async function TasksPage() {
  const { data: tasks } = await supabase
    .from('tasks')
    .select('*')
    .eq('status', 'open')
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
            No open tasks yet — post the first one.
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {tasks?.map(task => (
            <div key={task.id} className="card" style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 24, alignItems: 'center' }}>
              <div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 12 }}>
                  <span className="tag">{task.category}</span>
                  <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--muted)' }}>
                    {new Date(task.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </span>
                </div>
                <h2 style={{ fontFamily: 'var(--serif)', fontSize: 20, fontWeight: 400, marginBottom: 8 }}>{task.title}</h2>
                <p style={{ fontSize: 14, color: 'var(--muted)', lineHeight: 1.6 }}>{task.description}</p>
              </div>
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <div style={{ fontFamily: 'var(--serif)', fontSize: 32, fontWeight: 400, marginBottom: 4 }}>${task.budget}</div>
                <div style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--muted)', marginBottom: 12 }}>{task.proposal_count} proposals</div>
                <Link href="/auth" className="btn btn-dark" style={{ fontSize: 12 }}>Apply →</Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  )
}