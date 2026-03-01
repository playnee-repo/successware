// src/shared/auth/SupabaseAuthAdapter.ts
import { supabase } from '@/shared/api/supabase'
import type { AuthUser, IAuthProvider } from './IAuthProvider'

async function fetchAuthUser(userId: string, email: string): Promise<AuthUser> {
  const { data, error } = await supabase
    .from('membros_empresa')
    .select('empresa_id, role')
    .eq('user_id', userId)
    .single()

  if (error || !data) {
    throw new Error('Usuário não possui empresa associada. Contate o administrador.')
  }

  return {
    id: userId,
    email,
    empresaId: data.empresa_id,
    role: data.role as AuthUser['role'],
  }
}

export class SupabaseAuthAdapter implements IAuthProvider {
  async signIn(email: string, password: string): Promise<AuthUser> {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })

    if (error || !data.user) {
      throw new Error(error?.message ?? 'Falha na autenticação')
    }

    return fetchAuthUser(data.user.id, data.user.email ?? email)
  }

  async signUp(email: string, password: string, empresaNome: string): Promise<AuthUser> {
    const { data, error } = await supabase.auth.signUp({ email, password })

    if (error || !data.user) {
      throw new Error(error?.message ?? 'Falha ao criar conta')
    }

    // Sign in immediately (local Supabase auto-confirms email)
    const { data: session, error: signInError } = await supabase.auth.signInWithPassword({ email, password })
    if (signInError || !session.user) {
      throw new Error(signInError?.message ?? 'Falha ao autenticar após cadastro')
    }

    // Create empresa and link user via security definer function
    const { error: rpcError } = await supabase.rpc('registrar_usuario', { p_empresa_nome: empresaNome })
    if (rpcError) throw new Error(rpcError.message)

    return fetchAuthUser(session.user.id, session.user.email ?? email)
  }

  async signOut(): Promise<void> {
    const { error } = await supabase.auth.signOut()
    if (error) throw new Error(error.message)
  }

  async getSession(): Promise<AuthUser | null> {
    const { data: { session } } = await supabase.auth.getSession()

    if (!session?.user) return null

    try {
      return await fetchAuthUser(session.user.id, session.user.email ?? '')
    } catch {
      // Sessão Supabase existe mas sem empresa — tratar como não autenticado
      return null
    }
  }
}
