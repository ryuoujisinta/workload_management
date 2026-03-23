import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { LinkButton } from "@/components/link-button"
import { createTask, deleteTask, toggleMonthlyTask } from "@/actions/admin-tasks"
import { createProject, deleteProject } from "@/actions/admin-projects"
import { DeleteButton } from "@/components/delete-button"

import { ImportCSVButton } from "@/components/import-csv-button"
import { importData } from "@/actions/admin-import"

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

  // --- 選択年の全プロジェクトとタスクを取得 ---
  const projects = await prisma.project.findMany({
    where: { year: selectedYear },
    include: { tasks: true },
    orderBy: { name: "asc" }
  })

  // テーブル表示用に全タスクを平坦化
  const allTasks = projects.flatMap(p => p.tasks.map(t => ({ ...t, project: p })))

  // --- 選択月の有効タスクIDの一覧 ---
  const monthlyTasks = await prisma.monthlyTask.findMany({
    where: { targetMonth: selectedMonthStr },
  })
  const activeTaskIds = new Set(monthlyTasks.map(mt => mt.taskId))

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
              {selectedYear}年のタスク一覧
            </CardTitle>
            <CardDescription>
              {selectedMonth}月に有効なタスクを選択してください。
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="border rounded-md overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-muted">
                  <tr>
                    <th className="p-3 font-medium">プロジェクト名</th>
                    <th className="p-3 font-medium">タスク名</th>
                    <th className="p-3 font-medium text-center">{selectedMonth}月の状態</th>
                    <th className="p-3 font-medium text-right">操作 (マスター)</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {allTasks.map((t) => {
                    const isActive = activeTaskIds.has(t.id)
                    return (
                      <tr key={t.id} className="hover:bg-muted/50 transition-colors">
                        <td className="p-3">{t.project?.name}</td>
                        <td className="p-3">{t.name}</td>
                        <td className="p-3 text-center">
                          <form action={toggleMonthlyTask.bind(null, t.id, selectedMonthStr, !isActive)} className="inline">
                            <Button type="submit" variant={isActive ? "default" : "outline"} size="sm">
                              {isActive ? "✓ 当月有効" : "＋ 当月に追加"}
                            </Button>
                          </form>
                        </td>
                        <td className="p-3 text-right">
                          <DeleteButton 
                            formAction={deleteTask.bind(null, t.id)} 
                            variant="ghost" 
                            className="text-destructive hover:bg-destructive/10 hover:text-destructive" 
                            size="sm"
                            confirmMessage={`タスク「${t.name}」を完全に削除しますか？\nこの操作は取り消せません。`}
                          >
                            完全削除
                          </DeleteButton>
                        </td>
                      </tr>
                    )
                  })}
                  {allTasks.length === 0 && (
                    <tr>
                      <td colSpan={4} className="p-3 text-center text-muted-foreground">
                        {selectedYear}年のタスクはまだ登録されていません。
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        <div className="order-1 md:order-2 space-y-6 flex flex-col">
          {/* CSVインポート */}
          <Card className="h-fit">
            <CardHeader>
              <CardTitle>一括登録 (CSV)</CardTitle>
              <CardDescription>
                year, projectName, taskName<br />の形式でインポートします。
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ImportCSVButton action={importData} />
            </CardContent>
          </Card>

          {/* 新規プロジェクト登録フォーム */}
          <Card className="h-fit">
            <CardHeader>
              <CardTitle>新規プロジェクト登録</CardTitle>
            </CardHeader>
            <CardContent>
              <form action={createProject} className="space-y-4">
                <input type="hidden" name="year" value={selectedYear.toString()} />
                <div className="space-y-2">
                  <Label htmlFor="projectName">プロジェクト名</Label>
                  <Input id="projectName" name="name" required />
                </div>
                <Button type="submit" className="w-full mt-2">
                  登録する
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* 登録済みプロジェクト一覧 */}
          <Card className="h-fit">
            <CardHeader>
              <CardTitle>プロジェクト管理</CardTitle>
              <CardDescription>{selectedYear}年のプロジェクト</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {projects.map(p => (
                  <div key={p.id} className="flex items-center justify-between border-b pb-2 last:border-0 last:pb-0">
                    <span className="text-sm font-medium">{p.name}</span>
                    <DeleteButton 
                      formAction={deleteProject.bind(null, p.id)} 
                      variant="ghost" 
                      size="sm" 
                      className="text-destructive h-8 px-2"
                      confirmMessage={`プロジェクト「${p.name}」を削除しますか？\n関連するタスクもすべて削除されます。`}
                    >
                      削除
                    </DeleteButton>
                  </div>
                ))}
                {projects.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    登録されたプロジェクトはありません。
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* 新規タスク登録フォーム */}
          <Card className="h-fit">
            <CardHeader>
              <CardTitle>新規タスク登録</CardTitle>
            </CardHeader>
            <CardContent>
              <form action={createTask} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="projectId">プロジェクト</Label>
                  <select 
                    id="projectId" 
                    name="projectId" 
                    required 
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <option value="">選択してください</option>
                    {projects.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
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
    </div>
  )
}
