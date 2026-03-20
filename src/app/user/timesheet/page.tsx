import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import Link from "next/link"
import { LinkButton } from "@/components/link-button"
import TimesheetTable from "@/components/timesheet-table"

export default async function UserTimesheetPage(props: { searchParams?: Promise<{ week?: string }> }) {
  const searchParams = await props.searchParams
  
  const session = await auth()
  if (!session?.user) redirect("/login")
  const userId = session.user.id

  // Date setup (Start of the week - Monday)
  const formatQueryDate = (d: Date) => {
    const y = d.getFullYear()
    const m = String(d.getMonth() + 1).padStart(2, '0')
    const dt = String(d.getDate()).padStart(2, '0')
    return `${y}-${m}-${dt}`
  }

  let startOfWeek = new Date()
  if (searchParams?.week) {
    const [y, m, dt] = searchParams.week.split('-').map(Number)
    startOfWeek = new Date(y, m - 1, dt)
  }

  // 常に指定された日付が含まれる週の「月曜」始まりに補正する
  const day = startOfWeek.getDay()
  const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1)
  startOfWeek.setDate(diff)
  startOfWeek.setHours(0, 0, 0, 0)
  
  const endOfWeek = new Date(startOfWeek)
  endOfWeek.setDate(startOfWeek.getDate() + 6)
  
  const prevWeek = new Date(startOfWeek)
  prevWeek.setDate(startOfWeek.getDate() - 7)
  const nextWeek = new Date(startOfWeek)
  nextWeek.setDate(startOfWeek.getDate() + 7)

  // Data fetching
  const userTasks = await prisma.userTask.findMany({
    where: { userId },
    include: { task: true }
  })

  const workloads = await prisma.workload.findMany({
    where: {
      userId,
      date: {
        gte: startOfWeek,
        lte: endOfWeek
      }
    }
  })

  // Format data for client
  const tasks = userTasks.map(ut => ut.task)
  const dates = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date(startOfWeek)
    d.setDate(startOfWeek.getDate() + i)
    return formatQueryDate(d)
  })

  return (
    <div className="container mx-auto p-4 md:p-8 space-y-6">
      <div className="flex justify-between items-center flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">工数タイムシート</h1>
          <p className="text-muted-foreground">{formatQueryDate(startOfWeek)} 〜 {formatQueryDate(endOfWeek)} の作業時間を入力します。</p>
        </div>
        <div className="flex space-x-2">
          <LinkButton href={`?week=${formatQueryDate(prevWeek)}`} variant="outline">
            前週
          </LinkButton>
          <LinkButton href={`?week=${formatQueryDate(nextWeek)}`} variant="outline">
            次週
          </LinkButton>
        </div>
      </div>

      {tasks.length === 0 ? (
        <div className="border border-dashed rounded-lg p-12 text-center">
          <p className="text-muted-foreground mb-4">マイタスクが1つも登録されていません。</p>
          <LinkButton href="/user/tasks">
            マイタスクを登録する
          </LinkButton>
        </div>
      ) : (
        <TimesheetTable key={dates[0]} tasks={tasks} dates={dates} initialWorkloads={workloads} />
      )}
    </div>
  )
}
