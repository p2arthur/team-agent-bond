# Agent Bond — Team Onboarding Guide

## Project Overview

**Agent Bond** is an AI-powered networking agent for conferences and events. It acts as a lightweight digital twin for each attendee, helping them find the right people to meet and providing conversation starters.

**Hackathon Goal:** Build a working MVP in 3 days that allows users to create a profile, define networking goals, and receive suggested people to connect with.

---

## Quick Start

### Prerequisites

1. Node.js 18+ installed
2. OpenRouter API key (for AI features)
3. Git

### Setup (5 minutes)

```bash
# 1. Clone and setup
git clone <repo>
cd agent-bond
npm install

# 2. Add environment variables
# Create .env.local with:
# DATABASE_URL="file:./dev.db"
# OPENROUTER_API_KEY="your-key-here"

# 3. Push database schema
npx prisma db push
npx prisma generate

# 4. Run development server
npm run dev
```

### First Steps

1. Visit `http://localhost:3000`
2. Click "Load Sample Attendees" (loads 15 realistic attendee profiles)
3. Click "Get Started" and create your profile
4. Paste your LinkedIn bio → AI extracts your profile
5. Review and edit the extracted information
6. Generate your digital twin
7. Get matched with 3-5 relevant attendees
8. Click on a match to see conversation starters and book a meeting

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────┐
│              Next.js 14 (App Router)                │
│                                                     │
│  Pages (React Server Components)                    │
│  - /          → Landing page                        │
│  - /profile   → Create profile                      │
│  - /twin      → Digital twin summary                │
│  - /matches   → Match dashboard                     │
│  - /matches/[id] → Match detail                     │
│                                                     │
│  API Routes (Server-side)                           │
│  - /api/profile/extract  → LinkedIn → AI extraction │
│  - /api/profile          → Save profile + twin      │
│  - /api/match            → Generate matches         │
│  - /api/match/[userId]   → Get cached matches       │
│  - /api/calendar-link    → Generate Google Calendar │
│  - /api/seed             → Load sample attendees    │
│                                                     │
│  ┌──────────────────────────────────────────────┐   │
│  │  Prisma ORM + SQLite                          │   │
│  │  Local dev.db, easy to reset for demos       │   │
│  └──────────────────────────────────────────────┘   │
│                                                     │
│  ┌──────────────────────────────────────────────┐   │
│  │  OpenRouter (OpenAI-compatible API)          │   │
│  │  - text-embedding-3-small (embeddings)       │   │
│  │  - gpt-4o-mini (LLM for extraction/ranking)  │   │
│  └──────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────┘
```

---

## Key Concepts

### Digital Twin

A "digital twin" is a concise, AI-generated summary of who you are professionally and what you're looking for at the event. It's generated from your profile data and used for matching.

Example:
> "Maya Chen is an AI Governance Lead with deep expertise in responsible AI frameworks and regulatory compliance. She's looking to connect with organizations building AI governance structures and can offer 10 years of policy experience plus connections to key regulatory bodies."

### Hybrid Matching Algorithm

The matching process uses two phases:

**Phase 1: Vector Similarity**
- Each profile is converted to a vector embedding (array of floats)
- We compute cosine similarity between your profile and all other profiles
- Top 10 candidates are selected based on vector similarity

**Phase 2: LLM Ranking**
- The top 10 candidates are sent to GPT-4o-mini
- The LLM evaluates goal alignment, skills match, conversation potential
- Returns top 3-5 matches with scores (0-100) and explanations
- Results are cached in the database

### Conversation Openers

For each match, the LLM generates 3 suggested conversation starters. These are shown on the match detail page and help break the ice.

---

## Data Model

### User
Represents a person attending the event.

| Field | Type | Description |
|-------|------|-------------|
| id | string | Unique identifier (CUID) |
| name | string | Attendee's name |
| linkedInUrl | string? | Optional LinkedIn URL |
| createdAt | datetime | When profile was created |

### Profile
The AI-enriched profile extracted from LinkedIn or user input.

| Field | Type | Description |
|-------|------|-------------|
| userId | string | FK to User |
| role | string | Job title (AI extracted) |
| company | string? | Company name (AI extracted) |
| industry | string? | Industry (AI inferred) |
| skills | JSON array | Professional skills |
| interests | JSON array | Professional interests |
| networkingGoal | string | What they want from the event |
| lookingFor | string | Who they want to meet |
| canOffer | string | What value they bring |
| preferredTopics | JSON array | Topics they enjoy discussing |
| twinSummary | string | AI-generated summary |
| embedding | JSON array | Vector embedding for matching |

### Match
Represents a connection recommendation.

| Field | Type | Description |
|-------|------|-------------|
| userId | string | Current user's ID |
| matchedUserId | string | Suggested match's ID |
| score | float | Match score (0-100) |
| reason | string | AI-generated explanation |

### ConversationStarter
Suggested conversation openers for a match.

| Field | Type | Description |
|-------|------|-------------|
| matchId | string | FK to Match |
| text | string | The conversation starter |
| order | int | Display order (1, 2, 3) |

---

## File Structure

```
src/
├── app/
│   ├── layout.tsx                 # Global layout + navigation
│   ├── page.tsx                   # Landing page
│   ├── profile/
│   │   └── page.tsx               # Profile creation
│   ├── twin/
│   │   └── page.tsx               # Digital twin summary
│   ├── matches/
│   │   ├── page.tsx               # Match dashboard
│   │   └── [id]/
│   │       └── page.tsx           # Match detail
│   └── api/
│       ├── profile/
│       │   ├── extract/route.ts   # LinkedIn → AI extraction
│       │   └── route.ts           # Profile save + twin gen
│       ├── match/
│       │   ├── route.ts           # Trigger matching
│       │   └── [userId]/route.ts  # Get cached matches
│       ├── calendar-link/route.ts # Generate Google Cal URL
│       └── seed/route.ts          # Load sample data
├── lib/
│   ├── prisma.ts                  # DB client singleton
│   ├── openrouter.ts              # OpenRouter client
│   ├── matching.ts                # Matching algorithm
│   ├── embedding.ts               # Embedding utilities
│   └── seed-data.ts               # Sample attendees
├── components/
│   ├── ProfileForm.tsx            # Profile creation form
│   ├── TwinSummary.tsx            # Twin summary display
│   ├── MatchCard.tsx              # Match card component
│   ├── MatchDetail.tsx            # Match detail view
│   ├── ConversationStarters.tsx   # Conversation starters
│   └── LoadingSpinner.tsx         # Loading state
└── prisma/
    ├── schema.prisma              # Database schema
    └── dev.db                     # SQLite database
