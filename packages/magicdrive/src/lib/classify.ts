/**
 * @domain magicdrive
 * @layer server
 * @responsibility Rules-based docType and tag suggestions from title/filename and (later) extracted text
 */

import "server-only"

import { DOC_TYPE, type DocTypeValue } from "@afenda/shared/constants/magicdrive"

export type ClassifyInput = {
  title?: string | null
  filename?: string | null
  extractedText?: string | null
}

export type ClassifyResult = {
  suggestedDocType: DocTypeValue
  suggestedTags: string[]
}

const INVOICE_PATTERNS = [
  /invoice/i,
  /tax\s*invoice/i,
  /bill\s*#/i,
  /rechnung/i,
]
const CONTRACT_PATTERNS = [
  /contract/i,
  /agreement/i,
  /terms?\s+and\s+conditions/i,
  /parties/i,
  /signed\s+by/i,
]
const RECEIPT_PATTERNS = [
  /receipt/i,
  /payment\s+received/i,
  /quittance/i,
]

function matchAny(text: string, patterns: RegExp[]): boolean {
  if (!text) return false
  return patterns.some((p) => p.test(text))
}

/**
 * Suggest docType from title, filename, and optionally extracted text.
 * Order: invoice > contract > receipt > other.
 */
export function suggestDocType(input: ClassifyInput): DocTypeValue {
  const combined = [
    input.title ?? "",
    input.filename ?? "",
    input.extractedText ?? "",
  ]
    .filter(Boolean)
    .join(" ")

  if (matchAny(combined, INVOICE_PATTERNS)) return DOC_TYPE.INVOICE
  if (matchAny(combined, CONTRACT_PATTERNS)) return DOC_TYPE.CONTRACT
  if (matchAny(combined, RECEIPT_PATTERNS)) return DOC_TYPE.RECEIPT
  return DOC_TYPE.OTHER
}

// Patterns to suggest tag names from extracted text (heuristics)
const TAG_PATTERNS: Array<{ tag: string; patterns: RegExp[] }> = [
  { tag: "invoice", patterns: [/invoice\s*#?\s*(\w+)/i, /bill\s*#?\s*(\w+)/i, /rechnung/i] },
  { tag: "contract", patterns: [/contract\s+(?:between|with)\s+([A-Za-z0-9\s&.,]+?)(?:\s+and|\s*$)/i, /agreement\s+with\s+([A-Za-z0-9\s&.,]+)/i] },
  { tag: "receipt", patterns: [/receipt\s*#?\s*(\w+)/i, /payment\s+received/i] },
  { tag: "Q1", patterns: [/\bQ1[\s-]?(?:20\d{2})\b/i] },
  { tag: "Q2", patterns: [/\bQ2[\s-]?(?:20\d{2})\b/i] },
  { tag: "Q3", patterns: [/\bQ3[\s-]?(?:20\d{2})\b/i] },
  { tag: "Q4", patterns: [/\bQ4[\s-]?(?:20\d{2})\b/i] },
  { tag: "tax", patterns: [/tax\s*invoice/i, /VAT\s*[#:]?\s*\w+/i, /GST\s*[#:]?\s*\w+/i] },
]

/**
 * Extract candidate tag names from text using simple regex heuristics.
 * Returns tag name strings; caller can match to existing tags by name/slug or create new ones.
 */
function extractTagCandidates(text: string): string[] {
  if (!text || !text.trim()) return []
  const seen = new Set<string>()
  const out: string[] = []
  for (const { tag, patterns } of TAG_PATTERNS) {
    if (seen.has(tag)) continue
    if (patterns.some((p) => p.test(text))) {
      seen.add(tag)
      out.push(tag)
    }
  }
  // Optional: extract year as tag (e.g. "2024")
  const yearMatch = text.match(/\b(20\d{2})\b/)
  if (yearMatch) {
    const y = yearMatch[1]
    if (!seen.has(y)) {
      seen.add(y)
      out.push(y)
    }
  }
  return out
}

/**
 * Suggest tags from extracted text (and title/filename) using heuristics.
 * Returns tag name strings; UI or caller can resolve to tag IDs or create tags.
 */
export function suggestTags(input: ClassifyInput): string[] {
  const combined = [
    input.title ?? "",
    input.filename ?? "",
    input.extractedText ?? "",
  ]
    .filter(Boolean)
    .join(" ")
  return extractTagCandidates(combined)
}

/**
 * Full classification: suggested docType and tags.
 */
export function classify(input: ClassifyInput): ClassifyResult {
  return {
    suggestedDocType: suggestDocType(input),
    suggestedTags: suggestTags(input),
  }
}
