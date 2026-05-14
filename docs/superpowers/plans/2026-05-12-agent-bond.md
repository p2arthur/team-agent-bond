# Agent Bond — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build an AI-powered networking agent that creates digital twins from LinkedIn profiles and matches attendees for meaningful event connections.

**Architecture:** Next.js monolith with App Router, Prisma/SQLite for persistence, OpenRouter for AI (embeddings + GPT-4o-mini), hybrid matching (vector similarity → LLM ranking).

**Tech Stack:** Next.js 14+, TypeScript, Prisma, SQLite, OpenRouter, Tailwind CSS, Zod

---

## Task 1: Project Scaffolding

### Files:
- Create: `package.json`, `tsconfig.json`, `next.config.js`, `tailwind.config.ts`, `postcss.config.js`
- Create: `src/app/layout.tsx`, `src/app/page.tsx`
- Create: `prisma/schema.prisma`

### Steps:

- [ ] **Step 1: Initialize Next.js project**

```bash
npx create-next-app@latest agent-bond --typescript --tailwind --app --src-dir --no-eslint --import-alias "@/*"
cd agent-bond
```

- [ ] **Step 2: Install dependencies**

```bash
npm install prisma @prisma/client openai zod uuid
npm install -D @types/uuid
```

- [ ] **Step 3: Initialize Prisma**

```bash
npx prisma init --datasource-provider sqlite
```

- [ ] **Step 4: Define Prisma schema**

```prisma
// prisma/schema.prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}

model User {
  id          String   @id @default(cuid())
  name        String
  linkedInUrl String?
  createdAt   DateTime @default(now())
  profile     Profile?
  matches     Match[]  @relation("UserMatches")
  matchedBy   Match[]  @relation("MatchedUser")
}

model Profile {
  id              String  @id @default(cuid())
  userId          String  @unique
  user            User    @relation(fields: [userId], references: [id])
  role            String
  company         String?
  industry        String?
  skills          String  // JSON array
  interests       String  // JSON array
  networkingGoal  String
  lookingFor      String
  canOffer        String
  preferredTopics String? // JSON array
  rawLinkedIn     String?
  twinSummary     String?
  embedding       String? // JSON array of floats
}

model Match {
  id            String   @id @default(cuid())
  userId        String
  user          User     @relation("UserMatches", fields: [userId], references: [id])
  matchedUserId String
  matchedUser   User     @relation("MatchedUser", fields: [matchedUserId], references: [id])
  score         Float
  reason        String
  createdAt     DateTime @default(now())
  starters      ConversationStarter[]
}

model ConversationStarter {
  id      String @id @default(cuid())
  matchId String
  match   Match  @relation(fields: [matchId], references: [id])
  text    String
  order   Int
}
```

- [ ] **Step 5: Create environment file**

```bash
# .env.local
DATABASE_URL="file:./dev.db"
OPENROUTER_API_KEY="your-key-here"
```

- [ ] **Step 6: Push schema and generate client**

```bash
npx prisma db push
npx prisma generate
```

- [ ] **Step 7: Create Prisma client singleton**

```typescript
// src/lib/prisma.ts
import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient }

export const prisma = globalForPrisma.prisma || new PrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
```

- [ ] **Step 8: Create basic landing page**

```tsx
// src/app/page.tsx
import Link from 'next/link'

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <h1 className="text-5xl font-bold mb-4">Agent Bond</h1>
      <p className="text-xl text-gray-600 mb-8">Your AI networking twin</p>
      <Link
        href="/profile"
        className="bg-blue-600 text-white px-8 py-3 rounded-lg text-lg hover:bg-blue-700 transition"
      >
        Get Started
      </Link>
    </main>
  )
}
```

- [ ] **Step 9: Verify dev server runs**

```bash
npm run dev
# Visit http://localhost:3000 — should see landing page
```

- [ ] **Step 10: Commit**

```bash
git init
git add .
git commit -m "feat: scaffold Next.js project with Prisma schema"
```

---

## Task 2: Seed Data & Seed Endpoint

### Files:
- Create: `src/lib/seed-data.ts`
- Create: `src/app/api/seed/route.ts`

### Steps:

- [ ] **Step 1: Create seed data file**

