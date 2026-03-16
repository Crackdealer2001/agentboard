'use client'
import { useState } from 'react'
import Navbar from '@/components/Navbar'
import { useRouter } from 'next/navigation'

export default function AnalyticsClient({
  agent, runs, documents, contacts, memories, events, knowledge, teamMembers
}: {
  agent: Record<string, unknown>
  runs: Record<string, unknown>[]
  documents: Record<string, unknown>[]
  contacts: Record<string, unknown>[]
  memories: Record<string, unknown>[]
  events: Record<string, unknown>[]
  knowledge: Record<string, unknown>[]
  teamMembers: Record<string, unknown>[]
}) {
  const router = useRouter()
  const [period, setPeriod] = useState<'7' | '30' | 'all'>('30')

  const now = new Date()
  const cutoff = period === 'all' ? new Date(0) : new Date(now.getTime() - parseInt(period) * 86400000)

  const filteredRuns = runs.filter(r => new Date(r.created_at as string) >= cutoff)
  const filteredDocs = documents.filter(d => new Date(d.created_at as string) >= cutoff)

  // Document type breakdown
  const docTypes = documents.reduce((acc: Record<string, number>, doc) => {
    const type = doc.type as string || 'OTHER'
    acc[type] = (acc[type] || 0) + 1
    return acc
  }, {})

  // Activity by day (last 30 days)
  const getDailyActivity = () => {
    const days: Record<string, number> = {}
    const daysToShow = period === '7' ? 7 : 30
    for (let i = daysToShow - 1; i >= 0; i--) {
      const d = new Date()
      d.setDate(d.getDate() - i)
      const key = d.toISOString().split('T')[0]
      days[key] = 0
    }
    filteredRuns.forEach(r => {
      const key = (r.created_at as string).split('T')[0]
      if (days[key] !== undefined) days[key]++
    })
    return Object.entries(days).map(([date, count]) => ({ date, count }))
  }

  const dailyActivity = getDailyActivity()
  const maxActivity = Math.max(...dailyActivity.map(d => d.count), 1)

  // Most used actions
  const actionCounts = runs.reduce((acc: Record<string, number>, run) => {
    const input = (run.input as string) || ''
    let action = 'Custom task'
    if (input.toLowerCase().includes('invoice')) action = 'Invoice'
    else if (input.toLowerCase().includes('contract')) action = 'Contract'
    else if (input.toLowerCase().includes('email')) action = 'Email'
    else if (input.toLowerCase().includes('proposal')) action = 'Proposal'
    else if (input.toLowerCase().includes('report')) action = 'Report'
    else if (input.toLowerCase().includes('social')) action = 'Social media'
    else if (input.toLowerCase().includes('complaint')) action = 'Complaint'
    else if (input.toLowerCase().includes('meeting')) action = 'Meeting'
    acc[action] = (acc[action] || 0) + 1
    return acc
  }, {})
  const topActions = Object.entries(actionCounts).sort((a, b) => b[1] - a[1]).slice(0, 5)
  const maxActionCount = Math.max(...topActions.map(a => a[1]), 1)

  // Upcoming events
  const upcomingEvents = events
    .filter(e => (e.event_date as string) >= now.toISOString().split('T')[0])
    .slice(0, 3)

  const statCards = [
    { label: 'Total messages', value: runs.length, sub: `${filteredRuns.length} this period`, icon: <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>, color: '#3b82f6' },
    { label: 'Documents created', value: documents.length, sub: `${filteredDocs.length} this period`, icon: <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/></svg>, color: '#8b5cf6' },
    { label: 'Contacts', value: contacts.length, sub: 'In your CRM', icon: <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></svg>, color: '#10b981' },
    { label: 'Calendar events', value: events.length, sub: `${upcomingEvents.length} upcoming`, icon: <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>, color: '#f59e0b' },
    { label: 'Knowledge base', value: knowledge.length, sub: 'Entries stored', icon: <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>, color: '#ec4899' },
    { label: 'Memories learned', value: memories.length, sub: 'Auto-learned facts', icon: <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path d="M12 2a10 10 0 1 0 10 10"/><path d="M12 6v6l4 2"/></svg>, color: '#c8f135' },
  ]

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr)
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  return (
    <>
      <Navbar />
      <div style={{ maxWidth: 1000, margin: '0 auto', padding: '32px 24px' }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
          <div>
            <div style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--muted)', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 8 }}>Analytics</div>
            <h1 style={{ fontFamily: 'var(--serif)', fontSize: 36, fontWeight: 400, marginBottom: 4 }}>{agent.agent_name as string}</h1>
            <p style={{ fontSize: 14, color: 'var(--muted)' }}>{agent.business_name as string} · {agent.industry as string}</p>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => router.push(`/agent/${agent.id as string}`)} className="btn btn-outline" style={{ fontSize: 12 }}>← Back to Agent</button>
          </div>
        </div>

        {/* Period selector */}
        <div style={{ display: 'flex', gap: 6, marginBottom: 32, background: 'var(--bg2)', padding: 4, borderRadius: 10, border: '1px solid var(--border)', width: 'fit-content' }}>
          {[{ value: '7', label: 'Last 7 days' }, { value: '30', label: 'Last 30 days' }, { value: 'all', label: 'All time' }].map(p => (
            <button key={p.value} onClick={() => setPeriod(p.value as '7' | '30' | 'all')}
              style={{ fontFamily: 'var(--mono)', fontSize: 11, padding: '7px 16px', borderRadius: 7, border: 'none', cursor: 'pointer', background: period === p.value ? 'var(--fg)' : 'transparent', color: period === p.value ? 'var(--bg)' : 'var(--muted)', transition: 'all 0.15s' }}>
              {p.label}
            </button>
          ))}
        </div>

        {/* Stat cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16, marginBottom: 32 }}>
          {statCards.map(card => (
            <div key={card.label} style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 16, padding: '20px 24px', display: 'flex', gap: 16, alignItems: 'flex-start' }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: `${card.color}18`, border: `1px solid ${card.color}33`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: card.color, flexShrink: 0 }}>
                {card.icon}
              </div>
              <div>
                <div style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--muted)', marginBottom: 4 }}>{card.label}</div>
                <div style={{ fontFamily: 'var(--serif)', fontSize: 32, fontWeight: 400, lineHeight: 1, marginBottom: 4 }}>{card.value}</div>
                <div style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--muted)' }}>{card.sub}</div>
              </div>
            </div>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 24 }}>

          {/* Activity chart */}
          <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 16, padding: '24px' }}>
            <div style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--muted)', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 20 }}>
              Daily activity
            </div>
            {filteredRuns.length === 0 ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 120, color: 'var(--muted)', fontFamily: 'var(--mono)', fontSize: 12 }}>
                No activity yet
              </div>
            ) : (
              <div>
                <div style={{ display: 'flex', alignItems: 'flex-end', gap: 3, height: 100, marginBottom: 8 }}>
                  {dailyActivity.map(({ date, count }) => (
                    <div key={date} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, height: '100%', justifyContent: 'flex-end' }}>
                      <div
                        title={`${formatDate(date)}: ${count} messages`}
                        style={{
                          width: '100%', borderRadius: '3px 3px 0 0',
                          background: count > 0 ? 'var(--accent)' : 'var(--border)',
                          height: `${Math.max((count / maxActivity) * 100, count > 0 ? 8 : 2)}%`,
                          opacity: count > 0 ? 1 : 0.3,
                          transition: 'height 0.3s',
                          cursor: 'pointer',
                        }}
                      />
                    </div>
                  ))}
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--muted)' }}>
                  <span>{formatDate(dailyActivity[0]?.date)}</span>
                  <span>{formatDate(dailyActivity[Math.floor(dailyActivity.length / 2)]?.date)}</span>
                  <span>{formatDate(dailyActivity[dailyActivity.length - 1]?.date)}</span>
                </div>
              </div>
            )}
          </div>

          {/* Top actions */}
          <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 16, padding: '24px' }}>
            <div style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--muted)', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 20 }}>
              Most used actions
            </div>
            {topActions.length === 0 ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 120, color: 'var(--muted)', fontFamily: 'var(--mono)', fontSize: 12 }}>
                No actions yet
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {topActions.map(([action, count]) => (
                  <div key={action}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                      <span style={{ fontSize: 13 }}>{action}</span>
                      <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--muted)' }}>{count}</span>
                    </div>
                    <div style={{ height: 4, background: 'var(--border)', borderRadius: 2, overflow: 'hidden' }}>
                      <div style={{ height: '100%', background: 'var(--accent)', borderRadius: 2, width: `${(count / maxActionCount) * 100}%`, transition: 'width 0.5s' }} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 24 }}>

          {/* Document breakdown */}
          <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 16, padding: '24px' }}>
            <div style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--muted)', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 20 }}>
              Documents by type
            </div>
            {Object.keys(docTypes).length === 0 ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 80, color: 'var(--muted)', fontFamily: 'var(--mono)', fontSize: 12 }}>
                No documents yet
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {Object.entries(docTypes).sort((a, b) => b[1] - a[1]).map(([type, count]) => {
                  const colors: Record<string, string> = { INVOICE: '#10b981', CONTRACT: '#3b82f6', PROPOSAL: '#8b5cf6', REPORT: '#f59e0b', 'MEETING AGENDA': '#ec4899', 'JOB LISTING': '#6b7280' }
                  const color = colors[type] || '#c8f135'
                  return (
                    <div key={type} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: 'var(--bg3)', borderRadius: 8, borderLeft: `3px solid ${color}` }}>
                      <span style={{ fontFamily: 'var(--mono)', fontSize: 12 }}>{type}</span>
                      <span style={{ fontFamily: 'var(--mono)', fontSize: 12, color, fontWeight: 600 }}>{count}</span>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Recent activity feed */}
          <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 16, padding: '24px' }}>
            <div style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--muted)', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 20 }}>
              Recent activity
            </div>
            {runs.length === 0 ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 80, color: 'var(--muted)', fontFamily: 'var(--mono)', fontSize: 12 }}>
                No activity yet
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {[...runs].reverse().slice(0, 5).map((run, i) => {
                  const timeAgo = () => {
                    const s = Math.floor((new Date().getTime() - new Date(run.created_at as string).getTime()) / 1000)
                    if (s < 60) return 'just now'
                    if (s < 3600) return `${Math.floor(s / 60)}m ago`
                    if (s < 86400) return `${Math.floor(s / 3600)}h ago`
                    return `${Math.floor(s / 86400)}d ago`
                  }
                  return (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
                      <div style={{ fontSize: 12, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginRight: 12 }}>
                        {(run.input as string)?.slice(0, 45)}{(run.input as string)?.length > 45 ? '...' : ''}
                      </div>
                      <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--muted)', flexShrink: 0 }}>{timeAgo()}</div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        {/* Agent health */}
        <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 16, padding: '24px', marginBottom: 24 }}>
          <div style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--muted)', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 20 }}>
            Agent setup health
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12 }}>
            {[
              { label: 'Knowledge base', done: knowledge.length > 0, value: `${knowledge.length} entries`, action: 'Add pricing & FAQs' },
              { label: 'Contacts imported', done: contacts.length > 0, value: `${contacts.length} contacts`, action: 'Import customer list' },
              { label: 'Memory active', done: memories.length > 0, value: `${memories.length} facts learned`, action: 'Start chatting to build memory' },
              { label: 'Calendar connected', done: events.length > 0, value: `${events.length} events`, action: 'Schedule first meeting' },
              { label: 'Team invited', done: teamMembers.length > 0, value: `${teamMembers.length} members`, action: 'Invite your staff' },
              { label: 'Agent active', done: runs.length > 0, value: `${runs.length} tasks run`, action: 'Start using your agent' },
            ].map(item => (
              <div key={item.label} style={{ padding: '14px 16px', background: item.done ? '#0d2e14' : 'var(--bg3)', border: `1px solid ${item.done ? '#1a4a24' : 'var(--border)'}`, borderRadius: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <div style={{ width: 16, height: 16, borderRadius: '50%', background: item.done ? '#4ade80' : 'var(--border2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    {item.done && <svg width="10" height="10" fill="none" stroke="#0a0a0a" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M20 6 9 17l-5-5"/></svg>}
                  </div>
                  <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: item.done ? '#4ade80' : 'var(--muted)' }}>{item.label}</span>
                </div>
                <div style={{ fontSize: 12, color: item.done ? 'var(--fg)' : 'var(--muted)', paddingLeft: 24 }}>
                  {item.done ? item.value : item.action}
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </>
  )
}