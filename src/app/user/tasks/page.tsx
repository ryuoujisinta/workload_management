import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { LinkButton } from "@/components/link-button"
import { addUserTask, removeUserTask } from "@/actions/user-tasks"

export default async function UserTasksPage(props: {
  searchParams?: Promise<{ month?: string }>
}) {
  const searchParams = await props.searchParams

  const session = await auth()
  if (!session?.user) redirect("/login")

  const userId = session.user.id

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

  // --- データ取得 (選択月のタスクのみ) ---
  const availableTasks = await prisma.task.findMany({
    where: {
      monthlyTasks: { some: { targetMonth: selectedMonthStr } }
    },
    include: { project: true },
    orderBy: { project: { name: "asc" } },
  })

  // ユーザーが登録しているタスクのうち、当月有効なもの
  const userTasks = await prisma.userTask.findMany({
    where: {
      userId,
      task: {
        is: {
          monthlyTasks: { some: { targetMonth: selectedMonthStr } }
        }
      },
    },
  })

  const userTaskIds = new Set(userTasks.map((ut) => ut.taskId))

  return (
    <div className="container mx-auto p-4 md:p-8 space-y-6">
      {/* 月ナビゲーション */}
      <div className="flex justify-between items-center flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">マイタスク登録</h1>
          <p className="text-muted-foreground">
            {selectedYear}年{selectedMonth}月 &mdash; 担当するタスクを選択してください。
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

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {availableTasks.map((task) => {
          const isAdded = userTaskIds.has(task.id)
          return (
            <Card key={task.id} className={isAdded ? "ring-2 ring-primary border-primary" : ""}>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">{task.project?.name}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm font-medium mb-4">{task.name}</p>
                <form
                  action={
                    isAdded
                      ? removeUserTask.bind(null, task.id)
                      : addUserTask.bind(null, task.id)
                  }
                >
                  <Button
                    type="submit"
                    className="w-full"
                    variant={isAdded ? "outline" : "default"}
                  >
                    {isAdded ? "マイタスクから解除" : "マイタスクに追加"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          )
        })}
        {availableTasks.length === 0 && (
          <div className="col-span-full py-8 text-center text-muted-foreground border border-dashed rounded-lg">
            {selectedYear}年{selectedMonth}月のタスクはまだ登録されていません。
          </div>
        )}
      </div>
    </div>
  )
}
