/**
 * @domain magicdrive
 * @layer server
 * @responsibility OCR pipeline: read canonical source from R2, extract text, write text.json, upsert object_index
 *
 * PDF: pdf-parse. Images: preprocess (sharp resize + normalise + grayscale), then tesseract.js with optional multi-pass PSM (3, 6, 11); when OCR_PYTHON_FALLBACK=1 and result is weak, run PaddleOCR + EasyOCR via scripts/ocr-fallback.py. See docs/magicdrive-tesseract-evaluation.md, docs/magicdrive-ocr-tesseract-vs-google.md, docs/magicdrive-ocr-python-fallback.md.
 */

import "server-only"

import { GetObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3"
import { createHash, randomUUID } from "node:crypto"
import { spawn } from "node:child_process"
import { access, unlink, writeFile } from "node:fs/promises"
import { constants } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { eq } from "drizzle-orm"

import {
  getDb,
  magicdriveObjectIndex,
  magicdriveObjects,
} from "@afenda/shared/db"
import {
  getR2BucketName,
  getR2Client,
  canonicalSourceKey,
  canonicalTextKey,
} from "@afenda/shared/r2"
import { classify } from "./classify"
import { runNearDuplicateCheck } from "./duplicates"
import { findOrCreateTagByName, addTagToObject } from "./tags"

export type OcrResult =
  | { ok: true; objectId: string; extractedLength: number }
  | { ok: false; error: string }

/**
 * Normalize text for hashing: trim, lowercase, collapse whitespace.
 */
function normalizeTextForHash(text: string): string {
  return text
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ")
}

/**
 * SHA-256 hex of normalized extracted text (for near-duplicate detection).
 */
function sha256HexOfText(text: string): string {
  const normalized = normalizeTextForHash(text)
  if (!normalized) return ""
  return createHash("sha256").update(normalized, "utf8").digest("hex")
}

const IMAGE_MIMES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/tiff",
] as const

/** Default Tesseract language; set TESSERACT_LANG in env (e.g. eng+deu). */
const TESSERACT_LANG_DEFAULT = "eng"
const TESSERACT_LANG = (process.env.TESSERACT_LANG?.trim() || TESSERACT_LANG_DEFAULT) || TESSERACT_LANG_DEFAULT

/** Below this confidence (0–100), we store lowConfidence in extractedFields. TESSERACT_CONFIDENCE_THRESHOLD in env to override. */
const CONFIDENCE_THRESHOLD_DEFAULT = 60
const CONFIDENCE_THRESHOLD = (() => {
  const v = process.env.TESSERACT_CONFIDENCE_THRESHOLD
  if (v === undefined || v === "") return CONFIDENCE_THRESHOLD_DEFAULT
  const n = parseInt(v, 10)
  return Number.isFinite(n) && n >= 0 && n <= 100 ? n : CONFIDENCE_THRESHOLD_DEFAULT
})()

/** Max dimension for optional preprocessing (improves accuracy and performance for large images). */
const PREPROCESS_MAX_PX = 2000

/** Tesseract recognize timeout (ms). TESSERACT_TIMEOUT_MS in env to override (default 30000). */
const RECOGNIZE_TIMEOUT_MS_DEFAULT = 30_000
const RECOGNIZE_TIMEOUT_MS = (() => {
  const v = process.env.TESSERACT_TIMEOUT_MS
  if (v === undefined || v === "") return RECOGNIZE_TIMEOUT_MS_DEFAULT
  const n = parseInt(v, 10)
  return Number.isFinite(n) && n > 0 ? n : RECOGNIZE_TIMEOUT_MS_DEFAULT
})()

/** When first-pass text length is below this, multi-pass PSM is used (if enabled). */
const PSM_MULTI_PASS_MIN_TEXT_LEN = 15

/** PSM (page segmentation mode): 3 = auto, 6 = single block, 11 = sparse text. */
const PSM_AUTO = 3
const PSM_SINGLE_BLOCK = 6
const PSM_SPARSE_TEXT = 11

