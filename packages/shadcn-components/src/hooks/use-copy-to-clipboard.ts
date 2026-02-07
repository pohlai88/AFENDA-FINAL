/**
 * @domain shared
 * @layer ui
 * @responsibility Copy to clipboard hook with feedback state
 * @owner afenda/shadcn
 * @exports
 * - useCopyToClipboard hook
 */

import * as React from "react"

interface CopyToClipboardState {
  value: string | null
  success: boolean | null
}

type CopyFn = (text: string) => Promise<boolean>

/**
 * React hook for copying text to the clipboard.
 * Provides copied value and success state for user feedback.
 *
 * @example
 * const [copiedText, copy] = useCopyToClipboard()
 *
 * return (
 *   <Button onClick={() => copy("Hello, World!")}>
 *     {copiedText ? "Copied!" : "Copy"}
 *   </Button>
 * )
 */
export function useCopyToClipboard(): [CopyToClipboardState, CopyFn] {
  const [state, setState] = React.useState<CopyToClipboardState>({
    value: null,
    success: null,
  })

  const copy: CopyFn = React.useCallback(async (text: string) => {
    if (!navigator?.clipboard) {
      console.warn("Clipboard API not available")
      setState({ value: text, success: false })
      return false
    }

    try {
      await navigator.clipboard.writeText(text)
      setState({ value: text, success: true })
      return true
    } catch (error) {
      console.warn("Failed to copy to clipboard:", error)
      setState({ value: text, success: false })
      return false
    }
  }, [])

  return [state, copy]
}

/**
 * React hook for copying text to clipboard with auto-reset.
 * The copied state automatically resets after a timeout.
 *
 * @example
 * const { copied, copy, reset } = useCopyToClipboardWithReset({ timeout: 2000 })
 *
 * return (
 *   <Button onClick={() => copy("Hello, World!")}>
 *     {copied ? <CheckIcon /> : <CopyIcon />}
 *   </Button>
 * )
 */
export function useCopyToClipboardWithReset(options?: { timeout?: number }) {
  const { timeout = 2000 } = options ?? {}
  const [copied, setCopied] = React.useState(false)
  const timeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null)

  const copy = React.useCallback(
    async (text: string) => {
      if (!navigator?.clipboard) {
        console.warn("Clipboard API not available")
        return false
      }

      try {
        await navigator.clipboard.writeText(text)
        setCopied(true)

        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current)
        }

        timeoutRef.current = setTimeout(() => {
          setCopied(false)
        }, timeout)

        return true
      } catch (error) {
        console.warn("Failed to copy to clipboard:", error)
        return false
      }
    },
    [timeout]
  )

  const reset = React.useCallback(() => {
    setCopied(false)
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
  }, [])

  // Cleanup on unmount
  React.useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  return { copied, copy, reset }
}
