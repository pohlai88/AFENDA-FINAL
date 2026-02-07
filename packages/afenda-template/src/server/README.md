# Afenda Server (Logic Only)

## OBJECTIVE
- Domain server logic only.
- No UI in this folder.

## RULES
- Prefix every file/folder with `afenda`.
- Keep logic pure and domain-scoped.
- Use NEON-first data access.
- Do not import UI or component code.

## ALLOWED
- Service classes and domain orchestration.
- Data access helpers (NEON/Drizzle).
- Server-only utilities.

## FORBIDDEN 🚫
- UI components.
- Client hooks or browser APIs.
- Cross-domain imports.
- API route handlers.
