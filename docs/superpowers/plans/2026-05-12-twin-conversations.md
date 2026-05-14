# Twin Conversations Implementation Plan

> **For agentic workers:** Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace the current LLM-based matching with a system where AI twins have real-time conversations to determine if people should meet.

**Architecture:** New SSE endpoint streams twin conversations. Matching flow becomes: vector similarity → twin conversations (sequential) → filter by verdict → show results with conversation transcripts.

**Tech Stack:** Next.js App Router, Prisma (SQLite), OpenRouter (GPT-4o-mini), Server-Sent Events, React

---

## File Changes

| File                                     | Action | Purpose                                              |
| ---------------------------------------- | ------ | ---------------------------------------------------- |
| `prisma/schema.prisma`                   | Modify | Add `Conversation` model, update `Match` relation    |
| `src/lib/twin-conversation.ts`           | Create | Core conversation logic with SSE streaming           |
| `src/app/api/twin-conversation/route.ts` | Create | SSE endpoint for streaming conversations             |
| `src/app/api/match/route.ts`             | Modify | Integrate twin conversations into matching flow      |
| `src/lib/matching.ts`                    | Modify | Remove `rankWithLLM`, use twin conversations instead |
| `src/components/ConversationView.tsx`    | Create | Live chat UI component                               |
| `src/components/MatchCard.tsx`           | Modify | Add conversation preview                             |
| `src/app/matches/page.tsx`               | Modify | Show conversation progress during matching           |

---

### Task 1: Update Prisma Schema

**Files:**

- Modify: `prisma/schema.prisma`

- [ ] **Step 1: Add Conversation model**

```prisma
model Conversation {
  id        String   @id @default(cuid())
  matchId   String   @unique
  match     Match    @relation(fields: [matchId], references: [id])
  messages  String   // JSON array of conversation messages
  decision  Boolean  @default(false)
  summary   String?
  createdAt DateTime @default(now())
}
```

- [ ] **Step 2: Update Match model to include conversation**

Add to `Match` model:

```prisma
conversation Conversation?
```

- [ ] **Step 3: Push schema changes**

Run: `npx prisma db push`
Run: `npx prisma generate`

- [ ] **Step 4: Verify build**

Run: `npm run build`

- [ ] **Step 5: Commit**

```bash
git add prisma/schema.prisma
git commit -m "feat: add Conversation model for twin chat"
```

---

### Task 2: Create Twin Conversation Logic

**Files:**

- Create: `src/lib/twin-conversation.ts`

- [ ] **Step 1: Create conversation types**

```typescript
export interface ConversationMessage {
  role: "twin_a" | "twin_b";
  speakerName: string;
  content: string;
  timestamp: number;
}

export interface ConversationVerdict {
  shouldMeet: boolean;
  reason: string;
  sharedInterests: string[];
  conversationTopics: string[];
}

export interface TwinConversationResult {
  messages: ConversationMessage[];
  verdict: ConversationVerdict;
}
```

- [ ] **Step 2: Create conversation system prompt generator**

```typescript
export function buildConversationPrompt(
  userA: { name: string; twinSummary: string | null; networkingGoal: string },
  userB: { name: string; twinSummary: string | null; networkingGoal: string },
): string {
  return `You are simulating a networking conversation between two digital twins at a professional event.

