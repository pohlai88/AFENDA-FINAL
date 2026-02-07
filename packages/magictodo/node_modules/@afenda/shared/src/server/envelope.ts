/**
 * API Response Envelope Helpers
 * Re-exports from orchestra for consistent envelope usage across domains.
 *
 * @see 01-AGENT: All APIs return ok()/fail() envelope
 * @see 02-ARCHITECTURE: Response Envelope (Mandatory)
 */

export {
  kernelOk as ok,
  kernelFail as fail,
  KERNEL_ERROR_CODES,
  type KernelEnvelope,
  type KernelEnvelopeOk,
  type KernelEnvelopeFail,
  type KernelApiError,
  type KernelErrorCode,
} from "@afenda/orchestra/zod";
