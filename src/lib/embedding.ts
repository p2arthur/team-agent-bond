import { openrouter, EMBEDDING_MODEL } from './openrouter'

export async function generateEmbedding(text: string): Promise<number[]> {
  const response = await openrouter.embeddings.create({
    model: EMBEDDING_MODEL,
    input: text,
  })

  return response.data[0].embedding
}

export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) throw new Error('Vectors must have same length')

  let dotProduct = 0
  let normA = 0
  let normB = 0

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i]
    normA += a[i] * a[i]
    normB += b[i] * b[i]
  }

  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB))
}

export function profileToEmbeddingText(profile: {
  role: string
  company?: string | null
  industry?: string | null
  skills: string
  interests: string
  networkingGoal: string
  lookingFor: string
  canOffer: string
  preferredTopics?: string | null
}): string {
  const skills = JSON.parse(profile.skills).join(', ')
  const interests = JSON.parse(profile.interests).join(', ')
  const topics = profile.preferredTopics
    ? JSON.parse(profile.preferredTopics).join(', ')
    : ''

  return [
    `Role: ${profile.role}`,
    profile.company ? `Company: ${profile.company}` : '',
    profile.industry ? `Industry: ${profile.industry}` : '',
    `Skills: ${skills}`,
    `Interests: ${interests}`,
    `Networking Goal: ${profile.networkingGoal}`,
    `Looking For: ${profile.lookingFor}`,
    `Can Offer: ${profile.canOffer}`,
    topics ? `Preferred Topics: ${topics}` : '',
  ]
    .filter(Boolean)
    .join('\n')
}
