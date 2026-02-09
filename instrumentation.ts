/**
 * @module instrumentation
 *
 * Next.js instrumentation entrypoint.
 * Runs once per server instance across runtimes.
 * 
 * @see https://nextjs.org/docs/app/guides/instrumentation
 * @performance Enable monitoring, telemetry, and performance tracking
 */

export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    // Node.js runtime instrumentation
    
    // Performance monitoring: Log server startup
    if (process.env.NODE_ENV === "development") {
      console.log(`[Instrumentation] Node.js runtime initialized at ${new Date().toISOString()}`)
    }
    
    // Production: Initialize OpenTelemetry, Sentry, or other monitoring tools here
    // Example:
    // if (process.env.NODE_ENV === "production") {
    //   const { register: registerOTel } = await import("./instrumentation/otel")
    //   await registerOTel()
    // }
    
    return
  }

  if (process.env.NEXT_RUNTIME === "edge") {
    // Edge runtime instrumentation
    if (process.env.NODE_ENV === "development") {
      console.log(`[Instrumentation] Edge runtime initialized at ${new Date().toISOString()}`)
    }
    
    return
  }
}
