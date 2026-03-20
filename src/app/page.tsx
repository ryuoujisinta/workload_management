import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { LinkButton } from "@/components/link-button"

export default async function Home() {
  const session = await auth()
  
  if (!session?.user) {
    redirect("/login")
  }

  return (
    <div className="container mx-auto p-4 md:p-8 space-y-6">
      <div className="flex flex-col space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">ダッシュボード</h1>
        <p className="text-muted-foreground">ようこそ、{session.user.name}さん。</p>
      </div>
      
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>工数タイムシート</CardTitle>
            <CardDescription>日々の稼働時間を入力して申請します。</CardDescription>
          </CardHeader>
          <CardContent>
            <LinkButton href="/user/timesheet" className="w-full">
              タイムシートを開く
            </LinkButton>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>マイタスク</CardTitle>
            <CardDescription>今月担当するタスクを選択・確認します。</CardDescription>
          </CardHeader>
          <CardContent>
            <LinkButton href="/user/tasks" className="w-full" variant="secondary">
              マイタスクを管理
            </LinkButton>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>設定（マイページ）</CardTitle>
            <CardDescription>アカウント情報の確認やパスワード変更を行います。</CardDescription>
          </CardHeader>
          <CardContent>
            <LinkButton href="/user/settings" className="w-full" variant="outline">
              設定を開く
            </LinkButton>
          </CardContent>
        </Card>

        {session.user.role === "ADMIN" && (
          <Card className="md:col-span-2 lg:col-span-3 border-primary/20 bg-primary/5">
            <CardHeader>
              <CardTitle className="text-primary">管理者メニュー</CardTitle>
              <CardDescription>システム管理や工数承認を行います。</CardDescription>
            </CardHeader>
            <CardContent>
              <LinkButton href="/admin" className="w-full sm:w-auto" variant="default">
                管理者ダッシュボードへ
              </LinkButton>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
