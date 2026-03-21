import { Check } from 'lucide-react'
import { motion } from 'motion/react'
import { cn } from '@renderer/lib/utils'
import type { FontSize, FontFamily, CodeTheme, Settings } from '@renderer/types'
import { FONT_SIZES, FONT_FAMILIES, CODE_THEMES } from '@renderer/types'

interface ConfigViewProps {
  settings: Settings
  onFontSize: (size: FontSize) => void
  onFontFamily: (family: FontFamily) => void
  onCodeTheme: (theme: CodeTheme) => void
}

export function ConfigView({
  settings,
  onFontSize,
  onFontFamily,
  onCodeTheme
}: ConfigViewProps): React.JSX.Element {
  return (
    <motion.div
      key="config"
      initial={{ opacity: 0, x: 8 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 8 }}
      transition={{ duration: 0.15, ease: 'easeOut' }}
      className="space-y-3"
    >
      {/* Font Size */}
      <section>
        <h2 className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-3">
          Font size
        </h2>
        <div className="flex items-center gap-1">
          {FONT_SIZES.map((size) => (
            <button
              key={size}
              onClick={() => onFontSize(size)}
              className={cn(
                'h-7 w-10 rounded-md text-[11px] font-mono transition-colors',
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
    </motion.div>
  )
}