const OCR_PREPROCESS_NORMALISE = (() => {
  const v = process.env.OCR_PREPROCESS_NORMALISE?.toLowerCase()
  if (v === "0" || v === "false" || v === "no") return false
  return true
})()
const OCR_PREPROCESS_GRAYSCALE = (() => {
  const v = process.env.OCR_PREPROCESS_GRAYSCALE?.toLowerCase()
  if (v === "0" || v === "false" || v === "no") return false
  return true
})()
const TESSERACT_PSM_MULTI_PASS = (() => {
  const v = process.env.TESSERACT_PSM_MULTI_PASS?.toLowerCase()
  if (v === "0" || v === "false" || v === "no") return false
  return true
})()

/** When true, on low Tesseract confidence/short text we call Python PaddleOCR + EasyOCR fallback. */
const OCR_PYTHON_FALLBACK = (() => {
  const v = process.env.OCR_PYTHON_FALLBACK?.toLowerCase()
  if (v === "0" || v === "false" || v === "no") return false
  return v === "1" || v === "true" || v === "yes"
})()

/** Python executable for OCR fallback. OCR_PYTHON_EXE in env (e.g. python3 or python). */
const OCR_PYTHON_EXE = process.env.OCR_PYTHON_EXE?.trim() || "python3"

/** Path to scripts/ocr-fallback.py. OCR_PYTHON_SCRIPT in env to override. */
const OCR_PYTHON_SCRIPT = (() => {
  const v = process.env.OCR_PYTHON_SCRIPT?.trim()
  if (v) return v
  return join(process.cwd(), "scripts", "ocr-fallback.py")
})()

/** Timeout (ms) for Python OCR fallback. OCR_PYTHON_TIMEOUT_MS in env (default 90000). */
const OCR_PYTHON_TIMEOUT_MS_DEFAULT = 90_000
const OCR_PYTHON_TIMEOUT_MS = (() => {
  const v = process.env.OCR_PYTHON_TIMEOUT_MS
  if (v === undefined || v === "") return OCR_PYTHON_TIMEOUT_MS_DEFAULT
  const n = parseInt(v, 10)
  return Number.isFinite(n) && n > 0 ? n : OCR_PYTHON_TIMEOUT_MS_DEFAULT
})()

/**
 * Preprocess image buffer for OCR: resize, optional normalise and grayscale.
 * Returns the same buffer on error or when sharp is unavailable.
 */
async function preprocessImageBuffer(
  buffer: Buffer,
  _mimeType: string
): Promise<Buffer> {
  const sharpMod = await import("sharp").catch(() => null)
  const sharpFn = sharpMod?.default
  if (!sharpFn) return buffer
  try {
    let pipeline = sharpFn(buffer)
    const meta = await pipeline.metadata()
    const w = meta.width ?? 0
    const h = meta.height ?? 0
    if (w > PREPROCESS_MAX_PX || h > PREPROCESS_MAX_PX) {
      pipeline = pipeline.resize(PREPROCESS_MAX_PX, PREPROCESS_MAX_PX, {
        withoutEnlargement: true,
      })
    }
    if (OCR_PREPROCESS_NORMALISE) pipeline = pipeline.normalise()
    if (OCR_PREPROCESS_GRAYSCALE) pipeline = pipeline.grayscale()
    return await pipeline.toBuffer()
  } catch {
    return buffer
  }
}

/**
 * Run Tesseract recognize with optional PSM. Returns trimmed text and confidence.
 */
async function recognizeWithPsm(
  worker: {
    setParameters?: (params: { tessedit_pageseg_mode: number }) => Promise<unknown>
    recognize: (image: Buffer) => Promise<{ data: { text: string; confidence?: number } }>
  },
  inputBuffer: Buffer,
  psm: number
): Promise<{ text: string; confidence: number }> {
  if (typeof worker.setParameters === "function") {
    await worker.setParameters({ tessedit_pageseg_mode: psm })
  }
  const result = await Promise.race([
    worker.recognize(inputBuffer),
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error("Tesseract recognize timeout")), RECOGNIZE_TIMEOUT_MS)
    ),
  ])
  const text = (result.data?.text ?? "").trim()
  const confidence = typeof result.data?.confidence === "number" ? result.data.confidence : 0
  return { text, confidence }
}

/**
 * Pick best result by confidence, then by text length.
 */
function bestOf(
  a: { text: string; confidence: number },
  b: { text: string; confidence: number }
): { text: string; confidence: number } {
  if (b.confidence > a.confidence) return b
  if (a.confidence > b.confidence) return a
  return a.text.length >= b.text.length ? a : b
}

