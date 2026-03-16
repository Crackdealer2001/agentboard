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
When creating an invoice, respond with ONLY this exact structure:

INVOICE #[NUMBER]
[Business Name]
Date: [date] · Due: [due date]

Bill To: [client name and email if provided]

[Item description] | [qty] | $[rate] | $[amount]

Subtotal: $[amount]
Tax (10%): $[amount]
Total Due: $[amount]

Then add: [SEND_INVOICE:email:invoiceNumber:clientName:subtotal:tax:total:item1desc|item1qty|item1rate|item1amount]

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
      const subtotal = parts[3]?.trim()
      const tax = parts[4]?.trim()
      const total = parts[5]?.trim()
      const itemParts = parts[6]?.split('|') || []
      const itemDesc = itemParts[0] || 'Service'
      const itemQty = itemParts[1] || '1'
      const itemRate = itemParts[2] || subtotal
      const itemAmount = itemParts[3] || subtotal

      reply = reply.replace(/\[SEND_INVOICE:[^\]]+\]/g, '').trim()

      const lineItemsHTML = `<tr>
        <td style="padding:14px 16px;font-size:14px;color:#333;border-bottom:1px solid #f0f0f0;">${itemDesc}</td>
        <td style="padding:14px 16px;font-size:14px;color:#666;text-align:right;border-bottom:1px solid #f0f0f0;">${itemQty}</td>
        <td style="padding:14px 16px;font-size:14px;color:#666;text-align:right;border-bottom:1px solid #f0f0f0;">$${itemRate}</td>
        <td style="padding:14px 16px;font-size:14px;font-weight:600;color:#0a0a0a;text-align:right;border-bottom:1px solid #f0f0f0;">$${itemAmount}</td>
      </tr>`

      const invoiceHTML = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8">
