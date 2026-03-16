import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { createClient } from '@supabase/supabase-js'

export async function POST(req: NextRequest) {
  try {
    const { message, agent, history } = await req.json()

    const today = new Date()
    const dueDate = new Date(today)
    dueDate.setDate(dueDate.getDate() + 30)
    const formatDate = (d: Date) => d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })

    const systemPrompt = `You are ${agent.agent_name}, a professional AI business agent for ${agent.business_name}.
Industry: ${agent.industry}
Tone: ${agent.tone}

You are concise, professional, and action-oriented. You complete tasks immediately.

TODAY: ${formatDate(today)}
DUE DATE (invoices): ${formatDate(dueDate)}

━━━ RULES ━━━
- Be brief. Never repeat yourself.
- Never use ** for bold. Use plain text only.
- Keep all documents SHORT and professional
- Confirm task in ONE line at the end

━━━ INVOICE FORMAT ━━━
When creating an invoice, respond with ONLY this exact structure — nothing more:

INVOICE #[NUMBER]
[Business Name]
Date: [date] · Due: [due date]

Bill To: [client name and email if provided]

[Item description] | [qty] | $[rate] | $[amount]
[Item description] | [qty] | $[rate] | $[amount]

Subtotal: $[amount]
Tax (10%): $[amount]
Total Due: $[amount]

Payment terms: Net 30
[One line thank you]

Then add: [SEND_INVOICE:email:invoiceNumber:clientName:itemsJSON:subtotal:tax:total]

━━━ EMAIL FORMAT ━━━
Keep emails SHORT — max 5 lines of body text.
Subject line: clear and direct.
No lengthy explanations.
Then add: [SEND_EMAIL:email:subject]

━━━ CONTRACT FORMAT ━━━
Keep contracts to ONE page max.
Only essential clauses.
Then add: [CREATE_DOCUMENT:CONTRACT:title|party1|party2|date]

━━━ GENERAL ━━━
- For ANY document: keep it to one page
- Professional = short and clear, not long and wordy
- Always confirm in one line what you did`

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
        max_tokens: 1500,
        system: systemPrompt,
        messages: [...conversationHistory, { role: 'user', content: message }],
      }),
    })

    const data = await response.json()
    let reply = data.content[0].text
    let emailSent = false
    let documentId = null
    let documentType = null

    // Handle invoice sending
    const invoiceMatch = reply.match(/\[SEND_INVOICE:([^\]]+)\]/)
    if (invoiceMatch) {
      const parts = invoiceMatch[1].split(':')
      const recipientEmail = parts[0]?.trim()
      const invoiceNumber = parts[1]?.trim()
      const clientName = parts[2]?.trim()
      const subtotal = parts[4]?.trim()
      const tax = parts[5]?.trim()
      const total = parts[6]?.trim()

      reply = reply.replace(/\[SEND_INVOICE:[^\]]+\]/g, '').trim()

      // Parse invoice lines from reply
      const lines = reply.split('\n').filter(l => l.includes('|'))
      const lineItemsHTML = lines.map(line => {
        const [desc, qty, rate, amount] = line.split('|').map(s => s.trim())
        return `<tr>
          <td style="padding:10px 0;font-size:14px;border-bottom:1px solid #f0f0f0;">${desc}</td>
          <td style="padding:10px 0;font-size:14px;border-bottom:1px solid #f0f0f0;text-align:center;">${qty}</td>
          <td style="padding:10px 0;font-size:14px;border-bottom:1px solid #f0f0f0;text-align:right;">${rate}</td>
          <td style="padding:10px 0;font-size:14px;border-bottom:1px solid #f0f0f0;text-align:right;font-weight:600;">${amount}</td>
        </tr>`
      }).join('')

      const invoiceHTML = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8">