TWIN A (${userA.name}'s twin):
Profile: ${userA.twinSummary || "No summary available"}
Goals: ${userA.networkingGoal}

TWIN B (${userB.name}'s twin):
Profile: ${userB.twinSummary || "No summary available"}
Goals: ${userB.networkingGoal}

Rules:
- Keep conversation natural and professional
- Each message should be 1-2 sentences
- Explore shared interests, complementary skills, and goal alignment
- After 3-4 exchanges each, the twins should naturally conclude
- Be genuine - don't force connections that don't exist

The conversation should feel like two people meeting at a conference cocktail hour.

Respond with ONLY a JSON array of messages in this format:
[
  {"speaker": "twin_a", "name": "${userA.name}'s Twin", "content": "..."},
  {"speaker": "twin_b", "name": "${userB.name}'s Twin", "content": "..."},
  ...
]

Generate exactly 6-8 messages total (3-4 from each twin).`;
}
```

- [ ] **Step 3: Create verdict prompt generator**

```typescript
export function buildVerdictPrompt(
  userA: { name: string; networkingGoal: string },
  userB: { name: string; networkingGoal: string },
  messages: ConversationMessage[],
): string {
  const conversationText = messages
    .map((m) => `${m.speakerName}: ${m.content}`)
    .join("\n");

  return `Based on this conversation between ${userA.name} and ${userB.name}'s digital twins, should the real people meet at the event?

Conversation:
${conversationText}

Respond with ONLY a JSON object:
{
  "shouldMeet": true/false,
  "reason": "One sentence explaining why they should or shouldn't meet",
  "sharedInterests": ["interest1", "interest2"],
  "conversationTopics": ["topic1", "topic2"]
}`;
}
```

- [ ] **Step 4: Create runTwinConversation function**

```typescript
import { chatCompletion } from "./openrouter";

export async function runTwinConversation(
  userA: {
    id: string;
    name: string;
    twinSummary: string | null;
    networkingGoal: string;
  },
  userB: {
    id: string;
    name: string;
    twinSummary: string | null;
    networkingGoal: string;
  },
): Promise<TwinConversationResult> {
  // Generate conversation
  const conversationPrompt = buildConversationPrompt(userA, userB);
  const conversationResult = await chatCompletion(
    "You are a conversation simulator. Generate realistic networking conversations.",
    conversationPrompt,
  );

  // Parse messages
  let rawMessages: Array<{ speaker: string; name: string; content: string }>;
  try {
    rawMessages = JSON.parse(conversationResult);
  } catch {
    const jsonMatch = conversationResult.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      rawMessages = JSON.parse(jsonMatch[0]);
    } else {
      throw new Error("Failed to parse conversation");
    }
  }

  const messages: ConversationMessage[] = rawMessages.map((m, i) => ({
    role: m.speaker as "twin_a" | "twin_b",
    speakerName: m.name,
    content: m.content,
    timestamp: Date.now() + i * 1000,
  }));

  // Generate verdict
  const verdictPrompt = buildVerdictPrompt(userA, userB, messages);
  const verdictResult = await chatCompletion(
    "You are a networking advisor. Evaluate conversations and determine if people should meet.",
    verdictPrompt,
  );

  let verdict: ConversationVerdict;
  try {
    verdict = JSON.parse(verdictResult);
  } catch {
    const jsonMatch = verdictResult.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      verdict = JSON.parse(jsonMatch[0]);
    } else {
      verdict = {
        shouldMeet: false,
        reason: "Could not evaluate conversation",
        sharedInterests: [],
        conversationTopics: [],
      };
    }
  }

  return { messages, verdict };
}
```

- [ ] **Step 5: Verify build**

Run: `npm run build`

- [ ] **Step 6: Commit**

```bash
git add src/lib/twin-conversation.ts
git commit -m "feat: add twin conversation logic"
```

---

### Task 3: Create SSE Conversation Endpoint

**Files:**

- Create: `src/app/api/twin-conversation/route.ts`

- [ ] **Step 1: Create SSE streaming endpoint**

```typescript
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  runTwinConversation,
  ConversationMessage,
} from "@/lib/twin-conversation";

export async function POST(request: NextRequest) {
  const { userId, candidateUserId } = await request.json();

  if (!userId || !candidateUserId) {
    return new Response(
      JSON.stringify({
        success: false,
        error: "userId and candidateUserId required",
      }),
      { status: 400, headers: { "Content-Type": "application/json" } },
    );
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      try {
        // Load both users
        const [userA, userB] = await Promise.all([
          prisma.user.findUnique({
            where: { id: userId },
            include: { profile: true },
          }),
          prisma.user.findUnique({
            where: { id: candidateUserId },
            include: { profile: true },
          }),
        ]);

        if (!userA?.profile || !userB?.profile) {
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({ type: "error", message: "User not found" })}\n\n`,
            ),
          );
          controller.close();
          return;
        }

        const userDataA = {
          id: userA.id,
          name: userA.name,
          twinSummary: userA.profile.twinSummary,
          networkingGoal: userA.profile.networkingGoal,
        };

        const userDataB = {
          id: userB.id,
          name: userB.name,
          twinSummary: userB.profile.twinSummary,
          networkingGoal: userB.profile.networkingGoal,
        };

        // Stream conversation start
        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({ type: "start", userA: userDataA.name, userB: userDataB.name })}\n\n`,
          ),
        );

        // Run conversation
        const result = await runTwinConversation(userDataA, userDataB);

        // Stream each message with delay for live effect
        for (const message of result.messages) {
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({ type: "message", ...message })}\n\n`,
            ),
          );
          await new Promise((resolve) => setTimeout(resolve, 800));
        }

        // Stream verdict
        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({ type: "verdict", ...result.verdict })}\n\n`,
          ),
        );

        // Store conversation if verdict is positive
        if (result.verdict.shouldMeet) {
          // Find or create match
          let match = await prisma.match.findFirst({
            where: { userId, matchedUserId: candidateUserId },
          });

          if (!match) {
            match = await prisma.match.create({
              data: {
                userId,
                matchedUserId: candidateUserId,
                score: 75,
                reason: result.verdict.reason,
              },
            });
          }

          // Store conversation
          await prisma.conversation.upsert({
            where: { matchId: match.id },
            create: {
              matchId: match.id,
              messages: JSON.stringify(result.messages),
              decision: result.verdict.shouldMeet,
              summary: result.verdict.reason,
            },
            update: {
              messages: JSON.stringify(result.messages),
              decision: result.verdict.shouldMeet,
              summary: result.verdict.reason,
            },
          });
        }

        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ type: "complete" })}\n\n`),
        );
        controller.close();
      } catch (error) {
        console.error("Conversation error:", error);
        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({ type: "error", message: "Conversation failed" })}\n\n`,
          ),
        );
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
```

