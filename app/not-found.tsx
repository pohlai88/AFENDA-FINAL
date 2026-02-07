import Link from "next/link"

import { Button } from "@afenda/shadcn"
import { routes } from "@afenda/shared/constants"

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-svh max-w-xl flex-col items-center justify-center gap-4 p-6 text-center">
      <h1 className="text-2xl font-semibold">Page not found</h1>
      <p className="text-muted-foreground">
        The page you are looking for doesn’t exist or has moved.
      </p>
      <div className="flex flex-wrap justify-center gap-2">
        <Button asChild>
          <Link href={routes.ui.marketing.home()}>Go home</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href={routes.ui.orchestra.root()}>Go to app</Link>
        </Button>
      </div>
    </main>
  )
}