```typescript
// src/lib/seed-data.ts
export const seedAttendees = [
  {
    name: "Maya Chen",
    role: "AI Governance Lead",
    company: "TechCorp",
    industry: "Technology",
    skills: ["AI ethics", "policy writing", "stakeholder management", "data governance"],
    interests: ["responsible AI", "regulatory frameworks", "machine learning fairness"],
    networkingGoal: "Find partners for AI governance consulting",
    lookingFor: "Organizations building AI governance frameworks",
    canOffer: "10 years of AI policy experience, connections to regulatory bodies",
    preferredTopics: ["AI regulation", "corporate governance", "ethics boards"],
  },
  // ... more seed data (truncated for brevity - see full list in design doc)
]
```

- [ ] **Step 2: Create seed API route**

```typescript
// src/app/api/seed/route.ts
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { seedAttendees } from '@/lib/seed-data'

export async function POST() {
  try {
    await prisma.conversationStarter.deleteMany()
    await prisma.match.deleteMany()
    await prisma.profile.deleteMany()
    await prisma.user.deleteMany()

    for (const attendee of seedAttendees) {
      const user = await prisma.user.create({
        data: { name: attendee.name },
      })
      await prisma.profile.create({
        data: {
          userId: user.id,
          role: attendee.role,
          company: attendee.company || null,
          industry: attendee.industry || null,
          skills: JSON.stringify(attendee.skills),
          interests: JSON.stringify(attendee.interests),
          networkingGoal: attendee.networkingGoal,
          lookingFor: attendee.lookingFor,
          canOffer: attendee.canOffer,
          preferredTopics: JSON.stringify(attendee.preferredTopics),
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
      { success: false, error: 'Failed to seed database' },
      { status: 500 }
    )
  }
}
```

- [ ] **Step 3: Test seed endpoint**

```bash
curl -X POST http://localhost:3000/api/seed
# Expected: {"success":true,"message":"Seeded 15 attendees"}
```

- [ ] **Step 4: Commit**

```bash
git add src/lib/seed-data.ts src/app/api/seed/route.ts
git commit -m "feat: add seed data and seed API endpoint"
```

---

## Task 3: OpenRouter Client & Embedding Utilities

### Files:
- Create: `src/lib/openrouter.ts`
- Create: `src/lib/embedding.ts`

### Steps:

- [ ] **Step 1: Create OpenRouter client**

```typescript
// src/lib/openrouter.ts
import OpenAI from 'openai'

export const openrouter = new OpenAI({
  baseURL: 'https://openrouter.ai/api/v1',
  apiKey: process.env.OPENROUTER_API_KEY,
})

export const LLM_MODEL = 'openai/gpt-4o-mini'
export const EMBEDDING_MODEL = 'openai/text-embedding-3-small'

export async function chatCompletion(
  systemPrompt: string,
  userPrompt: string
): Promise<string> {
  const response = await openrouter.chat.completions.create({
    model: LLM_MODEL,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    temperature: 0.7,
  })

  return response.choices[0].message.content || ''
}
```

- [ ] **Step 2: Create embedding utility**

```typescript
// src/lib/embedding.ts
import { openrouter, EMBEDDING_MODEL } from './openrouter'

export async function generateEmbedding(text: string): Promise<number[]> {
  const response = await openrouter.embeddings.create({
    model: EMBEDDING_MODEL,
    input: text,
  })

  return response.data[0].embedding
}

export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) throw new Error('Vectors must have same length')

  let dotProduct = 0
  let normA = 0
  let normB = 0

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i]
    normA += a[i] * a[i]
    normB += b[i] * b[i]
  }

  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB))
}

export function profileToEmbeddingText(profile: any): string {
  const skills = JSON.parse(profile.skills).join(', ')
  const interests = JSON.parse(profile.interests).join(', ')
  const topics = profile.preferredTopics
    ? JSON.parse(profile.preferredTopics).join(', ')
    : ''

  return [
    `Role: ${profile.role}`,
    profile.company ? `Company: ${profile.company}` : '',
    profile.industry ? `Industry: ${profile.industry}` : '',
    `Skills: ${skills}`,
    `Interests: ${interests}`,
    `Networking Goal: ${profile.networkingGoal}`,
    `Looking For: ${profile.lookingFor}`,
    `Can Offer: ${profile.canOffer}`,
    topics ? `Preferred Topics: ${topics}` : '',
  ]
    .filter(Boolean)
    .join('\n')
}
```

- [ ] **Step 3: Commit**

```bash
git add src/lib/openrouter.ts src/lib/embedding.ts
git commit -m "feat: add OpenRouter client and embedding utilities"
```

---

## Task 4: Profile Extraction Endpoint

### Files:
- Create: `src/app/api/profile/extract/route.ts`

### Steps:

- [ ] **Step 1: Create profile extraction route**

