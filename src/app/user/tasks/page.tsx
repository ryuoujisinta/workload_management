import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { addUserTask, removeUserTask } from "@/actions/user-tasks"

export default async function UserTasksPage() {
  const session = await auth()
  if (!session?.user) redirect("/login")

  const userId = session.user.id

  const availableTasks = await prisma.task.findMany({
    orderBy: { targetMonth: "desc" }
  })

  const userTasks = await prisma.userTask.findMany({
    where: { userId }
  })
  
  const userTaskIds = new Set(userTasks.map(ut => ut.taskId))

  return (
    <div className="container mx-auto p-4 md:p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">マイタスク登録</h1>
        <p className="text-muted-foreground">今月担当するタスクを全体タスクから選択・追加してください。</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {availableTasks.map(task => {
          const isAdded = userTaskIds.has(task.id)
          return (
            <Card key={task.id} className={isAdded ? "ring-2 ring-primary border-primary" : ""}>
              <CardHeader className="pb-3">
                <div className="text-xs text-muted-foreground">{task.targetMonth}</div>
                <CardTitle className="text-lg">{task.project}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm font-medium mb-4">{task.name}</p>
                <form action={isAdded ? removeUserTask.bind(null, task.id) : addUserTask.bind(null, task.id)}>
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
            管理者が登録したタスクはまだありません。
          </div>
        )}
      </div>
    </div>
  )
}
