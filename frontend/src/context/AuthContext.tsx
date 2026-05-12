import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react'
import axios from 'axios'

interface User {
  id: number
  username: string
}

interface AuthContextType {
  user: User | null
  token: string | null
  loading: boolean
  needsSetup: boolean
  setup: (password: string) => Promise<void>
  login: (password: string) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextType | null>(null)

const TOKEN_KEY = 'ledger_token'

const api = axios.create({ baseURL: '/api' })

api.interceptors.request.use(config => {
  const token = localStorage.getItem(TOKEN_KEY)
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401) {
      localStorage.removeItem(TOKEN_KEY)
      window.location.href = '/login'
    }
    return Promise.reject(err)
  }
)

export { api }

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [needsSetup, setNeedsSetup] = useState(false)

  useEffect(() => {
    ;(async () => {
      try {
        const { data } = await axios.get('/api/auth/status')
        if (!data.initialized) {
          setNeedsSetup(true)
          setLoading(false)
          return
        }

        const saved = localStorage.getItem(TOKEN_KEY)
        if (saved) {
          try {
            const { data: userData } = await api.get('/auth/me')
            setToken(saved)
            setUser(userData)
          } catch {
            localStorage.removeItem(TOKEN_KEY)
          }
        }
      } catch {
        // offline
      }
      setLoading(false)
    })()
  }, [])

  const setup = useCallback(async (password: string) => {
    const { data } = await axios.post('/api/auth/setup', { password })
    localStorage.setItem(TOKEN_KEY, data.token)
    setToken(data.token)
    setUser({ id: 0, username: data.username })
    setNeedsSetup(false)
  }, [])

  const login = useCallback(async (password: string) => {
    const { data } = await api.post('/auth/login', { password })
    localStorage.setItem(TOKEN_KEY, data.token)
    setToken(data.token)
    setUser({ id: 0, username: data.username })
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY)
    setToken(null)
    setUser(null)
  }, [])

  return (
    <AuthContext.Provider value={{ user, token, loading, needsSetup, setup, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be inside AuthProvider')
  return ctx
}
