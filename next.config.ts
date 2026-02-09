import type { NextConfig } from "next";
import withBundleAnalyzer from "@next/bundle-analyzer";
import withSerwistInit from "@serwist/next";

const withSerwist = withSerwistInit({
  swSrc: "app/sw.ts",
  swDest: "public/sw.js",
  cacheOnNavigation: true,
  reloadOnOnline: true,
  disable: process.env.NODE_ENV === "development",
  // NOTE: Auto-registration enabled to resolve Serwist build warning.
  register: true,
});

const nextConfig: NextConfig = {
  // Enable gzip compression for production
  compress: true,

  // Enterprise: strict mode for safer renders and future React compatibility
  reactStrictMode: true,

  // Security: remove X-Powered-By header
  poweredByHeader: false,

  // Type safety: Enable statically typed links
  typedRoutes: true,

  // Logging: Configure development logging for better debugging
  logging: {
    fetches: {
      fullUrl: true,
      hmrRefreshes: false,
    },
  },

  // Server-side optimizations: Exclude heavy packages from bundling
  serverExternalPackages: [
    "canvas",
    "tesseract.js",
    "pdf-parse",
    "bullmq",
    "ws",
    "ioredis",
    "pdfjs-dist",
  ],

  // Development indicators configuration
  devIndicators: {
    position: "bottom-right",
  },

  // turbopack root auto-detected via pnpm-lock.yaml
  experimental: {
    // Global 404 for unmatched routes (enterprise: consistent 404 without layout)
    globalNotFound: true,
    // CSS optimization: Enable CSS chunking (experimental - better performance)
    cssChunking: "strict",
    // lucide-react, @tabler/icons-react, recharts are optimized by default
    optimizePackageImports: [
      "@radix-ui/react-icons",
      "@afenda/shadcn",
      "@afenda/orchestra",
      "@afenda/magictodo",
      "@afenda/magicdrive",
      "@afenda/auth",
      "@neondatabase/auth",
    ],
    // Experimental: persistent cache for production builds
    turbopackFileSystemCacheForBuild: true,
    // Inline CSS for better performance (smaller initial bundles)
    inlineCss: true,
    // Client-side router cache optimization (experimental)
    staleTimes: {
      dynamic: 30,
      static: 180,
    },
  },
  async headers() {
    return [
      {
        source: "/sw.js",
        headers: [
          {
            key: "Content-Type",
            value: "application/javascript; charset=utf-8",
          },
          {
            key: "Cache-Control",
            value: "public, max-age=0, must-revalidate",
          },
          {
            key: "Service-Worker-Allowed",
            value: "/",
          },
        ],
      },
      {
        source: "/manifest.json",
        headers: [
          {
            key: "Content-Type",
            value: "application/manifest+json",
          },
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
      {
        // Security headers for all routes
        source: "/:path*",
        headers: [
          {
            key: "X-DNS-Prefetch-Control",
            value: "on",
          },
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
          {
            key: "X-Frame-Options",
            value: "SAMEORIGIN",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "X-XSS-Protection",
            value: "1; mode=block",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
        ],
      },
    ];
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
    ],
    // Image optimization: enable formats for better performance
    formats: ["image/avif", "image/webp"],
    // Image optimization: optimize quality/performance balance
    minimumCacheTTL: 60,
  },
};

const withAnalyzer = withBundleAnalyzer({
  enabled: process.env.ANALYZE === "true",
});

export default withSerwist(withAnalyzer(nextConfig));
