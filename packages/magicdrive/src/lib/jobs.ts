/**
 * @domain magicdrive
 * @layer server
 * @responsibility Job queue for OCR, preview, thumb so ingest returns immediately.
 *
 * Why ioredis (with BullMQ):
 * - BullMQ expects a Redis client that speaks the Redis protocol (TCP). ioredis is the
 *   standard Node client for that: https://ioredis.com/ — high performance, TLS (rediss://),
 *   Cluster/Sentinel, pipelining, and proven in production (e.g. Alibaba). Guide: https://ioredis.com/category/guide/
 * - HTTP-based clients (e.g. @upstash/redis) do not implement the connection interface
 *   BullMQ needs; ioredis + REDIS_URL (including Upstash rediss://) works out of the box.
 * - Redis alone: you’d implement LPUSH/BRPOP and retries yourself; BullMQ gives retries,
 *   delays, and observability. Redis via Docker or Upstash; BullMQ via pnpm add bullmq ioredis.
 *
 * Behavior:
 * - If REDIS_URL is set: enqueue to BullMQ queue "magicdrive". Process via cron
 *   POST /api/cron/process-magicdrive-queue or a separate worker.
 * - If REDIS_URL is not set: in-process queue; no Redis required.
 */

import "server-only"

import { runOcrForVersion } from "./ocr"
import { runPreviewForVersion } from "./preview"
import { runThumbnailsForVersion } from "./thumbs"

export type magicdriveJob =
  | { type: "ocr"; payload: { tenantId: string; objectId: string; versionId: string; mimeType: string } }
  | { type: "preview"; payload: { tenantId: string; objectId: string; versionId: string; mimeType: string } }
  | { type: "thumb"; payload: { tenantId: string; objectId: string; versionId: string; mimeType: string } }

const QUEUE_NAME = "magicdrive"

const inProcessQueue: magicdriveJob[] = []
let inProcessProcessing = false

async function runJob(job: magicdriveJob): Promise<void> {
  switch (job.type) {
    case "ocr":
      await runOcrForVersion(
        job.payload.tenantId,
        job.payload.objectId,
        job.payload.versionId,
        job.payload.mimeType
      )
      break
    case "preview":
      await runPreviewForVersion(
        job.payload.tenantId,
        job.payload.objectId,
        job.payload.versionId,
        job.payload.mimeType
      )
      break
    case "thumb":
      await runThumbnailsForVersion(
        job.payload.tenantId,
        job.payload.objectId,
        job.payload.versionId,
        job.payload.mimeType
      )
      break
  }
}

async function processNextInProcess(): Promise<void> {
  if (inProcessProcessing || inProcessQueue.length === 0) return
  inProcessProcessing = true
  const job = inProcessQueue.shift()
  if (!job) {
    inProcessProcessing = false
    return
  }
  try {
    await runJob(job)
  } catch {
    // Job dropped; optional logging
  } finally {
    inProcessProcessing = false
    if (inProcessQueue.length > 0) setImmediate(processNextInProcess)
  }
}

/** REDIS_URL from env. ioredis connects via TCP/TLS; Upstash rediss:// URL works. */
function getRedisUrl(): string | undefined {
  const url = process.env.REDIS_URL?.trim()
  return url || undefined
}

/** BullMQ Queue when REDIS_URL is set; otherwise null. */
function getBullQueue(): import("bullmq").Queue<magicdriveJob> | null {
  const url = getRedisUrl()
  if (!url) return null
  try {
    const { Queue } = require("bullmq") as typeof import("bullmq")
    const IORedis = require("ioredis") as typeof import("ioredis").default
    const connection = new IORedis(url, { maxRetriesPerRequest: null })
    return new Queue<magicdriveJob>(QUEUE_NAME, { connection })
  } catch {
    return null
  }
}

let cachedQueue: ReturnType<typeof getBullQueue> | undefined = undefined

function getQueue(): ReturnType<typeof getBullQueue> {
  if (cachedQueue === undefined) cachedQueue = getBullQueue()
  return cachedQueue
}

/**
 * Enqueue a job. Uses BullMQ when REDIS_URL is set; otherwise in-process. Processing for
 * in-process starts asynchronously; for BullMQ, run via cron or a separate worker.
 */
export function enqueueMagicdriveJob(job: magicdriveJob): void {
  const queue = getQueue()
  if (queue) {
    queue.add("job", job, { removeOnComplete: { count: 1000 } }).catch(() => { })
    return
  }
  inProcessQueue.push(job)
  if (!inProcessProcessing) setImmediate(processNextInProcess)
}

/**
 * Enqueue OCR, preview, and thumb for a version (e.g. after ingest).
 */
export function enqueuePostIngestJobs(
  tenantId: string,
  objectId: string,
  versionId: string,
  mimeType: string
): void {
  enqueueMagicdriveJob({ type: "ocr", payload: { tenantId, objectId, versionId, mimeType } })
  enqueueMagicdriveJob({ type: "preview", payload: { tenantId, objectId, versionId, mimeType } })
  enqueueMagicdriveJob({ type: "thumb", payload: { tenantId, objectId, versionId, mimeType } })
}

/**
 * Process one job from the BullMQ queue. Call from cron (e.g. /api/cron/process-magicdrive-queue).
 * No-op if REDIS_URL is not set. Resolves after one job is processed or after timeoutMs.
 */
export async function processOneMagicdriveJobFromQueue(timeoutMs: number = 55_000): Promise<{
  processed: boolean
  error?: string
}> {
  if (!getRedisUrl()) return { processed: false }
  try {
    const { Worker } = require("bullmq") as typeof import("bullmq")
    const IORedis = require("ioredis") as typeof import("ioredis").default
    const connection = new IORedis(process.env.REDIS_URL!, { maxRetriesPerRequest: null })
    let processed = false
    const worker = new Worker<magicdriveJob>(
      QUEUE_NAME,
      async (job) => {
        await runJob(job.data)
        processed = true
      },
      { connection, concurrency: 1 }
    )
    const done = new Promise<void>((resolve) => {
      const t = setTimeout(resolve, timeoutMs)
      worker.on("completed", () => {
        clearTimeout(t)
        resolve()
      })
      worker.on("failed", () => {
        clearTimeout(t)
        resolve()
      })
    })
    await done
    await worker.close()
    return { processed }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    return { processed: false, error: message }
  }
}
