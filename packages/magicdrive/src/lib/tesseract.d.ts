/**
 * Optional: types for tesseract.js when used for image OCR.
 * Install tesseract.js to enable image text extraction.
 */
declare module "tesseract.js" {
  export function createWorker(
    lang?: string,
    oem?: number,
    config?: { logger?: (m: unknown) => void }
  ): Promise<{
    setParameters?: (params: { tessedit_pageseg_mode: number }) => Promise<unknown>
    recognize: (image: Buffer | string) => Promise<{ data: { text: string; confidence?: number } }>
    terminate: () => Promise<void>
  }>
}

