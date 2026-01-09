# AGENTS.md — SolidJS Code Guidelines

This repo prioritizes **predictable SolidJS reactivity**, **clear TypeScript types**, and **maintainable component boundaries**.

If a guideline conflicts with existing code patterns, follow this doc for new code and refactors unless explicitly told otherwise.

---

## Goals

- Keep components easy to reason about.
  - Prefer local clarity over clever abstractions.
  - Prefer explicit control-flow components (`Show`, `Switch/Match`, `Suspense`) over JS shortcuts.
- Keep files small and scannable.
  - Aim for **< 200 LOC per file**.
  - Prefer **1 component per file**, unless multiple components are tiny and tightly related.

---

## File structure and organization

- **One component per file** by default.
  - Exception: a small set of private helper components (icons, tiny subcomponents) that are only used by the parent component.
- **Types live with their consumer**.
  - Props types MUST be defined in the same file as the component.
  - General-purpose/shared types belong in a common types module.
- **Helpers**
  - If a helper is reusable, move it to a common place (`src/utils/*`, `src/lib/*`, etc.).
  - Component-specific helpers can stay local, but if they grow or become shared, promote them.

---

## Imports and exports

- Imports occur **at the top of the file**.
  - No lazy/deferred imports.
  - No inline imports in functions.
- Prefer **named exports** over default exports.
- Type imports:
  - ✅ `import { type Foo } from "./foo"`
  - ❌ `typeof import("./foo").Foo`

---

## TypeScript rules

- Avoid `any`.
  - If `any` is unavoidable, add a comment explaining why.
- Avoid `as any` to silence lint/type issues.
  - If you must, mark it clearly:
    - `// TODO:AS_ANY, <reason>`
- Avoid creating “mirror types” that duplicate an object’s structure.
  - Prefer deriving types from existing values/returns when possible.
  - If blocked by tooling or an inference issue:
    - `// TODO:TYPE_MIRROR, <reason>`
- Prefer `type` over `interface`.
  - Use intersection composition where needed:
    - `type Props = BaseProps & { extra: string }`

---

## Debugging

- Use `console.log` for debugging.
- For large code changes/chunks, add a couple logs to clarify:
  - entry/exit
  - important branch decisions
  - key data shape/ids
- **Do not wrap `console.log` in try/catch**.

---

## Control flow and readability

- Prefer early returns over deeply nested conditionals.
- Prefer Solid control-flow components:
  - **Use `Show` over `&&`** for conditional rendering.
  - Prefer `Switch/Match` for top-level forks when multiple branches exist.

### Conditional rendering rules

- Use `Show` to narrow types safely.
  - Prefer function children when you want narrowed typing.

✅ Good:

```tsx
<Show when={user()}>{(u) => <UserCard user={u} />}</Show>
```

❌ Avoid:

```tsx
{
  user() && <UserCard user={user()!} />;
}
```

---

## SolidJS reactivity fundamentals

### Signals vs stores

| Use case                 | Preferred      | Notes                                |
| ------------------------ | -------------- | ------------------------------------ |
| Single independent value | `createSignal` | OK for one-off state                 |
| Multiple related values  | `createStore`  | Prefer store over “stack of signals” |

- If state fields conceptually belong together, make a store.

### Derived values: inline thunks vs `createMemo`

- Inline thunks are fine for most derived values:

  - `const label = () => props.title ?? "Untitled"`

- Only use `createMemo` when there’s likely a performance hit:

  - sorting, filtering, heavy mapping, expensive formatting, large lists

| Pattern                  | Use when              | Example                              |
| ------------------------ | --------------------- | ------------------------------------ |
| `() => expr`             | cheap derivations     | label, simple boolean flags          |
| `createMemo(() => expr)` | expensive derivations | sorted/filtered lists, heavy compute |

### Effects

- Prefer `createEffect`. Do not use `createComputed`.
- Effects should be **for side effects**, not for pure derivations.

  - If something is derived, it should usually be a thunk or memo.

### Batching updates

- Use `batch(() => { ... })` when updating multiple signals or multiple store paths in a tight sequence.

  - This avoids unnecessary effect re-runs and reduces “glitching” from intermediate states.

✅ Good:

```tsx
batch(() => {
  setA((v) => v + 1);
  setB((v) => v + 1);
  setStore("filters", "q", nextQ);
});
```

---

## Props handling

- **Do not destructure props** (neither in parameters nor inside the body).

  - Solid props are reactive; destructuring breaks reactivity.

