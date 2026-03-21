import { useCallback } from 'react'

export function useAutoResize(): (element: HTMLTextAreaElement) => void {
  return useCallback((element: HTMLTextAreaElement) => {
    element.style.height = 'auto'
    element.style.height = `${element.scrollHeight}px`
  }, [])
}
