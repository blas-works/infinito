import { useState, useRef, useEffect } from 'react'
import { Check, RefreshCw, Github } from 'lucide-react'
import { motion } from 'motion/react'
import { cn } from '@renderer/lib/utils'
import { Button } from '@renderer/components/ui/button'
import type { FontSize, FontFamily, CodeTheme, Settings, UpdateInfo } from '@renderer/types'
import { FONT_SIZES, FONT_FAMILIES, CODE_THEMES } from '@renderer/types'

interface ConfigViewProps {
  settings: Settings
  onFontSize: (size: FontSize) => void
  onFontFamily: (family: FontFamily) => void
  onCodeTheme: (theme: CodeTheme) => void
  onCheckUpdate: () => void
  updateInfo: UpdateInfo | null
  version: string
}

export function ConfigView({
  settings,
  onFontSize,
  onFontFamily,
  onCodeTheme,
  onCheckUpdate,
  updateInfo,
  version
}: ConfigViewProps): React.JSX.Element {
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
    window.api?.openExternal('https://github.com/torrescereno/infinito')
  }

  return (
    <motion.div
      key="config"
      initial={{ opacity: 0, x: 8 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 8 }}
      transition={{ duration: 0.15, ease: 'easeOut' }}
      className="flex flex-col gap-3 pb-6"
    >
      {/* Font Size */}
      <section>
        <h2 className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-3">
          Font size
        </h2>
        <div className="flex items-center gap-1 flex-wrap">
          {FONT_SIZES.map((size) => (
            <button
              key={size}
              onClick={() => onFontSize(size)}
              className={cn(
                'h-7 w-9 rounded-md text-[11px] font-mono transition-colors',
                settings.fontSize === size
                  ? 'bg-zinc-800 text-zinc-200'
                  : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900'
              )}
            >
              {size}
            </button>
          ))}
        </div>
      </section>

      {/* Font Family */}
      <section>
        <h2 className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-3">Font</h2>
        <div className="space-y-0.5">
          {FONT_FAMILIES.map((font) => (
            <button
              key={font.id}
              onClick={() => onFontFamily(font.id)}
              className={cn(
                'flex items-center justify-between w-full h-8 px-3 rounded-md text-xs transition-colors',
                settings.fontFamily === font.id
                  ? 'bg-zinc-800 text-zinc-200'
                  : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900'
              )}
            >
              <span style={{ fontFamily: font.value }}>{font.label}</span>
              {settings.fontFamily === font.id && <Check className="w-3 h-3 text-zinc-400" />}
            </button>
          ))}
        </div>
      </section>

      {/* Code Theme */}
      <section>
        <h2 className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-3">
          Code theme
        </h2>
        <div className="space-y-0.5">
          {CODE_THEMES.map((theme) => (
            <button
              key={theme.id}
              onClick={() => onCodeTheme(theme.id)}
              className={cn(
                'flex items-center justify-between w-full h-8 px-3 rounded-md text-xs transition-colors',
                settings.codeTheme === theme.id
                  ? 'bg-zinc-800 text-zinc-200'
                  : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900'
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

      {/* Check for updates */}
      <div className="flex justify-center pt-2">
        <button
          onClick={handleCheckUpdate}
          disabled={checking || isDownloading}
          className={cn(
            'inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[11px] font-medium transition-colors',
            'border border-zinc-800/50 hover:border-zinc-700',
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

      {/* Footer: GitHub + Version */}
      <div className="mt-auto pt-4 border-t border-zinc-800/50">
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleGithubClick}
            className="h-7 w-7 text-zinc-600 hover:text-zinc-300"
            title="GitHub repository"
          >
            <Github size={14} strokeWidth={1.5} />
          </Button>
          <span className="text-[11px] text-zinc-600 font-light tracking-wide">
            v{version || '0.0.0'}
          </span>
        </div>
      </div>
    </motion.div>
  )
}
