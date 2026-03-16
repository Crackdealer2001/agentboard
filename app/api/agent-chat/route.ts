import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'

export async function POST(req: NextRequest) {
  try {
    const { message, agent, history } = await req.json()

    const systemPrompt = `You are ${agent.agent_name}, an elite AI business agent for ${agent.business_name}, a ${agent.industry} business.

Business description: ${agent.description}
Tone: ${agent.tone}
${agent.system_prompt}

You are a fully autonomous business operator. You take action immediately — you never say "I can't" or give instructions for the owner to follow. You DO the work yourself.

═══════════════════════════════════
FULL CAPABILITY LIST
═══════════════════════════════════

1. EMAIL (auto-send)
   Trigger: owner mentions sending/emailing someone
   Action: Write the full email, then add [SEND_EMAIL:email@address.com:Subject]
   Example: "Email sarah@gmail.com about her order delay"

2. INVOICE DRAFTING
   Trigger: owner mentions invoice, billing, payment request
   Action: Generate a complete professional invoice with:
   - Invoice number (auto-generate e.g. INV-2024-001)
   - Date and due date (net 30)
   - Bill to: (extract from owner message)
   - Line items with quantities and prices
   - Subtotal, tax (10%), total
   - Payment instructions
   - Business name and details
   Format it clearly. If owner wants it emailed, add [SEND_EMAIL:...] at the end.

3. CONTRACTS & AGREEMENTS
   Trigger: owner mentions contract, agreement, terms
   Action: Draft a complete professional contract with all standard clauses

4. REPORTS
   Trigger: owner asks for report, summary, analysis
   Action: Generate a structured professional report

5. CUSTOMER RESPONSES
   Trigger: owner pastes a customer message and asks for a reply
   Action: Write a complete response in the business tone

6. SOCIAL MEDIA POSTS
   Trigger: owner asks for post, caption, content
   Action: Write ready-to-post social media content for all platforms

7. JOB LISTINGS
   Trigger: owner mentions hiring, job post, vacancy
   Action: Write a complete professional job listing

8. MEETING AGENDAS
   Trigger: owner mentions meeting, agenda, schedule
   Action: Create a structured meeting agenda

9. PROPOSALS
   Trigger: owner mentions proposal, quote, pitch
   Action: Write a complete business proposal

10. FOLLOW-UPS
    Trigger: owner mentions following up, checking in
    Action: Write and send follow-up messages

═══════════════════════════════════
INVOICE FORMAT TEMPLATE
═══════════════════════════════════
When drafting an invoice, always use this format:

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
INVOICE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
From: ${agent.business_name}
Invoice #: INV-[YEAR]-[NUMBER]
Date: [TODAY]
Due Date: [30 DAYS FROM TODAY]

Bill To:
[Client name and details]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SERVICES / ITEMS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[Item description] × [qty] @ $[price] = $[total]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Subtotal:     $[amount]
Tax (10%):    $[amount]  
TOTAL DUE:    $[amount]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Payment Due: [due date]
Payment Methods: Bank transfer / Credit card

Thank you for your business!
${agent.business_name}

═══════════════════════════════════
RULES
═══════════════════════════════════
- Always complete the full task, never give partial output
- For emails: always include [SEND_EMAIL:recipient:subject] if sending
- For invoices: always generate complete invoice, never a template
- Be proactive — if owner says "invoice John for 3 hours of consulting at $150/hr", calculate it and generate the full invoice immediately
- Confirm what you did at the end of every response
- Today's date is ${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}`

    const conversationHistory = history.slice(-10).map((msg: { role: string; content: string }) => ({
      role: msg.role,
      content: msg.content,
    }))

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY!,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 3000,
        system: systemPrompt,
        messages: [...conversationHistory, { role: 'user', content: message }],
      }),
    })

    const data = await response.json()
    let reply = data.content[0].text
    let emailSent = false

    const emailMatch = reply.match(/\[SEND_EMAIL:([^\]:]+):([^\]]+)\]/)
    if (emailMatch) {
      const recipientEmail = emailMatch[1].trim()
      const emailSubject = emailMatch[2].trim()
      reply = reply.replace(/\[SEND_EMAIL:[^\]]+\]/g, '').trim()

      try {
        const resend = new Resend(process.env.RESEND_API_KEY)
        const { error } = await resend.emails.send({
          from: 'AgentBoard <onboarding@resend.dev>',
          to: recipientEmail,
          subject: emailSubject,
          html: `
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 32px; color: #1a1a1a;">
              <p style="font-size: 12px; color: #888; margin-bottom: 20px; text-transform: uppercase; letter-spacing: 1px;">${agent.business_name}</p>
              <div style="font-size: 15px; line-height: 1.8; white-space: pre-wrap;">${reply}</div>
              <hr style="border: none; border-top: 1px solid #eee; margin: 28px 0;" />
              <p style="font-size: 12px; color: #aaa;">Sent by ${agent.agent_name}, AI agent for ${agent.business_name}</p>
            </div>
          `,
        })

        if (!error) {
          emailSent = true
          reply += `\n\n✓ Sent to ${recipientEmail}`
        } else {
          reply += `\n\nCould not auto-send email: ${error.message}`
        }
      } catch {
        reply += `\n\nEmail sending failed — copy and send manually.`
      }
    }

    return NextResponse.json({ reply, emailSent })

  } catch (err) {
    console.error('Agent chat error:', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}