- Use `splitProps` when you need “local names”.
- `mergeProps` is allowed.

✅ Good:

```tsx
import { splitProps } from "solid-js";

type Props = {
  title?: string;
  onSave?: () => void;
};

export function Panel(props: Props) {
  const [local, rest] = splitProps(props, ["title", "onSave"]);

  const title = () => local.title ?? "Untitled";

  return (
    <section {...rest}>
      <h2>{title()}</h2>
    </section>
  );
}
```

❌ Avoid:

```tsx
export function Panel({ title }: Props) {
  return <h2>{title}</h2>;
}
```

---

## Event handlers and callbacks

- Inline handlers are OK **if short (≤ 3 lines)**.

- If longer than 3 lines, pull into a named function in parent scope:

  - `const handleClick = () => { ... }`
  - `onClick={handleClick}`

- Avoid `preventDefault` and `stopPropagation` unless there is a strong reason.

  - Prefer events that propagate safely.
  - Exception: intentional “consume” behavior (usually click).

✅ Good:

```tsx
const handleSave = () => {
  console.log("save:clicked");
  props.onSave?.();
};

<button onClick={handleSave}>Save</button>;
```

---

## Lists: `<For>` rules (very important)

- Prefer `<For>` over `.map()` in JSX.
- No need to set `keyed` by default.
- When creating render functions inside a `<For>`, **all variables must be reactive functions**.

  - Either wrap with `() => ...` or use `createMemo`.

✅ Good:

```tsx
<For each={items()}>
  {(item) => {
    const id = () => item.id;
    const label = () => item.label;

    return <Row id={id()} label={label()} />;
  }}
</For>
```

✅ Also good (expensive):

```tsx
<For each={items()}>
  {(item) => {
    const computed = createMemo(() => expensiveFormat(item));
    return <div>{computed()}</div>;
  }}
</For>
```

❌ Avoid (capturing non-reactive locals):

```tsx
<For each={items()}>
  {(item) => {
    const label = item.label; // not reactive per repo convention
    return <div>{label}</div>;
  }}
</For>
```

---

## Resources: `createResource` + `Suspense`

- If `createResource` is involved, ALWAYS use `Suspense` with a fallback.

  - Avoid using `Show` as the primary loading gate for resources.

✅ Good:

```tsx
const [data] = createResource(fetchData);

return (
  <Suspense fallback={<div>Loading…</div>}>
    <DataView data={data()!} />
  </Suspense>
);
```

Notes:

- Prefer handling “empty” states inside the resolved UI (`DataView`) rather than branching around the resource.
- For “major” page/feature sections, also apply the Error Boundary rule below.

---

## Error boundaries

- Every major page/feature “island” MUST be wrapped in an `<ErrorBoundary>`.

  - This prevents an unhandled runtime error from crashing the entire UI tree.

✅ Good:

```tsx
<ErrorBoundary
  fallback={(err, reset) => (
    <div>
      <h2>Something went wrong</h2>
      <pre>{String(err)}</pre>
      <button onClick={reset}>Retry</button>
    </div>
  )}
>
  <Suspense fallback={<div>Loading…</div>}>
    <FeatureIsland />
  </Suspense>
</ErrorBoundary>
```

Guidance:

- Keep fallbacks user-friendly.
- It’s OK for the fallback to log details:

  - `console.log("FeatureIsland:error", err);`

---

## Global state and Context API

### When to use context

- Avoid prop drilling beyond **3 levels**.

  - If data must travel deeper than 3 component layers, prefer a context or a dedicated state module.

- Prefer using an **exported Provider** from a module.

  - Do not create ad-hoc contexts inside pages/components unless it’s truly local and short-lived.

### Context rule: always wrap context access in a custom hook

- Context consumers MUST go through a `useX()` helper that:

  - calls `useContext`
  - throws if used outside the Provider

### Sample: full custom `<Provider>` pattern

✅ Recommended module pattern:

