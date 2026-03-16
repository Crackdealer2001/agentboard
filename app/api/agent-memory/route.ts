import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(req: NextRequest) {
  try {
    const { businessAgentId, memories } = await req.json()

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    for (const memory of memories) {
      await supabase.from('agent_memory').upsert({
        business_agent_id: businessAgentId,
        category: memory.category,
        key: memory.key,
        value: memory.value,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'business_agent_id,key' })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const businessAgentId = searchParams.get('businessAgentId')

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    const { data } = await supabase
      .from('agent_memory')
      .select('*')
      .eq('business_agent_id', businessAgentId)
      .order('updated_at', { ascending: false })

    return NextResponse.json({ memories: data || [] })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}