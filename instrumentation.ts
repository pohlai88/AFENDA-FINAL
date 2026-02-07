/**
 * @module instrumentation
 *
 * Next.js instrumentation entrypoint.
 * Runs once per server instance across runtimes.
 */

export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    // Place Node.js-only instrumentation here (e.g. OTel initialization).
    return
  }

  if (process.env.NEXT_RUNTIME === "edge") {
    // Place Edge runtime instrumentation here when needed.
    return
  }
}
