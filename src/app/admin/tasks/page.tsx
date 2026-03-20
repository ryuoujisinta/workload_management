import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { createTask, deleteTask } from "@/actions/admin-tasks"

export default async function AdminTasksPage() {
  const session = await auth()
  if (session?.user?.role !== "ADMIN") {
    redirect("/")
  }

  const tasks = await prisma.task.findMany({
    orderBy: { createdAt: "desc" }
  })

  // Set default target month to current month "YYYY-MM"
  const now = new Date()
  const defaultMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`

  return (
    <div className="container mx-auto p-4 md:p-8 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">タスク管理</h1>
          <p className="text-muted-foreground">月ごとのプロジェクトおよびタスクを登録・管理します。</p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-[1fr_300px]">
        <Card className="order-2 md:order-1">
          <CardHeader>
            <CardTitle>タスク一覧</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="border rounded-md overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-muted">
                  <tr>
                    <th className="p-3 font-medium">対象月</th>
                    <th className="p-3 font-medium">プロジェクト名</th>
                    <th className="p-3 font-medium">タスク名</th>
                    <th className="p-3 font-medium text-right">操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {tasks.map((t) => (
                    <tr key={t.id} className="hover:bg-muted/50 transition-colors">
                      <td className="p-3">{t.targetMonth}</td>
                      <td className="p-3">{t.project}</td>
                      <td className="p-3">{t.name}</td>
                      <td className="p-3 text-right">
                        <form action={deleteTask.bind(null, t.id)} className="inline">
                          <Button type="submit" variant="destructive" size="sm">削除</Button>
                        </form>
                      </td>
                    </tr>
                  ))}
                  {tasks.length === 0 && (
                    <tr>
                      <td colSpan={4} className="p-3 text-center text-muted-foreground">登録されているタスクはありません。</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        <Card className="order-1 md:order-2 h-fit">
          <CardHeader>
            <CardTitle>新規タスク登録</CardTitle>
          </CardHeader>
          <CardContent>
            <form action={createTask} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="targetMonth">対象月 (YYYY-MM)</Label>
                <Input id="targetMonth" name="targetMonth" type="month" defaultValue={defaultMonth} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="project">プロジェクト名</Label>
                <Input id="project" name="project" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="name">タスク名</Label>
                <Input id="name" name="name" required />
              </div>
              <Button type="submit" className="w-full mt-2">登録する</Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
