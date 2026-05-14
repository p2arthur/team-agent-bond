import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json()

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'userId required' },
        { status: 400 }
      )
    }

    await prisma.conversation.deleteMany({
      where: { match: { userId } },
    })
    await prisma.conversationStarter.deleteMany({
      where: { match: { userId } },
    })
    await prisma.match.deleteMany({
      where: { userId },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Clear matches error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to clear matches' },
      { status: 500 }
    )
  }
}
