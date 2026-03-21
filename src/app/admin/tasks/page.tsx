import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { LinkButton } from "@/components/link-button"
import { createTask, deleteTask } from "@/actions/admin-tasks"

export default async function AdminTasksPage(props: {
  searchParams?: Promise<{ month?: string }>
}) {
  const searchParams = await props.searchParams

  const session = await auth()
  if (session?.user?.role !== "ADMIN") {
    redirect("/")
  }

  const formatMonth = (y: number, m: number) =>
    `${y}-${String(m).padStart(2, "0")}`

  // --- 選択月の決定 ---
  const now = new Date()
  let selectedYear = now.getFullYear()
  let selectedMonth = now.getMonth() + 1 // 1-indexed

  if (searchParams?.month) {
    const [sy, sm] = searchParams.month.split("-").map(Number)
    if (sy && sm) {
      selectedYear = sy
      selectedMonth = sm
    }
  }

  const selectedMonthStr = formatMonth(selectedYear, selectedMonth)

  // --- 前月 / 次月 ---
  const prevMonthDate = new Date(selectedYear, selectedMonth - 2, 1)
  const nextMonthDate = new Date(selectedYear, selectedMonth, 1)
  const prevMonthStr = formatMonth(prevMonthDate.getFullYear(), prevMonthDate.getMonth() + 1)
  const nextMonthStr = formatMonth(nextMonthDate.getFullYear(), nextMonthDate.getMonth() + 1)

  // --- 選択月のタスクを取得 ---
  const tasks = await prisma.task.findMany({
    where: { targetMonth: selectedMonthStr },
    orderBy: { project: "asc" },
  })

  return (
    <div className="container mx-auto p-4 md:p-8 space-y-6">
      {/* 月ナビゲーション */}
      <div className="flex justify-between items-center flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">タスク管理</h1>
          <p className="text-muted-foreground">
            {selectedYear}年{selectedMonth}月 &mdash; プロジェクトおよびタスクを登録・管理します。
          </p>
        </div>
        <div className="flex space-x-2">
          <LinkButton href={`?month=${prevMonthStr}`} variant="outline">
            前月
          </LinkButton>
          <LinkButton href={`?month=${nextMonthStr}`} variant="outline">
            次月
          </LinkButton>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-[1fr_300px]">
        {/* タスク一覧 */}
        <Card className="order-2 md:order-1">
          <CardHeader>
            <CardTitle>
              {selectedYear}年{selectedMonth}月のタスク一覧
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="border rounded-md overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-muted">
                  <tr>
                    <th className="p-3 font-medium">プロジェクト名</th>
                    <th className="p-3 font-medium">タスク名</th>
                    <th className="p-3 font-medium text-right">操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {tasks.map((t) => (
                    <tr key={t.id} className="hover:bg-muted/50 transition-colors">
                      <td className="p-3">{t.project}</td>
                      <td className="p-3">{t.name}</td>
                      <td className="p-3 text-right">
                        <form action={deleteTask.bind(null, t.id)} className="inline">
                          <Button type="submit" variant="destructive" size="sm">
                            削除
                          </Button>
                        </form>
                      </td>
                    </tr>
                  ))}
                  {tasks.length === 0 && (
                    <tr>
                      <td colSpan={3} className="p-3 text-center text-muted-foreground">
                        {selectedYear}年{selectedMonth}月のタスクはまだ登録されていません。
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* 新規タスク登録フォーム */}
        <Card className="order-1 md:order-2 h-fit">
          <CardHeader>
            <CardTitle>新規タスク登録</CardTitle>
          </CardHeader>
          <CardContent>
            <form action={createTask} className="space-y-4">
              <input type="hidden" name="targetMonth" value={selectedMonthStr} />
              <div className="space-y-2">
                <Label htmlFor="project">プロジェクト名</Label>
                <Input id="project" name="project" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="name">タスク名</Label>
                <Input id="name" name="name" required />
              </div>
              <Button type="submit" className="w-full mt-2">
                登録する
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
