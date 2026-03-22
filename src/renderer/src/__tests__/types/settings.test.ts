import { describe, it, expect } from 'vitest'
import {
  FONT_SIZES,
  FONT_FAMILIES,
  CODE_THEMES,
  DEFAULT_SETTINGS,
  type Settings,
  type FontSize,
  type FontFamily,
  type CodeTheme
} from '../../types/settings'

describe('FONT_SIZES', () => {
  it('should have correct font sizes', () => {
    expect(FONT_SIZES).toEqual([11, 12, 13, 14, 15, 16, 17])
  })
})

describe('FONT_FAMILIES', () => {
  it('should have 8 font families', () => {
    expect(FONT_FAMILIES).toHaveLength(8)
  })

  it('should have correct structure', () => {
    expect(FONT_FAMILIES[0]).toEqual({
      id: 'inter',
      label: 'Inter',
      value: "'Inter', sans-serif"
    })
    expect(FONT_FAMILIES[1]).toEqual({
      id: 'jetbrains',
      label: 'JetBrains Mono',
      value: "'JetBrains Mono', monospace"
    })
    expect(FONT_FAMILIES[7].id).toBe('system')
  })
})

describe('CODE_THEMES', () => {
  it('should have 12 themes', () => {
    expect(CODE_THEMES).toHaveLength(12)
  })

  it('should have correct structure for each theme', () => {
    CODE_THEMES.forEach((theme) => {
      expect(theme).toHaveProperty('id')
      expect(theme).toHaveProperty('label')
      expect(theme).toHaveProperty('colors')
      expect(theme.colors).toHaveLength(4)
    })
  })

  it('should include expected themes', () => {
    const themeIds = CODE_THEMES.map((t) => t.id)
    expect(themeIds).toContain('zinc')
    expect(themeIds).toContain('tokyo-night')
    expect(themeIds).toContain('dracula')
    expect(themeIds).toContain('nord')
  })
})

describe('DEFAULT_SETTINGS', () => {
  it('should have correct default values', () => {
    expect(DEFAULT_SETTINGS).toEqual({
      fontSize: 12,
      fontFamily: 'inter',
      codeTheme: 'zinc',
      ligatures: false
    })
  })

  it('should match Settings type', () => {
    const settings: Settings = DEFAULT_SETTINGS
    expect(settings.fontSize).toBeDefined()
    expect(settings.fontFamily).toBeDefined()
    expect(settings.codeTheme).toBeDefined()
  })
})

describe('Settings type', () => {
  it('should accept valid settings object', () => {
    const settings: Settings = {
      fontSize: 14,
      fontFamily: 'jetbrains',
      codeTheme: 'tokyo-night',
      ligatures: false
    }
    expect(settings.fontSize).toBe(14)
    expect(settings.fontFamily).toBe('jetbrains')
    expect(settings.codeTheme).toBe('tokyo-night')
  })
})

describe('Type constraints', () => {
  it('should enforce FontSize values', () => {
    const validSizes: FontSize[] = [11, 12, 13, 14, 15, 16, 17]
    validSizes.forEach((size) => {
      expect(FONT_SIZES).toContain(size)
    })
  })

  it('should enforce FontFamily values', () => {
    const validFamilies: FontFamily[] = [
      'inter',
      'jetbrains',
      'fira-code',
      'source-code-pro',
      'ibm-plex-mono',
      'cascadia-code',
      'geist-mono',
      'system'
    ]
    validFamilies.forEach((family) => {
      expect(FONT_FAMILIES.map((f) => f.id)).toContain(family)
    })
  })

  it('should enforce CodeTheme values', () => {
    const validThemes: CodeTheme[] = [
      'zinc',
      'tokyo-night',
      'github-dark',
      'catppuccin',
      'nord',
      'dracula',
      'solarized-dark',
      'gruvbox',
      'one-dark',
      'monokai',
      'rose-pine',
      'ayu-dark'
    ]
    validThemes.forEach((theme) => {
      expect(CODE_THEMES.map((t) => t.id)).toContain(theme)
    })
  })
})
