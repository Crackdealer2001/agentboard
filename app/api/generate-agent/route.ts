import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const form = await req.json()

    const prompt = `You are an expert AI consultant helping businesses set up AI agents. Based on this business information, create a complete AI agent package.

Business Name: ${form.businessName}
Industry: ${form.industry}
Description: ${form.description}
Tasks needed: ${form.tasks.join(', ')}
Agent Name: ${form.agentName}
Tone: ${form.tone}
Extra requirements: ${form.extraInfo || 'None'}

Create a complete AI agent package. Respond with ONLY a valid JSON object, absolutely no markdown, no backticks, no extra text before or after:
{
  "name": "agent name",
  "description": "2-3 sentence description of what this agent does for the business",
  "category": "Customer support",
  "tags": ["tag1", "tag2", "tag3"],
  "systemPrompt": "A detailed system prompt. Start with: You are [name], an AI agent for [business]. Your role is to... Include specific instructions for each task, how to handle edge cases, what tone to use, and what to do when unsure.",
  "setupSteps": [
    "Step 1: Go to chat.openai.com and create a free account",
    "Step 2: Click on GPT-4 or any model and paste your system prompt",
    "Step 3: ...",
    "Step 4: ...",
    "Step 5: ..."
  ],
  "useCases": [
    {
      "task": "task name",
      "howTo": "exactly how to use the agent for this task in 2-3 sentences",
      "examplePrompt": "an example prompt the business owner can copy and use"
    }
  ],
  "emailTemplates": [
    {
      "subject": "email subject line",
      "body": "full email body the agent can send",
      "useCase": "when to use this email"
    }
  ],
  "tips": [
    "Practical tip 1 for getting the most out of this agent",
    "Practical tip 2",
    "Practical tip 3"
  ]
}`

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY!,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 4000,
        messages: [{ role: 'user', content: prompt }],
      }),
    })

    const data = await response.json()

    if (!data.content || !data.content[0]) {
      console.error('Anthropic error:', JSON.stringify(data))
      return NextResponse.json({ error: 'Failed to generate' }, { status: 500 })
    }

    const text = data.content[0].text
    const cleaned = text.replace(/```json|```/g, '').trim()

    let result
    try {
      result = JSON.parse(cleaned)
    } catch (parseErr) {
      console.error('Parse error:', parseErr, 'Text was:', text)
      return NextResponse.json({ error: 'Failed to parse response' }, { status: 500 })
    }

    return NextResponse.json(result)

  } catch (err) {
    console.error('Generate agent error:', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}