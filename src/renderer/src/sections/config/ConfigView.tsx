import { useState, useRef, useEffect } from 'react'
import { Check, RefreshCw, Github } from 'lucide-react'
import { cn } from '@renderer/lib/utils'
import { Button } from '@renderer/components/ui/button'
import type {
  FontSize,
  FontFamily,
  CodeTheme,
  ContentWidth,
  Settings,
  UpdateInfo
} from '@renderer/types'
import {
  FONT_SIZES,
  FONT_FAMILIES,
  CODE_THEMES,
  CONTENT_WIDTHS,
  SHORTCUT_GROUPS,
  SHORTCUTS,
  formatShortcutKeys
} from '@renderer/types'
import { useIsMac } from '@renderer/hooks'

interface ConfigViewProps {
  settings: Settings
  isMacOS: boolean
  appMode: 'normal' | 'menubar'
  onFontSize: (size: FontSize) => void
  onFontFamily: (family: FontFamily) => void
  onCodeTheme: (theme: CodeTheme) => void
  onLigatures: (enabled: boolean) => void
  onContentWidth: (width: ContentWidth) => void
  onAppMode: (mode: 'normal' | 'menubar') => void
  onCheckUpdate: () => void
  updateInfo: UpdateInfo | null
  version: string
}

export function ConfigView({
  settings,
  isMacOS,
  appMode,
  onFontSize,
  onFontFamily,
  onCodeTheme,
  onLigatures,
  onContentWidth,
  onAppMode,
  onCheckUpdate,
  updateInfo,
  version
}: ConfigViewProps): React.JSX.Element {
  const isMac = useIsMac()

  const [checking, setChecking] = useState(false)
  const [upToDate, setUpToDate] = useState(false)
  const updateInfoRef = useRef(updateInfo)

  useEffect(() => {
    updateInfoRef.current = updateInfo
  })

  const isUpdating = updateInfo?.available === true
  const isDownloading = isUpdating && !updateInfo.downloaded && (updateInfo.progress ?? 0) < 100
  const isReady = isUpdating && updateInfo.downloaded === true

  const handleCheckUpdate = (): void => {
    setChecking(true)
    setUpToDate(false)
    onCheckUpdate()

    setTimeout(() => {
      setChecking(false)
      if (!updateInfoRef.current?.available) {
        setUpToDate(true)
        setTimeout(() => setUpToDate(false), 3000)
      }
    }, 4000)
  }

  const getUpdateLabel = (): string => {
    if (isReady) return 'Update ready'
    if (isDownloading) return `Downloading... ${updateInfo?.progress ?? 0}%`
    if (isUpdating) return 'Updating...'
    if (checking) return 'Checking...'
    if (upToDate) return 'Up to date'
    return 'Check for updates'
  }

  const handleGithubClick = (): void => {
    window.api?.openExternal('https://github.com/blas-works/infinito')
  }

  return (
    <div className="flex flex-col gap-4 pb-6">
      {/* Typography */}
      <div className="rounded-xl bg-zinc-900/40 border border-zinc-800/30 p-4 space-y-4">
        <h2 className="text-[10px] font-semibold text-zinc-500 uppercase tracking-widest">
          Typography
        </h2>

        {/* Font Size */}
        <section className="space-y-2">
          <label className="text-[11px] text-zinc-400">Size</label>
          <div className="flex items-center gap-1 flex-wrap">
            {FONT_SIZES.map((size) => (
              <button
                key={size}
                onClick={() => onFontSize(size)}
                className={cn(
                  'h-7 w-9 rounded-md text-[11px] font-mono transition-colors',
                  settings.fontSize === size
                    ? 'bg-zinc-700/60 text-zinc-200'
                    : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50'
                )}
              >
                {size}
              </button>
            ))}
          </div>
        </section>

        <div className="border-t border-zinc-800/30" />

        {/* Font Family */}
        <section className="space-y-2">
          <label className="text-[11px] text-zinc-400">Font</label>
          <div className="space-y-0.5">
            {FONT_FAMILIES.map((font) => (
              <button
                key={font.id}
                onClick={() => onFontFamily(font.id)}
                className={cn(
                  'flex items-center justify-between w-full h-8 px-3 rounded-md text-xs transition-colors',
                  settings.fontFamily === font.id
                    ? 'bg-zinc-700/60 text-zinc-200'
                    : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50'
                )}
              >
                <span style={{ fontFamily: font.value }}>{font.label}</span>
                {settings.fontFamily === font.id && <Check className="w-3 h-3 text-zinc-400" />}
              </button>
            ))}
          </div>
        </section>

        <div className="border-t border-zinc-800/30" />

        {/* Ligatures */}
        <section className="space-y-2">
          <label className="text-[11px] text-zinc-400">Ligatures</label>
          <div className="flex items-center gap-1">
            {(['Off', 'On'] as const).map((label) => {
              const enabled = label === 'On'
              return (
                <button
                  key={label}
                  onClick={() => onLigatures(enabled)}
                  className={cn(
                    'h-7 px-3 rounded-md text-[11px] font-mono transition-colors',
                    settings.ligatures === enabled
                      ? 'bg-zinc-700/60 text-zinc-200'
                      : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50'
                  )}
                >
                  {label}
                </button>
              )
            })}
          </div>
        </section>
      </div>

      {/* Layout */}
      <div className="rounded-xl bg-zinc-900/40 border border-zinc-800/30 p-4 space-y-3">
        <h2 className="text-[10px] font-semibold text-zinc-500 uppercase tracking-widest">
          Layout
        </h2>

        {/* Content Width */}
        <section className="space-y-2">
          <label className="text-[11px] text-zinc-400">Content width</label>
          <div className="flex items-center gap-1">
            {CONTENT_WIDTHS.map((width) => (
              <button
                key={width.id}
                onClick={() => onContentWidth(width.id)}
                className={cn(
                  'h-7 px-3 rounded-md text-[11px] font-mono transition-colors',
                  settings.contentWidth === width.id
                    ? 'bg-zinc-700/60 text-zinc-200'
                    : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50'
                )}
              >
                {width.label}
              </button>
            ))}
          </div>
          <p className="text-[10px] text-zinc-500">
            Maximum width of Daily and Notes on large windows.
          </p>
        </section>
      </div>

      {/* Editor */}
      <div className="rounded-xl bg-zinc-900/40 border border-zinc-800/30 p-4 space-y-3">
        <h2 className="text-[10px] font-semibold text-zinc-500 uppercase tracking-widest">
          Editor
        </h2>

        {/* Code Theme */}
        <section className="space-y-2">
          <label className="text-[11px] text-zinc-400">Theme</label>
          <div className="space-y-0.5">
            {CODE_THEMES.map((theme) => (
              <button
                key={theme.id}
                onClick={() => onCodeTheme(theme.id)}
                className={cn(
                  'flex items-center justify-between w-full h-8 px-3 rounded-md text-xs transition-colors',
                  settings.codeTheme === theme.id
                    ? 'bg-zinc-700/60 text-zinc-200'
                    : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50'
                )}
              >
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1">
                    {theme.colors.map((color, i) => (
                      <div
                        key={i}
                        className="w-2.5 h-2.5 rounded-full"
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                  <span>{theme.label}</span>
                </div>
                {settings.codeTheme === theme.id && <Check className="w-3 h-3 text-zinc-400" />}
              </button>
            ))}
          </div>
        </section>
      </div>

      {/* Shortcuts */}
      <div className="rounded-xl bg-zinc-900/40 border border-zinc-800/30 p-4 space-y-3">
        <h2 className="text-[10px] font-semibold text-zinc-500 uppercase tracking-widest">
          Shortcuts
        </h2>
        <div className="space-y-3">
          {SHORTCUT_GROUPS.map((group) => {
            const groupShortcuts = SHORTCUTS.filter((s) => s.group === group)
            if (groupShortcuts.length === 0) return null
            return (
              <div key={group} className="space-y-1">
                <label className="text-[10px] text-zinc-600 font-medium">{group}</label>
                <div className="space-y-0.5">
                  {groupShortcuts.map((shortcut) => (
                    <div
                      key={shortcut.id}
                      className="flex items-center justify-between h-6 px-2 rounded-md text-xs"
                    >
                      <span className="text-zinc-400">{shortcut.label}</span>
                      <kbd className="text-[10px] font-mono text-zinc-500 bg-zinc-800/60 px-1.5 py-0.5 rounded">
                        {formatShortcutKeys(shortcut.keys, isMac)}
                      </kbd>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {isMacOS && (
        <div className="rounded-xl bg-zinc-900/40 border border-zinc-800/30 p-4 space-y-3">
          <h2 className="text-[10px] font-semibold text-zinc-500 uppercase tracking-widest">
            Window
          </h2>

          <section className="space-y-2">
            <label className="text-[11px] text-zinc-400">Application Mode</label>
            <div className="flex items-center gap-1">
              <button
                onClick={() => onAppMode('normal')}
                className={cn(
                  'h-7 px-3 rounded-md text-[11px] font-mono transition-colors',
                  appMode === 'normal'
                    ? 'bg-zinc-700/60 text-zinc-200'
                    : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50'
                )}
              >
                Normal app
              </button>
              <button
                onClick={() => onAppMode('menubar')}
                className={cn(
                  'h-7 px-3 rounded-md text-[11px] font-mono transition-colors',
                  appMode === 'menubar'
                    ? 'bg-zinc-700/60 text-zinc-200'
                    : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50'
                )}
              >
                Menu bar app
              </button>
            </div>
            <p className="text-[10px] text-zinc-500">
              Menu bar mode hides window on close and minimize.
            </p>
          </section>
        </div>
      )}

      {/* About */}
      <div className="rounded-xl bg-zinc-900/40 border border-zinc-800/30 p-4 space-y-4">
        <h2 className="text-[10px] font-semibold text-zinc-500 uppercase tracking-widest">About</h2>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleGithubClick}
              className="h-7 w-7 text-zinc-500 hover:text-zinc-300"
              title="GitHub repository"
            >
              <Github size={14} strokeWidth={1.5} />
            </Button>
            <span className="text-[11px] text-zinc-500 font-light tracking-wide">
              v{version || '0.0.0'}
            </span>
          </div>

          <button
            onClick={handleCheckUpdate}
            disabled={checking || isDownloading}
            className={cn(
              'inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-medium transition-colors',
              'border border-zinc-800/40 hover:border-zinc-700',
              upToDate ? 'text-green-400/70' : 'text-zinc-400 hover:text-zinc-300',
              (checking || isDownloading) && 'opacity-60 cursor-not-allowed'
            )}
          >
            {upToDate ? (
              <Check size={12} strokeWidth={1.5} />
            ) : (
              <RefreshCw
                size={12}
                strokeWidth={1.5}
                className={checking || isDownloading ? 'animate-spin' : ''}
              />
            )}
            {getUpdateLabel()}
          </button>
        </div>
      </div>
    </div>
  )
}
