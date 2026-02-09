/**
 * @domain magicdrive
 * @layer server
 * @responsibility Generate thumbnails: resize image or first page to thumb/1.jpg.
 *
 * Dependencies (justified):
 * - sharp: already used; resizes images and encodes JPEG. No system binaries.
 * - pdfjs-dist: Mozilla PDF.js; pure JS parser, no system deps. Standard for PDF in Node.
 * - canvas: Node Canvas (node-canvas) so pdfjs-dist can render; standard approach.
 *   Alternative (pdf2pic) requires GraphicsMagick/ImageMagick installed on the system.
 *   With pdfjs-dist + canvas, "pnpm install" is enough (canvas has native bindings but installs via npm).
 *   If canvas fails to build (e.g. Windows without build tools), PDF thumb is skipped gracefully.
 */

import "server-only"

import { GetObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3"

import {
  getR2BucketName,
  getR2Client,
  canonicalSourceKey,
  canonicalThumbKey,
} from "@afenda/shared/r2"

export type ThumbResult = { ok: true; pages: number } | { ok: false; error: string }

const THUMB_MAX_WIDTH = 400
const THUMB_QUALITY = 85
const IMAGE_MIMES = ["image/jpeg", "image/png", "image/webp", "image/tiff"] as const
const PDF_MIME = "application/pdf"

/**
 * Generate thumb/1.jpg for a version. Images: sharp resize. PDF: first page via pdfjs-dist + canvas, then sharp to JPEG.
 */
export async function runThumbnailsForVersion(
  tenantId: string,
  objectId: string,
  versionId: string,
  mimeType: string
): Promise<ThumbResult> {
  const bucket = getR2BucketName()
  const s3 = getR2Client()
  const sourceKey = canonicalSourceKey(tenantId, objectId, versionId)

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

  if (IMAGE_MIMES.includes(mimeType as (typeof IMAGE_MIMES)[number])) {
    return runImageThumb(tenantId, objectId, versionId, buffer, bucket, s3)
  }
  if (mimeType === PDF_MIME) {
    return runPdfFirstPageThumb(tenantId, objectId, versionId, buffer, bucket, s3)
  }
  return { ok: true, pages: 0 }
}

async function runImageThumb(
  tenantId: string,
  objectId: string,
  versionId: string,
  buffer: Buffer,
  bucket: string,
  s3: ReturnType<typeof getR2Client>
): Promise<ThumbResult> {
  try {
    const sharp = (await import("sharp")).default
    const thumb = await sharp(buffer)
      .resize(THUMB_MAX_WIDTH, undefined, { withoutEnlargement: true })
      .jpeg({ quality: THUMB_QUALITY })
      .toBuffer()
    const thumbKey = canonicalThumbKey(tenantId, objectId, versionId, 1)
    await s3.send(
      new PutObjectCommand({ Bucket: bucket, Key: thumbKey, Body: thumb, ContentType: "image/jpeg" })
    )
    return { ok: true, pages: 1 }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    return { ok: false, error: `Thumbnail generation failed: ${message}` }
  }
}

/**
 * Render PDF first page to JPEG using pdfjs-dist + canvas, then upload thumb/1.jpg.
 * If pdfjs-dist or canvas are unavailable / fail, returns { ok: true, pages: 0 } so ingest flow is not broken.
 */
async function runPdfFirstPageThumb(
  tenantId: string,
  objectId: string,
  versionId: string,
  buffer: Buffer,
  bucket: string,
  s3: ReturnType<typeof getR2Client>
): Promise<ThumbResult> {
  try {
    const scale = THUMB_MAX_WIDTH / 612 // default PDF page width ~612pt
    const { createCanvas } = await import("canvas")
    const pdfjsLib = await import("pdfjs-dist/legacy/build/pdf.mjs")
    const loadingTask = pdfjsLib.getDocument({
      data: new Uint8Array(buffer),
      useSystemFonts: true,
      disableFontFace: true,
    })
    const pdf = await loadingTask.promise
    const page = await pdf.getPage(1)
    const viewport = page.getViewport({ scale })
    const canvas = createCanvas(viewport.width, viewport.height)
    const ctx = canvas.getContext("2d")
    await page.render({
      canvasContext: ctx as unknown as CanvasRenderingContext2D,
      viewport,
      intent: "print",
    }).promise
    const pngBuffer = canvas.toBuffer("image/png")
    const sharp = (await import("sharp")).default
    const thumb = await sharp(pngBuffer)
      .resize(THUMB_MAX_WIDTH, undefined, { withoutEnlargement: true })
      .jpeg({ quality: THUMB_QUALITY })
      .toBuffer()
    const thumbKey = canonicalThumbKey(tenantId, objectId, versionId, 1)
    await s3.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: thumbKey,
        Body: thumb,
        ContentType: "image/jpeg",
      })
    )
    return { ok: true, pages: 1 }
  } catch {
    return { ok: true, pages: 0 }
  }
}

