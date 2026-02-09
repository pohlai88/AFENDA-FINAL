/**
 * Types for sharp when used for image resize/preprocessing.
 * Install sharp to enable thumbnail generation and optional OCR preprocessing.
 */
declare module "sharp" {
  interface SharpInstance {
    metadata(): Promise<{ width?: number; height?: number }>
    resize(
      width?: number,
      height?: number,
      options?: { withoutEnlargement?: boolean }
    ): SharpInstance
    normalise(): SharpInstance
    grayscale(): SharpInstance
    jpeg(options?: { quality?: number }): SharpInstance
    toBuffer(): Promise<Buffer>
  }
  function sharp(input: Buffer): SharpInstance
  export default sharp
}

