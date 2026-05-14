# Twin Conversations for Matching

## Overview

When a user clicks "Find Matches", their AI twin has short conversations with each candidate's twin to determine if the real people should meet. Users watch conversations in real-time as passive observers. Only matches where twins agree to meet are shown.

## User Flow

1. User clicks "Find Matches" on `/matches` page
2. App finds top 5-8 candidates via vector similarity
3. For each candidate (sequentially):
   - User's twin and candidate's twin have a 3-4 exchange conversation
   - User sees live chat UI with messages appearing in real-time
   - After conversation, verdict shown (should meet / skip)
4. Final results page shows only "should meet" matches
5. Each match card has expandable conversation transcript

## Data Model

### New Prisma Model: `Conversation`

```prisma
model Conversation {
  id        String   @id @default(cuid())
  matchId   String
  match     Match    @relation(fields: [matchId], references: [id])
  messages  String   // JSON: [{role, content, speakerName, timestamp}]
  decision  Boolean  // Whether twins agreed to meet
  summary   String?  // AI summary of recommendation
}
```

Update `Match` model to include conversations:

```prisma
model Match {
  // ... existing fields
  conversation Conversation?
}
```

## API Endpoints

### `POST /api/twin-conversation` (NEW)

Runs a conversation between two twins with SSE streaming.

**Request:**
```json
{
  "userId": "user-123",
  "candidateUserId": "candidate-456"
}
```

**Response:** Server-Sent Events stream

```
data: {"type": "message", "role": "assistant", "speakerName": "Arthur's Twin", "content": "Hi! I'm Arthur's digital twin..."}
data: {"type": "message", "role": "assistant", "speakerName": "Maya's Twin", "content": "Hey Arthur! I'm Maya's twin..."}
...
data: {"type": "verdict", "decision": true, "summary": "Strong overlap in AI and blockchain interests..."}
```

**Logic:**
1. Load both users' profiles and twin summaries
2. Create system prompt defining both twins' personas
3. Run 3-4 turn conversation using `chatCompletion`
4. After conversation, ask LLM for verdict (shouldMeet + summary)
5. Store conversation and verdict in database
6. Stream each message as SSE event

### Updated `POST /api/match`

**New flow:**
1. Find top candidates via vector similarity (existing)
2. For each candidate, call twin conversation logic
3. Filter to only matches where `decision === true`
4. Store matches with conversation references
5. Return matches with conversation data

**Response includes conversations:**
```json
{
  "success": true,
  "matches": [
    {
      "id": "match-1",
      "user": { ... },
      "score": 89,
      "reason": "...",
      "starters": [...],
      "conversation": {
        "messages": [...],
        "decision": true,
        "summary": "..."
      }
    }
  ]
}
```

## UI Components

### `ConversationView` (NEW)

Live chat component showing twin conversation.

**Props:**
```typescript
interface ConversationViewProps {
  messages: ConversationMessage[]
  isComplete: boolean
  verdict?: { decision: boolean; summary: string }
  candidateName: string
}
```

**Behavior:**
- Messages appear with typing animation
- Each twin has distinct styling (left/right, color)
- After completion, shows verdict banner
- Expandable/collapsible

### Updated `MatchesPage`

**Changes:**
- Show conversation progress when finding matches
- Display conversations sequentially with live updates
- After all conversations, show only "should meet" matches
- Each `MatchCard` shows conversation summary with expand option

### Updated `MatchCard`

**Changes:**
- Add conversation preview (first 2 messages)
- Add "View Full Conversation" expand button
- Show verdict summary

## Conversation Prompts

### System Prompt Template

```
You are simulating a networking conversation between two digital twins at a professional event.

TWIN A (User's twin):
Name: {userName}
Profile: {userTwinSummary}
Goals: {userNetworkingGoal}

TWIN B (Candidate's twin):
Name: {candidateName}
Profile: {candidateTwinSummary}
Goals: {candidateNetworkingGoal}

Rules:
- Keep conversation natural and professional
- Each message should be 1-2 sentences
- Explore shared interests, complementary skills, and goal alignment
- After 3-4 exchanges each, the twins should naturally conclude
- Be genuine - don't force connections that don't exist

The conversation should feel like two people meeting at a conference cocktail hour.
```

### Verdict Prompt

```
Based on this conversation between {userName} and {candidateName}'s digital twins, should the real people meet at the event?

Conversation:
{conversationHistory}

Respond with JSON:
{
  "shouldMeet": true/false,
  "reason": "One sentence explaining why they should or shouldn't meet",
  "sharedInterests": ["interest1", "interest2"],
  "conversationTopics": ["topic1", "topic2"]
}
```

## Error Handling

- If LLM fails during conversation, skip candidate and continue
- If verdict parsing fails, default to `shouldMeet: false`
- Show error state in UI with retry option
- Timeout after 30 seconds per conversation

## Technical Notes

- Use `ReadableStream` for SSE in Next.js route handlers
- Store conversations as JSON string in `messages` field
- Consider rate limiting for API calls
- Cache conversations to avoid re-running on page refresh