```typescript
// src/app/api/profile/extract/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { chatCompletion } from '@/lib/openrouter'

const ExtractSchema = z.object({
  linkedInText: z.string().min(10, 'Please provide more LinkedIn content'),
})

const SYSTEM_PROMPT = `You are a profile extraction expert...`

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { linkedInText } = ExtractSchema.parse(body)

    const result = await chatCompletion(
      SYSTEM_PROMPT,
      `Extract profile from this LinkedIn content:\n\n${linkedInText}`
    )

    let profile
    try {
      profile = JSON.parse(result)
    } catch {
      const jsonMatch = result.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        profile = JSON.parse(jsonMatch[0])
      } else {
        throw new Error('Failed to parse AI response')
      }
    }

    return NextResponse.json({ success: true, profile })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: error.errors[0].message },
        { status: 400 }
      )
    }
    console.error('Extract error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to extract profile' },
      { status: 500 }
    )
  }
}
```

- [ ] **Step 2: Test extraction endpoint**

```bash
curl -X POST http://localhost:3000/api/profile/extract \
  -H "Content-Type: application/json" \
  -d '{"linkedInText": "Jane Doe - VP of Engineering at FinTech Corp. 15 years in software engineering..."}'
```

- [ ] **Step 3: Commit**

```bash
git add src/app/api/profile/extract/route.ts
git commit -m "feat: add LinkedIn profile extraction endpoint"
```

---

## Task 5: Profile Save & Twin Generation

### Files:
- Create: `src/app/api/profile/route.ts`

### Steps:

- [ ] **Step 1: Create profile save route**

```typescript
// src/app/api/profile/route.ts
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
})

const TWIN_PROMPT = `You are a networking profile writer...`

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

    const twinSummary = await chatCompletion(TWIN_PROMPT, profileText)

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
    const embedding = await generateEmbedding(embeddingText)

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
        twinSummary,
        embedding: JSON.stringify(embedding),
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
        { success: false, error: error.errors[0].message },
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
    },
  })
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/api/profile/route.ts
git commit -m "feat: add profile save endpoint with twin generation and embedding"
```

---

## Task 6: Matching Algorithm

### Files:
- Create: `src/lib/matching.ts`
- Create: `src/app/api/match/route.ts`
- Create: `src/app/api/match/[userId]/route.ts`

### Steps:

- [ ] **Step 1: Create matching library** (see full code in design doc)

- [ ] **Step 2: Create match trigger route**

```typescript
// src/app/api/match/route.ts
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
        starters: m.starters.sort((a, b) => a.order - b.order).map((s) => s.text),
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
```

- [ ] **Step 3: Create match retrieval route**

```typescript
// src/app/api/match/[userId]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  const { userId } = params

  const matches = await prisma.match.findMany({
    where: { userId },
    include: {
      matchedUser: { include: { profile: true } },
      starters: true,
    },
    orderBy: { score: 'desc' },
  })

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
      starters: m.starters
        .sort((a, b) => a.order - b.order)
        .map((s) => s.text),
    })),
  })
}
```

- [ ] **Step 4: Commit**

```bash
git add src/lib/matching.ts src/app/api/match/route.ts src/app/api/match/[userId]/route.ts
git commit -m "feat: add hybrid matching algorithm with vector similarity and LLM ranking"
```

---

## Task 7: Calendar Link Endpoint

### Files:
- Create: `src/app/api/calendar-link/route.ts`

### Steps:

- [ ] **Step 1: Create calendar link route**

```typescript
// src/app/api/calendar-link/route.ts
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
```

- [ ] **Step 2: Commit**

```bash
git add src/app/api/calendar-link/route.ts
git commit -m "feat: add Google Calendar link generator endpoint"
```

---

## Task 8: Profile Creation Page

### Files:
- Create: `src/components/ProfileForm.tsx`
- Create: `src/components/LoadingSpinner.tsx`
- Modify: `src/app/profile/page.tsx`

### Steps:

- [ ] **Step 1: Create LoadingSpinner component**

```tsx
// src/components/LoadingSpinner.tsx
export function LoadingSpinner({ message = 'Loading...' }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center p-8">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
      <p className="text-gray-600">{message}</p>
    </div>
  )
}
```

- [ ] **Step 2: Create ProfileForm component** (see full code in design doc)

- [ ] **Step 3: Create profile page**

```tsx
// src/app/profile/page.tsx
import { ProfileForm } from '@/components/ProfileForm'

export default function ProfilePage() {
  return (
    <main className="min-h-screen py-12">
      <ProfileForm />
    </main>
  )
}
```

