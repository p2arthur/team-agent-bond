import { chatCompletion } from './openrouter'

export interface NetworkingEnrichment {
  starters: string[]
  sharedInterests: string[]
  conversationTopics: string[]
  networkingTips: string[]
  connectionStrength: string
}

export async function generateNetworkingEnrichment(
  userA: { name: string; role: string; skills: string[]; networkingGoal: string },
  userB: { name: string; role: string; skills: string[]; networkingGoal: string; twinSummary: string | null },
  conversationSummary: string
): Promise<NetworkingEnrichment> {
  const prompt = `You are a professional networking advisor. Given two people who matched at a conference, generate data to help them connect effectively.

PERSON A: ${userA.name}
Role: ${userA.role}
Skills: ${userA.skills.join(', ')}
Goal: ${userA.networkingGoal}

PERSON B: ${userB.name}
Role: ${userB.role}
Skills: ${userB.skills.join(', ')}
Goal: ${userB.networkingGoal}
${userB.twinSummary ? `Background: ${userB.twinSummary}` : ''}

Their AI twins had this conversation:
${conversationSummary}

Generate networking assistance data. The starters MUST feel natural — like something you'd actually say to someone at a conference cocktail hour. Reference specific things from their conversation or profiles. Never be generic.

Respond with ONLY a JSON object:
{
  "starters": [
    "Specific opener referencing something their twin said or a shared topic",
    "Alternative opener referencing their role, company, or a specific project",
    "Casual opener that references the event context and their specific interest"
  ],
  "sharedInterests": [
    "Specific shared interest with brief explanation of why it connects them",
    "Another specific overlap with context"
  ],
  "conversationTopics": [
    "Specific topic 1: why it's relevant to both of them",
    "Specific topic 2: what they could learn from each other",
    "Specific topic 3: potential collaboration angle"
  ],
  "networkingTips": [
    "Specific actionable tip for this exact connection",
    "Another specific tip based on their unique profiles"
  ],
  "connectionStrength": "One specific sentence describing the nature and potential of this connection"
}`

  const result = await chatCompletion(
    'You are a networking advisor who generates practical, specific advice for professional connections at events.',
    prompt
  )

  try {
    return JSON.parse(result)
  } catch {
    const jsonMatch = result.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      try {
        return JSON.parse(jsonMatch[0])
      } catch {}
    }
    return {
      starters: [
        `Hey ${userB.name}! I heard our AI twins were talking about ${userA.skills[0] || 'tech'} — I'd love to continue that conversation.`,
        `Hi ${userB.name}, I'm ${userA.name}. ${userB.role ? `I saw you're ${userB.role}` : ''} — I think there's some interesting overlap with what I do. Got a minute?`,
      ],
      sharedInterests: [
        userA.skills[0] && userB.skills[0] ? `Both work with ${userA.skills[0].toLowerCase()} and ${userB.skills[0].toLowerCase()}` : 'Overlapping professional domains',
      ],
      conversationTopics: [
        `How your work in ${userA.skills[0] || 'tech'} intersects with ${userB.role || 'their field'}`,
      ],
      networkingTips: [`Ask about their current projects and share how ${userA.skills[0] || 'your work'} might relate`],
      connectionStrength: `A promising connection between ${userA.role} and ${userB.role || 'a fellow professional'} with complementary expertise.`,
    }
  }
}
