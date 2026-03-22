export type FontSize = 11 | 12 | 13 | 14 | 15 | 16 | 17

export type FontFamily =
  | 'inter'
  | 'jetbrains'
  | 'fira-code'
  | 'source-code-pro'
  | 'ibm-plex-mono'
  | 'cascadia-code'
  | 'geist-mono'
  | 'system'

export type CodeTheme =
  | 'zinc'
  | 'tokyo-night'
  | 'github-dark'
  | 'catppuccin'
  | 'nord'
  | 'dracula'
  | 'solarized-dark'
  | 'gruvbox'
  | 'one-dark'
  | 'monokai'
  | 'rose-pine'
  | 'ayu-dark'

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

export const FONT_SIZES: FontSize[] = [11, 12, 13, 14, 15, 16, 17]

export const FONT_FAMILIES: { id: FontFamily; label: string; value: string }[] = [
  { id: 'inter', label: 'Inter', value: "'Inter', sans-serif" },
  { id: 'jetbrains', label: 'JetBrains Mono', value: "'JetBrains Mono', monospace" },
  { id: 'fira-code', label: 'Fira Code', value: "'Fira Code', monospace" },
  { id: 'source-code-pro', label: 'Source Code Pro', value: "'Source Code Pro', monospace" },
  { id: 'ibm-plex-mono', label: 'IBM Plex Mono', value: "'IBM Plex Mono', monospace" },
  { id: 'cascadia-code', label: 'Cascadia Code', value: "'Cascadia Code', monospace" },
  { id: 'geist-mono', label: 'Geist Mono', value: "'Geist Mono', monospace" },
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
  { id: 'dracula', label: 'Dracula', colors: ['#ff79c6', '#50fa7b', '#f1fa8c', '#bd93f9'] },
  {
    id: 'solarized-dark',
    label: 'Solarized Dark',
    colors: ['#dc322f', '#859900', '#b58900', '#268bd2']
  },
  { id: 'gruvbox', label: 'Gruvbox', colors: ['#fb4934', '#b8bb26', '#fabd2f', '#83a598'] },
  { id: 'one-dark', label: 'One Dark', colors: ['#e06c75', '#98c379', '#e5c07b', '#61afef'] },
  { id: 'monokai', label: 'Monokai', colors: ['#f92672', '#a6e22e', '#e6db74', '#66d9ef'] },
  {
    id: 'rose-pine',
    label: 'Rosé Pine',
    colors: ['#eb6f92', '#9ccfd8', '#f6c177', '#c4a7e7']
  },
  { id: 'ayu-dark', label: 'Ayu Dark', colors: ['#f07178', '#aad94c', '#e6b450', '#59c2ff'] }
]

export const DEFAULT_SETTINGS: Settings = {
  fontSize: 12,
  fontFamily: 'inter',
  codeTheme: 'zinc'
}
