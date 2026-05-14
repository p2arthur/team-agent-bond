# Agent Bond Devtool UI Redesign

**Date:** 2026-05-12
**Status:** Approved for implementation

## Goal

Refresh Agent Bond with a dark, developer-tool dashboard style inspired by the devloot reference while keeping Agent Bond's networking-twin product language and flows intact.

## Visual Direction

The selected direction is a softer product dashboard. The interface should use the devloot-like ingredients of dark app chrome, compact navigation, mono labels, subdued borders, charcoal panels, coral primary actions, and amber/green state accents, but with more whitespace and readability than the reference image.

Agent Bond remains the product. Copy should continue to describe digital twins, scans, matches, scheduled meetings, and completed connections rather than bounties or code rewards.

## Scope

The redesign covers the global shell, home board, onboarding modal, profile flow, twin summary page, matches flow, match cards, match detail view, conversation display, loading states, form controls, badges, buttons, and scrollbars.

No API behavior, database schema, AI prompts, matching logic, local-storage keys, or route structure should change.

## Layout

The app should use a persistent dark sidebar on desktop with Agent Bond branding and primary routes. A compact top bar should provide workspace context and high-priority actions. Main content should sit in a dark workspace with subtle grid/noise texture and bordered panels.

On smaller screens, the shell should remain usable by collapsing the sidebar footprint rather than introducing a separate navigation system.

## Components

Cards should be dark panels with tight borders, status color accents, compact mono metadata, and restrained hover states. Board columns should be visually distinct through border/header accents rather than bright backgrounds. Forms and dialogs should use the same dark surface language with clear focus states.

## Verification

Run a production build to catch TypeScript and Next.js errors. Start the local dev server and inspect the UI in a browser at the main routes to verify the new visual system renders coherently.