- [ ] **Step 2: Verify build**

Run: `npm run build`

- [ ] **Step 3: Commit**

```bash
git add src/app/api/twin-conversation/route.ts
git commit -m "feat: add SSE endpoint for twin conversations"
```

---

### Task 4: Update Matching Flow

**Files:**

- Modify: `src/lib/matching.ts`
- Modify: `src/app/api/match/route.ts`

- [ ] **Step 1: Update matching.ts to use twin conversations**

Replace the `findMatches` function:

```typescript
export async function findMatches(userId: string) {
  const currentUser = await prisma.user.findUnique({
    where: { id: userId },
    include: { profile: true },
  });

  if (!currentUser || !currentUser.profile) {
    throw new Error("User profile not found");
  }

  const currentEmbedding = JSON.parse(currentUser.profile.embedding || "[]");
  if (currentEmbedding.length === 0) {
    throw new Error("User has no embedding");
  }

  // Get top candidates via vector similarity
  const otherProfiles = await prisma.profile.findMany({
    where: {
      userId: { not: userId },
      embedding: { not: null },
    },
    include: { user: true },
  });

  const candidates = otherProfiles
    .map((profile: any) => {
      const embedding = JSON.parse(profile.embedding || "[]");
      const similarity = cosineSimilarity(currentEmbedding, embedding);
      return {
        userId: profile.userId,
        name: profile.user.name,
        twinSummary: profile.twinSummary,
        networkingGoal: profile.networkingGoal,
        similarity,
      };
    })
    .sort((a: any, b: any) => b.similarity - a.similarity)
    .slice(0, 6);

  // Clear old matches
  await prisma.match.deleteMany({ where: { userId } });

  // Run twin conversations for each candidate
  const matches = [];
  for (const candidate of candidates) {
    try {
      const result = await runTwinConversation(
        {
          id: userId,
          name: currentUser.name,
          twinSummary: currentUser.profile.twinSummary,
          networkingGoal: currentUser.profile.networkingGoal,
        },
        {
          id: candidate.userId,
          name: candidate.name,
          twinSummary: candidate.twinSummary,
          networkingGoal: candidate.networkingGoal,
        },
      );

      if (result.verdict.shouldMeet) {
        const match = await prisma.match.create({
          data: {
            userId,
            matchedUserId: candidate.userId,
            score: Math.round(candidate.similarity * 100),
            reason: result.verdict.reason,
          },
          include: {
            matchedUser: { include: { profile: true } },
            starters: true,
            conversation: true,
          },
        });

        // Store conversation
        await prisma.conversation.create({
          data: {
            matchId: match.id,
            messages: JSON.stringify(result.messages),
            decision: true,
            summary: result.verdict.reason,
          },
        });

        matches.push({ ...match, conversation: result });
      }
    } catch (error) {
      console.error(`Conversation failed for ${candidate.name}:`, error);
      // Skip this candidate
    }
  }

  return matches;
}
```

