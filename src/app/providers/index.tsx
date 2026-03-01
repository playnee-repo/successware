import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { RouterProvider } from 'react-router-dom'
import { TooltipProvider } from '@/shared/ui/tooltip'
import { ThemeProvider } from '@/shared/lib/theme-provider'
import { AuthProvider, SupabaseAuthAdapter } from '@/shared/auth'
import { router } from '@/app/router'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 2,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
})

const authProvider = new SupabaseAuthAdapter()

export function AppProviders() {
  return (
    <ThemeProvider>
      <AuthProvider provider={authProvider}>
        <QueryClientProvider client={queryClient}>
          <TooltipProvider delayDuration={300}>
            <RouterProvider router={router} />
          </TooltipProvider>
        </QueryClientProvider>
      </AuthProvider>
    </ThemeProvider>
  )
}
