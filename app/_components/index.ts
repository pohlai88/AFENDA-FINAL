/**
 * App-level shared components and hooks.
 * Used by root layout and (app) layout. No business logic — orchestration only.
 *
 * @layer app/components
 * @see .dev-note/02-ARCHITECTURE.md — App layer, Layer Reference
 */

export { AuthProvider } from "./auth-provider";
export { ClientRuntime } from "./client-runtime";
export {
  ErrorBoundaryWithRecovery,
  type ErrorBoundaryWithRecoveryProps,
  type ErrorInfo,
} from "./ErrorBoundaryWithRecovery";
export { QueryProvider } from "./query-provider";
export {
  UserProvider,
  useUser,
  getUserInitials,
  type User,
} from "./user-context";
export { useApiWithRetry } from "./useApiWithRetry";
export { useOptimisticUpdate, optimisticUpdate } from "./useOptimisticUpdate";
export { useRetry, retryWithBackoff } from "./useRetry";
export { WebVitals } from "./web-vitals";
