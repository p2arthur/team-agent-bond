import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const profiles = await prisma.profile.findMany({
      where: { availability: { not: null } },
      select: { availability: true },
    })

    const counts = { morning: 0, afternoon: 0, evening: 0 }

    for (const profile of profiles) {
      try {
        const periods: string[] = JSON.parse(profile.availability || '[]')
        for (const period of periods) {
          if (period in counts) {
            counts[period as keyof typeof counts]++
          }
        }
      } catch {}
    }

    return NextResponse.json({ success: true, counts })
  } catch (error) {
    console.error('Counts error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch counts' },
      { status: 500 }
    )
  }
}
