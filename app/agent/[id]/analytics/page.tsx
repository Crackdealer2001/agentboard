import { createClient } from '@supabase/supabase-js'
import AnalyticsClient from './AnalyticsClient'

export default async function AnalyticsPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const [{ data: agent }, { data: runs }, { data: documents }, { data: contacts }, { data: knowledge }] = await Promise.all([
    supabase.from('business_agents').select('*').eq('id', id).single(),
    supabase.from('automation_runs').select('*').eq('business_agent_id', id).order('created_at', { ascending: false }).limit(100),
    supabase.from('documents').select('*').eq('agent_id', id).order('created_at', { ascending: false }),
    supabase.from('contacts').select('*').eq('business_agent_id', id),
    supabase.from('knowledge_base').select('*').eq('business_agent_id', id),
  ])

  if (!agent) return <div style={{ padding: 40, color: '#fff' }}>Agent not found</div>

  return (
    <AnalyticsClient
      agent={agent}
      runs={runs || []}
      documents={documents || []}
      contacts={contacts || []}
      knowledge={knowledge || []}
    />
  )
}