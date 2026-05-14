import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { chatCompletion } from '@/lib/openrouter'
import { generateEmbedding, profileToEmbeddingText } from '@/lib/embedding'

const ProfileSchema = z.object({
  name: z.string().min(1),
  linkedInUrl: z.string().optional(),
  role: z.string().min(1),
  company: z.string().optional(),
  industry: z.string().optional(),
  skills: z.array(z.string()).min(1),
  interests: z.array(z.string()).min(1),
  networkingGoal: z.string().min(1),
  lookingFor: z.string().min(1),
  canOffer: z.string().min(1),
  preferredTopics: z.array(z.string()).optional(),
  availability: z.array(z.string()).optional(),
})

const TWIN_PROMPT = `You are a networking profile writer. Given a person's professional details, write a concise "networking twin" summary — a 2-3 sentence paragraph that captures who they are, what they're looking for, and what they bring to the table. Write in third person. Make it engaging and conversation-ready.`

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const data = ProfileSchema.parse(body)

    const user = await prisma.user.create({
      data: {
        name: data.name,
        linkedInUrl: data.linkedInUrl || null,
      },
    })

    const profileText = [
      `Name: ${data.name}`,
      `Role: ${data.role}`,
      data.company ? `Company: ${data.company}` : '',
      data.industry ? `Industry: ${data.industry}` : '',
      `Skills: ${data.skills.join(', ')}`,
      `Interests: ${data.interests.join(', ')}`,
      `Networking Goal: ${data.networkingGoal}`,
      `Looking For: ${data.lookingFor}`,
      `Can Offer: ${data.canOffer}`,
      data.preferredTopics?.length
        ? `Preferred Topics: ${data.preferredTopics.join(', ')}`
        : '',
    ]
      .filter(Boolean)
      .join('\n')

    let twinSummary = ''
    try {
      twinSummary = await chatCompletion(TWIN_PROMPT, profileText)
    } catch (err) {
      console.error('Twin summary generation failed:', err)
      twinSummary = `${data.name} is a ${data.role}${data.company ? ` at ${data.company}` : ''} looking to connect with others who share their interest in ${(data.skills[0] || data.interests[0] || 'technology').toLowerCase()}.`
    }

    let embedding: number[] = []
    try {
      const profileForEmbedding = {
        role: data.role,
        company: data.company,
        industry: data.industry,
        skills: JSON.stringify(data.skills),
        interests: JSON.stringify(data.interests),
        networkingGoal: data.networkingGoal,
        lookingFor: data.lookingFor,
        canOffer: data.canOffer,
        preferredTopics: data.preferredTopics
          ? JSON.stringify(data.preferredTopics)
          : null,
      }

      const embeddingText = profileToEmbeddingText(profileForEmbedding)
      embedding = await generateEmbedding(embeddingText)
    } catch (err) {
      console.error('Embedding generation failed:', err)
    }

    const profile = await prisma.profile.create({
      data: {
        userId: user.id,
        role: data.role,
        company: data.company || null,
        industry: data.industry || null,
        skills: JSON.stringify(data.skills),
        interests: JSON.stringify(data.interests),
        networkingGoal: data.networkingGoal,
        lookingFor: data.lookingFor,
        canOffer: data.canOffer,
        preferredTopics: data.preferredTopics
          ? JSON.stringify(data.preferredTopics)
          : null,
        availability: data.availability
          ? JSON.stringify(data.availability)
          : null,
        twinSummary,
        embedding: embedding.length > 0 ? JSON.stringify(embedding) : null,
      },
    })

    return NextResponse.json({
      success: true,
      user: { id: user.id, name: user.name },
      profile: {
        ...profile,
        skills: data.skills,
        interests: data.interests,
        preferredTopics: data.preferredTopics,
      },
      twinSummary,
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: error.issues[0].message },
        { status: 400 }
      )
    }
    console.error('Profile save error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to save profile' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const userId = searchParams.get('userId')

  if (!userId) {
    return NextResponse.json(
      { success: false, error: 'userId required' },
      { status: 400 }
    )
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { profile: true },
  })

  if (!user || !user.profile) {
    return NextResponse.json(
      { success: false, error: 'Profile not found' },
      { status: 404 }
    )
  }

  return NextResponse.json({
    success: true,
    user: { id: user.id, name: user.name },
    profile: {
      ...user.profile,
      skills: JSON.parse(user.profile.skills),
      interests: JSON.parse(user.profile.interests),
      preferredTopics: user.profile.preferredTopics
        ? JSON.parse(user.profile.preferredTopics)
        : [],
      availability: user.profile.availability
        ? JSON.parse(user.profile.availability)
        : [],
    },
  })
}
