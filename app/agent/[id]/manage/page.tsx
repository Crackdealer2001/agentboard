import { createClient } from '@supabase/supabase-js'
import ManageClient from './ManageClient'

export default async function ManagePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const [{ data: agent }, { data: knowledge }, { data: contacts }, { data: memories }, { data: team }] = await Promise.all([
    supabase.from('business_agents').select('*').eq('id', id).single(),
    supabase.from('knowledge_base').select('*').eq('business_agent_id', id).order('created_at', { ascending: false }),
    supabase.from('contacts').select('*').eq('business_agent_id', id).order('created_at', { ascending: false }),
    supabase.from('agent_memory').select('*').eq('business_agent_id', id).order('updated_at', { ascending: false }),
    supabase.from('team_members').select('*').eq('business_agent_id', id).order('invited_at', { ascending: false }),
  ])

  if (!agent) return <div style={{ padding: 40, color: '#fff' }}>Agent not found</div>

  return <ManageClient agent={agent} knowledge={knowledge || []} contacts={contacts || []} memories={memories || []} team={team || []} />
}