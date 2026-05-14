import { NextRequest, NextResponse } from 'next/server'
import { findMatches } from '@/lib/matching'

export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json()

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'userId required' },
        { status: 400 }
      )
    }

    const matches = await findMatches(userId)

    return NextResponse.json({
      success: true,
      matches: matches.map((m) => ({
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
        },
        score: m.score,
        reason: m.reason,
        starters: m.starters?.sort((a, b) => a.order - b.order).map((s) => s.text) || [],
        conversation: m.conversation ? {
          messages: m.conversation.messages,
          verdict: m.conversation.verdict,
        } : null,
      })),
    })
  } catch (error) {
    console.error('Match error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to find matches' },
      { status: 500 }
    )
  }
}
