/**
 * Table view utility functions for MagicTodo.
 * Pure functions — no React, no side effects.
 *
 * @domain magictodo
 * @layer util
 */

/**
 * Format a date string for display in the table.
 * Shows "Mon DD" for current year, "Mon DD, YYYY" for other years.
 */
export function formatDate(dateString?: string | null): string {
  if (!dateString) return "—";
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: date.getFullYear() !== new Date().getFullYear() ? "numeric" : undefined,
  });
}

/**
 * Check if a date is overdue (before today).
 */
export function isOverdue(dateString?: string | null): boolean {
  if (!dateString) return false;
  const date = new Date(dateString);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return date < today;
}
