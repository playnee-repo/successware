// src/shared/auth/AuthContext.tsx
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import type { AuthUser, IAuthProvider } from './IAuthProvider'

interface AuthContextValue {
  user: AuthUser | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

interface AuthProviderProps {
  children: ReactNode
  provider: IAuthProvider
}

export function AuthProvider({ children, provider }: AuthProviderProps) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    provider.getSession().then((u) => {
      setUser(u)
      setLoading(false)
    })
  }, [provider])

  async function signIn(email: string, password: string) {
    const u = await provider.signIn(email, password)
    setUser(u)
  }

  async function signOut() {
    await provider.signOut()
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export { AuthContext }
