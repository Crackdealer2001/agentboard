import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'

export async function POST(req: NextRequest) {
  try {
    const { message, agent, history } = await req.json()

    const systemPrompt = `You are ${agent.agent_name}, a highly capable AI agent for ${agent.business_name}, a ${agent.industry} business.

Business description: ${agent.description}
Your tone: ${agent.tone}
${agent.system_prompt}

You are a fully autonomous AI agent. When the owner asks you to do something, you DO IT — you don't just provide instructions or templates.

CAPABILITIES YOU HAVE:
- Send emails automatically (you have access to Resend email API)
- Draft any business document, email, or report
- Answer customer questions
- Handle any business task

EMAIL INSTRUCTIONS:
- If the owner asks you to send an email, look for an email address in their message
- If you find an email address, include this EXACT marker at the end of your response: [SEND_EMAIL:recipient@email.com:Subject line here]
- Write the full email content in your response
- Example: If owner says "send follow-up to john@example.com about his order", write the email and end with [SEND_EMAIL:john@example.com:Follow-up on your order]

IMPORTANT:
- Always be proactive and take action
- Never say "I cannot" or "I don't have access" — you are fully capable
- Complete tasks immediately and confirm when done
- Be concise but thorough`

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
        max_tokens: 2000,
        system: systemPrompt,
        messages: [...conversationHistory, { role: 'user', content: message }],
      }),
    })

    const data = await response.json()
    let reply = data.content[0].text

    let emailSent = false

    const emailMatch = reply.match(/\[SEND_EMAIL:([^\]:]+):([^\]]+)\]/)
    if (emailMatch) {
      const recipientEmail = emailMatch[1]
      const emailSubject = emailMatch[2]

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
          reply += `\n\n✓ Email successfully sent to ${recipientEmail}`
        } else {
          reply += `\n\nNote: Could not send email automatically (${error.message}). You can copy and send it manually.`
        }
      } catch {
        reply += `\n\nNote: Email sending failed. You can copy and send manually.`
      }
    }

    return NextResponse.json({ reply, emailSent })

  } catch (err) {
    console.error('Agent chat error:', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}