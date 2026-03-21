import { useState, useEffect, useCallback } from 'react'
import type { Settings, FontSize, FontFamily, CodeTheme } from '@renderer/types'
import { DEFAULT_SETTINGS, FONT_FAMILIES } from '@renderer/types'

const STORAGE_KEY = 'infinito-settings'

function loadSettings(): Settings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return DEFAULT_SETTINGS
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) }
  } catch {
    return DEFAULT_SETTINGS
  }
}

function persistSettings(settings: Settings): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
}

function applyToDOM(settings: Settings): void {
  const root = document.documentElement
  root.style.setProperty('--app-font-size', `${settings.fontSize}px`)

  const font = FONT_FAMILIES.find((f) => f.id === settings.fontFamily)
  if (font) {
    root.style.setProperty('--app-font-family', font.value)
  }

  document.body.className = document.body.className
    .replace(/theme-[\w-]+/g, '')
    .trim()

  if (settings.codeTheme !== 'zinc') {
    document.body.classList.add(`theme-${settings.codeTheme}`)
  }
}

export function useSettings(): {
  settings: Settings
  setFontSize: (size: FontSize) => void
  setFontFamily: (family: FontFamily) => void
  setCodeTheme: (theme: CodeTheme) => void
} {
  const [settings, setSettings] = useState<Settings>(loadSettings)

  useEffect(() => {
    applyToDOM(settings)
    persistSettings(settings)
  }, [settings])

  const setFontSize = useCallback((fontSize: FontSize) => {
    setSettings((prev) => ({ ...prev, fontSize }))
  }, [])

  const setFontFamily = useCallback((fontFamily: FontFamily) => {
    setSettings((prev) => ({ ...prev, fontFamily }))
  }, [])

  const setCodeTheme = useCallback((codeTheme: CodeTheme) => {
    setSettings((prev) => ({ ...prev, codeTheme }))
  }, [])

  return { settings, setFontSize, setFontFamily, setCodeTheme }
}
