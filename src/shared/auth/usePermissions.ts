// src/shared/auth/usePermissions.ts
import { useAuth } from './useAuth'
import type { AuthUser } from './IAuthProvider'

export type Permission =
  | 'gerenciar_usuarios'
  | 'ver_admin'
  | 'editar_projeto'
  | 'aprovar_artefato'

const PERMISSION_MAP: Record<AuthUser['role'], Permission[]> = {
  admin: [
    'gerenciar_usuarios',
    'ver_admin',
    'editar_projeto',
    'aprovar_artefato',
  ],
  membro: ['editar_projeto', 'aprovar_artefato'],
}

export function usePermissions() {
  const { user } = useAuth()

  const role = user?.role ?? 'membro'
  const permissions = PERMISSION_MAP[role]

  return {
    isAdmin: role === 'admin',
    isMembro: role === 'membro',
    can: (action: Permission) => permissions.includes(action),
  }
}
