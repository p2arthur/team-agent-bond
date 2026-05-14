# Agent Bond

Your AI-powered networking twin for events.

## Overview

At conferences and events, people often struggle to find the right people to meet, start meaningful conversations, and make the most of networking opportunities.

Agent Bond is an AI-powered networking agent that acts as a lightweight digital twin for each attendee. It helps users describe who they are, what they are looking for, and who they should connect with at the event.

## Quick Start

```bash
# 1. Clone and setup
git clone <repo>
cd agent-bond
npm install

# 2. Add environment variables
echo 'DATABASE_URL="file:./dev.db"' > .env.local
echo 'OPENROUTER_API_KEY="your-key-here"' >> .env.local

# 3. Setup database
npx prisma db push
npx prisma generate

# 4. Run development server
npm run dev
```

Visit `http://localhost:3000` and click "Load Sample Attendees" to get started!

## Features

- **AI Profile Extraction** — Paste your LinkedIn bio and AI extracts your profile
- **Digital Twin Generation** — AI creates a concise networking identity summary
- **Smart Matching** — Hybrid vector + LLM matching finds the best connections
- **Conversation Starters** — Get 3 suggested openers for each match
- **Calendar Booking** — One-click Google Calendar event creation

## Documentation

- **Design Document:** `docs/superpowers/specs/2026-05-12-agent-bond-design.md`
- **Implementation Plan:** `docs/superpowers/plans/2026-05-12-agent-bond.md`
- **Team Onboarding:** `docs/team/onboarding.md`
- **Project Conventions:** `docs/team/AGENTS.md`

## Tech Stack

- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript
- **Database:** SQLite via Prisma ORM
- **AI:** OpenRouter (GPT-4o-mini + embeddings)
- **Styling:** Tailwind CSS

## Environment Variables

```env
DATABASE_URL="file:./dev.db"
OPENROUTER_API_KEY="sk-or-your-key-here"
```

## Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npx prisma db push` | Push schema changes |
| `npx prisma generate` | Regenerate Prisma client |
| `npx prisma studio` | Browse database |
| `curl -X POST http://localhost:3000/api/seed` | Load sample data |

## Demo Flow

1. Click "Load Sample Attendees" on the landing page
2. Click "Get Started" and create your profile
3. Paste your LinkedIn bio and let AI extract your profile
4. Review and edit the extracted information
5. Generate your digital twin
6. Find your matches and view connection details
7. Book meetings with your top matches

## Next Steps

- [ ] Complete implementation following the plan
- [ ] Deploy to Vercel
- [ ] Add real attendee data
- [ ] Enhance with more AI features

## License

MIT
