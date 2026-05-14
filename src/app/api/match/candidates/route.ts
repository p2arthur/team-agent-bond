import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { cosineSimilarity } from '@/lib/embedding'

export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json()

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'userId required' },
        { status: 400 }
      )
    }

    const currentUser = await prisma.user.findUnique({
      where: { id: userId },
      include: { profile: true },
    })

    if (!currentUser?.profile) {
      return NextResponse.json(
        { success: false, error: 'User profile not found' },
        { status: 404 }
      )
    }

    const currentEmbedding = JSON.parse(currentUser.profile.embedding || '[]')

    let currentAvailability: string[] = []
    try {
      const raw = currentUser.profile.availability || '[]'
      currentAvailability = typeof raw === 'string' ? JSON.parse(raw) : raw
    } catch {}

    const otherProfiles = await prisma.profile.findMany({
      where: {
        userId: { not: userId },
      },
      include: { user: true },
    })

    const candidates = otherProfiles
      .map((profile: any) => {
        let embedding: number[] = []
        try {
          embedding = JSON.parse(profile.embedding || '[]')
        } catch {}

        // Filter by overlapping availability
        if (currentAvailability.length > 0) {
          let otherAvailability: string[] = []
          try {
            const raw = profile.availability || '[]'
            otherAvailability = typeof raw === 'string' ? JSON.parse(raw) : raw
          } catch {}
          // Both must have availability set AND share at least one period
          if (otherAvailability.length === 0) return null
          const hasOverlap = currentAvailability.some((p) =>
            otherAvailability.includes(p)
          )
          if (!hasOverlap) return null
        }

        // Get other availability for response
        let otherAvailability: string[] = []
        try {
          const raw = profile.availability || '[]'
          otherAvailability = typeof raw === 'string' ? JSON.parse(raw) : raw
        } catch {}

        // Calculate similarity (0 if either has no embedding)
        let similarity = 0
        if (currentEmbedding.length > 0 && embedding.length > 0) {
          similarity = cosineSimilarity(currentEmbedding, embedding)
        }

        return {
          userId: profile.userId,
          name: profile.user.name,
          role: profile.role,
          company: profile.company,
          industry: profile.industry,
          twinSummary: profile.twinSummary,
          networkingGoal: profile.networkingGoal,
          availability: otherAvailability,
          similarity: Math.round(similarity * 100),
        }
      })
      .filter(Boolean)
      .sort((a: any, b: any) => b.similarity - a.similarity)
      .slice(0, 20)

    return NextResponse.json({
      success: true,
      candidates,
    })
  } catch (error) {
    console.error('Candidates error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to get candidates' },
      { status: 500 }
    )
  }
}
