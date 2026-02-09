/**
 * Shared hooks barrel export.
 *
 * Domain-specific hooks have been migrated to their owning packages:
 *  - `getKeyboardShortcutList` / `useKeyboardShortcuts` → `@afenda/magicdrive/hooks`
 *  - `useTaskIndicators` / `TaskIndicators` → `@afenda/magictodo/hooks`
 *
 * This file is intentionally empty — kept so the `@afenda/shared/hooks`
 * entrypoint continues to resolve without breaking existing package.json
 * exports. Add new cross-domain hooks here if needed.
 *
 * @domain shared
 * @layer hooks
 */

export {};
