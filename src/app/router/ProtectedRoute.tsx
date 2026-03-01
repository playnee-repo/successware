// src/app/router/ProtectedRoute.tsx
import { Navigate, Outlet } from 'react-router-dom'
import { useAuth, usePermissions } from '@/shared/auth'
import type { Permission } from '@/shared/auth'

/** Redireciona para /login se não autenticado */
export function ProtectedRoute() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <span className="text-muted-foreground text-sm">Carregando...</span>
      </div>
    )
  }

  if (!user) return <Navigate to="/login" replace />

  return <Outlet />
}

interface PermissionRouteProps {
  permission: Permission
}

/** Redireciona para / se usuário não tiver a permissão */
export function PermissionRoute({ permission }: PermissionRouteProps) {
  const { user, loading } = useAuth()
  const { can } = usePermissions()

  if (loading) return null
  if (!user) return <Navigate to="/login" replace />
  if (!can(permission)) return <Navigate to="/" replace />

  return <Outlet />
}
