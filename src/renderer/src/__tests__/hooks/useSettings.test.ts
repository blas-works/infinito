import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useSettings } from '../../hooks/useSettings'
import { DEFAULT_SETTINGS, FONT_FAMILIES } from '../../types'

describe('useSettings', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.clearAllMocks()
  })

  it('should initialize with default settings', () => {
    const { result } = renderHook(() => useSettings())

    expect(result.current.settings).toEqual(DEFAULT_SETTINGS)
  })

  it('should set font size', () => {
    const { result } = renderHook(() => useSettings())

    act(() => {
      result.current.setFontSize(14)
    })

    expect(result.current.settings.fontSize).toBe(14)
  })

  it('should set font family', () => {
    const { result } = renderHook(() => useSettings())

    act(() => {
      result.current.setFontFamily('jetbrains')
    })

    expect(result.current.settings.fontFamily).toBe('jetbrains')
  })

  it('should set code theme', () => {
    const { result } = renderHook(() => useSettings())

    act(() => {
      result.current.setCodeTheme('tokyo-night')
    })

    expect(result.current.settings.codeTheme).toBe('tokyo-night')
  })

  it('should persist settings to localStorage', () => {
    const { result } = renderHook(() => useSettings())

    act(() => {
      result.current.setFontSize(13)
    })

    const stored = localStorage.getItem('infinito-settings')
    expect(stored).not.toBeNull()
    const parsed = JSON.parse(stored!)
    expect(parsed.fontSize).toBe(13)
  })

  it('should load settings from localStorage on mount', () => {
    const savedSettings = {
      fontSize: 14,
      fontFamily: 'jetbrains',
      codeTheme: 'dracula'
    }

    localStorage.setItem('infinito-settings', JSON.stringify(savedSettings))

    const { result } = renderHook(() => useSettings())

    expect(result.current.settings.fontSize).toBe(14)
    expect(result.current.settings.fontFamily).toBe('jetbrains')
    expect(result.current.settings.codeTheme).toBe('dracula')
  })

  it('should merge saved settings with defaults', () => {
    const partialSettings = {
      fontSize: 11
    }

    localStorage.setItem('infinito-settings', JSON.stringify(partialSettings))

    const { result } = renderHook(() => useSettings())

    expect(result.current.settings.fontSize).toBe(11)
    expect(result.current.settings.fontFamily).toBe(DEFAULT_SETTINGS.fontFamily)
    expect(result.current.settings.codeTheme).toBe(DEFAULT_SETTINGS.codeTheme)
  })

  it('should handle invalid localStorage data', () => {
    localStorage.setItem('infinito-settings', 'invalid-json')

    const { result } = renderHook(() => useSettings())

    expect(result.current.settings).toEqual(DEFAULT_SETTINGS)
  })

  it('should apply font size to DOM', () => {
    const { result } = renderHook(() => useSettings())

    act(() => {
      result.current.setFontSize(14)
    })

    const root = document.documentElement
    const fontSize = root.style.getPropertyValue('--app-font-size')
    expect(fontSize).toBe('14px')
  })

  it('should apply font family to DOM', () => {
    const { result } = renderHook(() => useSettings())

    act(() => {
      result.current.setFontFamily('jetbrains')
    })

    const root = document.documentElement
    const fontFamily = root.style.getPropertyValue('--app-font-family')
    const jetbrainsFont = FONT_FAMILIES.find((f) => f.id === 'jetbrains')
    expect(fontFamily).toBe(jetbrainsFont?.value)
  })

  it('should toggle ligatures and apply them to DOM', () => {
    const { result } = renderHook(() => useSettings())

    act(() => {
      result.current.setLigatures(true)
    })

    expect(result.current.settings.ligatures).toBe(true)
    expect(document.documentElement.style.getPropertyValue('--app-font-ligatures')).toBe('normal')
  })

  it('should not apply an unknown font family to DOM', () => {
    document.documentElement.style.removeProperty('--app-font-family')
    localStorage.setItem('infinito-settings', JSON.stringify({ fontFamily: 'comic-sans' }))

    renderHook(() => useSettings())

    expect(document.documentElement.style.getPropertyValue('--app-font-family')).toBe('')
  })

  it('should default content width to narrow', () => {
    const { result } = renderHook(() => useSettings())

    expect(result.current.settings.contentWidth).toBe('narrow')
    expect(document.documentElement.style.getPropertyValue('--app-content-width')).toBe('42rem')
  })

  it('should set content width and apply it to DOM', () => {
    const { result } = renderHook(() => useSettings())

    act(() => {
      result.current.setContentWidth('full')
    })

    expect(result.current.settings.contentWidth).toBe('full')
    expect(document.documentElement.style.getPropertyValue('--app-content-width')).toBe('none')
  })

  it('should keep narrow width for settings saved before content width existed', () => {
    localStorage.setItem(
      'infinito-settings',
      JSON.stringify({ fontSize: 14, fontFamily: 'inter', codeTheme: 'zinc', ligatures: false })
    )

    const { result } = renderHook(() => useSettings())

    expect(result.current.settings.contentWidth).toBe('narrow')
  })

  it('should not apply an unknown content width to DOM', () => {
    document.documentElement.style.removeProperty('--app-content-width')
    localStorage.setItem('infinito-settings', JSON.stringify({ contentWidth: 'huge' }))

    renderHook(() => useSettings())

    expect(document.documentElement.style.getPropertyValue('--app-content-width')).toBe('')
  })
})
