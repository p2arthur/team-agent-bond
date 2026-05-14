import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const title = searchParams.get('title') || 'Networking Meeting'
  const details = searchParams.get('details') || ''
  const date = searchParams.get('date') || ''
  const duration = searchParams.get('duration') || '30'

  const startDate = date ? new Date(date) : new Date()
  const endDate = new Date(startDate.getTime() + parseInt(duration) * 60 * 1000)

  const formatDate = (d: Date) =>
    d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')

  const url = new URL('https://calendar.google.com/calendar/render')
  url.searchParams.set('action', 'TEMPLATE')
  url.searchParams.set('text', title)
  url.searchParams.set('details', details)
  url.searchParams.set('dates', `${formatDate(startDate)}/${formatDate(endDate)}`)

  return NextResponse.json({ url: url.toString() })
}
