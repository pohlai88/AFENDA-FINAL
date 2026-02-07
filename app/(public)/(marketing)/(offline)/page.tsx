/**
 * @domain marketing
 * @layer ui
 * @responsibility UI route entrypoint for /offline
 */

import type { Metadata } from "next"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@afenda/shadcn"
import { Alert, AlertDescription, AlertTitle } from "@afenda/shadcn"
import { WifiOff, CheckCircle2, AlertCircle } from "lucide-react"

import { OfflinePageClient } from "./offline-client"

export const metadata: Metadata = {
  title: "Offline - AFENDA",
  description: "You've lost your internet connection. Access offline capabilities and sync when back online.",
  robots: {
    index: false,
    follow: false,
  },
}

/**
 * Offline page - shown when no network connection
 * Server component that renders minimal markup with lazy client boundary
 */

export default function OfflinePage() {
  return (
    <div className="container mx-auto flex min-h-screen max-w-2xl items-center justify-center px-4 py-16">
      <Card className="w-full">
        <CardHeader className="text-center">
          <div className="mb-4 flex justify-center">
            <WifiOff className="h-16 w-16 text-muted-foreground" aria-hidden="true" />
          </div>
          <CardTitle className="text-3xl">You&apos;re offline</CardTitle>
          <CardDescription className="text-base">
            It looks like you&apos;ve lost your internet connection.
            Don&apos;t worry - you can still access your tasks and create new ones.
            Your changes will sync automatically when you&apos;re back online.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          <Alert>
            <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
            <AlertTitle>What you can do offline:</AlertTitle>
            <AlertDescription>
              <ul className="mt-2 space-y-1 text-sm">
                <li>• View all your tasks and projects</li>
                <li>• Create new tasks</li>
                <li>• Edit existing tasks</li>
                <li>• Mark tasks as complete</li>
                <li>• Organize tasks into projects</li>
              </ul>
            </AlertDescription>
          </Alert>

          <Alert className="border-yellow-200 bg-yellow-50 text-yellow-900">
            <AlertCircle className="h-4 w-4" aria-hidden="true" />
            <AlertTitle>What requires internet:</AlertTitle>
            <AlertDescription className="text-yellow-800">
              <ul className="mt-2 space-y-1 text-sm">
                <li>• Initial sign in</li>
                <li>• Syncing with other devices</li>
                <li>• Collaborative features</li>
                <li>• Email notifications</li>
              </ul>
            </AlertDescription>
          </Alert>

          <div className="flex flex-col gap-2 pt-4">
            <OfflinePageClient />
            <p className="text-center text-sm text-muted-foreground">
              This page will automatically refresh when your connection is restored.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
