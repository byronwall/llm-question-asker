---
name: solid-ssr-hydration-debug-playbook
description: Troubleshoot and resolve SolidJS hydration mismatches using a comment-out and re-enable playbook. Use when seeing hydration errors, template crashes, or server/client DOM mismatch behavior.
---

# Solid SSR Hydration Debug Playbook

## Goal

Find the exact mismatch source fast, then restore features with targeted hydration-safe fixes.

## Isolation Method

Use coarse-to-fine comment/backout isolation.

1. Disable a large suspect subtree.
2. Confirm hydration stabilizes.
3. Re-enable one chunk at a time.
4. Stop when mismatch returns.
5. Rewrite only that chunk with hydration-safe patterns.

## Practical Sequence

1. Disable custom render overrides first (high signal).
2. Restore plain baseline render path.
3. Re-enable headings only.
4. Re-enable `code` behavior only.
5. Re-enable `pre` wrappers/controls.
6. Re-enable mermaid/client-only visuals last.

## Fix Patterns

- Keep SSR and initial client DOM identical.
- Move dynamic branching to `onMount`.
- Replace render-time branching with post-mount attribute/content updates.
- Use query params for tab state and hash for heading anchors to avoid state collisions.
- Add retry scroll after hydration when anchor targets appear after async/tab render.

## Debug Signals

- `template2 is not a function` with content flash: likely tree mismatch.
- Works when custom markdown components are removed: problem is in overrides.
- Works until one feature re-enabled: culprit localized.

## Example Prompts

- "Use the hydration debug playbook: comment out risky chunks, isolate the mismatch, then re-enable features incrementally."
- "I get a Solid hydration error on refresh. Apply the backout-and-restore workflow and fix only the culprit area."
- "Run a coarse-to-fine SSR mismatch triage on this component and propose targeted post-mount fixes."

## Completion Criteria

- Hard refresh loads without hydration error.
- Server render and client hydration both succeed.
- Required features restored incrementally.
- No broad rewrites outside culprit area.

## Verification

Run `pnpm type-check`.
Validate with hard refresh, direct URL load, and in-app navigation.