- [ ] **Step 2: Update match route to return conversation data**

```typescript
// In src/app/api/match/route.ts
return NextResponse.json({
  success: true,
  matches: matches.map((m: any) => ({
    id: m.id,
    user: {
      id: m.matchedUser.id,
      name: m.matchedUser.name,
      role: m.matchedUser.profile?.role,
      company: m.matchedUser.profile?.company,
      industry: m.matchedUser.profile?.industry,
      skills: JSON.parse(m.matchedUser.profile?.skills || "[]"),
      interests: JSON.parse(m.matchedUser.profile?.interests || "[]"),
      twinSummary: m.matchedUser.profile?.twinSummary,
    },
    score: m.score,
    reason: m.reason,
    starters:
      m.starters
        ?.sort((a: any, b: any) => a.order - b.order)
        .map((s: any) => s.text) || [],
    conversation: m.conversation
      ? {
          messages: m.conversation.messages,
          verdict: {
            shouldMeet: m.conversation.decision,
            reason: m.conversation.summary,
          },
        }
      : null,
  })),
});
```

- [ ] **Step 3: Verify build**

Run: `npm run build`

- [ ] **Step 4: Commit**

```bash
git add src/lib/matching.ts src/app/api/match/route.ts
git commit -m "feat: integrate twin conversations into matching flow"
```

---

### Task 5: Create ConversationView Component

**Files:**

- Create: `src/components/ConversationView.tsx`

- [ ] **Step 1: Create the component**

