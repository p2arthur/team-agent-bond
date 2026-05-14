# Agent Bond — Design Document

**Date:** 2026-05-12
**Project:** Networking Agent / Digital Twin for Events
**Stack:** Next.js + Prisma/SQLite + OpenRouter + Tailwind CSS

---

## Problem

At conferences and events, people struggle to find the right people to meet, start meaningful conversations, and make the most of networking opportunities.

## Solution

An AI-powered networking agent that acts as a lightweight digital twin for each attendee. Users provide their LinkedIn profile, the AI extracts and enriches their profile, then compares it against other attendees to recommend the best connections — with explanations and conversation starters.

---

## Architecture

```
┌─────────────────────────────────────────────────────┐
│                    Next.js App                       │
│                                                     │
│  ┌──────────┐  ┌──────────┐  ┌──────────────────┐  │
│  │  Pages    │  │  Server  │  │  API Routes      │  │
│  │  (React)  │  │  Actions │  │  /api/profiles   │  │
│  │           │  │          │  │  /api/match       │  │
│  │ - Onboard │  │ - Match  │  │  /api/twin        │  │
│  │ - Dashboard│  │ - Embed  │  │  /api/calendar    │  │
│  │ - Match   │  │ - Seed   │  │                  │  │
│  └──────────┘  └──────────┘  └──────────────────┘  │
│                                                     │
│  ┌──────────────────────────────────────────────┐   │
│  │           Prisma ORM + SQLite                │   │
│  │  User | Profile | Match | ConversationStarter│   │
│  └──────────────────────────────────────────────┘   │
│                                                     │
│  ┌──────────────────────────────────────────────┐   │
│  │           OpenRouter API                     │   │
│  │  - Embeddings (vector similarity)            │   │
│  │  - GPT-4o-mini (extraction, summary, ranking)│   │
│  └──────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────┘
```

---

## Data Model

```
User
  id            uuid
  name          string
  linkedInUrl   string
  createdAt     datetime

Profile
  id              uuid
  userId          FK → User
  role            string          (AI extracted)
  company         string          (AI extracted)
  industry        string          (AI inferred)
  skills          JSON array      (AI extracted)
  interests       JSON array      (AI extracted/inferred)
  networkingGoal  string          (AI suggested, user edits)
  lookingFor      string          (AI suggested, user edits)
  canOffer        string          (AI suggested, user edits)
  preferredTopics JSON array      (AI suggested)
  rawLinkedIn     string          (stored raw input)
  twinSummary     string          (AI-generated)
  embedding       JSON array      (vector for matching)

Match
  id              uuid
  userId          FK → User
  matchedUserId   FK → User
  score           float (0-100)
  reason          string (AI-generated)
  createdAt       datetime

ConversationStarter
  id              uuid
  matchId         FK → Match
  text            string
  order           int (1, 2, 3)
```

---

## User Flow

1. **Landing page** — "Agent Bond — Your AI networking twin" with Get Started button
2. **Profile creation** — Enter name, paste LinkedIn URL or text, AI extracts profile fields, user reviews/edits pre-filled form
3. **Digital twin summary** — AI generates a "networking identity" summary
4. **Matches dashboard** — Top 3-5 connections shown as cards with match scores
5. **Match detail** — Full explanation of why they should meet, 3 conversation starters, "Book a Meeting" button (Google Calendar link)

---

## Matching Algorithm

### Phase 1: Vector Similarity (fast shortlist)

- Generate embedding for each profile via OpenRouter embeddings API
- Compute cosine similarity between current user and all others in-memory
- Return top 10 candidates

### Phase 2: LLM Ranking (smart final picks)

- Send top 10 candidates + user profile to GPT-4o-mini
- LLM evaluates goal alignment, complementary skills, conversation potential
- Returns top 3-5 matches with scores, explanations, and conversation starters
- Results cached in Match + ConversationStarter tables

### Score Weighting (LLM prompt-guided)

| Factor | Weight |
|--------|--------|
| Shared interests | 30% |
| Goal alignment | 30% |
| Skills match | 20% |
| Industry relevance | 10% |
| Conversation topic overlap | 10% |

---

## API Routes

| Route | Method | Purpose |
|-------|--------|---------|
| `/api/profile/extract` | POST | LinkedIn → AI extraction → profile fields |
| `/api/profile` | POST | Save profile, generate twin + embedding |
| `/api/profile/:id` | GET | Fetch profile + twin summary |
| `/api/match` | POST | Run matching (vector + LLM) for a user |
| `/api/match/:userId` | GET | Fetch cached matches |
| `/api/calendar-link` | GET | Generate Google Calendar pre-filled link |
| `/api/seed` | POST | Seed database with sample attendees |

---

## Tech Stack

| Layer | Choice |
|-------|--------|
| Framework | Next.js 14+ (App Router) |
| Language | TypeScript |
| Database | SQLite via Prisma ORM |
| AI | OpenRouter (GPT-4o-mini + embeddings) |
| Styling | Tailwind CSS |
| Validation | Zod |

---

## Key Dependencies

`next`, `react`, `@prisma/client`, `openai` (OpenRouter-compatible), `tailwindcss`, `zod`, `uuid`

---

## Project Structure

```
src/
├── app/
│   ├── layout.tsx                 (global layout + nav)
│   ├── page.tsx                   (landing)
│   ├── profile/page.tsx           (create/edit profile)
│   ├── twin/page.tsx              (digital twin summary)
│   ├── matches/page.tsx           (match dashboard)
│   ├── matches/[id]/page.tsx      (match detail)
│   └── api/
│       ├── profile/extract/route.ts
│       ├── profile/route.ts
│       ├── match/route.ts
│       ├── match/[userId]/route.ts
│       ├── calendar-link/route.ts
│       └── seed/route.ts
├── lib/
│   ├── prisma.ts                  (DB client singleton)
│   ├── openrouter.ts              (AI client wrapper)
│   ├── matching.ts                (vector + LLM matching)
│   ├── embedding.ts               (embedding generation)
│   └── seed-data.ts               (sample attendees)
├── components/
│   ├── ProfileForm.tsx
│   ├── TwinSummary.tsx
│   ├── MatchCard.tsx
│   ├── MatchDetail.tsx
│   ├── ConversationStarters.tsx
│   └── LoadingSpinner.tsx
└── prisma/
    ├── schema.prisma
    └── dev.db
```

---

## Environment Variables

```env
DATABASE_URL="file:./dev.db"
OPENROUTER_API_KEY="sk-or-..."
```
