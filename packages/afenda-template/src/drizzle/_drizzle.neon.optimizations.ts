/**
 * Neon-specific optimization utilities.
 *
 * Helpers for:
 * - Autoscaling configuration
 * - Compute unit management
 * - Branch-specific settings
 * - Performance monitoring
 * - Connection pooling best practices
 */

export interface NeonAutoscalingConfig {
  minCu?: number; // Minimum compute units (0.25 - 10)
  maxCu?: number; // Maximum compute units (0.25 - 10)
  suspendTimeout?: number; // Seconds of inactivity before suspend
}

export interface NeonBranchConfig {
  name: string;
  parentId?: string;
  computeConfig?: NeonAutoscalingConfig;
}

export interface NeonPerformanceHints {
  useConnectionPooling: boolean;
  preferredDriver: "http" | "websocket" | "pool";
  cacheStrategy: "none" | "stale-while-revalidate" | "cache-first";
  readReplica?: boolean;
}

/**
 * Get recommended autoscaling config based on workload type.
 */
export function getRecommendedAutoscaling(workloadType: "dev" | "staging" | "production" | "analytics"): NeonAutoscalingConfig {
  switch (workloadType) {
    case "dev":
      return {
        minCu: 0.25,
        maxCu: 1,
        suspendTimeout: 300, // 5 minutes
      };
    case "staging":
      return {
        minCu: 0.25,
        maxCu: 2,
        suspendTimeout: 600, // 10 minutes
      };
    case "production":
      return {
        minCu: 0.5,
        maxCu: 4,
        suspendTimeout: 0, // Never suspend
      };
    case "analytics":
      return {
        minCu: 1,
        maxCu: 10,
        suspendTimeout: 1800, // 30 minutes
      };
    default:
      return {
        minCu: 0.25,
        maxCu: 2,
        suspendTimeout: 300,
      };
  }
}

/**
 * Get recommended driver based on use case.
 */
export function getRecommendedDriver(useCase: "serverless" | "server" | "edge" | "interactive"): NeonPerformanceHints["preferredDriver"] {
  switch (useCase) {
    case "serverless":
    case "edge":
      return "http"; // Fast, stateless, edge-compatible
    case "server":
      return "pool"; // Connection pooling for better performance
    case "interactive":
      return "websocket"; // Interactive transactions
    default:
      return "http";
  }
}

/**
 * Calculate optimal connection pool size.
 * Based on: https://neon.tech/docs/connect/connection-pooling
 */
export function calculatePoolSize(params: {
  maxConnections?: number; // Max DB connections available
  concurrentRequests?: number; // Expected concurrent requests
  avgQueryDuration?: number; // Average query duration in ms
}): number {
  const { maxConnections = 100, concurrentRequests = 10, avgQueryDuration = 100 } = params;

  // Rule of thumb: poolSize = (concurrent requests * avg query time) / 1000
  const recommended = Math.ceil((concurrentRequests * avgQueryDuration) / 1000);

  // Cap at 25% of max connections to leave headroom
  const maxPoolSize = Math.floor(maxConnections * 0.25);

  return Math.min(recommended, maxPoolSize, 20); // Max 20 for most apps
}

/**
 * Get performance hints based on environment.
 */
export function getPerformanceHints(environment: "development" | "staging" | "production"): NeonPerformanceHints {
  const baseHints: NeonPerformanceHints = {
    useConnectionPooling: false,
    preferredDriver: "http",
    cacheStrategy: "none",
  };

  switch (environment) {
    case "development":
      return {
        ...baseHints,
        preferredDriver: "http",
        cacheStrategy: "none",
      };
    case "staging":
      return {
        ...baseHints,
        useConnectionPooling: true,
        preferredDriver: "pool",
        cacheStrategy: "stale-while-revalidate",
      };
    case "production":
      return {
        ...baseHints,
        useConnectionPooling: true,
        preferredDriver: "pool",
        cacheStrategy: "stale-while-revalidate",
        readReplica: true,
      };
  }
}

/**
 * Estimate query cost in compute units.
 * Rough estimation for planning purposes.
 */
export function estimateQueryCost(params: {
  rowsScanned: number;
  rowsReturned: number;
  indexUsed: boolean;
  joins: number;
}): number {
  const { rowsScanned, rowsReturned, indexUsed, joins } = params;

  let cost = 0;

  // Base cost for rows scanned
  cost += rowsScanned * (indexUsed ? 0.001 : 0.01);

  // Cost for rows returned
  cost += rowsReturned * 0.01;

  // Cost for joins
  cost += joins * 0.1;

  return Math.max(0.001, cost); // Minimum cost
}

/**
 * Validate compute unit configuration.
 */
export function validateComputeConfig(config: NeonAutoscalingConfig): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (config.minCu && (config.minCu < 0.25 || config.minCu > 10)) {
    errors.push("minCu must be between 0.25 and 10");
  }

  if (config.maxCu && (config.maxCu < 0.25 || config.maxCu > 10)) {
    errors.push("maxCu must be between 0.25 and 10");
  }

  if (config.minCu && config.maxCu && config.minCu > config.maxCu) {
    errors.push("minCu cannot be greater than maxCu");
  }

  if (config.suspendTimeout !== undefined && config.suspendTimeout < 0) {
    errors.push("suspendTimeout must be >= 0 (0 means never suspend)");
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Get connection string with optimal parameters for Neon.
 */
export function optimizeConnectionString(baseUrl: string, options: {
  pooling?: boolean;
  ssl?: boolean;
  statement_cache_size?: number;
  idle_in_transaction_session_timeout?: number;
}): string {
  const url = new URL(baseUrl);

  // Add recommended parameters
  if (options.pooling) {
    url.searchParams.set("pooler", "true");
  }

  if (options.ssl !== false) {
    url.searchParams.set("sslmode", "require");
  }

  if (options.statement_cache_size) {
    url.searchParams.set("statement_cache_size", String(options.statement_cache_size));
  }

  if (options.idle_in_transaction_session_timeout) {
    url.searchParams.set("idle_in_transaction_session_timeout", String(options.idle_in_transaction_session_timeout));
  }

  return url.toString();
}

/**
 * Branch naming conventions for different environments.
 */
export function generateBranchName(type: "feature" | "hotfix" | "release" | "staging", identifier: string): string {
  const timestamp = new Date().toISOString().split("T")[0];

  switch (type) {
    case "feature":
      return `feat/${identifier}-${timestamp}`;
    case "hotfix":
      return `hotfix/${identifier}-${timestamp}`;
    case "release":
      return `release/${identifier}`;
    case "staging":
      return `staging-${identifier}`;
    default:
      return identifier;
  }
}
