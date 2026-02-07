/**
 * Client-side storage keys.
 * Use typed constants instead of magic strings.
 *
 * @domain shared
 * @layer constants
 */

/** localStorage key for command palette recent items */
export const COMMAND_PALETTE_RECENT_KEY = "afenda:command-palette-recent";

/** sessionStorage key – FAB "Press ? for help" hint dismissed this session */
export const FAB_HINT_DISMISSED_KEY = "afenda:fab-hint-dismissed";

/** Custom event: open Machina recommendations (e.g. from FAB). Dispatch on window. */
export const MACHINA_OPEN_EVENT = "show-machina-recommendations";
