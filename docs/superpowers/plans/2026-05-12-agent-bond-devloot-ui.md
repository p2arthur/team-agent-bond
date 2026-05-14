# Agent Bond Devtool UI Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restyle Agent Bond into a dark devtool-inspired dashboard while preserving existing product behavior.

**Architecture:** This is a presentational pass over the existing Next.js App Router app. It updates the global theme tokens, shell layout, and existing React components in place without changing API routes, Prisma schema, matching logic, or local-storage contracts.

**Tech Stack:** Next.js App Router, TypeScript, React, Tailwind CSS v4, shadcn/base-ui primitives, lucide-react icons.

---

### Task 1: Global Theme And Shell

**Files:**
- Modify: `src/app/globals.css`
- Modify: `src/app/layout.tsx`

- [ ] Update CSS variables from the warm light palette to a dark charcoal palette with coral primary, amber warning, and green success accents.
- [ ] Add reusable utilities for app background texture, dark panels, compact status chips, scrollbars, and pressable controls.
- [ ] Replace the current single top header with a dark app shell: fixed desktop sidebar, compact top bar, Agent Bond branding, route links, and a primary "Create Twin" action.
- [ ] Keep children rendered inside the existing main slot without changing routes or data loading.

### Task 2: Board Workspace

**Files:**
- Modify: `src/app/page.tsx`

- [ ] Restyle the board toolbar as a dark hero/status panel with Agent Bond copy and scan/create actions.
- [ ] Add compact filter/search controls for visual parity with the reference without wiring new filtering behavior.
- [ ] Restyle kanban columns and cards with dark panels, mono metadata, status-colored borders, compact badges, and visible actions.
- [ ] Preserve existing scan, onboarding, local storage, and move-between-column behavior.

### Task 3: Profile, Twin, Matches, And Detail Views

**Files:**
- Modify: `src/app/profile/page.tsx`
- Modify: `src/app/twin/page.tsx`
- Modify: `src/app/matches/page.tsx`
- Modify: `src/components/MatchDetail.tsx`

- [ ] Apply the dark workspace layout to form pages and result pages.
- [ ] Restyle profile inputs, review panels, twin summary, match grids, and detail cards.
- [ ] Preserve all existing fetch calls, router redirects, and button actions.

### Task 4: Shared Components

**Files:**
- Modify: `src/components/OnboardingModal.tsx`
- Modify: `src/components/MatchCard.tsx`
- Modify: `src/components/ConversationView.tsx`
- Modify: `src/components/LoadingSpinner.tsx`
- Modify as needed: `src/components/ConversationStarters.tsx`

- [ ] Make dialogs, match cards, conversation bubbles, loading states, and conversation-starter panels match the dark dashboard system.
- [ ] Use lucide icons where helpful for recognizable actions and avoid decorative-only icon clutter.
- [ ] Keep prop shapes and component behavior unchanged.

### Task 5: Verification

**Files:**
- No source modifications unless verification reveals a defect.

- [ ] Run `npm run build`.
- [ ] If build fails due to existing unrelated issues, document the failure and fix only UI-change regressions.
- [ ] Start `npm run dev`.
- [ ] Inspect `http://localhost:3000` and key routes in a browser for nonblank rendering, layout fit, and obvious console/runtime errors.
