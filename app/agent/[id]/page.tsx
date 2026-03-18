import { createClient } from '@supabase/supabase-js'
import AgentClient from './AgentClient'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Agent | AgentBoard',
}

export default async function AgentPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data: agent } = await supabase
    .from('business_agents')
    .select('*')
    .eq('id', id)
    .single()

  if (!agent) return <div style={{ padding: 40, color: '#fff' }}>Agent not found</div>

  return <AgentClient agent={agent} />
}