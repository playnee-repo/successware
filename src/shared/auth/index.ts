// src/shared/auth/index.ts
export type { AuthUser, IAuthProvider } from './IAuthProvider'
export { AuthProvider } from './AuthContext'
export { useAuth } from './useAuth'
export { usePermissions } from './usePermissions'
export type { Permission } from './usePermissions'
export { SupabaseAuthAdapter } from './SupabaseAuthAdapter'
