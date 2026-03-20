"use client"

import { useSession, signOut } from "next-auth/react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function Navbar() {
  const { data: session } = useSession()

  if (!session?.user) return null

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 flex h-14 items-center justify-between">
        <div className="flex items-center gap-6">
          <Link href="/" className="font-bold flex items-center space-x-2">
            <span className="text-lg">工数管理システム</span>
          </Link>
          <nav className="flex items-center space-x-6 text-sm font-medium">
            <Link href="/" className="transition-colors hover:text-foreground/80 text-foreground">
              ダッシュボード
            </Link>
            <Link href="/user/timesheet" className="transition-colors hover:text-foreground/80 text-foreground/60">
              タイムシート
            </Link>
            <Link href="/user/tasks" className="transition-colors hover:text-foreground/80 text-foreground/60">
              マイタスク
            </Link>
            {session.user.role === "ADMIN" && (
              <Link href="/admin" className="transition-colors hover:text-foreground/80 text-foreground/60">
                管理者メニュー
              </Link>
            )}
          </nav>
        </div>
        <div className="flex items-center space-x-4">
          <span className="text-sm text-muted-foreground hidden sm:inline-block">
            {session.user.name} ({session.user.role === "ADMIN" ? "管理者" : "一般"})
          </span>
          <Button variant="outline" size="sm" onClick={() => signOut({ callbackUrl: "/login" })}>
            ログアウト
          </Button>
        </div>
      </div>
    </header>
  )
}
