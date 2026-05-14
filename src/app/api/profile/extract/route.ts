import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { chatCompletion } from '@/lib/openrouter'

const ExtractSchema = z.object({
  linkedInText: z.string().min(10, 'Please provide more LinkedIn content'),
})

const SYSTEM_PROMPT = `You are a profile extraction expert. Given raw text about a person (which could be a full LinkedIn profile, a short bio, or just a few sentences), extract and infer the following fields. Return ONLY valid JSON with no markdown formatting.

Fields to extract:
- role: Their current job title or role (infer from context if not explicit)
- company: Their current company name (null if genuinely not mentioned)
- industry: Their primary industry (infer from context)
- skills: Array of 5-10 professional skills (infer from their role, company, and description)
- interests: Array of 5-10 professional interests (infer from context)
- networkingGoal: A suggested networking goal for a conference (1 sentence)
- lookingFor: What they might be looking for at a networking event (1 sentence)
- canOffer: What value they can bring to connections (1 sentence)
- preferredTopics: Array of 3-5 conversation topics they'd enjoy

IMPORTANT: Even if the input is short (just a few sentences), do your best to infer and generate reasonable values for ALL fields. Use the role/company/industry context to extrapolate skills, interests, and goals. Never leave arrays empty — always provide at least 3-5 items.

Return format:
{
  "role": "...",
  "company": "...",
  "industry": "...",
  "skills": ["...", "..."],
  "interests": ["...", "..."],
  "networkingGoal": "...",
  "lookingFor": "...",
  "canOffer": "...",
  "preferredTopics": ["...", "..."]
}`

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { linkedInText } = ExtractSchema.parse(body)

    const result = await chatCompletion(
      SYSTEM_PROMPT,
      `Extract profile from this LinkedIn content:\n\n${linkedInText}`
    )

    let profile
    try {
      profile = JSON.parse(result)
    } catch {
      const jsonMatch = result.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        profile = JSON.parse(jsonMatch[0])
      } else {
        throw new Error('Failed to parse AI response')
      }
    }

    return NextResponse.json({ success: true, profile })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: error.issues[0].message },
        { status: 400 }
      )
    }
    console.error('Extract error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to extract profile' },
      { status: 500 }
    )
  }
}
