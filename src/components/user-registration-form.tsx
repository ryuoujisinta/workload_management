"use client"

import { useActionState, useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { createUser } from "@/actions/admin-users"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { CheckCircle2, Copy, AlertCircle } from "lucide-react"

export function UserRegistrationForm() {
  const [state, action, isPending] = useActionState(createUser, null)
  const [showPassword, setShowPassword] = useState(false)

  useEffect(() => {
    if (state?.success && state.password) {
      setShowPassword(true)
    }
  }, [state])

  const copyToClipboard = () => {
    if (state?.password) {
      navigator.clipboard.writeText(state.password)
    }
  }

  return (
    <div className="space-y-4">
      {state?.success && state.password && showPassword && (
        <Alert className="bg-green-50 border-green-200 dark:bg-green-900/10 dark:border-green-900/20">
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <AlertTitle className="text-green-800 dark:text-green-400">ユーザー登録完了</AlertTitle>
          <AlertDescription className="text-green-700 dark:text-green-500 space-y-2">
            <p>ユーザーを登録しました。初期パスワードは以下です：</p>
            <div className="flex items-center gap-2 p-2 bg-white dark:bg-zinc-900 border rounded-md font-mono text-base font-bold">
              <span className="flex-1">{state.password}</span>
              <Button 
                type="button" 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8"
                onClick={copyToClipboard}
                title="クリップボードにコピー"
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-xs">※この画面を閉じたり更新したりすると、パスワードは二度と表示されません。必ずコピーしてユーザーに伝えてください。</p>
            <Button 
              variant="outline" 
              size="sm" 
              className="mt-2"
              onClick={() => setShowPassword(false)}
            >
              閉じる
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {state?.success === false && state.error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>エラー</AlertTitle>
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      )}

      <form action={action} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name">氏名</Label>
          <Input id="name" name="name" required disabled={isPending} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">メールアドレス</Label>
          <Input id="email" name="email" type="email" required disabled={isPending} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="role">権限</Label>
          <select 
            id="role" 
            name="role" 
            className="w-full border rounded-md px-3 h-10 text-sm bg-background cursor-pointer" 
            required
            disabled={isPending}
          >
            <option value="USER">一般ユーザー</option>
            <option value="ADMIN">管理者</option>
          </select>
        </div>
        <div className="pt-2">
          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending ? "登録中..." : "登録する"}
          </Button>
          {!showPassword && (
            <p className="text-xs text-muted-foreground text-center mt-2">
              ※パスワードはランダム生成され、登録後に一度だけ表示されます
            </p>
          )}
        </div>
      </form>
    </div>
  )
}
