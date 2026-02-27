import { Moon, Sun } from 'lucide-react'
import { useTheme } from '@/shared/lib/theme-provider'
import { Button } from '@/shared/ui/button'
import { cn } from '@/shared/lib/utils'

export function ThemeToggle({ className }: { className?: string }) {
  const { mode, toggleMode } = useTheme()

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      onClick={toggleMode}
      className={cn('shrink-0', className)}
      aria-label={mode === 'dark' ? 'Ativar tema claro' : 'Ativar tema escuro'}
    >
      {mode === 'dark' ? (
        <Sun className="h-4 w-4" />
      ) : (
        <Moon className="h-4 w-4" />
      )}
    </Button>
  )
}
