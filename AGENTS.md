# Agent Bond — Project Conventions

## Tech Stack

- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript
- **Database:** SQLite via Prisma ORM
- **AI Provider:** OpenRouter (OpenAI-compatible API)
- **Styling:** Tailwind CSS
- **Form Validation:** Zod

---

## Code Style

### TypeScript
- Always use TypeScript
- No `any` types — use proper interfaces
- One interface per component prop type

### React/Next.js
- Use App Router (not Pages Router)
- Server Components by default, Client Components only when needed
- Use `use client` directive for client-side interactivity

### Imports
```typescript
// Good
import { prisma } from '@/lib/prisma'
import { ProfileForm } from '@/components/ProfileForm'

// Avoid
import { prisma } from '../../../lib/prisma'
```

### Styling
- Use Tailwind CSS utility classes
- No inline styles
- Use Tailwind's responsive classes (e.g., `md:flex`)

### Commit Messages
Follow conventional commits:
```
feat: add profile extraction endpoint
fix: resolve embedding generation error
refactor: extract matching logic to separate file
docs: update API reference
```

---

## Directory Structure

```
src/
├── app/                    # Next.js App Router pages
├── lib/                    # Shared utilities (no React)
├── components/             # React components
└── prisma/                 # Database schema
```

### `src/lib/`
Contains non-React utilities:
- Database client (`prisma.ts`)
- AI client (`openrouter.ts`)
- Matching algorithm (`matching.ts`)
- Embedding utilities (`embedding.ts`)
- Seed data (`seed-data.ts`)

### `src/components/`
Contains React components:
- UI components (`LoadingSpinner.tsx`)
- Page-specific components (`ProfileForm.tsx`, `MatchCard.tsx`)

### `src/app/api/`
Contains API routes:
- Profile operations
- Matching operations
- Calendar operations
- Seed data operations

---

## Database

### Prisma Schema Location
`prisma/schema.prisma`

### Commands
```bash
# Push schema changes to database
npx prisma db push

# Regenerate Prisma client
npx prisma generate

# Open Prisma Studio (GUI for database)
npx prisma studio
```

### SQLite Database
- Location: `prisma/dev.db`
- For demo/reset: Delete file and run `npx prisma db push`
- In production: Switch to PostgreSQL

---

## API Routes

### Naming
- Use kebab-case for route directories: `api/profile/extract`
- Use camelCase for dynamic segments: `api/match/[userId]`
- Always use `route.ts` for route handlers

### Response Format
All API routes return:
```typescript
{
  success: boolean,
  data?: any,        // On success
  error?: string     // On failure
}
```

### Error Handling
- Always try/catch in API routes
- Return appropriate HTTP status codes
- Log errors to console
- Don't expose internal errors to client

---

## OpenRouter Integration

### Models Used
- **Embeddings:** `openai/text-embedding-3-small`
- **LLM:** `openai/gpt-4o-mini`

### API Client
Located in `src/lib/openrouter.ts`

### Prompt Examples

**Profile Extraction Prompt:**
```
You are a profile extraction expert. Given raw LinkedIn profile text, extract and infer the following fields...

[Returns JSON with role, company, industry, skills, interests, networkingGoal, lookingFor, canOffer, preferredTopics]
```

**Twin Generation Prompt:**
```
You are a networking profile writer. Given a person's professional details, write a concise "networking twin" summary...
```

**Matching Prompt:**
```
You are a networking matchmaker. Given a user profile and candidates, select the TOP 3-5 best matches...
```

---

## Matching Algorithm

### Two-Phase Approach

**Phase 1: Vector Similarity**
- Generate embeddings for all profiles
- Compute cosine similarity between current user and others
- Select top 10 candidates

**Phase 2: LLM Ranking**
- Send top 10 candidates + user profile to GPT-4o-mini
- LLM evaluates: goal alignment, skills match, conversation potential
- Returns top 3-5 matches with scores and explanations

### Score Weighting
- Shared interests: 30%
- Goal alignment: 30%
- Skills match: 20%
- Industry relevance: 10%
- Conversation topic overlap: 10%

---

## Components

### Pattern: Loading States
Use `LoadingSpinner` component for async operations:
```tsx
<LoadingSpinner message="Loading matches..." />
```

### Pattern: Form Handling
Use Zod for validation:
```tsx
const schema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
})
```

### Pattern: Local Storage
Store user ID for demo:
```tsx
localStorage.setItem('userId', user.id)
localStorage.getItem('userId')
```

---

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | SQLite connection string |
| `OPENROUTER_API_KEY` | Yes | OpenRouter API key |

---

## Development Workflow

### Starting Fresh
```bash
git clone <repo>
cd agent-bond
npm install
npx prisma db push
npx prisma generate
npm run dev
```

### Making Changes
1. Make code changes
2. Run `npx prisma generate` if you changed the schema
3. Test locally
4. Commit with conventional commit message
5. Push to repo

### Resetting Demo
```bash
# Delete database
rm prisma/dev.db

# Re-create from schema
npx prisma db push

# Reload sample data
curl -X POST http://localhost:3000/api/seed
```

---

## Testing

### Manual Testing
1. Start development server: `npm run dev`
2. Test landing page at `http://localhost:3000`
3. Test profile creation: `/profile`
4. Test twin generation: `/twin`
5. Test match generation: `/matches`
6. Test match details: `/matches/[id]`

### API Testing
Use curl or Postman:
```bash
# Test seed endpoint
curl -X POST http://localhost:3000/api/seed

# Test profile extraction
curl -X POST http://localhost:3000/api/profile/extract \
  -H "Content-Type: application/json" \
  -d '{"linkedInText": "test..."}'
```

---

## Deployment

### Vercel (Recommended)
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel
```

### Environment Variables in Vercel
- Add `DATABASE_URL` (use a hosted PostgreSQL database)
- Add `OPENROUTER_API_KEY`

### Production Notes
- SQLite is not suitable for production — migrate to PostgreSQL
- Use a hosted database service (Supabase, Neon, Railway)
- Consider Vercel Postgres for simplicity

---

## File Checklist

When creating a new page or feature:
- [ ] API route in `src/app/api/`
- [ ] Component in `src/components/` (if UI)
- [ ] Page in `src/app/` (if public route)
- [ ] Database model in `prisma/schema.prisma`
- [ ] Prisma client regenerated (`npx prisma generate`)
- [ ] Environment variables documented
- [ ] Committed with conventional commit message
