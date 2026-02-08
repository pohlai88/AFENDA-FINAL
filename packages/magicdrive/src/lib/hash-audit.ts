/**
 * @domain magicdrive
 * @layer server
 * @responsibility Hash audit: sample object versions, re-download from R2, verify SHA-256 matches DB.
 */

import "server-only"

import { GetObjectCommand } from "@aws-sdk/client-s3"
import { createHash } from "node:crypto"
import { eq, sql } from "drizzle-orm"

import { getDb, magicdriveObjectVersions, magicdriveObjects } from "@afenda/shared/db"
import { getR2BucketName, getR2Client } from "@afenda/shared/r2"

export type HashAuditResult = {
  sampled: number
  checked: number
  matched: number
  mismatched: Array<{ versionId: string; objectId: string; expected: string; actual: string }>
  errors: Array<{ versionId: string; error: string }>
}

const DEFAULT_SAMPLE_SIZE = 20

/**
 * Sample up to `sampleSize` versions across tenants, download from R2, compute SHA-256, compare to DB.
 */
export async function runHashAudit(sampleSize: number = DEFAULT_SAMPLE_SIZE): Promise<HashAuditResult> {
  const db = getDb()
  const bucket = getR2BucketName()
  const s3 = getR2Client()

  const rows = await db
    .select({
      versionId: magicdriveObjectVersions.id,
      objectId: magicdriveObjectVersions.objectId,
      tenantId: magicdriveObjects.legacyTenantId,
      sha256: magicdriveObjectVersions.sha256,
      r2Key: magicdriveObjectVersions.r2Key,
    })
    .from(magicdriveObjectVersions)
    .innerJoin(magicdriveObjects, eq(magicdriveObjectVersions.objectId, magicdriveObjects.id))
    .orderBy(sql`random()`)
    .limit(sampleSize)

  const result: HashAuditResult = {
    sampled: rows.length,
    checked: 0,
    matched: 0,
    mismatched: [],
    errors: [],
  }

  for (const row of rows) {
    try {
      const response = await s3.send(
        new GetObjectCommand({ Bucket: bucket, Key: row.r2Key })
      )
      const body = response.Body
      if (!body) {
        result.errors.push({ versionId: row.versionId, error: "Empty response" })
        result.checked++
        continue
      }
      const bytes = await body.transformToByteArray()
      const actual = createHash("sha256").update(Buffer.from(bytes)).digest("hex")
      const expected = row.sha256
      result.checked++
      if (actual === expected) {
        result.matched++
      } else {
        result.mismatched.push({
          versionId: row.versionId,
          objectId: row.objectId,
          expected,
          actual,
        })
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      result.errors.push({ versionId: row.versionId, error: message })
      result.checked++
    }
  }

  return result
}