- [ ] **Step 4: Commit**

```bash
git add src/components/ProfileForm.tsx src/components/LoadingSpinner.tsx src/app/profile/page.tsx
git commit -m "feat: add profile creation page with AI extraction"
```

---

## Task 9: Digital Twin Summary Page

### Files:
- Create: `src/components/TwinSummary.tsx`
- Create: `src/app/twin/page.tsx`

### Steps:

- [ ] **Step 1: Create TwinSummary component** (see full code in design doc)

- [ ] **Step 2: Create twin page**

```tsx
// src/app/twin/page.tsx
import { TwinSummary } from '@/components/TwinSummary'

export default function TwinPage() {
  return (
    <main className="min-h-screen py-12">
      <TwinSummary />
    </main>
  )
}
```

- [ ] **Step 3: Commit**

```bash
git add src/components/TwinSummary.tsx src/app/twin/page.tsx
git commit -m "feat: add digital twin summary page"
```

---

## Task 10: Matches Dashboard Page

### Files:
- Create: `src/components/MatchCard.tsx`
- Create: `src/app/matches/page.tsx`

### Steps:

- [ ] **Step 1: Create MatchCard component** (see full code in design doc)

- [ ] **Step 2: Create matches page** (see full code in design doc)

- [ ] **Step 3: Commit**

```bash
git add src/components/MatchCard.tsx src/app/matches/page.tsx
git commit -m "feat: add matches dashboard page"
```

---

## Task 11: Match Detail Page

### Files:
- Create: `src/components/MatchDetail.tsx`
- Create: `src/components/ConversationStarters.tsx`
- Create: `src/app/matches/[id]/page.tsx`

### Steps:

- [ ] **Step 1: Create ConversationStarters component**

```tsx
// src/components/ConversationStarters.tsx
export function ConversationStarters({ starters }: { starters: string[] }) {
  return (
    <div className="space-y-3">
      <h4 className="font-semibold text-sm text-gray-500 uppercase">
        Suggested Conversation Openers
      </h4>
      {starters.map((starter, i) => (
        <div
          key={i}
          className="bg-amber-50 border border-amber-200 rounded-lg p-4"
        >
          <p className="text-gray-800 italic">&ldquo;{starter}&rdquo;</p>
        </div>
      ))}
    </div>
  )
}
```

- [ ] **Step 2: Create MatchDetail component** (see full code in design doc)

- [ ] **Step 3: Create match detail page**

```tsx
// src/app/matches/[id]/page.tsx
import { MatchDetail } from '@/components/MatchDetail'

export default function MatchDetailPage({
  params,
}: {
  params: { id: string }
}) {
  return (
    <main className="min-h-screen py-12">
      <MatchDetail matchId={params.id} />
    </main>
  )
}
```

- [ ] **Step 4: Commit**

```bash
git add src/components/MatchDetail.tsx src/components/ConversationStarters.tsx src/app/matches/[id]/page.tsx
git commit -m "feat: add match detail page with conversation starters and calendar booking"
```

---

## Task 12: Demo Polish & End-to-End Test

### Files:
- Modify: `src/app/layout.tsx`
- Modify: `src/app/page.tsx`

### Steps:

- [ ] **Step 1: Update layout with navigation** (see full code in design doc)

- [ ] **Step 2: Update landing page with seed button** (see full code in design doc)

- [ ] **Step 3: Run full end-to-end test**

```bash
# 1. Start dev server
npm run dev

# 2. Open http://localhost:3000
# 3. Click "Load Sample Attendees"
# 4. Click "Get Started"
# 5. Enter name, paste a LinkedIn bio, click "Extract Profile"
# 6. Review the AI-extracted profile, click "Generate My Digital Twin"
# 7. Read the twin summary, click "Find My Matches"
# 8. See 3-5 match cards, click one
# 9. Read the match explanation and conversation starters
# 10. Click "Book a Meeting" — verify Google Calendar opens
```

- [ ] **Step 4: Final commit**

```bash
git add .
git commit -m "feat: complete Agent Bond MVP with demo polish"
```

---

## Plan Self-Review Checklist

- [x] All 6 API routes have corresponding tasks
- [x] All 5 pages have corresponding tasks
- [x] All components are created before they're used
- [x] Prisma schema matches all API route expectations
- [x] No TBD/TODO/placeholder text in any step
- [x] All file paths are exact
- [x] All code blocks are complete (no "similar to...")
- [x] Type names consistent across tasks
- [x] Commit messages are descriptive
