import { z } from "zod";

export { zJsonPrimitive, zJsonValue, zJsonSafe, type JsonPrimitive, type JsonValue } from "./_zod.json";

/**
 * Serialization helpers:
 * - Make output JSON-safe
 * - Normalize primitives not supported by JSON
 */

export const zBigIntToString = z.bigint().transform((b) => b.toString());
