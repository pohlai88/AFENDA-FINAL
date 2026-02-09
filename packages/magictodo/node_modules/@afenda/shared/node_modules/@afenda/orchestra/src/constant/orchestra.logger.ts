/**
 * Orchestra Kernel Logger
 * Re-exports from pino/ folder for backward compatibility.
 * Use kernelLogger for structured logging — never console.*
 *
 * @domain orchestra
 * @layer constant
 */

export { kernelLogger, createKernelLogger, logKernelError } from "../pino/orchestra.pino";
