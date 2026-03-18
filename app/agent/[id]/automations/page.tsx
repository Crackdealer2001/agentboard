import { createClient } from '@supabase/supabase-js'
import AutomationsClient from './AutomationsClient'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Automations | AgentBoard',
}

export default async function AutomationsPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const [{ data: agent }, { data: automations }, { data: results }] = await Promise.all([
    supabase.from('business_agents').select('*').eq('id', id).single(),
    supabase.from('scheduled_automations').select('*').eq('business_agent_id', id).order('created_at', { ascending: false }),
    supabase.from('automation_results').select('*').eq('business_agent_id', id).order('ran_at', { ascending: false }).limit(10),
  ])

  if (!agent) return <div style={{ padding: 40, color: '#fff' }}>Agent not found</div>

  return <AutomationsClient agent={agent} automations={automations || []} results={results || []} />
}