/** Max stdout length (chars) from Python script to avoid memory exhaustion. Must be >= script MAX_OUTPUT_CHARS. */
const OCR_PYTHON_MAX_STDOUT_CHARS = 2 * 1024 * 1024

/**
 * Run Python OCR fallback (PaddleOCR then EasyOCR). Returns extracted text or "".
 * PRODUCTION-FROZEN: Do not modify except security/critical fixes. Contract: docs/magicdrive-ocr-fallback-contract.md
 * Skips if script missing. Writes temp file, spawns script, caps stdout, timeout, always unlinks temp.
 */
async function runPythonOcrFallback(inputBuffer: Buffer, mimeType: string): Promise<string> {
  try {
    await access(OCR_PYTHON_SCRIPT, constants.R_OK)
  } catch {
    return ""
  }
  const ext =
    mimeType === "image/png"
      ? "png"
      : mimeType === "image/webp"
        ? "webp"
        : mimeType === "image/tiff"
          ? "tiff"
          : "jpg"
  const tmpPath = join(tmpdir(), `ocr-${randomUUID()}.${ext}`)
  try {
    await writeFile(tmpPath, inputBuffer)
    const text = await new Promise<string>((resolve, reject) => {
      let settled = false
      const finish = (value: string) => {
        if (settled) return
        settled = true
        clearTimeout(t)
        resolve(value)
      }
      const fail = (err: Error) => {
        if (settled) return
        settled = true
        clearTimeout(t)
        reject(err)
      }
      const child = spawn(OCR_PYTHON_EXE, [OCR_PYTHON_SCRIPT, tmpPath], {
        stdio: ["ignore", "pipe", "pipe"],
        env: { ...process.env, OCR_LANG: TESSERACT_LANG.split("+")[0] || "en" },
      })
      let stdout = ""
      let overflow = false
      child.stdout?.setEncoding("utf8")
      child.stdout?.on("data", (chunk: string) => {
        if (overflow) return
        stdout += chunk
        if (stdout.length > OCR_PYTHON_MAX_STDOUT_CHARS) {
          overflow = true
          child.kill("SIGTERM")
          finish("")
        }
      })
      child.stderr?.on("data", () => { })
      const t = setTimeout(() => {
        child.kill("SIGTERM")
        fail(new Error("Python OCR fallback timeout"))
      }, OCR_PYTHON_TIMEOUT_MS)
      child.on("error", (err) => fail(err))
      child.on("close", (code) => {
        if (overflow) return
        if (code === 0 && stdout.trim()) finish(stdout.trim())
        else finish("")
      })
    })
    return text ?? ""
  } catch {
    return ""
  } finally {
    await unlink(tmpPath).catch(() => { })
  }
}

/**
 * Extract text from buffer by MIME.
 * PDF: pdf-parse (getText). Images: preprocess (resize + normalise + grayscale), then Tesseract.js with optional multi-pass PSM.
 */
async function extractTextFromBuffer(
  buffer: Buffer,
  mimeType: string
): Promise<{ text: string; fields?: Record<string, unknown> }> {
  if (mimeType === "application/pdf") {
    try {
      const { PDFParse } = await import("pdf-parse")
      const parser = new PDFParse({ data: buffer })
      const result = await parser.getText()
      await parser.destroy()
      const text = (result?.text ?? "").trim()
      return { text }
    } catch {
      return { text: "" }
    }
  }
  if (IMAGE_MIMES.includes(mimeType as (typeof IMAGE_MIMES)[number])) {
    try {
      const inputBuffer = await preprocessImageBuffer(buffer, mimeType)
      const mod = await import("tesseract.js").catch(() => null)
      const createWorker = mod?.createWorker
      if (!createWorker) return { text: "" }
      const worker = await createWorker(TESSERACT_LANG, undefined, { logger: () => { } })
      try {
        let best = await recognizeWithPsm(worker, inputBuffer, PSM_AUTO)
        if (
          TESSERACT_PSM_MULTI_PASS &&
          (best.confidence < CONFIDENCE_THRESHOLD || best.text.length < PSM_MULTI_PASS_MIN_TEXT_LEN)
        ) {
          const block = await recognizeWithPsm(worker, inputBuffer, PSM_SINGLE_BLOCK)
          const sparse = await recognizeWithPsm(worker, inputBuffer, PSM_SPARSE_TEXT)
          best = bestOf(best, bestOf(block, sparse))
        }
        let text = best.text
        const confidence = best.confidence
        const fields: Record<string, unknown> = {}
        if (typeof confidence === "number" && confidence < CONFIDENCE_THRESHOLD) {
          fields.lowConfidence = true
          fields.confidence = confidence
        }
        if (
          OCR_PYTHON_FALLBACK &&
          (confidence < CONFIDENCE_THRESHOLD || text.length < PSM_MULTI_PASS_MIN_TEXT_LEN)
        ) {
          const fallbackText = await runPythonOcrFallback(inputBuffer, mimeType)
          if (fallbackText.length > text.length) {
            text = fallbackText
            fields.ocrFallback = "paddle_easy"
          }
        }
        return { text, fields: Object.keys(fields).length > 0 ? fields : undefined }
      } finally {
        await worker.terminate()
      }
    } catch {
      return { text: "" }
    }
  }
  return { text: "" }
}

