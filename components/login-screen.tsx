"use client"

import { useState, type FormEvent } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Loader2, Shield } from "lucide-react"
import { useAuth } from "@/components/auth-provider"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

export function LoginScreen() {
  const router = useRouter()
  const { user, status, login, register, signOut, error } = useAuth()
  const isLoading = status === "loading"
  const [mode, setMode] = useState<"login" | "register">("login")
  const [form, setForm] = useState({ name: "", email: "", password: "" })
  const [localError, setLocalError] = useState<string | null>(null)

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setLocalError(null)
    try {
      if (mode === "login") {
        await login({ email: form.email, password: form.password })
      } else {
        await register({ email: form.email, password: form.password, name: form.name })
      }
      router.push("/documents")
    } catch (err) {
      const message = err instanceof Error ? err.message : "Authentication failed"
      setLocalError(message)
    }
  }

  const toggleMode = () => {
    setMode((prev) => (prev === "login" ? "register" : "login"))
    setLocalError(null)
  }

  if (user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-muted to-background flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-md space-y-6 rounded-3xl border border-border bg-background/80 backdrop-blur-xl p-8 shadow-2xl text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <Shield className="h-7 w-7" />
          </div>
          <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-primary/40 bg-primary/5 px-4 py-6">
            <Avatar className="h-16 w-16 border border-border">
              <AvatarImage src={user.avatar} />
              <AvatarFallback style={{ backgroundColor: user.color, color: "white" }}>
                {user.name.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="text-lg font-semibold text-foreground">{user.name}</p>
              {user.email && <p className="text-sm text-muted-foreground">{user.email}</p>}
            </div>
          </div>
          <Button className="w-full h-11" asChild>
            <Link href="/documents">Tiếp tục đến tài liệu</Link>
          </Button>
          <Button variant="outline" className="w-full h-11" onClick={signOut} disabled={isLoading}>
            {isLoading ? (
              <div className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Đang đăng xuất...</span>
              </div>
            ) : (
              "Đăng xuất"
            )}
          </Button>
          <Button variant="link" asChild className="w-full">
            <Link href="/">Quay lại trang chủ</Link>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted to-background flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md space-y-6 rounded-3xl border border-border bg-background/80 backdrop-blur-xl p-8 shadow-2xl">
        <div className="space-y-2 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <Shield className="h-7 w-7" />
          </div>
          <h1 className="text-3xl font-bold text-foreground">
            {mode === "login" ? "Đăng nhập DocWave" : "Tạo tài khoản DocWave"}
          </h1>
          <p className="text-muted-foreground">
            {mode === "login" 
              ? "Sử dụng email và mật khẩu để truy cập workspace của bạn."
              : "Tạo tài khoản mới để bắt đầu sử dụng DocWave."
            }
          </p>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit}>
          {mode === "register" && (
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground" htmlFor="name">
                Họ và tên
              </label>
              <Input
                id="name"
                placeholder="Nguyễn Văn A"
                value={form.name}
                onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                disabled={isLoading}
                className="h-11"
              />
            </div>
          )}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground" htmlFor="email">
              Địa chỉ email
            </label>
            <Input
              id="email"
              type="email"
              placeholder="your-email@example.com"
              value={form.email}
              onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
              disabled={isLoading}
              required
              className="h-11"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground" htmlFor="password">
              Mật khẩu
            </label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              value={form.password}
              onChange={(e) => setForm((prev) => ({ ...prev, password: e.target.value }))}
              disabled={isLoading}
              required
              minLength={6}
              className="h-11"
            />
            {mode === "register" && (
              <p className="text-xs text-muted-foreground">Mật khẩu phải có ít nhất 6 ký tự</p>
            )}
          </div>
          {(localError || error) && (
            <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20">
              <p className="text-sm text-destructive">{localError ?? error}</p>
            </div>
          )}
          <Button type="submit" className="w-full h-11" disabled={isLoading}>
            {isLoading ? (
              <div className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>{mode === "login" ? "Đang đăng nhập..." : "Đang tạo tài khoản..."}</span>
              </div>
            ) : (
              mode === "login" ? "Đăng nhập" : "Tạo tài khoản"
            )}
          </Button>
        </form>

        <div className="space-y-4">
          <Button variant="ghost" className="w-full" onClick={toggleMode} type="button" disabled={isLoading}>
            {mode === "login" ? "Chưa có tài khoản? Đăng ký ngay" : "Đã có tài khoản? Đăng nhập"}
          </Button>
          <Button variant="link" asChild className="w-full">
            <Link href="/">Quay lại trang chủ</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