<style>
  * { margin:0; padding:0; box-sizing:border-box; }
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background:#f5f5f5; }
  .wrap { max-width:620px; margin:32px auto; background:#fff; }
  .top { background:#0f0f0f; padding:32px 40px; display:flex; justify-content:space-between; align-items:flex-end; }
  .biz { color:#fff; font-size:20px; font-weight:700; letter-spacing:-0.5px; }
  .inv-label { color:#c8f135; font-size:11px; letter-spacing:2px; font-family:monospace; text-transform:uppercase; }
  .inv-num { color:#fff; font-size:24px; font-weight:700; text-align:right; }
  .body { padding:36px 40px; }
  .meta { display:flex; justify-content:space-between; margin-bottom:28px; padding-bottom:20px; border-bottom:1px solid #eee; }
  .meta-block { font-size:13px; }
  .meta-block .lbl { font-size:10px; font-family:monospace; color:#999; letter-spacing:1px; text-transform:uppercase; margin-bottom:4px; }
  table { width:100%; border-collapse:collapse; margin-bottom:20px; }
  th { font-size:10px; font-family:monospace; color:#999; letter-spacing:1px; text-transform:uppercase; text-align:left; padding:0 0 8px; border-bottom:2px solid #0f0f0f; font-weight:500; }
  th.r { text-align:right; }
  th.c { text-align:center; }
  .totals { margin-left:auto; width:220px; }
  .t-row { display:flex; justify-content:space-between; font-size:13px; padding:5px 0; color:#666; }
  .t-final { display:flex; justify-content:space-between; font-size:17px; font-weight:700; color:#0f0f0f; border-top:2px solid #0f0f0f; padding-top:10px; margin-top:6px; }
  .foot { background:#fafafa; padding:20px 40px; border-top:1px solid #eee; }
  .foot p { font-size:11px; font-family:monospace; color:#aaa; }
</style>
</head>
<body>
<div class="wrap">
  <div class="top">
    <div>
      <div class="biz">${agent.business_name}</div>
      <div class="inv-label" style="margin-top:4px;">Invoice</div>
    </div>
    <div class="inv-num">${invoiceNumber}</div>
  </div>
  <div class="body">
    <div class="meta">
      <div class="meta-block">
        <div class="lbl">Bill To</div>
        <div style="font-weight:600;">${clientName}</div>
        ${recipientEmail ? `<div style="color:#666;">${recipientEmail}</div>` : ''}
      </div>
      <div class="meta-block" style="text-align:right;">
        <div class="lbl">Date</div>
        <div>${formatDate(today)}</div>
        <div class="lbl" style="margin-top:8px;">Due</div>
        <div style="font-weight:600;">${formatDate(dueDate)}</div>
      </div>
    </div>
    <table>
      <thead>
        <tr>
          <th>Description</th>
          <th class="c">Qty</th>
          <th class="r">Rate</th>
          <th class="r">Amount</th>
        </tr>
      </thead>
      <tbody>${lineItemsHTML}</tbody>
    </table>
    <div class="totals">
      <div class="t-row"><span>Subtotal</span><span>$${subtotal}</span></div>
      <div class="t-row"><span>Tax (10%)</span><span>$${tax}</span></div>
      <div class="t-final"><span>Total Due</span><span>$${total}</span></div>
    </div>
  </div>
  <div class="foot">
    <p>${agent.business_name} · Generated by ${agent.agent_name}</p>
    <p style="margin-top:2px;">Payment due within 30 days · Thank you for your business</p>
  </div>
</div>
</body>
</html>`

      try {
        const resend = new Resend(process.env.RESEND_API_KEY)
        const { error } = await resend.emails.send({
          from: 'AgentBoard <onboarding@resend.dev>',
          to: recipientEmail,
          subject: `Invoice ${invoiceNumber} from ${agent.business_name}`,
          html: invoiceHTML,
        })
        if (!error) {
          emailSent = true
          reply += `\n\nInvoice ${invoiceNumber} sent to ${recipientEmail}.`
        }
      } catch { }
    }

    // Handle regular email
    const emailMatch = reply.match(/\[SEND_EMAIL:([^\]:]+):([^\]]+)\]/)
    if (emailMatch && !invoiceMatch) {
      const recipientEmail = emailMatch[1].trim()
      const emailSubject = emailMatch[2].trim()
      reply = reply.replace(/\[SEND_EMAIL:[^\]]+\]/g, '').trim()

      const emailHTML = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8">
<style>
  body { font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif; background:#f5f5f5; margin:0; }
  .wrap { max-width:560px; margin:32px auto; background:#fff; }
  .top { background:#0f0f0f; padding:24px 36px; }
  .biz { color:#fff; font-size:16px; font-weight:700; }
  .body { padding:32px 36px; font-size:14px; line-height:1.7; color:#333; white-space:pre-wrap; }
  .foot { background:#fafafa; padding:16px 36px; border-top:1px solid #eee; }
  .foot p { font-size:11px; font-family:monospace; color:#aaa; margin:0; }
</style>
</head>
<body>
<div class="wrap">
  <div class="top"><div class="biz">${agent.business_name}</div></div>
  <div class="body">${reply.replace(/\n/g, '<br>')}</div>
  <div class="foot"><p>Sent by ${agent.agent_name} · ${agent.business_name}</p></div>
</div>
</body>
</html>`

      try {
        const resend = new Resend(process.env.RESEND_API_KEY)
        const { error } = await resend.emails.send({
          from: 'AgentBoard <onboarding@resend.dev>',
          to: recipientEmail,
          subject: emailSubject,
          html: emailHTML,
        })
        if (!error) {
          emailSent = true
          reply += `\n\nEmail sent to ${recipientEmail}.`
        }
      } catch { }
    }

    // Handle document creation
    const docMatch = reply.match(/\[CREATE_DOCUMENT:([^:]+):([^\]]+)\]/)
    if (docMatch) {
      documentType = docMatch[1]
      const params = docMatch[2].split('|')
      reply = reply.replace(/\[CREATE_DOCUMENT:[^\]]+\]/g, '').trim()

      const metadata: Record<string, unknown> = {
        title: params[0],
        party1: params[1],
        party2: params[2],
        date: params[3] || formatDate(today),
      }

      try {
        const supabase = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        )
        const { data: doc } = await supabase
          .from('documents')
          .insert({ agent_id: agent.id, type: documentType, content: reply, metadata })
          .select()
          .single()

        if (doc) {
          documentId = doc.id
          reply += `\n\n📄 ${documentType} ready — click to open and print.`
        }
      } catch { }
    }

    return NextResponse.json({ reply, emailSent, documentId, documentType })

  } catch (err) {
    console.error('Agent chat error:', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}