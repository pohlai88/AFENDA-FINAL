'use client'

import { useEffect } from "react"
import Link from "next/link"
import { Button } from "@afenda/shadcn"

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <html lang="en">
      <body className="min-h-svh bg-background text-foreground">
        <main className="mx-auto flex min-h-svh max-w-xl flex-col items-center justify-center gap-4 p-6 text-center">
          <h1 className="text-2xl font-semibold">Something went wrong</h1>
          <p className="text-muted-foreground">
            An unexpected error occurred. You can try again or return home.
          </p>
          {error.digest ? (
            <p className="text-xs text-muted-foreground">Digest: {error.digest}</p>
          ) : null}
          <div className="flex flex-wrap justify-center gap-2">
            <Button onClick={() => reset()} variant="outline">
              Try again
            </Button>
            <Button asChild>
              <Link href="/">Go home</Link>
            </Button>
          </div>
        </main>
      </body>
    </html>
  )
}
