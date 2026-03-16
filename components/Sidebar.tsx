'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'

export default function Sidebar() {
  const router = useRouter()
  const pathname = usePathname()
  const [user, setUser] = useState<any>(null)
  const [agents, setAgents] = useState<any[]>([])
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      setUser(user)
      const { data } = await supabase
        .from('business_agents')
        .select('id, agent_name, business_name')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
      setAgents(data || [])
    }
    load()

    const { data: listener } = supabase.auth.onAuthStateChange((_e, session) => {
      if (!session) router.push('/')
    })
    return () => listener.subscription.unsubscribe()
  }, [])

  const signOut = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  const isActive = (path: string) => pathname === path || pathname.startsWith(path + '/')

  const NavItem = ({ href, icon, label, badge }: { href: string; icon: React.ReactNode; label: string; badge?: string }) => (
    <Link href={href} className={`sidebar-item ${isActive(href) ? 'active' : ''}`} onClick={() => setMobileOpen(false)}>
      {icon}
      <span>{label}</span>
      {badge && <span className="sidebar-badge">{badge}</span>}
    </Link>
  )

  const SidebarContent = () => (
    <>
      <Link href="/dashboard" className="sidebar-logo">
        <div className="sidebar-logo-mark">A</div>
        <span className="sidebar-logo-text">AgentBoard</span>
      </Link>

      <div className="sidebar-section">
        <div className="sidebar-section-label">Main</div>
        <NavItem href="/dashboard" label="Dashboard" icon={<svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>} />
        <NavItem href="/builder" label="Build agent" icon={<svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M12 8v4l3 3"/></svg>} />
        <NavItem href="/documents" label="Documents" icon={<svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/></svg>} />

        {agents.length > 0 && (
          <>
            <div className="sidebar-section-label" style={{ marginTop: 8 }}>My Agents</div>
            {agents.map(agent => (
              <Link key={agent.id} href={`/agent/${agent.id}`} className={`sidebar-item ${pathname.includes(agent.id) ? 'active' : ''}`} onClick={() => setMobileOpen(false)}>
                <div style={{ width: 18, height: 18, borderRadius: 4, background: 'var(--bg4)', border: '1px solid var(--border2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontFamily: 'var(--mono)', flexShrink: 0 }}>
                  {agent.agent_name?.[0]}
                </div>
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{agent.agent_name}</span>
              </Link>
            ))}
          </>
        )}

        <div className="sidebar-section-label" style={{ marginTop: 8 }}>Account</div>
        <NavItem href="/settings" label="Settings" icon={<svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>} />
      </div>

      <div className="sidebar-bottom">
        {user && (
          <div className="sidebar-user" onClick={signOut} title="Sign out">
            <div className="sidebar-avatar">{user.email?.[0]?.toUpperCase()}</div>
            <div style={{ flex: 1, overflow: 'hidden' }}>
              <div style={{ fontSize: 12, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {user.user_metadata?.full_name || user.email?.split('@')[0]}
              </div>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--fg3)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {user.email}
              </div>
            </div>
            <svg width="14" height="14" fill="none" stroke="var(--fg3)" strokeWidth="1.5" viewBox="0 0 24 24" style={{ flexShrink: 0 }}>
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/>
            </svg>
          </div>
        )}
      </div>
    </>
  )

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="app-sidebar">
        <SidebarContent />
      </aside>

      {/* Mobile header */}
      <div style={{
        display: 'none', position: 'fixed', top: 0, left: 0, right: 0,
        height: 48, background: 'var(--bg2)', borderBottom: '1px solid var(--border)',
        alignItems: 'center', padding: '0 16px', justifyContent: 'space-between',
        zIndex: 60,
      }} className="mobile-header">
        <Link href="/dashboard" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none' }}>
          <div className="sidebar-logo-mark">A</div>
          <span className="sidebar-logo-text">AgentBoard</span>
        </Link>
        <button onClick={() => setMobileOpen(!mobileOpen)} className="btn btn-ghost btn-sm">
          {mobileOpen
            ? <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M18 6 6 18M6 6l12 12"/></svg>
            : <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M3 12h18M3 6h18M3 18h18"/></svg>
          }
        </button>
      </div>

      {/* Mobile sidebar overlay */}
      {mobileOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 55 }} onClick={() => setMobileOpen(false)}>
          <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 260, background: 'var(--bg2)', borderRight: '1px solid var(--border)' }} onClick={e => e.stopPropagation()}>
            <SidebarContent />
          </div>
        </div>
      )}

      <style>{`
        @media (max-width: 768px) {
          .app-sidebar { display: none !important; }
          .mobile-header { display: flex !important; }
          .app-main { margin-left: 0 !important; padding-top: 48px; }
        }
      `}</style>
    </>
  )
}