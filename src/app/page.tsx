import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default async function Home() {
  const session = await auth()
  
  if (!session?.user) {
    redirect("/login")
  }

  return (
    <div className="container mx-auto p-4 md:p-8 space-y-6">
      <div className="flex flex-col space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">マイページ</h1>
        <p className="text-muted-foreground">ようこそ、{session.user.name}さん。</p>
      </div>
      
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>マイタスク</CardTitle>
            <CardDescription>今月担当するタスクを選択・確認します。</CardDescription>
          </CardHeader>
          <CardContent>
            {/* TODO: Add Task Selection */}
            <p className="text-sm text-muted-foreground">現在登録されているタスクはありません。</p>
          </CardContent>
        </Card>
        
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>工数タイムシート</CardTitle>
            <CardDescription>日々の稼働時間を入力して申請します。</CardDescription>
          </CardHeader>
          <CardContent>
            {/* TODO: Add Timesheet UI */}
            <div className="h-64 flex items-center justify-center border rounded-md border-dashed">
              <span className="text-sm text-muted-foreground">タイムシート表示エリア</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
