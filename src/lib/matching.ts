import { prisma } from './prisma'
import { cosineSimilarity } from './embedding'
import { runTwinConversation } from './twin-conversation'
import { Prisma } from '@prisma/client'
import type { TwinConversationResult } from './twin-conversation'

interface Candidate {
  userId: string
  name: string
  twinSummary: string | null
  networkingGoal: string
  similarity: number
}

type MatchWithRelations = Prisma.MatchGetPayload<{
  include: {
    matchedUser: { include: { profile: true } }
    starters: true
  }
}>

type MatchResult = MatchWithRelations & {
  conversation: TwinConversationResult
}

export async function findMatches(userId: string) {
  const currentUser = await prisma.user.findUnique({
    where: { id: userId },
    include: { profile: true },
  })

  if (!currentUser || !currentUser.profile) {
    throw new Error('User profile not found')
  }

  let currentEmbedding: number[] = []
  try {
    currentEmbedding = JSON.parse(currentUser.profile.embedding || '[]')
  } catch {
    throw new Error('User has invalid embedding')
  }
  if (currentEmbedding.length === 0) {
    throw new Error('User has no embedding')
  }

  // Get top candidates via vector similarity
  const otherProfiles = await prisma.profile.findMany({
    where: {
      userId: { not: userId },
      embedding: { not: null },
    },
    include: { user: true },
  })

  const candidates: Candidate[] = []
  for (const profile of otherProfiles) {
    let embedding: number[] = []
    try {
      embedding = JSON.parse(profile.embedding || '[]')
    } catch {
      console.error(`Invalid embedding for user ${profile.userId}`)
      continue
    }
    const similarity = cosineSimilarity(currentEmbedding, embedding)
    candidates.push({
      userId: profile.userId,
      name: profile.user.name,
      twinSummary: profile.twinSummary,
      networkingGoal: profile.networkingGoal,
      similarity,
    })
  }

  candidates.sort((a, b) => b.similarity - a.similarity)
  const topCandidates = candidates.slice(0, 6)

  // Collect all conversation results first (non-destructive)
  const conversationResults: { candidate: Candidate; result: Awaited<ReturnType<typeof runTwinConversation>> }[] = []
  for (const candidate of topCandidates) {
    try {
      const result = await runTwinConversation(
        {
          id: userId,
          name: currentUser.name,
          twinSummary: currentUser.profile.twinSummary,
          networkingGoal: currentUser.profile.networkingGoal,
        },
        {
          id: candidate.userId,
          name: candidate.name,
          twinSummary: candidate.twinSummary,
          networkingGoal: candidate.networkingGoal,
        }
      )
      conversationResults.push({ candidate, result })
    } catch (error) {
      console.error(`Conversation failed for ${candidate.name}:`, error)
    }
  }

  // Transactionally delete old matches and create new ones
  const matches = await prisma.$transaction(async (tx) => {
    await tx.match.deleteMany({ where: { userId } })

    const created: MatchResult[] = []
    for (const { candidate, result } of conversationResults) {
      if (result.verdict.shouldMeet) {
        const match = await tx.match.create({
          data: {
            userId,
            matchedUserId: candidate.userId,
            score: Math.round(candidate.similarity * 100),
            reason: result.verdict.reason,
          },
          include: {
            matchedUser: { include: { profile: true } },
            starters: true,
          },
        })

        await tx.conversation.create({
          data: {
            matchId: match.id,
            messages: JSON.stringify(result.messages),
            decision: true,
            summary: result.verdict.reason,
          },
        })

        created.push({ ...match, conversation: result })
      }
    }
    return created
  })

  return matches
}
