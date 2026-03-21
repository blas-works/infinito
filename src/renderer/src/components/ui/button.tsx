import * as React from 'react'
import { cn } from '../../lib/utils'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'outline' | 'ghost' | 'secondary'
  size?: 'default' | 'sm' | 'icon'
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'default', ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          'inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 cursor-default',
          {
            'bg-zinc-50 text-zinc-900 hover:bg-zinc-50/90': variant === 'default',
            'border border-zinc-800 bg-transparent hover:bg-zinc-800 text-zinc-50':
              variant === 'outline',
            'hover:bg-zinc-800/50 text-zinc-400 hover:text-zinc-50': variant === 'ghost',
            'bg-zinc-800 text-zinc-50 hover:bg-zinc-800/80': variant === 'secondary'
          },
          {
            'h-9 px-4 py-2': size === 'default',
            'h-7 rounded-md px-2.5 text-xs': size === 'sm',
            'h-8 w-8': size === 'icon'
          },
          className
        )}
        {...props}
      />
    )
  }
)
Button.displayName = 'Button'

export { Button }
export type { ButtonProps }
