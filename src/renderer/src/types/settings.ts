export type FontSize = 11 | 12 | 13 | 14

export type FontFamily = 'inter' | 'jetbrains' | 'system'

export type CodeTheme = 'zinc' | 'tokyo-night' | 'github-dark' | 'catppuccin' | 'nord' | 'dracula'

export interface CodeThemeOption {
  id: CodeTheme
  label: string
  colors: [string, string, string, string]
}

export interface Settings {
  fontSize: FontSize
  fontFamily: FontFamily
  codeTheme: CodeTheme
}

export const FONT_SIZES: FontSize[] = [11, 12, 13, 14]

export const FONT_FAMILIES: { id: FontFamily; label: string; value: string }[] = [
  { id: 'inter', label: 'Inter', value: "'Inter', sans-serif" },
  { id: 'jetbrains', label: 'JetBrains Mono', value: "'JetBrains Mono', monospace" },
  {
    id: 'system',
    label: 'System',
    value: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
  }
]

export const CODE_THEMES: CodeThemeOption[] = [
  { id: 'zinc', label: 'Zinc', colors: ['#f87171', '#86efac', '#fbbf24', '#93c5fd'] },
  {
    id: 'tokyo-night',
    label: 'Tokyo Night',
    colors: ['#bb9af7', '#9ece6a', '#ff9e64', '#7aa2f7']
  },
  {
    id: 'github-dark',
    label: 'GitHub Dark',
    colors: ['#ff7b72', '#7ee787', '#d2a8ff', '#79c0ff']
  },
  {
    id: 'catppuccin',
    label: 'Catppuccin',
    colors: ['#f38ba8', '#a6e3a1', '#f9e2af', '#89b4fa']
  },
  { id: 'nord', label: 'Nord', colors: ['#bf616a', '#a3be8c', '#ebcb8b', '#81a1c1'] },
  { id: 'dracula', label: 'Dracula', colors: ['#ff79c6', '#50fa7b', '#f1fa8c', '#bd93f9'] }
]

export const DEFAULT_SETTINGS: Settings = {
  fontSize: 12,
  fontFamily: 'inter',
  codeTheme: 'zinc'
}
