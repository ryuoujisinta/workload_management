import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export default async function UserSettingsPage() {
  const session = await auth()
  
  if (!session?.user) {
    redirect("/login")
  }

  return (
    <div className="container mx-auto p-4 md:p-8 max-w-2xl space-y-6">
      <div className="flex flex-col space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">設定（マイページ）</h1>
        <p className="text-muted-foreground">アカウント情報の確認とパスワードの変更を行います。</p>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>アカウント情報</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1">
            <Label className="text-muted-foreground">氏名</Label>
            <p className="font-medium">{session.user.name}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-muted-foreground">メールアドレス</Label>
            <p className="font-medium">{session.user.email}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-muted-foreground">権限</Label>
            <p className="font-medium">{session.user.role === "ADMIN" ? "管理者" : "一般ユーザー"}</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>パスワード変更</CardTitle>
          <CardDescription>セキュリティのため、定期的なパスワード変更をおすすめします。</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="current-password">現在のパスワード</Label>
              <Input id="current-password" type="password" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-password">新しいパスワード</Label>
              <Input id="new-password" type="password" required />
            </div>
            <div className="pt-2">
              <Button type="button">パスワードを変更する</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
