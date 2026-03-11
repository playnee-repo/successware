import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'

// ─── Types ────────────────────────────────────────────────────────────────────

export type ThemeMode = 'light' | 'dark'
export type ColorTheme = 'slate' | 'default'

export interface ColorThemeConfig {
  id: ColorTheme
  label: string
  /** oklch value of --primary for that theme (used in swatches) */
  primaryLight: string
  primaryDark: string
}

export const COLOR_THEMES: ColorThemeConfig[] = [
  {
    id: 'default',
    label: 'Warmth',
    primaryLight: 'oklch(0.4650 0.1470 24.9381)',
    primaryDark: 'oklch(0.5054 0.1905 27.5181)',
  },
  {
    id: 'slate',
    label: 'Slate',
    primaryLight: 'oklch(0.5091 0.1965 264.376)',
    primaryDark: 'oklch(0.6231 0.1880 264.376)',
  },
]

// ─── Storage keys ─────────────────────────────────────────────────────────────

const MODE_KEY = 'theme-mode'
const COLOR_KEY = 'theme-color'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function readMode(): ThemeMode {
  if (typeof window === 'undefined') return 'light'
  const stored = localStorage.getItem(MODE_KEY) as ThemeMode | null
  if (stored === 'light' || stored === 'dark') return stored
  return 'light'
}

function readColorTheme(): ColorTheme {
  if (typeof window === 'undefined') return 'slate'
  const stored = localStorage.getItem(COLOR_KEY) as ColorTheme | null
  if (COLOR_THEMES.some((t) => t.id === stored)) return stored!
  return 'slate'
}

function applyThemeClasses(mode: ThemeMode, colorTheme: ColorTheme) {
  const root = document.documentElement
  const classes: string[] = []

  if (mode === 'dark') classes.push('dark')
  if (colorTheme !== 'default') classes.push(`theme-${colorTheme}`)

  // Replace all theme-related classes atomically
  const current = Array.from(root.classList)
  const themeClasses = current.filter(
    (c) => c === 'dark' || c.startsWith('theme-')
  )
  themeClasses.forEach((c) => root.classList.remove(c))
  classes.forEach((c) => root.classList.add(c))
}

// ─── Context ──────────────────────────────────────────────────────────────────

type ThemeContextValue = {
  mode: ThemeMode
  colorTheme: ColorTheme
  setMode: (mode: ThemeMode) => void
  toggleMode: () => void
  setColorTheme: (theme: ColorTheme) => void
}

const ThemeContext = createContext<ThemeContextValue | null>(null)

// ─── Provider ─────────────────────────────────────────────────────────────────

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [mode, setModeState] = useState<ThemeMode>(() => readMode())
  const [colorTheme, setColorThemeState] = useState<ColorTheme>(() => readColorTheme())

  useEffect(() => {
    applyThemeClasses(mode, colorTheme)
  }, [mode, colorTheme])

  const setMode = useCallback((next: ThemeMode) => {
    setModeState(next)
    localStorage.setItem(MODE_KEY, next)
  }, [])

  const toggleMode = useCallback(() => {
    setMode(mode === 'dark' ? 'light' : 'dark')
  }, [mode, setMode])

  const setColorTheme = useCallback((next: ColorTheme) => {
    setColorThemeState(next)
    localStorage.setItem(COLOR_KEY, next)
  }, [])

  const value = useMemo(
    () => ({ mode, colorTheme, setMode, toggleMode, setColorTheme }),
    [mode, colorTheme, setMode, toggleMode, setColorTheme]
  )

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider')
  return ctx
}
