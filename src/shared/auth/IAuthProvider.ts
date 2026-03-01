// src/shared/auth/IAuthProvider.ts

export interface AuthUser {
  id: string
  email: string
  empresaId: string
  role: 'admin' | 'membro'
}

export interface IAuthProvider {
  /** Autentica e retorna o usuário ou lança erro */
  signIn(email: string, password: string): Promise<AuthUser>
  /** Cria conta, empresa e retorna o usuário */
  signUp(email: string, password: string, empresaNome: string): Promise<AuthUser>
  /** Encerra a sessão */
  signOut(): Promise<void>
  /** Retorna usuário da sessão atual, ou null se não autenticado */
  getSession(): Promise<AuthUser | null>
}
