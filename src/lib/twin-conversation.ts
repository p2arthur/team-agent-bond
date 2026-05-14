import { chatCompletion } from './openrouter'

export interface ConversationMessage {
  role: 'twin_a' | 'twin_b'
  speakerName: string
  content: string
  timestamp: number
}

export interface ConversationVerdict {
  shouldMeet: boolean
  reason: string
  sharedInterests: string[]
  conversationTopics: string[]
  starters: string[]
}

export interface TwinConversationResult {
  messages: ConversationMessage[]
  verdict: ConversationVerdict
}

export function buildConversationPrompt(
  userA: { name: string; twinSummary: string | null; networkingGoal: string },
  userB: { name: string; twinSummary: string | null; networkingGoal: string }
): string {
  return `You are simulating a networking conversation between two digital twins at a professional event.

TWIN A (${userA.name}'s twin):
Profile: ${userA.twinSummary || 'No summary available'}
Goals: ${userA.networkingGoal}

TWIN B (${userB.name}'s twin):
Profile: ${userB.twinSummary || 'No summary available'}
Goals: ${userB.networkingGoal}

Rules:
- Keep conversation natural and professional
- Each message should be 1-2 sentences
- Explore shared interests, complementary skills, and goal alignment
- After 3-4 exchanges each, the twins should naturally conclude
- Be genuine - don't force connections that don't exist

The conversation should feel like two people meeting at a conference cocktail hour.

Respond with ONLY a JSON array of messages in this format:
[
  {"speaker": "twin_a", "name": "${userA.name}'s Twin", "content": "..."},
  {"speaker": "twin_b", "name": "${userB.name}'s Twin", "content": "..."},
  ...
]

Generate exactly 6-8 messages total (3-4 from each twin).`
}

export function buildVerdictPrompt(
  userA: { name: string; networkingGoal: string },
  userB: { name: string; networkingGoal: string },
  messages: ConversationMessage[]
): string {
  const conversationText = messages
    .map(m => `${m.speakerName}: ${m.content}`)
    .join('\n')

  return `You are a HIGHLY SELECTIVE networking advisor at an exclusive conference. You should only recommend meetings where there is CLEAR, SPECIFIC mutual value.

Evaluate this conversation between ${userA.name} and ${userB.name}'s digital twins.

Conversation:
${conversationText}

STRICT CRITERIA for shouldMeet = true:
- There must be a SPECIFIC, ACTIONABLE reason to meet (not just "they work in tech")
- Their goals must directly align or complement each other
- There should be a clear potential outcome (partnership, deal, collaboration, mentorship)
- Generic "shared interest in AI" is NOT enough — be specific

If the connection is vague, generic, or unlikely to produce real value, set shouldMeet = false.

Respond with ONLY a JSON object:
{
  "shouldMeet": true/false,
  "reason": "One specific sentence explaining the concrete value of meeting",
  "sharedInterests": ["specific interest 1", "specific interest 2"],
  "conversationTopics": ["specific topic 1", "specific topic 2"],
  "starters": [
    "Natural conversation opener referencing their specific work",
    "Alternative opener referencing a shared context or goal"
  ]
}

Only include starters if shouldMeet is true. Make them feel natural — something you'd actually say at a conference cocktail hour. Be specific to these two people.`
}

export async function runTwinConversation(
  userA: { id: string; name: string; twinSummary: string | null; networkingGoal: string },
  userB: { id: string; name: string; twinSummary: string | null; networkingGoal: string }
): Promise<TwinConversationResult> {
  const conversationPrompt = buildConversationPrompt(userA, userB)
  const conversationResult = await chatCompletion(
    'You are a conversation simulator. Generate realistic networking conversations.',
    conversationPrompt
  )

  if (!userA.networkingGoal || !userB.networkingGoal) {
    throw new Error('Both users must have a networkingGoal set')
  }

  let rawMessages: Array<{ speaker: string; name: string; content: string }>
  try {
    rawMessages = JSON.parse(conversationResult)
  } catch {
    const jsonMatch = conversationResult.match(/\[[\s\S]*\]/)
    if (jsonMatch) {
      try {
        rawMessages = JSON.parse(jsonMatch[0])
      } catch {
        throw new Error('Failed to parse conversation JSON from extracted match')
      }
    } else {
      throw new Error('Failed to parse conversation')
    }
  }

  const messages: ConversationMessage[] = rawMessages.map((m, i) => {
    const role = m.speaker === 'twin_a' || m.speaker === 'twin_b'
      ? m.speaker
      : i % 2 === 0 ? 'twin_a' : 'twin_b'
    return {
      role,
      speakerName: m.name,
      content: m.content,
      timestamp: Date.now() + i * 1000,
    }
  })

  const verdictPrompt = buildVerdictPrompt(userA, userB, messages)
  const verdictResult = await chatCompletion(
    'You are a networking advisor. Evaluate conversations and determine if people should meet.',
    verdictPrompt
  )

  let verdict: ConversationVerdict
  try {
    verdict = JSON.parse(verdictResult)
    if (!verdict.starters) verdict.starters = []
  } catch {
    const jsonMatch = verdictResult.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      try {
        verdict = JSON.parse(jsonMatch[0])
        if (!verdict.starters) verdict.starters = []
      } catch {
        verdict = { shouldMeet: false, reason: 'Could not evaluate conversation', sharedInterests: [], conversationTopics: [], starters: [] }
      }
    } else {
      verdict = { shouldMeet: false, reason: 'Could not evaluate conversation', sharedInterests: [], conversationTopics: [], starters: [] }
    }
  }

  return { messages, verdict }
}
