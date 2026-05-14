# Connected Circles Background Animation

**Date:** 2026-05-13
**Status:** Approved

## Summary

Add a canvas-based floating particles background animation to the landing page hero section. Circles drift gently and connect with lines when within proximity, using the primary orange color at low opacity.

## Scope

- Single new component: `src/components/ConnectedCircles.tsx`
- One edit: add component to `src/app/page.tsx` hero section
- No new dependencies (Canvas 2D API only)

## Design

### Component: `ConnectedCircles`

- Client component (`"use client"`)
- Full-bleed `<canvas>` positioned `absolute` inside the hero container
- `pointer-events: none` — does not block interaction
- `z-index` behind content

### Animation Parameters

| Parameter | Value |
|-----------|-------|
| Node count | 45 |
| Node radius | 1.5–3.5px |
| Drift speed | 0.3–0.5 px/frame |
| Connection distance | 100px |
| Node opacity | ~20% |
| Line opacity | ~10% (fades with distance) |
| Color | Primary orange `oklch(0.65 0.17 32)` → rgb(206, 90, 58) |

### Behavior

- Nodes bounce off canvas edges
- Lines drawn between nodes within 100px, opacity inversely proportional to distance
- `requestAnimationFrame` loop, pauses when document hidden
- Respects `prefers-reduced-motion` — disables animation, shows static nodes only
- Canvas resizes on window resize

### Placement

In `src/app/page.tsx`, wrap the hero section (`dev-panel` div) in a relative container and render `<ConnectedCircles />` behind it:

```
<div className="relative">
  <ConnectedCircles />
  <div className="dev-panel ...">  ← existing hero content
```

## Files Changed

1. **New:** `src/components/ConnectedCircles.tsx`
2. **Edit:** `src/app/page.tsx` — import and render component in hero
