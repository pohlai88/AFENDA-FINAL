/**
 * @domain tenant
 * @layer service
 * @responsibility Generate and manage globally unique organization short codes
 * 
 * Short codes are used as tenant identifiers in hierarchy codes (e.g., "AX7-T1001-01")
 */

import "@afenda/shared/server/only"

import { eq, isNull } from "drizzle-orm"
import type { Db } from "@afenda/shared/db"
import { organizations } from "@afenda/shared/db"

// ============ Types ============
export interface TenantCodeResult {
  shortCode: string
  isNew: boolean
}

// ============ Constants ============
const MIN_CODE_LENGTH = 2
const MAX_CODE_LENGTH = 6
const MAX_GENERATION_ATTEMPTS = 100

// ============ Helpers ============

/**
 * Extract initials from organization name
 * "Axis Corporation" → "AXC"
 * "My Company Ltd" → "MCL"
 */
function extractInitials(name: string): string {
  const words = name
    .toUpperCase()
    .replace(/[^A-Z0-9\s]/g, "")
    .split(/\s+/)
    .filter(Boolean)

  if (words.length === 0) return ""

  // Take first letter of each word (up to 4 words)
  const initials = words
    .slice(0, 4)
    .map((word) => word.charAt(0))
    .join("")

  return initials
}

/**
 * Clean a string to only alphanumeric uppercase
 */
function sanitizeCode(code: string): string {
  return code.toUpperCase().replace(/[^A-Z0-9]/g, "")
}

/**
 * Generate a random alphanumeric code
 */
function generateRandomCode(length: number): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789" // Exclude confusing chars: I, O, 0, 1
  let result = ""
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

// ============ Service ============
export class TenantCodeService {
  /**
   * Generate a globally unique short code for an organization
   * 
   * Algorithm:
   * 1. Try initials first (e.g., "Axis Corp" → "AXC")
   * 2. If taken, append incrementing numbers (AXC1, AXC2, etc.)
   * 3. If too many attempts, fall back to random alphanumeric
   * 
   * @param db - Database instance
   * @param orgName - Organization name to derive code from
   * @returns Unique short code (2-6 characters)
   */
  static async generateTenantCode(db: Db, orgName: string): Promise<string> {
    // Start with initials
    let baseCode = extractInitials(orgName)

    // Ensure minimum length
    if (baseCode.length < MIN_CODE_LENGTH) {
      // Use first 3 chars of sanitized name
      baseCode = sanitizeCode(orgName).substring(0, 3)
    }

    // Still too short? Use random
    if (baseCode.length < MIN_CODE_LENGTH) {
      baseCode = generateRandomCode(3)
    }

    // Truncate if too long
    if (baseCode.length > MAX_CODE_LENGTH - 1) {
      baseCode = baseCode.substring(0, MAX_CODE_LENGTH - 1)
    }

    // Try base code first
    let candidate = baseCode
    let counter = 0

    while (counter < MAX_GENERATION_ATTEMPTS) {
      // Check if code exists
      const existing = await db.query.organizations.findFirst({
        where: eq(organizations.shortCode, candidate),
        columns: { id: true },
      })

      if (!existing) {
        return candidate
      }

      // Code exists, try next variant
      counter++
      
      if (counter <= 99) {
        // Append number: AXC1, AXC2, ... AXC99
        candidate = `${baseCode}${counter}`
      } else {
        // Fallback to fully random code
        candidate = generateRandomCode(4)
      }

      // Ensure we don't exceed max length
      if (candidate.length > MAX_CODE_LENGTH) {
        // Trim base code to fit number
        const numStr = counter.toString()
        candidate = baseCode.substring(0, MAX_CODE_LENGTH - numStr.length) + numStr
      }
    }

    // Emergency fallback: completely random
    return generateRandomCode(4)
  }

  /**
   * Ensure an organization has a short code
   * If missing, generates one and updates the record
   * 
   * @param db - Database instance
   * @param organizationId - Organization UUID
   * @returns Short code (existing or newly generated)
   */
  static async ensureTenantCode(db: Db, organizationId: string): Promise<TenantCodeResult> {
    // Fetch organization
    const org = await db.query.organizations.findFirst({
      where: eq(organizations.id, organizationId),
      columns: { id: true, name: true, shortCode: true },
    })

    if (!org) {
      throw new Error(`Organization not found: ${organizationId}`)
    }

    // Already has a code
    if (org.shortCode) {
      return { shortCode: org.shortCode, isNew: false }
    }

    // Generate new code
    const shortCode = await this.generateTenantCode(db, org.name)

    // Update organization
    await db
      .update(organizations)
      .set({ shortCode, updatedAt: new Date() })
      .where(eq(organizations.id, organizationId))

    return { shortCode, isNew: true }
  }

  /**
   * Get short code for an organization (without generating)
   * Returns null if organization has no short code
   */
  static async getTenantCode(db: Db, organizationId: string): Promise<string | null> {
    const org = await db.query.organizations.findFirst({
      where: eq(organizations.id, organizationId),
      columns: { shortCode: true },
    })

    return org?.shortCode ?? null
  }

  /**
   * Find organization by short code
   */
  static async findByShortCode(db: Db, shortCode: string): Promise<{ id: string; name: string } | null> {
    const org = await db.query.organizations.findFirst({
      where: eq(organizations.shortCode, shortCode.toUpperCase()),
      columns: { id: true, name: true },
    })

    return org ?? null
  }

  /**
   * Backfill short codes for all organizations that don't have one
   * Useful for migrations
   */
  static async backfillAllCodes(db: Db): Promise<{ updated: number; errors: string[] }> {
    const orgsWithoutCode = await db.query.organizations.findMany({
      where: isNull(organizations.shortCode),
      columns: { id: true, name: true },
    })

    let updated = 0
    const errors: string[] = []

    for (const org of orgsWithoutCode) {
      try {
        await this.ensureTenantCode(db, org.id)
        updated++
      } catch (error) {
        errors.push(`Failed to generate code for org ${org.id}: ${error}`)
      }
    }

    return { updated, errors }
  }

  /**
   * Validate a short code format
   */
  static isValidShortCode(code: string): boolean {
    if (!code) return false
    const sanitized = sanitizeCode(code)
    return (
      sanitized === code.toUpperCase() &&
      sanitized.length >= MIN_CODE_LENGTH &&
      sanitized.length <= MAX_CODE_LENGTH
    )
  }
}
