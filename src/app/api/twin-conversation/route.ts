import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { runTwinConversation } from '@/lib/twin-conversation'
import { cosineSimilarity } from '@/lib/embedding'

export async function POST(request: NextRequest) {
  const { userId, candidateUserId } = await request.json()

  if (!userId || !candidateUserId) {
    return new Response(
      JSON.stringify({ success: false, error: 'userId and candidateUserId required' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    )
  }

  const encoder = new TextEncoder()
  const stream = new ReadableStream({
    async start(controller) {
      try {
        const [userA, userB] = await Promise.all([
          prisma.user.findUnique({
            where: { id: userId },
            include: { profile: true },
          }),
          prisma.user.findUnique({
            where: { id: candidateUserId },
            include: { profile: true },
          }),
        ])

        if (!userA?.profile || !userB?.profile) {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'error', message: 'User not found' })}\n\n`))
          controller.close()
          return
        }

        const userDataA = {
          id: userA.id,
          name: userA.name,
          twinSummary: userA.profile.twinSummary,
          networkingGoal: userA.profile.networkingGoal,
        }

        const userDataB = {
          id: userB.id,
          name: userB.name,
          twinSummary: userB.profile.twinSummary,
          networkingGoal: userB.profile.networkingGoal,
        }

        let similarity = 0.75
        try {
          const embA = JSON.parse(userA.profile.embedding || '[]')
          const embB = JSON.parse(userB.profile.embedding || '[]')
          if (embA.length > 0 && embB.length > 0) {
            similarity = cosineSimilarity(embA, embB)
          }
        } catch {}
        const score = Math.round(similarity * 100)

        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'start', userA: userDataA.name, userB: userDataB.name, similarity: score })}\n\n`))

        const result = await runTwinConversation(userDataA, userDataB)

        for (const message of result.messages) {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'message', ...message })}\n\n`))
          await new Promise(resolve => setTimeout(resolve, 800))
        }

        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'verdict', ...result.verdict })}\n\n`))

        if (result.verdict.shouldMeet) {
          let match = await prisma.match.findFirst({
            where: { userId, matchedUserId: candidateUserId },
          })

          if (!match) {
            match = await prisma.match.create({
              data: {
                userId,
                matchedUserId: candidateUserId,
                score,
                reason: result.verdict.reason,
              },
            })
          } else {
            match = await prisma.match.update({
              where: { id: match.id },
              data: { score, reason: result.verdict.reason },
            })
          }

          await prisma.conversation.upsert({
            where: { matchId: match.id },
            create: {
              matchId: match.id,
              messages: JSON.stringify(result.messages),
              decision: result.verdict.shouldMeet,
              summary: result.verdict.reason,
            },
            update: {
              messages: JSON.stringify(result.messages),
              decision: result.verdict.shouldMeet,
              summary: result.verdict.reason,
            },
          })
        }

        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'complete' })}\n\n`))
        controller.close()
      } catch (error) {
        console.error('Conversation error:', error)
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'error', message: 'Conversation failed' })}\n\n`))
        controller.close()
      }
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  })
}
