import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { seedAttendees } from '@/lib/seed-data'
import { generateEmbedding, profileToEmbeddingText } from '@/lib/embedding'

export async function POST() {
  try {
    await prisma.conversation.deleteMany()
    await prisma.conversationStarter.deleteMany()
    await prisma.match.deleteMany()
    await prisma.profile.deleteMany()
    await prisma.user.deleteMany()

    for (const attendee of seedAttendees) {
      const user = await prisma.user.create({
        data: {
          name: attendee.name,
        },
      })

      const profileData = {
        role: attendee.role,
        company: attendee.company,
        industry: attendee.industry,
        skills: JSON.stringify(attendee.skills),
        interests: JSON.stringify(attendee.interests),
        networkingGoal: attendee.networkingGoal,
        lookingFor: attendee.lookingFor,
        canOffer: attendee.canOffer,
        preferredTopics: JSON.stringify(attendee.preferredTopics),
      }

      let embedding: number[] = []
      try {
        const embeddingText = profileToEmbeddingText(profileData as any)
        embedding = await generateEmbedding(embeddingText)
      } catch (err) {
        console.error(`Embedding failed for ${attendee.name}:`, err)
      }

      await prisma.profile.create({
        data: {
          userId: user.id,
          ...profileData,
          availability: JSON.stringify(attendee.availability || []),
          embedding: embedding.length > 0 ? JSON.stringify(embedding) : null,
        },
      })
    }

    return NextResponse.json({
      success: true,
      message: `Seeded ${seedAttendees.length} attendees`,
    })
  } catch (error) {
    console.error('Seed error:', error)
    return NextResponse.json(
      { success: false, error: `Failed to seed database: ${error instanceof Error ? error.message : String(error)}` },
      { status: 500 }
    )
  }
}
