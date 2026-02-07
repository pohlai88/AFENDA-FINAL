/**
 * Service Worker for AFENDA PWA
 * Built with Serwist - TypeScript-first service worker library
 */

/// <reference lib="webworker" />

import { defaultCache } from "@serwist/next/worker"
import type { PrecacheEntry, SerwistGlobalConfig } from "serwist"
import { Serwist, CacheFirst, NetworkFirst, StaleWhileRevalidate } from "serwist"
import { CacheableResponsePlugin } from "@serwist/cacheable-response"
import { ExpirationPlugin } from "@serwist/expiration"
import type { RuntimeCaching } from "serwist"

declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined
  }
}

declare const self: ServiceWorkerGlobalScope

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching: [
    // Default Next.js caching strategies (images, static files, etc.)
    ...defaultCache,
    
    // API caching - Network First strategy with timeout
    {
      matcher: ({ url }) => /^\/api\/v1\/(tasks|projects)/.test(url.pathname),
      handler: new NetworkFirst({
        cacheName: "api-cache",
        networkTimeoutSeconds: 10,
        plugins: [
          new ExpirationPlugin({
            maxEntries: 50,
            maxAgeSeconds: 5 * 60, // 5 minutes
          }),
          new CacheableResponsePlugin({
            statuses: [0, 200],
          }),
        ],
      }),
    },
    
    // User profile and settings - Network First with longer cache
    {
      matcher: ({ url }) => /^\/api\/v1\/(profile|settings|preferences)/.test(url.pathname),
      handler: new NetworkFirst({
        cacheName: "user-cache",
        networkTimeoutSeconds: 5,
        plugins: [
          new ExpirationPlugin({
            maxEntries: 20,
            maxAgeSeconds: 15 * 60, // 15 minutes
          }),
          new CacheableResponsePlugin({
            statuses: [0, 200],
          }),
        ],
      }),
    },
    
    // Remote images - Cache First with long expiration
    {
      matcher: ({ url }) => /^https:\/\/images\.unsplash\.com\/.*/.test(url.href),
      handler: new CacheFirst({
        cacheName: "remote-images",
        plugins: [
          new ExpirationPlugin({
            maxEntries: 60,
            maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
          }),
          new CacheableResponsePlugin({
            statuses: [0, 200],
          }),
        ],
      }),
    },
    
    // App routes - Network First for fresh content
    {
      matcher: ({ url }) => /^\/app\/.*/.test(url.pathname),
      handler: new NetworkFirst({
        cacheName: "app-routes",
        networkTimeoutSeconds: 5,
        plugins: [
          new ExpirationPlugin({
            maxEntries: 50,
            maxAgeSeconds: 10 * 60, // 10 minutes
          }),
        ],
      }),
    },
    
    // Public routes - Stale While Revalidate for balance
    {
      matcher: ({ url }) => /^\/(login|register|about|privacy|terms)/.test(url.pathname),
      handler: new StaleWhileRevalidate({
        cacheName: "public-routes",
        plugins: [
          new ExpirationPlugin({
            maxEntries: 20,
            maxAgeSeconds: 60 * 60, // 1 hour
          }),
        ],
      }),
    },
  ] satisfies RuntimeCaching[],
  
  // Offline fallback
  fallbacks: {
    entries: [
      {
        url: "/offline",
        matcher: ({ request }) => request.destination === "document",
      },
    ],
  },
})

// Register event listeners
serwist.addEventListeners()

/**
 * Custom message handler for client-service worker communication
 */
self.addEventListener("message", (event: ExtendableMessageEvent) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting()
  }
  
  if (event.data && event.data.type === "CACHE_URLS") {
    event.waitUntil(
      caches.open("custom-cache").then((cache) => {
        return cache.addAll(event.data.payload)
      })
    )
  }
})

/**
 * Push notification handler
 */
self.addEventListener("push", (event: PushEvent) => {
  if (!event.data) return

  const data = event.data.json()

  const options: NotificationOptions = {
    body: data.body,
    icon: "/icons/icon-192x192.png",
    badge: "/icons/icon-72x72.png",
    tag: data.tag || "default",
    data: data.data,
    requireInteraction: data.requireInteraction || false,
  }

  event.waitUntil(self.registration.showNotification(data.title, options))
})

/**
 * Notification click handler
 */
self.addEventListener("notificationclick", (event: NotificationEvent) => {
  const notification = event.notification
  const action = event.action
  const data = notification.data || {}

  notification.close()

  if (action === "dismiss") {
    return
  }

  const urlToOpen = action === "open" || !action ? data.url || "/" : data.url

  event.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clientList: readonly WindowClient[]) => {
        // Focus existing window if available
        for (const client of clientList) {
          if (client.url === urlToOpen && "focus" in client) {
            return client.focus()
          }
        }
        // Open new window
        if (self.clients.openWindow) {
          return self.clients.openWindow(urlToOpen)
        }
      })
  )
})


