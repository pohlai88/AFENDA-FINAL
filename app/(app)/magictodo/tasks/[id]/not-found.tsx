/**
 * @domain magictodo
 * @layer ui
 * @responsibility Not found state for task detail page
 */

import { Card, CardContent } from "@afenda/shadcn"
import { Button } from "@afenda/shadcn"
import { ListTodo, ArrowLeft } from "lucide-react"
import Link from "next/link"
import { routes } from "@afenda/shared/constants"

export default function TaskNotFound() {
  return (
    <div className="flex h-full items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardContent className="flex flex-col items-center justify-center space-y-4 py-12">
          <ListTodo className="h-16 w-16 text-muted-foreground" />
          <h2 className="text-center text-2xl font-bold">Task Not Found</h2>
          <p className="text-center text-muted-foreground">
            The task you&apos;re looking for doesn&apos;t exist or has been removed.
          </p>
          <Button asChild>
            <Link href={routes.ui.magictodo.tasks()}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Tasks
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
