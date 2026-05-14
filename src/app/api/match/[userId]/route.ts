import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params

    const matches = await prisma.match.findMany({
      where: { userId },
      include: {
        matchedUser: { include: { profile: true } },
        starters: true,
        conversation: true,
      },
      orderBy: { score: 'desc' },
    })

    return NextResponse.json({
      success: true,
      matches: matches.map((m: any) => {
        let enrichment = null
        try {
          enrichment = m.enrichment ? JSON.parse(m.enrichment) : null
        } catch {}

        return {
          id: m.id,
          user: {
            id: m.matchedUser.id,
            name: m.matchedUser.name,
            role: m.matchedUser.profile?.role,
            company: m.matchedUser.profile?.company,
            industry: m.matchedUser.profile?.industry,
            skills: JSON.parse(m.matchedUser.profile?.skills || '[]'),
            interests: JSON.parse(m.matchedUser.profile?.interests || '[]'),
            twinSummary: m.matchedUser.profile?.twinSummary,
            availability: m.matchedUser.profile?.availability
              ? JSON.parse(m.matchedUser.profile.availability)
              : [],
          },
          score: m.score,
          reason: m.reason,
          starters: enrichment?.starters || m.starters
            .sort((a: any, b: any) => a.order - b.order)
            .map((s: any) => s.text),
          enrichment,
          conversation: m.conversation ? {
            messages: JSON.parse(m.conversation.messages),
            verdict: { shouldMeet: m.conversation.decision, reason: m.conversation.summary },
          } : null,
        }
      }),
    })
  } catch (error) {
    console.error('Get matches error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to get matches' },
      { status: 500 }
    )
  }
}
