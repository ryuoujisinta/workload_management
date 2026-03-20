import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { LinkButton } from "@/components/link-button"

export default async function AdminDashboardPage() {
  const session = await auth()
  
  if (session?.user?.role !== "ADMIN") {
    redirect("/")
  }

  return (
    <div className="container mx-auto p-4 md:p-8 space-y-6">
      <div className="flex flex-col space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">管理者ダッシュボード</h1>
        <p className="text-muted-foreground">システム全体の管理と申請の確認を行います。</p>
      </div>
      
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>ユーザー管理</CardTitle>
            <CardDescription>システムの利用ユーザーを管理します。</CardDescription>
          </CardHeader>
          <CardContent>
            <LinkButton href="/admin/users" className="w-full">
              ユーザー一覧へ
            </LinkButton>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>タスク管理</CardTitle>
            <CardDescription>月ごとの全体タスクを登録・管理します。</CardDescription>
          </CardHeader>
          <CardContent>
            <LinkButton href="/admin/tasks" className="w-full">
              タスク一覧へ
            </LinkButton>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>工数承認</CardTitle>
            <CardDescription>ユーザーから提出された工数を承認・却下します。</CardDescription>
          </CardHeader>
          <CardContent>
            <LinkButton href="/admin/approvals" className="w-full">
              承認画面へ
            </LinkButton>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
