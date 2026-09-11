import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, fireEvent, act } from '@testing-library/react'
import { ConfigView } from '../../sections/config/ConfigView'
import { DEFAULT_SETTINGS } from '../../types'

// Load only the hook ConfigView needs, so unrelated hooks from the barrel don't enter the coverage report
vi.mock('../../hooks', () => ({ useIsMac: () => false }))

type ConfigViewProps = React.ComponentProps<typeof ConfigView>

function renderConfig(overrides: Partial<ConfigViewProps> = {}): {
  props: ConfigViewProps
  rerender: (props: ConfigViewProps) => void
} {
  const props: ConfigViewProps = {
    settings: DEFAULT_SETTINGS,
    isMacOS: false,
    appMode: 'normal',
    onFontSize: vi.fn(),
    onFontFamily: vi.fn(),
    onCodeTheme: vi.fn(),
    onLigatures: vi.fn(),
    onContentWidth: vi.fn(),
    onAppMode: vi.fn(),
    onCheckUpdate: vi.fn(),
    updateInfo: null,
    version: '1.15.2',
    ...overrides
  }
  const view = render(<ConfigView {...props} />)
  return { props, rerender: (next) => view.rerender(<ConfigView {...next} />) }
}

describe('ConfigView', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  describe('content width', () => {
    it('should list the available widths', () => {
      renderConfig()

      expect(screen.getByText('Content width')).toBeInTheDocument()
      for (const label of ['Narrow', 'Wide', 'Full']) {
        expect(screen.getByRole('button', { name: label })).toBeInTheDocument()
      }
    })

    it('should highlight the current width', () => {
      renderConfig({ settings: { ...DEFAULT_SETTINGS, contentWidth: 'wide' } })

      expect(screen.getByRole('button', { name: 'Wide' })).toHaveClass('bg-zinc-700/60')
      expect(screen.getByRole('button', { name: 'Narrow' })).not.toHaveClass('bg-zinc-700/60')
    })

    it('should change the width when an option is clicked', () => {
      const { props } = renderConfig()

      fireEvent.click(screen.getByRole('button', { name: 'Full' }))

      expect(props.onContentWidth).toHaveBeenCalledWith('full')
    })
  })

  describe('typography and editor', () => {
    it('should forward font, ligature and theme choices', () => {
      const { props } = renderConfig()

      fireEvent.click(screen.getByRole('button', { name: '14' }))
      fireEvent.click(screen.getByRole('button', { name: 'JetBrains Mono' }))
      fireEvent.click(screen.getByRole('button', { name: 'On' }))
      fireEvent.click(screen.getByRole('button', { name: 'Nord' }))

      expect(props.onFontSize).toHaveBeenCalledWith(14)
      expect(props.onFontFamily).toHaveBeenCalledWith('jetbrains')
      expect(props.onLigatures).toHaveBeenCalledWith(true)
      expect(props.onCodeTheme).toHaveBeenCalledWith('nord')
    })
  })

  describe('window mode', () => {
    it('should hide the window section outside macOS', () => {
      renderConfig()

      expect(screen.queryByText('Application Mode')).not.toBeInTheDocument()
    })

    it('should highlight normal mode on macOS', () => {
      renderConfig({ isMacOS: true })

      expect(screen.getByRole('button', { name: 'Normal app' })).toHaveClass('bg-zinc-700/60')
      expect(screen.getByRole('button', { name: 'Menu bar app' })).not.toHaveClass('bg-zinc-700/60')
    })

    it('should switch application mode on macOS', () => {
      const { props } = renderConfig({ isMacOS: true, appMode: 'menubar' })

      expect(screen.getByRole('button', { name: 'Menu bar app' })).toHaveClass('bg-zinc-700/60')

      fireEvent.click(screen.getByRole('button', { name: 'Normal app' }))
      fireEvent.click(screen.getByRole('button', { name: 'Menu bar app' }))

      expect(props.onAppMode).toHaveBeenNthCalledWith(1, 'normal')
      expect(props.onAppMode).toHaveBeenNthCalledWith(2, 'menubar')
    })
  })

  describe('about and updates', () => {
    it('should show the app version', () => {
      renderConfig()

      expect(screen.getByText('v1.15.2')).toBeInTheDocument()
    })

    it('should fall back to v0.0.0 when the version is unknown', () => {
      renderConfig({ version: '' })

      expect(screen.getByText('v0.0.0')).toBeInTheDocument()
    })

    it('should open the repository on GitHub', () => {
      renderConfig()

      fireEvent.click(screen.getByTitle('GitHub repository'))

      expect(window.api.openExternal).toHaveBeenCalledWith('https://github.com/blas-works/infinito')
    })

    it.each([
      [{ available: true, downloaded: false, progress: 42 }, 'Downloading... 42%', true],
      [{ available: true, downloaded: false }, 'Downloading... 0%', true],
      [{ available: true, downloaded: false, progress: 100 }, 'Updating...', false],
      [{ available: true, downloaded: true, progress: 100 }, 'Update ready', false]
    ])('should show update state %#', (updateInfo, label, disabled) => {
      renderConfig({ updateInfo })

      const button = screen.getByRole('button', { name: label })
      if (disabled) {
        expect(button).toBeDisabled()
      } else {
        expect(button).toBeEnabled()
      }
    })

    it('should report up to date after checking', () => {
      vi.useFakeTimers()
      const { props } = renderConfig()

      fireEvent.click(screen.getByRole('button', { name: 'Check for updates' }))

      expect(props.onCheckUpdate).toHaveBeenCalledTimes(1)
      expect(screen.getByRole('button', { name: 'Checking...' })).toBeDisabled()

      act(() => {
        vi.advanceTimersByTime(4000)
      })
      expect(screen.getByRole('button', { name: 'Up to date' })).toBeInTheDocument()

      act(() => {
        vi.advanceTimersByTime(3000)
      })
      expect(screen.getByRole('button', { name: 'Check for updates' })).toBeInTheDocument()
    })

    it('should not report up to date when an update appears while checking', () => {
      vi.useFakeTimers()
      const { props, rerender } = renderConfig()

      fireEvent.click(screen.getByRole('button', { name: 'Check for updates' }))
      rerender({ ...props, updateInfo: { available: true, downloaded: false, progress: 10 } })

      act(() => {
        vi.advanceTimersByTime(4000)
      })

      expect(screen.queryByRole('button', { name: 'Up to date' })).not.toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Downloading... 10%' })).toBeInTheDocument()
    })
  })
})
