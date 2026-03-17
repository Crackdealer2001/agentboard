import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { agent_id, portal_enabled, portal_color, portal_tagline, portal_greeting, portal_avatar_url } = body

    if (!agent_id) return NextResponse.json({ error: 'Missing agent_id' }, { status: 400 })

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { data, error } = await supabase
      .from('business_agents')
      .update({ portal_enabled, portal_color, portal_tagline, portal_greeting, portal_avatar_url, })
      .eq('id', agent_id)
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({ data })
  } catch (err) {
    console.error('Portal settings error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}