"use client"

import { useState } from "react"
import { signIn } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"

export default function LoginForm() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    const res = await signIn("credentials", {
      email,
      password,
      redirect: false,
    })

    if (res?.error) {
      setError("メールアドレスまたはパスワードが間違っています")
      setIsLoading(false)
    } else {
      router.push("/")
      router.refresh()
    }
  }

  return (
    <Card className="w-full shadow-lg border-0 ring-1 ring-gray-900/5 dark:ring-white/10">
      <CardHeader className="space-y-1 text-center pb-6">
        <CardTitle className="text-2xl font-bold tracking-tight">工数管理システム</CardTitle>
        <CardDescription className="text-sm text-gray-500 pt-2">
          管理者に登録されたアカウントでログインしてください。
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-5">
          {error && <div className="text-sm text-red-500 text-center font-medium bg-red-50 py-2 rounded-md">{error}</div>}
          <div className="space-y-2">
            <Label htmlFor="email">メールアドレス</Label>
            <Input
              id="email"
              type="email"
              placeholder="name@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="h-11"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">パスワード</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="h-11"
            />
          </div>
        </CardContent>
        <CardFooter className="flex flex-col space-y-4 pt-4">
          <Button type="submit" className="w-full h-11 text-md font-medium" disabled={isLoading}>
            {isLoading ? "ログイン中..." : "ログイン"}
          </Button>

          <div className="relative w-full py-2">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-gray-200 dark:border-zinc-800" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-2 text-gray-500 dark:bg-zinc-950 dark:text-gray-400">または</span>
            </div>
          </div>

          <Button
            type="button"
            variant="outline"
            className="w-full h-11 text-md font-medium flex items-center justify-center gap-2"
            onClick={() => signIn("google")}
            disabled={isLoading}
          >
            <svg className="h-5 w-5" aria-hidden="true" focusable="false" data-prefix="fab" data-icon="google" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 488 512">
              <path fill="currentColor" d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 123 24.5 166.3 64.9l-67.5 64.9C258.5 52.6 94.3 116.6 94.3 256c0 86.5 69.1 156.6 153.7 156.6 98.2 0 135-70.4 140.8-106.9H248v-85.3h236.1c2.3 12.7 3.9 24.9 3.9 41.4z"></path>
            </svg>
            Googleでログイン
          </Button>

          <div className="text-xs text-center text-gray-400">
            パスワードを忘れた場合／初期パスワードは管理者へお問い合わせください。
          </div>
        </CardFooter>
      </form>
    </Card>
  )
}
