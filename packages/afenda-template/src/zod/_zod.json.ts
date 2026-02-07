import { z } from "zod";

/**
 * JSON-safe scalar types.
 */
export const zJsonPrimitive = z.union([z.string(), z.number(), z.boolean(), z.null()]);
export type JsonPrimitive = z.infer<typeof zJsonPrimitive>;

export type JsonValue = JsonPrimitive | JsonValue[] | { [k: string]: JsonValue };

export const zJsonValue: z.ZodType<JsonValue> = z.lazy(() => {
  const schema = z.union([zJsonPrimitive, z.array(zJsonValue), z.record(z.string(), zJsonValue)]);
  return schema as z.ZodType<JsonValue>;
});

/**
 * Transform unknown -> JSON-safe object by stripping unserializable stuff.
 * - Removes functions/symbols
 * - Converts Date -> ISO string
 * - Drops undefined
 *
 * Use at API output boundaries if you want guarantees.
 */
export const zJsonSafe = z.unknown().transform((v): JsonValue => {
  const seen = new WeakSet<object>();

  const walk = (x: any): JsonValue => {
    if (x === null) return null;
    const t = typeof x;
    if (t === "string" || t === "number" || t === "boolean") return x;
    if (t === "bigint") return x.toString(); // JSON can't handle bigint
    if (t === "undefined" || t === "function" || t === "symbol") return null;

    if (x instanceof Date) return x.toISOString();
    if (Array.isArray(x)) return x.map(walk);

    if (t === "object") {
      if (seen.has(x)) return null;
      seen.add(x);
      const out: Record<string, JsonValue> = {};
      for (const [k, val] of Object.entries(x)) {
        if (val === undefined) continue;
        const vv = walk(val);
        // keep null; it's a valid JsonValue
        out[k] = vv;
      }
      return out;
    }

    return null;
  };

  return walk(v);
});
