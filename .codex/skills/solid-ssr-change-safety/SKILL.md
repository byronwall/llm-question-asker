---
name: solid-ssr-change-safety
description: Prevent SolidJS SSR hydration mismatches during frontend edits. Use when changing components that render on both server and client, especially markdown renderers, conditional JSX, list rendering, and DOM-structure-heavy UI.
---

# Solid SSR Change Safety

## Goal

Keep the server-rendered DOM tree identical to the initial client hydration tree.

## Core Rule

Match node existence and hierarchy between SSR and first client render.
Only mutate attributes/text/content after mount.

## Change Guardrails

- Keep the same JSX element structure for SSR and initial client render.
- Avoid render-time branches based on `window`, `document`, viewport size, time, random values, or client-only APIs.
- Avoid returning different element types for the same markdown node (`code` must stay `code`, `pre` must stay `pre`).
- Defer enhancements to `onMount` and use client-side DOM mutation for progressive enhancement.
- Prefer setting `id`, `class`, `data-*`, `innerHTML`, and event hooks post-mount over changing JSX tree shape.
- Preserve stable wrapper nodes when adding buttons/overlays; hide/show after hydration with attributes/CSS.

## Safe Workflow

1. Identify where SSR output is generated.
2. Keep a minimal baseline renderer that is hydration-safe.
3. Add enhancement logic only in `onMount`.
4. Ensure fallback markup is identical server/client pre-hydration.
5. Hard refresh and verify no hydration mismatch.

## Red Flags

- Hydration errors like `template2 is not a function` or missing hydration keys.
- Brief flash of content before crash.
- Component works only when custom renderer is disabled.
- Hash/query navigation state conflicts that change rendered tree at load.

## Example Prompts

- "Use the Solid SSR safety skill and refactor this markdown renderer so hydration is stable while keeping features."
- "Before I merge this frontend change, run an SSR safety pass and list any DOM-tree mismatch risks."
- "Apply hydration-safe progressive enhancement rules to this Solid component and avoid render-time client-only branches."

## Verification

Run `pnpm type-check`.
Use hard-refresh/manual navigation checks for hydration behavior.