```tsx
import {
  createContext,
  useContext,
  type ParentProps,
  createMemo,
} from "solid-js";
import { createStore } from "solid-js/store";

type User = {
  id: string;
  name: string;
};

type UserState = {
  user: User | null;
  isLoading: boolean;
};

type UserContextValue = {
  state: UserState;
  setUser: (user: User | null) => void;
  setLoading: (isLoading: boolean) => void;
};

const UserContext = createContext<UserContextValue>();

export function UserProvider(props: ParentProps) {
  const [state, setState] = createStore<UserState>({
    user: null,
    isLoading: false,
  });

  const setUser = (user: User | null) => {
    console.log("UserProvider:setUser", user?.id ?? null);
    setState("user", user);
  };

  const setLoading = (isLoading: boolean) => {
    console.log("UserProvider:setLoading", isLoading);
    setState("isLoading", isLoading);
  };

  // Keep the value stable; memoize to avoid unnecessary downstream updates
  const value = createMemo<UserContextValue>(() => ({
    state,
    setUser,
    setLoading,
  }));

  return (
    <UserContext.Provider value={value()}>
      {props.children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const ctx = useContext(UserContext);
  if (!ctx) throw new Error("useUser must be used within a UserProvider");
  return ctx;
}
```

Notes:

- Prefer stores for related context state.
- Prefer exported Providers (`UserProvider`) and exported hooks (`useUser`) for consumption.
- Keep Provider logic small; if it grows, move non-UI logic into a shared helper/service module.

---

## DOM refs and component communication

- For DOM refs:

  - Use `let myRef;` and `ref={myRef}`.
  - Avoid `document.getElementById` (and similar) entirely.

✅ Good:

```tsx
let inputRef: HTMLInputElement | undefined;

const focus = () => {
  console.log("focus:input");
  inputRef?.focus();
};

<input ref={inputRef} />
<button onClick={focus}>Focus</button>
```

❌ Avoid:

```tsx
const el = document.getElementById("some-id");
```

---

## Mounting, cleanup, and subscriptions

- When pairing `onMount` with `onCleanup`, place `onCleanup` **inside** the `onMount` callback.

  - Do not create a separate top-level `onCleanup` block for that pairing.

✅ Good:

```tsx
onMount(() => {
  const id = window.setInterval(() => console.log("tick"), 1000);

  onCleanup(() => {
    window.clearInterval(id);
  });
});
```

---

## Components and composition

- Avoid IIFEs for Solid components.

  - Create a component and pass props normally.
  - Render functions are OK; IIFEs are not.

- SVG icons:

  - Put inline SVG into its own component with a good name.

---

## Error handling

- Avoid wrapping code in try/catch unless it’s clearly justified or explicitly requested.

  - Calling a method from props usually does not need try/catch.
  - Async fetch flows can use try/catch if needed.

---

## Prisma rules (server-side)

- Only modify the **Prisma schema**.
- Always generate migrations via CLI.
- Never manually author a migration file.

(Project-specific: follow the repo’s standard scripts/commands for generating and applying migrations.)

---

## “Thinking and planning” conventions

- When designing new components:

  - Consider key edge cases and handle them if simple.
  - If handling is non-trivial, add:

    - `// TODO:EDGE_CASE, <describe the case>`

---

## TODO tags (standardized)

Use these exact tags so they’re searchable:

- `TODO:AS_ANY, <reason>`
- `TODO:TYPE_MIRROR, <reason>`
- `TODO:EDGE_CASE, <reason>`

---

## Testing and verification

- Run `pnpm build` to verify the build passes after making changes.
- This project uses Vinxi (SolidStart) for building. The build compiles:
  - SSR bundle
  - Client bundle
  - Server functions bundle
- The build will catch TypeScript errors and bundling issues.
- There are no unit tests currently; verification is done via successful build and manual testing.

---

## Quick checklist (before you finish)

- [ ] File is < 200 LOC (or intentionally justified)
- [ ] No props destructuring; used `splitProps` if needed
- [ ] Used `createStore` for related state
- [ ] Derived values use thunks; `createMemo` only when it matters
- [ ] Used `batch` when updating multiple signals/store paths together
- [ ] `Show` instead of `&&`
- [ ] `Switch/Match` for multi-branch top-level forks
- [ ] `<For>` render locals are reactive functions
- [ ] `createResource` is gated by `Suspense` fallback
- [ ] Major feature islands wrapped in `<ErrorBoundary>`
- [ ] Context uses exported Provider + exported `useX()` hook
- [ ] Refs via `let ref` + `ref={ref}`; no `document.getElementById`
- [ ] Cleanup paired with mount is inside `onMount`
- [ ] No `any` without a comment; no `as any` without `TODO:AS_ANY`
- [ ] Named exports; imports at top; no `typeof import(...)`
- [ ] Large changes include a few `console.log` breadcrumbs

