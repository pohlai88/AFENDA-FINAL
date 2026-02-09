"use client";

import { useReportWebVitals } from "next/web-vitals";
import { routes } from "@afenda/shared/constants";

/** Core Web Vitals threshold keys and values (ms or unitless). */
const THRESHOLDS: Record<string, number> = {
  CLS: 0.1,
  FID: 100,
  FCP: 1800,
  LCP: 2500,
  TTFB: 800,
  INP: 200,
};

/**
 * Reports Core Web Vitals (CLS, FID, FCP, LCP, TTFB, INP).
 * Development: logs to console.
 * Production: sends to /api/analytics/web-vitals (and optionally warns when over threshold).
 *
 * @layer app/components
 */
export function WebVitals() {
  useReportWebVitals((metric) => {
    const payload = {
      name: metric.name,
      value: metric.value,
      rating: metric.rating,
      delta: metric.delta,
      id: metric.id,
    };

    if (process.env.NODE_ENV === "development") {
      console.log(`[Web Vitals] ${metric.name}:`, payload);
    }

    if (process.env.NODE_ENV === "production") {
      const endpoint = routes.api.analytics.webVitals();
      if (typeof navigator !== "undefined" && navigator.sendBeacon) {
        const body = JSON.stringify(payload);
        const blob = new Blob([body], { type: "application/json" });
        navigator.sendBeacon(endpoint, blob);
      } else {
        fetch(endpoint, {
          method: "POST",
          body: JSON.stringify(payload),
          headers: { "Content-Type": "application/json" },
          keepalive: true,
        }).catch(() => {});
      }

      const threshold = THRESHOLDS[metric.name];
      if (
        threshold != null &&
        metric.value > threshold &&
        process.env.NEXT_PUBLIC_WEB_VITALS_WARN_THRESHOLD === "true"
      ) {
        console.warn(
          `[Web Vitals] ${metric.name} exceeded threshold: ${metric.value} > ${threshold}`
        );
      }
    }
  });

  return null;
}
