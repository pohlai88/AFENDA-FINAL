# Afenda Zod (Contracts Only)

## OBJECTIVE
- Zod is the contract layer for all data shapes.
- If data has no `z` import, it is an orphan.

## COVERS
1) **Contracts** everywhere (request/response/params).
2) **Zod-generated types** (`z.infer`, `z.input`, `z.output`).
3) **Zod-to-API** mapping (API payload validation).
4) **Drizzle-Zod**: keep **here**, not in drizzle.
5) **Sanitization & serialization** tied to contracts.

## RULES
- File naming is stage-based (this folder is the `zod` stage). Keep internal helpers prefixed with `_zod.`.
- No raw types without Zod contract.
- Validation always happens before service logic.

## ALLOWED
- `z.object(...)`, `z.union(...)`, `z.enum(...)`.
- Contract schemas for route params, query, body.
- `zod-to-api` helpers for request/response shapes.

## FORBIDDEN 🚫
- Drizzle schema definitions.
- API handlers.
- Business logic.
- Types without a Zod source.
