import { Moon, Sun, Palette } from 'lucide-react'
import { useTheme, COLOR_THEMES } from '@/shared/lib/theme-provider'
import { Button } from '@/shared/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/shared/ui/dropdown-menu'
import { cn } from '@/shared/lib/utils'

export function ThemeSelector({ className }: { className?: string }) {
  const { mode, colorTheme, toggleMode, setColorTheme } = useTheme()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={cn('shrink-0', className)}
          aria-label="Selecionar tema"
        >
          <Palette className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-52 bg-popover border-border">
        {/* Mode toggle */}
        <DropdownMenuLabel className="text-[10px] text-muted-foreground uppercase tracking-wider pb-1">
          Modo
        </DropdownMenuLabel>
        <div className="px-2 pb-2">
          <div className="flex gap-1 p-1 bg-muted rounded-lg">
            <button
              className={cn(
                'flex-1 flex items-center justify-center gap-1.5 h-7 rounded-md text-xs font-medium transition-all',
                mode === 'light'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              )}
              onClick={() => { if (mode !== 'light') toggleMode() }}
            >
              <Sun className="w-3 h-3" />
              Claro
            </button>
            <button
              className={cn(
                'flex-1 flex items-center justify-center gap-1.5 h-7 rounded-md text-xs font-medium transition-all',
                mode === 'dark'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              )}
              onClick={() => { if (mode !== 'dark') toggleMode() }}
            >
              <Moon className="w-3 h-3" />
              Escuro
            </button>
          </div>
        </div>

        <DropdownMenuSeparator className="bg-border" />

        {/* Color palette */}
        <DropdownMenuLabel className="text-[10px] text-muted-foreground uppercase tracking-wider pb-1">
          Paleta de Cores
        </DropdownMenuLabel>
        <div className="px-2 pb-2 space-y-1">
          {COLOR_THEMES.map((t) => {
            const swatch = mode === 'dark' ? t.primaryDark : t.primaryLight
            const isActive = colorTheme === t.id
            return (
              <button
                key={t.id}
                onClick={() => setColorTheme(t.id)}
                className={cn(
                  'w-full flex items-center gap-2.5 px-2 py-1.5 rounded-md text-xs font-medium transition-all',
                  isActive
                    ? 'bg-accent text-foreground'
                    : 'text-muted-foreground hover:bg-accent/50 hover:text-foreground'
                )}
              >
                <span
                  className="w-4 h-4 rounded-full shrink-0 ring-1 ring-border"
                  style={{ background: swatch }}
                />
                {t.label}
                {isActive && (
                  <span className="ml-auto w-1.5 h-1.5 rounded-full bg-primary" />
                )}
              </button>
            )
          })}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
