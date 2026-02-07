# Marketing Components (UI Only)

## OBJECTIVE
- UI rendering only.
- No business logic.

## LOCATION
- Client UI: `component/client/` (must include "use client").
- Server UI: `component/server/` (no browser APIs).

## RULES
- PREFIX: Every file/folder starts with `marketing`.
- UI ONLY: Components render UI, nothing else.
- CLIENT: Hooks, zustand, DOM APIs allowed.
- SERVER: No browser APIs; render-only.

## ALLOWED
- Presentational UI (buttons, cards, layouts).
- Local UI state (client-only).
- Shadcn primitives from `@afenda/shadcn`.

## FORBIDDEN 🚫
- Database access.
- Auth/session logic.
- API handlers.
- Business logic or orchestration.
- Zod or Drizzle definitions.