```typescript
'use client'

import { useState, useEffect, useRef } from 'react'

interface ConversationMessage {
  role: 'twin_a' | 'twin_b'
  speakerName: string
  content: string
  timestamp: number
}

interface ConversationViewProps {
  messages: ConversationMessage[]
  isComplete: boolean
  verdict?: { shouldMeet: boolean; reason: string }
  userAName: string
  userBName: string
}

export function ConversationView({
  messages,
  isComplete,
  verdict,
  userAName,
  userBName,
}: ConversationViewProps) {
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  return (
    <div className="bg-gray-50 rounded-xl p-4 max-h-96 overflow-y-auto" ref={scrollRef}>
      <div className="space-y-3">
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex ${msg.role === 'twin_a' ? 'justify-start' : 'justify-end'}`}
          >
            <div
              className={`max-w-[80%] rounded-lg px-4 py-2 ${
                msg.role === 'twin_a'
                  ? 'bg-blue-100 text-blue-900'
                  : 'bg-purple-100 text-purple-900'
              }`}
            >
              <p className="text-lgfont-semibold mb-1 opacity-70">
                {msg.speakerName}
              </p>
              <p className="text-sm">{msg.content}</p>
            </div>
          </div>
        ))}

        {!isComplete && messages.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <div className="animate-pulse">Starting conversation...</div>
          </div>
        )}
      </div>

      {isComplete && verdict && (
        <div
          className={`mt-4 p-3 rounded-lg ${
            verdict.shouldMeet
              ? 'bg-green-100 border border-green-300'
              : 'bg-gray-100 border border-gray-300'
          }`}
        >
          <p className="text-sm font-semibold">
            {verdict.shouldMeet ? '✅ Twins recommend meeting' : '⏭️ Not a strong match'}
          </p>
          <p className="text-lgtext-gray-600 mt-1">{verdict.reason}</p>
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Verify build**

Run: `npm run build`

- [ ] **Step 3: Commit**

```bash
git add src/components/ConversationView.tsx
git commit -m "feat: add ConversationView component"
```

---

### Task 6: Update Matches Page with Live Conversations

**Files:**

- Modify: `src/app/matches/page.tsx`

- [ ] **Step 1: Rewrite matches page with conversation flow**

```typescript
'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { MatchCard } from '@/components/MatchCard'
import { ConversationView } from '@/components/ConversationView'

interface ConversationMessage {
  role: 'twin_a' | 'twin_b'
  speakerName: string
  content: string
  timestamp: number
}

interface Candidate {
  userId: string
  name: string
}

interface ActiveConversation {
  candidate: Candidate
  messages: ConversationMessage[]
  isComplete: boolean
  verdict?: { shouldMeet: boolean; reason: string }
}

export default function MatchesPage() {
  const router = useRouter()
  const [matches, setMatches] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [phase, setPhase] = useState<'loading' | 'conversations' | 'results'>('loading')
  const [activeConversation, setActiveConversation] = useState<ActiveConversation | null>(null)
  const [completedCount, setCompletedCount] = useState(0)
  const [totalCandidates, setTotalCandidates] = useState(0)

  useEffect(() => {
    const userId = localStorage.getItem('userId')
    if (!userId) {
      router.push('/profile')
      return
    }

    // First try to get cached matches
    fetch(`/api/match/${userId}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.matches.length > 0) {
          setMatches(data.matches)
          setPhase('results')
          setLoading(false)
        } else {
          // Start matching with conversations
          startMatching(userId)
        }
      })
      .catch(() => startMatching(userId))
  }, [router])

  const startMatching = async (userId: string) => {
    setPhase('conversations')
    setLoading(false)

    try {
      // Get candidates first
      const matchRes = await fetch('/api/match', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      })
      const matchData = await matchRes.json()

      if (matchData.success) {
        setMatches(matchData.matches)
        setPhase('results')
      }
    } catch (err) {
      console.error('Matching failed:', err)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  if (phase === 'conversations') {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <h2 className="text-2xl font-bold mb-4 text-center">Finding Your Matches</h2>
        <p className="text-gray-600 text-center mb-8">
          Your digital twin is meeting {totalCandidates} potential connections...
        </p>

        {activeConversation && (
          <div className="mb-6">
            <h3 className="font-semibold mb-2">
              Conversation with {activeConversation.candidate.name}'s Twin
            </h3>
            <ConversationView
              messages={activeConversation.messages}
              isComplete={activeConversation.isComplete}
              verdict={activeConversation.verdict}
              userAName="You"
              userBName={activeConversation.candidate.name}
            />
          </div>
        )}

        <div className="text-center text-sm text-gray-500">
          {completedCount} of {totalCandidates} conversations complete
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h2 className="text-3xl font-bold mb-2 text-center">Your Top Connections</h2>
      <p className="text-gray-600 text-center mb-8">
        {matches.length} people you should meet at this event
      </p>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {matches.map((match) => (
          <MatchCard key={match.id} match={match} />
        ))}
      </div>

      {matches.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">
            No strong matches found. Your twin didn't recommend any meetings.
          </p>
          <button
            onClick={() => router.push('/profile')}
            className="mt-4 text-blue-600 hover:underline"
          >
            Update Profile
          </button>
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Verify build**

Run: `npm run build`

- [ ] **Step 3: Commit**

```bash
git add src/app/matches/page.tsx
git commit -m "feat: update matches page with conversation UI"
```

---

### Task 7: Update MatchCard with Conversation Preview

**Files:**

- Modify: `src/components/MatchCard.tsx`

- [ ] **Step 1: Add conversation preview to MatchCard**

```typescript
import Link from 'next/link'
import { useState } from 'react'

interface MatchCardProps {
  match: {
    id: string
    user: {
      id: string
      name: string
      role: string
      company: string | null
      industry: string | null
      skills: string[]
      twinSummary: string | null
    }
    score: number
    reason: string
    conversation?: {
      messages: Array<{ role: string; speakerName: string; content: string }>
      verdict: { shouldMeet: boolean; reason: string }
    }
  }
}

export function MatchCard({ match }: MatchCardProps) {
  const [expanded, setExpanded] = useState(false)

  return (
    <div className="bg-white rounded-xl border hover:shadow-lg hover:border-blue-200 transition-all overflow-hidden">
      <Link href={`/matches/${match.id}`} className="block p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-indigo-600 rounded-full flex items-center justify-center text-white text-lg font-bold">
              {match.user.name.charAt(0)}
            </div>
            <div>
              <h3 className="font-bold text-lg">{match.user.name}</h3>
              <p className="text-gray-600 text-sm">
                {match.user.role}
                {match.user.company && ` at ${match.user.company}`}
              </p>
            </div>
          </div>
          <div className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-bold">
            {Math.round(match.score)}%
          </div>
        </div>

        <p className="text-gray-700 text-sm mb-4 line-clamp-2">{match.reason}</p>

        <div className="flex flex-wrap gap-2">
          {match.user.skills.slice(0, 4).map((skill) => (
            <span
              key={skill}
              className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs"
            >
              {skill}
            </span>
          ))}
          {match.user.skills.length > 4 && (
            <span className="text-gray-500 text-xs">
              +{match.user.skills.length - 4} more
            </span>
          )}
        </div>
      </Link>

      {match.conversation && (
        <div className="border-t">
          <button
            onClick={(e) => {
              e.preventDefault()
              setExpanded(!expanded)
            }}
            className="w-full px-6 py-3 text-sm text-blue-600 hover:bg-gray-50 flex items-center justify-between"
          >
            <span>View Twin Conversation</span>
            <span>{expanded ? '▲' : '▼'}</span>
          </button>

          {expanded && (
            <div className="px-6 pb-4 max-h-48 overflow-y-auto">
              <div className="space-y-2">
                {match.conversation.messages.map((msg, i) => (
                  <div
                    key={i}
                    className={`text-lgp-2 rounded ${
                      msg.role === 'twin_a'
                        ? 'bg-blue-50 text-blue-800'
                        : 'bg-purple-50 text-purple-800'
                    }`}
                  >
                    <span className="font-semibold">{msg.speakerName}: </span>
                    {msg.content}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Verify build**

Run: `npm run build`

- [ ] **Step 3: Commit**

```bash
git add src/components/MatchCard.tsx
git commit -m "feat: add conversation preview to MatchCard"
```

---

### Task 8: Final Integration Test

- [ ] **Step 1: Reset database and seed data**

```bash
rm prisma/dev.db
npx prisma db push
curl -X POST http://localhost:3000/api/seed
```

- [ ] **Step 2: Create a test profile**

Go to `http://localhost:3000/profile` and create a profile.

- [ ] **Step 3: Test matching flow**

Go to `http://localhost:3000/matches` and verify:

- Conversations appear with live streaming
- Verdicts show for each conversation
- Only "should meet" matches appear in results
- MatchCard shows conversation preview

- [ ] **Step 4: Run build**

Run: `npm run build`

- [ ] **Step 5: Final commit**

```bash
git add .
git commit -m "feat: complete twin conversation matching system"
```
