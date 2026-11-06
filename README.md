# Agent Bond

**Meet the right people at an event, with a reason to start the conversation.**

Agent Bond turns an attendee's background and networking goals into an AI networking twin. It shortlists relevant people with embeddings, then simulates conversations between twins to explore whether a meeting would be useful. Attendees can inspect the reasoning, save connections, and open a prefilled calendar invitation.

Built with a team at **Web Summit Vancouver**. This repository contains the hackathon application: a Next.js interface, API routes, and a SQLite data model.

## From a bio to a meeting

1. Paste a professional bio and review the extracted profile, skills, goals, and what you can offer.
2. Generate a short twin summary and a profile embedding.
3. Browse candidate matches or run a twin conversation. The batch matching path shortlists six candidates by cosine similarity before evaluating conversations.
4. Read the exchange and meeting verdict, save a connection, and use the scheduling interface.

The conversation endpoint streams messages and a verdict as server-sent events. The Google Calendar integration creates a prefilled event link; the attendee still reviews and saves the event in Google Calendar.

## Run locally

Use a current Node.js version supported by Next.js 16, npm, and an OpenRouter API key with access to the configured chat and embedding models.

```sh
git clone https://github.com/p2arthur/team-agent-bond.git
cd team-agent-bond
npm ci
```

Create **`.env`** in the repository root so both Prisma CLI and Next.js can read it:

```dotenv
DATABASE_URL="file:./dev.db"
OPENROUTER_API_KEY="replace-with-your-key"
```

```sh
npm run db:generate
npm run db:push
npm run dev
```

Open [localhost:3000](http://localhost:3000). Use **Load Sample Attendees** for a demonstration, then create your own profile. Loading samples clears existing users, profiles, matches, and conversations in the configured database. Use a disposable local database for this flow.

Profile and conversation operations send their inputs to OpenRouter. Sample-data loading also requests embeddings. The model configuration lives in [`src/lib/openrouter.ts`](src/lib/openrouter.ts): `xiaomi/mimo-v2-flash` for chat and `openai/text-embedding-3-small` for embeddings.

## Inside the application

| Area | Implementation |
| --- | --- |
| Interface | Next.js 16 App Router, React 19, Tailwind CSS 4, shadcn/ui |
| Profile extraction and twins | [`src/lib/`](src/lib/) and [`src/app/api/profile/`](src/app/api/profile/) |
| Candidate retrieval and evaluation | [`src/lib/matching.ts`](src/lib/matching.ts) |
| Conversation streaming | [`src/app/api/twin-conversation/route.ts`](src/app/api/twin-conversation/route.ts) |
| Persistence | Prisma 6 and [`prisma/schema.prisma`](prisma/schema.prisma) |
| Calendar handoff | [`src/app/api/calendar-link/route.ts`](src/app/api/calendar-link/route.ts) |

`npm run build` creates a production build, and `npm start` serves it. `npm run db:studio` opens the local database browser.

## Project status

This is an event prototype. It demonstrates the matching and networking flow, but does not establish production access controls, private attendee handling, or guaranteed match quality. The checked-in implementation is the reference for current behavior; earlier planning documents describe additional ideas and older stack versions.

See the [design brief](docs/superpowers/specs/2026-05-12-agent-bond-design.md) and [team onboarding](docs/team/onboarding.md) for background.
