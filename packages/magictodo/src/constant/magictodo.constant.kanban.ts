import type { TaskResponse } from "@afenda/magictodo/zod";

export function columnIdToStatus(columnId: string): TaskResponse["status"] {
  switch (columnId) {
    case "todo":
      return "todo";
    case "in_progress":
      return "in_progress";
    case "done":
      return "done";
    case "cancelled":
      return "cancelled";
    default:
      return "todo";
  }
}
