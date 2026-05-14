'use client'

import { use } from 'react'
import { MatchDetail } from '@/components/MatchDetail'

export default function MatchDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  return (
    <main className="min-h-screen bg-background">
      <MatchDetail matchId={id} />
    </main>
  )
}
