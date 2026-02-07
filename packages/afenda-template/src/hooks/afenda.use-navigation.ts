/**
 * Hook for detecting navigation transitions and slow network states
 * Returns transition state to enable visual feedback during navigation
 * 
 * @example
 * const { isPending } = useNavigation()
 * return <>{isPending && <ProgressBar />}</>
 */

import { useTransition } from 'react'

export function useNavigation() {
  const [isPending, startTransition] = useTransition()

  return {
    isPending,
    startTransition,
  }
}
