import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization')
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    const now = new Date().toISOString()
    const { data: dueAutomations } = await supabase
      .from('scheduled_automations')
      .select('*')
      .eq('enabled', true)
      .lte('next_run', now)

    if (!dueAutomations?.length) {
      return NextResponse.json({ message: 'No automations due', count: 0 })
    }

    const results = []
    for (const automation of dueAutomations) {
      const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/run-automation`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ automationId: automation.id }),
      })
      const data = await res.json()
      results.push({ id: automation.id, name: automation.name, success: data.success })
    }

    return NextResponse.json({ message: 'Automations run', count: results.length, results })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}