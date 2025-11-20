"use client"

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react"
import { pickColorForId } from "@/lib/auth"
import { toast } from "@/hooks/use-toast"

export type AuthUser = {
  id: string
  name: string
  email?: string
  avatar: string
  color: string
}

type LoginPayload = {
  email: string
  password: string
}

type RegisterPayload = LoginPayload & {
  name?: string
}

type AuthContextValue = {
  user: AuthUser | null
  accessToken: string | null
  refreshToken: string | null
  status: "idle" | "loading"
  error: string | null
  login: (payload: LoginPayload) => Promise<void>
  register: (payload: RegisterPayload) => Promise<void>
  signOut: () => Promise<void>
  refreshSession: () => Promise<void>
}

const STORAGE_KEY = "docwave-auth-user"
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000"

type StoredSession = {
  user: AuthUser
  accessToken: string
  refreshToken: string
}

type AuthResponse = {
  accessToken: string
  refreshToken: string
  user: {
    id: string
    name?: string | null
    email?: string | null
    avatar?: string | null
  }
}

const AuthContext = createContext<AuthContextValue | null>(null)

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider")
  }
  return ctx
}

const mapUser = (payload: AuthResponse["user"]): AuthUser => {
  const id = payload.id
  return {
    id,
    name: payload.name ?? payload.email ?? "DocWave User",
    email: payload.email ?? undefined,
    avatar: payload.avatar ?? "/abstract-geometric-shapes.png",
    color: pickColorForId(id),
  }
}

const InnerAuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [tokens, setTokens] = useState<{ accessToken: string; refreshToken: string } | null>(null)
  const [status, setStatus] = useState<"idle" | "loading">("idle")
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (typeof window === "undefined") return
    const stored = window.localStorage.getItem(STORAGE_KEY)
    if (!stored) return
    try {
      const parsed = JSON.parse(stored) as StoredSession
      setUser(parsed.user)
      setTokens({ accessToken: parsed.accessToken, refreshToken: parsed.refreshToken })
    } catch {
      window.localStorage.removeItem(STORAGE_KEY)
    }
  }, [])

  const persistSession = useCallback((value: StoredSession | null) => {
    if (typeof window === "undefined") return
    if (!value) {
      window.localStorage.removeItem(STORAGE_KEY)
      return
    }
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(value))
  }, [])

  const applyAuthResponse = useCallback(
    (data: AuthResponse) => {
      const mappedUser = mapUser(data.user)
      const nextTokens = { accessToken: data.accessToken, refreshToken: data.refreshToken }
      setUser(mappedUser)
      setTokens(nextTokens)
      persistSession({ user: mappedUser, accessToken: nextTokens.accessToken, refreshToken: nextTokens.refreshToken })
      
      // Show success toast
      toast({
        title: "Đăng nhập thành công!",
        description: `Chào mừng ${mappedUser.name} đã quay lại DocWave.`,
      })
    },
    [persistSession],
  )

  const performAuthRequest = useCallback(
    async (path: string, body: Record<string, unknown>) => {
      setStatus("loading")
      setError(null)
      try {
        const response = await fetch(`${API_BASE_URL}/auth/${path}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
          credentials: "include",
        })
        const payload = (await response.json().catch(() => null)) as AuthResponse | { message?: string } | null
        if (!response.ok || !payload || !("accessToken" in payload)) {
          const message = (payload as { message?: string } | null)?.message ?? "Authentication failed"
          throw new Error(message)
        }
        applyAuthResponse(payload)
      } catch (err) {
        const message = err instanceof Error ? err.message : "Authentication failed"
        setError(message)
        throw err
      } finally {
        setStatus("idle")
      }
    },
    [applyAuthResponse],
  )

  const login = useCallback(
    (payload: LoginPayload) => performAuthRequest("login", payload),
    [performAuthRequest],
  )

  const register = useCallback(
    (payload: RegisterPayload) => performAuthRequest("register", payload),
    [performAuthRequest],
  )

  const signOut = useCallback(async () => {
    const currentUserName = user?.name || "người dùng"
    
    setUser(null)
    setTokens(null)
    persistSession(null)
    
    // Show logout toast
    toast({
      title: "Đã đăng xuất",
      description: `Tạm biệt ${currentUserName}! Hẹn gặp lại bạn sớm.`,
    })
    
    try {
      await fetch(`${API_BASE_URL}/auth/logout`, {
        method: "POST",
        credentials: "include",
      })
    } catch (err) {
      console.warn("Failed to notify server about logout", err)
    }
  }, [persistSession, user?.name])

  const refreshSession = useCallback(async () => {
    if (!tokens?.refreshToken) return
    setStatus("loading")
    setError(null)
    try {
      const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken: tokens.refreshToken }),
        credentials: "include",
      })
      if (!response.ok) {
        throw new Error("Failed to refresh session")
      }
      const data: AuthResponse = await response.json()
      applyAuthResponse(data)
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to refresh session"
      setError(message)
      setUser(null)
      setTokens(null)
      persistSession(null)
    } finally {
      setStatus("idle")
    }
  }, [tokens?.refreshToken, applyAuthResponse, persistSession])

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      accessToken: tokens?.accessToken ?? null,
      refreshToken: tokens?.refreshToken ?? null,
      status,
      error,
      login,
      register,
      signOut,
      refreshSession,
    }),
    [user, tokens, status, error, login, register, signOut, refreshSession],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function AuthProvider({ children }: { children: ReactNode }) {
  return <InnerAuthProvider>{children}</InnerAuthProvider>
}
