import { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react'
import * as authApi from '../api/authApi'
import {
  getToken,
  setToken,
  clearToken,
  getStoredUser,
  setStoredUser,
} from '../utils/tokenStorage'
import { AUTH_UNAUTHORIZED_EVENT } from '../constants/config'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => getStoredUser())
  const [loading, setLoading] = useState(() => !!getToken())

  useEffect(() => {
    if (!getToken()) return

    let cancelled = false
    authApi
      .getProfile()
      .then((profile) => {
        if (!cancelled) {
          setUser(profile)
          setStoredUser(profile)
        }
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    const handleUnauthorized = () => {
      clearToken()
      setUser(null)
    }
    window.addEventListener(AUTH_UNAUTHORIZED_EVENT, handleUnauthorized)
    return () => {
      window.removeEventListener(AUTH_UNAUTHORIZED_EVENT, handleUnauthorized)
    }
  }, [])

  async function login(credentials) {
    const res = await authApi.login(credentials)
    setToken(res.token)
    const newUser = {
      id: res.userId,
      name: res.name,
      email: res.email,
      role: res.role,
    }
    setStoredUser(newUser)
    setUser(newUser)
    return res
  }

  async function register(payload) {
    return authApi.register(payload)
  }

  async function logout() {
    try {
      await authApi.logout()
    } catch {
      /* ignore network errors on logout */
    }
    clearToken()
    setUser(null)
  }

  const hasRole = useCallback(
    (...roles) => Boolean(user && roles.includes(user.role)),
    [user]
  )

  const value = useMemo(
    () => ({
      user,
      isAuthenticated: !!user,
      loading,
      login,
      register,
      logout,
      hasRole,
    }),
    [user, loading, hasRole]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuthContext() {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error('useAuthContext must be used within an AuthProvider')
  }
  return ctx
}
