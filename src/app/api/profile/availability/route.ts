import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const { userId, availability } = await request.json()

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'userId required' },
        { status: 400 }
      )
    }

    if (!Array.isArray(availability)) {
      return NextResponse.json(
        { success: false, error: 'availability must be an array' },
        { status: 400 }
      )
    }

    const validPeriods = ['morning', 'afternoon', 'evening']
    const filtered = availability.filter((p: string) => validPeriods.includes(p))

    await prisma.profile.update({
      where: { userId },
      data: { availability: JSON.stringify(filtered) },
    })

    return NextResponse.json({ success: true, availability: filtered })
  } catch (error) {
    console.error('Availability update error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update availability' },
      { status: 500 }
    )
  }
}