/**
 * Run OCR for a version: read source from R2, extract text, write text.json to R2, upsert object_index.
 */
export async function runOcrForVersion(
  tenantId: string,
  objectId: string,
  versionId: string,
  mimeType: string
): Promise<OcrResult> {
  const bucket = getR2BucketName()
  const s3 = getR2Client()
  const sourceKey = canonicalSourceKey(tenantId, objectId, versionId)
  const textKey = canonicalTextKey(tenantId, objectId, versionId)

  let buffer: Buffer
  try {
    const response = await s3.send(
      new GetObjectCommand({ Bucket: bucket, Key: sourceKey })
    )
    const body = response.Body
    if (!body) return { ok: false, error: "Empty object" }
    buffer = Buffer.from(await body.transformToByteArray())
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    return { ok: false, error: `Failed to read source: ${message}` }
  }

  const { text, fields } = await extractTextFromBuffer(buffer, mimeType)

  const textJson = JSON.stringify({
    extractedText: text,
    extractedFields: fields ?? {},
    versionId,
    objectId,
  })

  try {
    await s3.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: textKey,
        Body: textJson,
        ContentType: "application/json",
      })
    )
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    return { ok: false, error: `Failed to write text.json: ${message}` }
  }

  const textHash = sha256HexOfText(text)

  const db = getDb()

  // Classify after OCR: get suggestedDocType and suggestedTags (store latter for UI)
  const [objRow] = await db
    .select({ title: magicdriveObjects.title })
    .from(magicdriveObjects)
    .where(eq(magicdriveObjects.id, objectId))
    .limit(1)
  let extractedFieldsWithSuggestions = fields ?? {}
  let suggestedDocType: string | null = null
  if (objRow) {
    const result = classify({
      title: objRow.title,
      filename: objRow.title ?? undefined,
      extractedText: text || null,
    })
    suggestedDocType = result.suggestedDocType
    if (result.suggestedTags.length > 0) {
      extractedFieldsWithSuggestions = {
        ...extractedFieldsWithSuggestions,
        suggestedTags: result.suggestedTags,
      }
    }
  }

  await db.delete(magicdriveObjectIndex).where(eq(magicdriveObjectIndex.objectId, objectId))
  await db.insert(magicdriveObjectIndex).values({
    id: randomUUID(),
    objectId,
    extractedText: text || null,
    extractedFields: extractedFieldsWithSuggestions,
    textHash: textHash || null,
  })

  if (textHash) {
    await runNearDuplicateCheck(
      db,
      tenantId,
      objectId,
      versionId,
      textHash
    )
  }

  if (suggestedDocType) {
    await db
      .update(magicdriveObjects)
      .set({
        docType: suggestedDocType as (typeof magicdriveObjects.$inferSelect)["docType"],
        updatedAt: new Date(),
      })
      .where(eq(magicdriveObjects.id, objectId))
  }

  // Auto-apply suggested tags: find or create tag by name, then add to object
  const suggestedTags = (extractedFieldsWithSuggestions.suggestedTags as string[] | undefined) ?? []
  for (const tagName of suggestedTags) {
    const found = await findOrCreateTagByName(tenantId, tagName)
    if (found.ok) await addTagToObject(tenantId, objectId, found.tagId)
  }

  return { ok: true, objectId, extractedLength: text.length }
}
