import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { generateNetworkingEnrichment } from '@/lib/enrichment'

interface SaveMatchInput {
  id: string
  user: {
    id: string
    name: string
    role: string
    company: string | null
    industry: string | null
    skills: string[]
    interests: string[]
    twinSummary: string | null
  }
  score: number
  reason: string
  starters: string[]
  conversation: {
    messages: Array<{ role: string; speakerName: string; content: string }>
    verdict: { shouldMeet: boolean; reason: string; sharedInterests?: string[]; conversationTopics?: string[] }
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId, matches } = (await request.json()) as {
      userId: string
      matches: SaveMatchInput[]
    }

    if (!userId || !matches) {
      return NextResponse.json(
        { success: false, error: 'userId and matches required' },
        { status: 400 }
      )
    }

    const userA = await prisma.user.findUnique({
      where: { id: userId },
      include: { profile: true },
    })

    const savedMatchIds: string[] = []

    await prisma.$transaction(async (tx) => {
      await tx.match.deleteMany({ where: { userId } })

      for (const m of matches) {
        const match = await tx.match.create({
          data: {
            userId,
            matchedUserId: m.user.id,
            score: m.score,
            reason: m.reason,
          },
        })

        await tx.conversation.create({
          data: {
            matchId: match.id,
            messages: JSON.stringify(m.conversation.messages),
            decision: m.conversation.verdict.shouldMeet,
            summary: m.conversation.verdict.reason,
          },
        })

        savedMatchIds.push(match.id)
      }
    })

    if (userA?.profile) {
      const userDataA = {
        name: userA.name,
        role: userA.profile.role,
        skills: JSON.parse(userA.profile.skills || '[]'),
        networkingGoal: userA.profile.networkingGoal,
      }

      await Promise.all(
        matches.map(async (m, i) => {
          // Save starters from verdict
          if (m.starters && m.starters.length > 0) {
            try {
              await prisma.conversationStarter.createMany({
                data: m.starters.map((text, order) => ({
                  matchId: savedMatchIds[i],
                  text,
                  order,
                })),
              })
            } catch (err) {
              console.error(`Starters save failed for ${m.user.name}:`, err)
            }
          }

          // Generate enrichment (resilient with fallback)
          try {
            const conversationSummary = m.conversation.messages
              .map((msg) => `${msg.speakerName}: ${msg.content}`)
              .join('\n')

            const enrichment = await generateNetworkingEnrichment(
              userDataA,
              {
                name: m.user.name,
                role: m.user.role,
                skills: m.user.skills,
                networkingGoal: '',
                twinSummary: m.user.twinSummary,
              },
              conversationSummary
            )

            await prisma.match.update({
              where: { id: savedMatchIds[i] },
              data: { enrichment: JSON.stringify(enrichment) },
            })
          } catch (err) {
            console.error(`Enrichment API failed for ${m.user.name}:`, err)
            // Build rich fallback enrichment from conversation data
            const verdictShared = m.conversation.verdict.sharedInterests || []
            const verdictTopics = m.conversation.verdict.conversationTopics || []
            const verdictReason = m.conversation.verdict.reason || ''
            const topSkill = m.user.skills[0] || ''
            const roleRef = m.user.role ? ` as ${m.user.role}` : ''
            const companyRef = m.user.company ? ` at ${m.user.company}` : ''

            // Extract a key topic from the twin conversation
            const convoExcerpt = m.conversation.messages
              .slice(-4)
              .map(msg => msg.content)
              .join(' ')
            const topicFromConvo = verdictTopics[0] || topSkill || 'your work'

            const fallbackEnrichment = {
              starters: m.starters && m.starters.length > 0 ? m.starters : [
                `Hey ${m.user.name}! Our AI twins were just talking about ${topicFromConvo} — I'd love to hear your take on it in person.`,
                `Hi ${m.user.name}, I'm ${userDataA.name}${roleRef ? ` — I work in ${userDataA.skills[0] || 'tech'}` : ''}. I saw we matched on ${topSkill || 'shared interests'}. Got a minute?`,
                `${m.user.name}? I think there's something interesting here — ${verdictReason || `our twins clicked over ${topicFromConvo}`}. Coffee?`,
              ],
              sharedInterests: verdictShared.length > 0 ? verdictShared : [
                topSkill ? `Both work with ${topSkill.toLowerCase()}` : 'Overlapping professional interests',
                m.user.industry ? `Both in or adjacent to ${m.user.industry}` : 'Similar career trajectories',
              ],
              conversationTopics: verdictTopics.length > 0 ? verdictTopics : [
                topSkill ? `How you each approach ${topSkill.toLowerCase()} in your work` : 'Your respective projects and what excites you right now',
                m.user.company ? `What's happening at ${m.user.company} right now` : "Current challenges you're both solving",
                'Potential ways to collaborate or help each other',
              ],
              networkingTips: [
                `Open with something specific from the twin conversation — it shows you're already invested in this connection`,
                `Ask what ${m.user.name} is most excited about right now — people light up when talking about what they care about`,
                `Share one thing you're working on that relates to ${topSkill || 'their expertise'} — find the overlap`,
              ],
              connectionStrength: verdictReason || `Your AI twins had a productive conversation about ${topicFromConvo}, suggesting real potential for collaboration.`,
            }
            try {
              await prisma.match.update({
                where: { id: savedMatchIds[i] },
                data: { enrichment: JSON.stringify(fallbackEnrichment) },
              })
            } catch {}
          }
        })
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Save matches error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to save matches' },
      { status: 500 }
    )
  }
}
