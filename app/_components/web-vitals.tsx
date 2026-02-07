"use client";

import { useReportWebVitals } from "next/web-vitals";

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
 * Development: logs to console and warns when over threshold.
 * Production: wire metric to your analytics (gtag, Vercel Analytics, or /api/analytics).
 *
 * @layer app/components
 */
export function WebVitals() {
  useReportWebVitals((metric) => {
    if (process.env.NODE_ENV === "development") {
      const payload = {
        value: metric.value,
        rating: metric.rating,
        delta: metric.delta,
      };
      // eslint-disable-next-line no-console -- dev-only diagnostic
      console.log(`[Web Vitals] ${metric.name}:`, payload);

      const threshold = THRESHOLDS[metric.name];
      if (threshold != null && metric.value > threshold) {
        // eslint-disable-next-line no-console -- dev-only diagnostic
        console.warn(
          `[Web Vitals] ${metric.name} exceeded threshold: ${metric.value} > ${threshold}`
        );
      }
    }

    // Production: send to analytics (e.g. gtag('event', metric.name, { value: metric.value }))
  });

  return null;
}
