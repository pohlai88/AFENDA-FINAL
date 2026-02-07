"use client"

/**
 * PWA install prompt - shows when app can be installed
 */

import { useEffect, useState } from "react"
import { Button } from "../button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../dialog"
import { Badge } from "../badge"
import { X, Download, Smartphone, Monitor } from "lucide-react"

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[]
  readonly userChoice: Promise<{
    outcome: "accepted" | "dismissed"
    platform: string
  }>
  prompt(): Promise<void>
}

export function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  // Check sessionStorage on initial render
  const [showPrompt, setShowPrompt] = useState(() => {
    if (typeof window === "undefined") return false
    const dismissed = sessionStorage.getItem("pwa-install-dismissed")
    return !dismissed
  })
  const [isInstalled, setIsInstalled] = useState(false)
  const [hasInteracted, setHasInteracted] = useState(false)

  useEffect(() => {
    // Check if app is already installed
    const checkInstalled = () => {
      const isStandalone = window.matchMedia("(display-mode: standalone)").matches
      const isInWebAppiOS = (window.navigator as { standalone?: boolean }).standalone === true
      setIsInstalled(isStandalone || isInWebAppiOS)
    }

    checkInstalled()

    const handleFirstInteraction = () => {
      setHasInteracted(true)
      window.removeEventListener("pointerdown", handleFirstInteraction)
      window.removeEventListener("keydown", handleFirstInteraction)
    }

    // Listen for beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      const dismissed = sessionStorage.getItem("pwa-install-dismissed")
      if (dismissed || isInstalled || !hasInteracted) {
        return
      }

      // Prevent default only when we intend to show the custom prompt
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)

      // Show prompt after a delay
      setTimeout(() => {
        if (!isInstalled) {
          setShowPrompt(true)
        }
      }, 3000)
    }

    // Listen for app installed event
    const handleAppInstalled = () => {
      setIsInstalled(true)
      setShowPrompt(false)
      setDeferredPrompt(null)
    }

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt)
    window.addEventListener("appinstalled", handleAppInstalled)
    window.addEventListener("pointerdown", handleFirstInteraction)
    window.addEventListener("keydown", handleFirstInteraction)

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt)
      window.removeEventListener("appinstalled", handleAppInstalled)
      window.removeEventListener("pointerdown", handleFirstInteraction)
      window.removeEventListener("keydown", handleFirstInteraction)
    }
  }, [isInstalled, hasInteracted])

  const handleInstall = async () => {
    if (!deferredPrompt) return

    try {
      await deferredPrompt.prompt()
      const { outcome } = await deferredPrompt.userChoice

      if (outcome === "accepted") {
        setIsInstalled(true)
      }

      setDeferredPrompt(null)
      setShowPrompt(false)
    } catch (error) {
      console.error("Install prompt failed:", error)
    }
  }

  const handleDismiss = () => {
    setShowPrompt(false)
    // Don't show again for this session
    sessionStorage.setItem("pwa-install-dismissed", "true")
  }

  // Don't show if already installed or no prompt available
  if (isInstalled || !deferredPrompt || !showPrompt) {
    return null
  }

  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent)

  return (
    <Dialog open={showPrompt} onOpenChange={setShowPrompt}>
      <DialogContent className="sm:max-w-md" showCloseButton={false}>
        <DialogHeader>
          <button
            onClick={handleDismiss}
            className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none"
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </button>

          <DialogTitle className="flex items-center space-x-2">
            <Download className="h-5 w-5" />
            <span>Install AFENDA</span>
          </DialogTitle>

          <DialogDescription>
            Install AFENDA on your device for quick access and offline capabilities.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Features */}
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Smartphone className="h-4 w-4 text-green-600" />
              <span className="text-sm">Works offline</span>
            </div>
            <div className="flex items-center space-x-2">
              <Monitor className="h-4 w-4 text-blue-600" />
              <span className="text-sm">Full screen experience</span>
            </div>
            <div className="flex items-center space-x-2">
              <Badge variant="secondary" className="text-xs">
                Faster loading
              </Badge>
              <span className="text-sm">Instant access</span>
            </div>
          </div>

          {/* Instructions for iOS */}
          {isIOS && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-sm text-blue-800">
                To install on iOS: Tap the share button
                <span className="mx-1">
                  <svg
                    className="inline h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m9.032 4.026a9.001 9.001 0 01-7.432 0m9.032-4.026A9.001 9.001 0 0112 3c-4.474 0-8.268 3.12-9.032 7.326m0 0A9.001 9.001 0 0012 21c4.474 0 8.268-3.12 9.032-7.326"
                    />
                  </svg>
                </span>
                and select &quot;Add to Home Screen&quot;
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="flex space-x-2">
            {!isIOS && (
              <Button onClick={handleInstall} className="flex-1">
                Install App
              </Button>
            )}
            <Button variant="outline" onClick={handleDismiss} className={isIOS ? "w-full" : ""}>
              Maybe Later
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