<style>
  * { margin:0; padding:0; box-sizing:border-box; }
  body { font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif; background:#1a1a1a; padding:40px 20px; }
  .page { max-width:680px; margin:0 auto; background:#fff; border-radius:12px; overflow:hidden; box-shadow:0 20px 60px rgba(0,0,0,0.4); }
  .header { background:#0a0a0a; padding:40px 48px; }
  .header-top { display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:20px; }
  .business-name { color:#ffffff; font-size:24px; font-weight:700; letter-spacing:-0.5px; }
  .invoice-badge { background:#c8f135; color:#0a0a0a; font-size:11px; font-weight:700; letter-spacing:2px; text-transform:uppercase; padding:6px 14px; border-radius:20px; font-family:monospace; display:inline-block; }
  .invoice-number { color:#ffffff; font-size:36px; font-weight:800; letter-spacing:-1px; }
  .invoice-number-label { color:#666; font-size:11px; letter-spacing:2px; text-transform:uppercase; font-family:monospace; margin-bottom:4px; }
  .meta-strip { background:#111; padding:20px 48px; display:flex; justify-content:space-between; border-top:1px solid #222; }
  .meta-item label { color:#555; font-size:10px; letter-spacing:1.5px; text-transform:uppercase; font-family:monospace; display:block; margin-bottom:4px; }
  .meta-item span { color:#fff; font-size:13px; font-weight:500; }
  .body { padding:40px 48px; background:#fff; }
  .bill-to { margin-bottom:32px; padding:20px 24px; background:#f8f8f8; border-radius:10px; border-left:3px solid #0a0a0a; }
  .bill-to label { font-size:10px; letter-spacing:1.5px; text-transform:uppercase; font-family:monospace; color:#999; display:block; margin-bottom:8px; }
  .bill-to .name { font-size:16px; font-weight:700; color:#0a0a0a; margin-bottom:2px; }
  .bill-to .email { font-size:13px; color:#666; }
  table { width:100%; border-collapse:collapse; margin-bottom:24px; }
  thead tr { background:#0a0a0a; }
  th { color:#fff; font-size:10px; letter-spacing:1.5px; text-transform:uppercase; font-family:monospace; font-weight:500; padding:12px 16px; text-align:left; }
  th.r { text-align:right; }
  .totals-section { display:flex; justify-content:flex-end; margin-bottom:32px; }
  .totals-box { width:260px; background:#f8f8f8; border-radius:10px; padding:20px 24px; }
  .total-line { display:flex; justify-content:space-between; padding:6px 0; font-size:13px; color:#666; border-bottom:1px solid #eee; }
  .total-final { display:flex; justify-content:space-between; padding:12px 0 0; margin-top:4px; font-size:18px; font-weight:800; color:#0a0a0a; }
  .payment-info { background:#0a0a0a; border-radius:10px; padding:20px 24px; margin-bottom:32px; }
  .payment-info label { color:#666; font-size:10px; letter-spacing:1.5px; text-transform:uppercase; font-family:monospace; display:block; margin-bottom:8px; }
  .payment-info p { color:#fff; font-size:13px; line-height:1.6; }
  .footer { padding:24px 48px; background:#f8f8f8; border-top:2px solid #0a0a0a; display:flex; justify-content:space-between; align-items:center; }
  .footer-left p { font-size:13px; color:#0a0a0a; font-weight:600; margin-bottom:2px; }
  .footer-left span { font-size:11px; color:#999; font-family:monospace; }
  .footer-right .amount { font-size:24px; font-weight:800; color:#0a0a0a; }
  .footer-right .amount-label { font-size:10px; color:#999; font-family:monospace; letter-spacing:1px; text-transform:uppercase; text-align:right; }
</style>
</head>
<body>
<div class="page">
  <div class="header">
    <div class="header-top">
      <div><div class="business-name">${agent.business_name}</div></div>
      <div style="text-align:right;">
        <div class="invoice-number-label">Invoice</div>
        <div class="invoice-number">${invoiceNumber}</div>
      </div>
    </div>
    <span class="invoice-badge">Tax Invoice</span>
  </div>
  <div class="meta-strip">
    <div class="meta-item"><label>Issue Date</label><span>${formatDate(today)}</span></div>
    <div class="meta-item"><label>Due Date</label><span style="color:#c8f135;">${formatDate(dueDate)}</span></div>
    <div class="meta-item"><label>Status</label><span style="color:#fbbf24;">Unpaid</span></div>
    <div class="meta-item"><label>Terms</label><span>Net 30</span></div>
  </div>
  <div class="body">
    <div class="bill-to">
      <label>Billed To</label>
      <div class="name">${clientName}</div>
      ${recipientEmail ? `<div class="email">${recipientEmail}</div>` : ''}
    </div>
    <table>
      <thead>
        <tr>
          <th style="width:50%;">Description</th>
          <th class="r">Qty</th>
          <th class="r">Rate</th>
          <th class="r">Amount</th>
        </tr>
      </thead>
      <tbody>${lineItemsHTML}</tbody>
    </table>
    <div class="totals-section">
      <div class="totals-box">
        <div class="total-line"><span>Subtotal</span><span>$${subtotal}</span></div>
        <div class="total-line"><span>GST / Tax (10%)</span><span>$${tax}</span></div>
        <div class="total-final"><span>Total Due</span><span>$${total}</span></div>
      </div>
    </div>
    <div class="payment-info">
      <label>Payment Instructions</label>
      <p>Please remit payment by ${formatDate(dueDate)}. For payment enquiries contact ${agent.business_name} directly.</p>
    </div>
  </div>
  <div class="footer">
    <div class="footer-left">
      <p>${agent.business_name}</p>
      <span>Generated by ${agent.agent_name}</span>
    </div>
    <div class="footer-right">
      <div class="amount-label">Amount Due</div>
      <div class="amount">$${total}</div>
    </div>
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
  * { margin:0; padding:0; box-sizing:border-box; }
  body { font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif; background:#1a1a1a; padding:40px 20px; }
  .page { max-width:600px; margin:0 auto; background:#fff; border-radius:12px; overflow:hidden; box-shadow:0 20px 60px rgba(0,0,0,0.4); }
  .header { background:#0a0a0a; padding:28px 40px; display:flex; justify-content:space-between; align-items:center; }
  .biz { color:#fff; font-size:17px; font-weight:700; }
  .badge { background:#c8f135; color:#0a0a0a; font-size:10px; font-weight:700; letter-spacing:1.5px; text-transform:uppercase; padding:5px 12px; border-radius:20px; font-family:monospace; }
  .body { padding:36px 40px; font-size:14px; line-height:1.8; color:#333; white-space:pre-wrap; }
  .footer { background:#f8f8f8; padding:20px 40px; border-top:1px solid #eee; display:flex; justify-content:space-between; align-items:center; }
  .footer p { font-size:11px; font-family:monospace; color:#aaa; }
</style>
</head>
<body>
<div class="page">
  <div class="header">
    <div class="biz">${agent.business_name}</div>
    <div class="badge">Message</div>
  </div>
  <div class="body">${reply.replace(/\n/g, '<br>')}</div>
  <div class="footer">
    <p>Sent by ${agent.agent_name}</p>
    <p>${agent.business_name}</p>
  </div>
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