/**
 * magictodo domain route constants.
 * Re-exports and extends shared routes for type safety and consistency.
 */

import { routes } from "@afenda/shared/constants"

export const MAGICTODO_ROUTES = {
  ui: {
    root: routes.ui.magictodo.root(),
    dashboard: routes.ui.magictodo.dashboard(),
    list: routes.ui.magictodo.tasks(),
    tasks: routes.ui.magictodo.tasks(),
    detail: routes.ui.magictodo.taskDetail,
    create: routes.ui.magictodo.tasks(),
    edit: routes.ui.magictodo.taskEdit,
    kanban: routes.ui.magictodo.kanban(),
    projects: routes.ui.magictodo.projects(),
  },
  api: {
    bff: routes.api.magictodo.bff.root(),
    v1: routes.api.magictodo.v1.root(),
    ops: routes.api.magictodo.ops.root(),
  },
} as const