```

---

## API Reference

### `POST /api/profile/extract`

Extracts profile fields from LinkedIn content using AI.

**Request:**
```json
{
  "linkedInText": "Paste your LinkedIn profile text here..."
}
```

**Response:**
```json
{
  "success": true,
  "profile": {
    "role": "VP of Engineering",
    "company": "TechCorp",
    "industry": "Technology",
    "skills": ["...", "..."],
    "interests": ["...", "..."],
    "networkingGoal": "...",
    "lookingFor": "...",
    "canOffer": "...",
    "preferredTopics": ["...", "..."]
  }
}
```

---

### `POST /api/profile`

Saves a profile and generates digital twin summary + embedding.

**Request:**
```json
{
  "name": "Jane Doe",
  "linkedInUrl": "https://linkedin.com/in/janedoe",
  "role": "VP of Engineering",
  "company": "TechCorp",
  "industry": "Technology",
  "skills": ["...", "..."],
  "interests": ["...", "..."],
  "networkingGoal": "...",
  "lookingFor": "...",
  "canOffer": "...",
  "preferredTopics": ["...", "..."]
}
```

**Response:**
```json
{
  "success": true,
  "user": { "id": "...", "name": "Jane Doe" },
  "twinSummary": "Jane is a VP of Engineering..."
}
```

---

### `POST /api/match`

Generates matches for a user.

**Request:**
```json
{
  "userId": "user-id"
}
```

**Response:**
```json
{
  "success": true,
  "matches": [
    {
      "id": "match-id",
      "user": { "id": "...", "name": "...", "role": "...", ... },
      "score": 89,
      "reason": "Maya is working on AI governance...",
      "starters": ["...", "...", "..."]
    }
  ]
}
```

---

### `GET /api/match/[userId]`

Gets cached matches for a user.

**Response:** Same as `POST /api/match`

---

### `GET /api/calendar-link`

Generates a Google Calendar event URL.

**Query params:**
- `title` - Event title
- `details` - Event description
- `date` - ISO date string
- `duration` - Duration in minutes

**Response:**
```json
{
  "url": "https://calendar.google.com/calendar/render?..."
}
```

---

### `POST /api/seed`

Loads sample attendees into the database.

**Response:**
```json
{
  "success": true,
  "message": "Seeded 15 attendees"
}
```

---

## Environment Variables

```env
# .env.local
DATABASE_URL="file:./dev.db"
OPENROUTER_API_KEY="sk-or-your-key-here"
```

Get your OpenRouter API key at https://openrouter.ai/keys

---

## Common Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npx prisma studio` | Browse database in UI |
| `npx prisma db push` | Push schema changes |
| `npx prisma generate` | Regenerate Prisma client |
| `curl -X POST http://localhost:3000/api/seed` | Load sample data |

---

## Demo Script

### 1. Load Sample Data (30 seconds)
1. Visit `http://localhost:3000`
2. Click "Load Sample Attendees"
3. See confirmation message

### 2. Create Your Profile (2 minutes)
1. Click "Get Started"
2. Enter your name
3. Paste your LinkedIn bio or profile text
4. Click "Extract Profile with AI"
5. Review and edit the AI-extracted fields
6. Click "Generate My Digital Twin"

### 3. View Your Digital Twin (30 seconds)
1. Read your networking identity summary
2. See your skills and interests tags
3. Review your networking goals

### 4. Find Matches (1 minute)
1. Click "Find My Matches"
2. Wait for matching (2-3 seconds)
3. See 3-5 match cards with scores

### 5. View Match Details (2 minutes)
1. Click on a match card
2. Read "Why you should meet" explanation
3. Review 3 suggested conversation starters
4. Click "Book a Meeting" to open Google Calendar

---

## Troubleshooting

### Prisma errors
```bash
npx prisma db push
npx prisma generate
```

### Port already in use
Change the port: `PORT=3001 npm run dev`

### OpenRouter API errors
Check your `.env.local` has `OPENROUTER_API_KEY` set correctly.

### Database needs reset
Delete `prisma/dev.db` and run `npx prisma db push`

---

## Next Steps

After the hackathon, potential improvements:
- Real-time chat between matches
- Multiple event support
- Organizer dashboard for attendee analytics
- Advanced privacy controls
- Real-time availability scheduling
