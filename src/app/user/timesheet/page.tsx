import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { LinkButton } from "@/components/link-button"
import TimesheetTable from "@/components/timesheet-table"

export default async function UserTimesheetPage(props: {
  searchParams?: Promise<{ month?: string; week?: string }>
}) {
  const searchParams = await props.searchParams

  const session = await auth()
  if (!session?.user) redirect("/login")
  const userId = session.user.id

  const formatQueryDate = (d: Date) => {
    const y = d.getFullYear()
    const m = String(d.getMonth() + 1).padStart(2, "0")
    const dt = String(d.getDate()).padStart(2, "0")
    return `${y}-${m}-${dt}`
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

  // --- 選択週の決定 (月曜始まり) ---
  let startOfWeek: Date

  if (searchParams?.week) {
    const [wy, wm, wd] = searchParams.week.split("-").map(Number)
    startOfWeek = new Date(wy, wm - 1, wd)
  } else {
    // デフォルト: 選択月の最初の月曜日を探す
    startOfWeek = new Date(selectedYear, selectedMonth - 1, 1)
  }

  // 月曜始まりに補正
  const day = startOfWeek.getDay()
  const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1)
  startOfWeek = new Date(startOfWeek.getFullYear(), startOfWeek.getMonth(), diff)
  startOfWeek.setHours(0, 0, 0, 0)

  // 週の月曜日が選択月と異なる場合は、選択月の1日を含む週にフォールバック
  const weekMonthStr = formatMonth(startOfWeek.getFullYear(), startOfWeek.getMonth() + 1)
  if (weekMonthStr !== selectedMonthStr) {
    const firstDay = new Date(selectedYear, selectedMonth - 1, 1)
    const fd = firstDay.getDay()
    const fdiff = firstDay.getDate() - fd + (fd === 0 ? -6 : 1)
    startOfWeek = new Date(selectedYear, selectedMonth - 1, fdiff)
    startOfWeek.setHours(0, 0, 0, 0)
  }

  const nextMonday = new Date(startOfWeek)
  nextMonday.setDate(startOfWeek.getDate() + 7)

  const endOfWeek = new Date(startOfWeek)
  endOfWeek.setDate(startOfWeek.getDate() + 6)

  // --- 前週 / 次週 (月をまたがない、ただし週の一部が選択月に含まれていればOK) ---
  const checkWeekInMonth = (weekStart: Date, targetMonthStr: string) => {
    const mondayStr = formatMonth(weekStart.getFullYear(), weekStart.getMonth() + 1)
    const sundayDate = new Date(weekStart)
    sundayDate.setDate(weekStart.getDate() + 6)
    const sundayStr = formatMonth(sundayDate.getFullYear(), sundayDate.getMonth() + 1)
    return mondayStr === targetMonthStr || sundayStr === targetMonthStr
  }

  const prevWeekDate = new Date(startOfWeek)
  prevWeekDate.setDate(startOfWeek.getDate() - 7)
  const hasPrevWeek = checkWeekInMonth(prevWeekDate, selectedMonthStr)

  const nextWeekDate = new Date(startOfWeek)
  nextWeekDate.setDate(startOfWeek.getDate() + 7)
  const hasNextWeek = checkWeekInMonth(nextWeekDate, selectedMonthStr)

  // --- 前月 / 次月 ---
  const prevMonthDate = new Date(selectedYear, selectedMonth - 2, 1)
  const nextMonthDate = new Date(selectedYear, selectedMonth, 1)
  const prevMonthStr = formatMonth(prevMonthDate.getFullYear(), prevMonthDate.getMonth() + 1)
  const nextMonthStr = formatMonth(nextMonthDate.getFullYear(), nextMonthDate.getMonth() + 1)

  // --- Data fetching (選択月のタスクのみ) ---
  const userTasks = await prisma.userTask.findMany({
    where: {
      userId,
      task: {
        is: {
          monthlyTasks: { some: { targetMonth: selectedMonthStr } }
        }
      },
    },
    include: { 
      task: {
        include: {
          project: true,
        },
      },
    },
  })

  const workloads = await prisma.workload.findMany({
    where: {
      userId,
      date: {
        gte: startOfWeek,
        lt: nextMonday,
      },
    },
  })

  const tasks = userTasks.map((ut) => ut.task)
  const dates = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date(startOfWeek)
    d.setDate(startOfWeek.getDate() + i)
    return formatQueryDate(d)
  })

  return (
    <div className="container mx-auto p-4 md:p-8 space-y-6">
      {/* 月ナビゲーション */}
      <div className="flex justify-between items-center flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">工数タイムシート</h1>
          <p className="text-muted-foreground">
            {selectedYear}年{selectedMonth}月
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

      {/* 週ナビゲーション */}
      <div className="flex justify-between items-center flex-wrap gap-2">
        <p className="text-sm text-muted-foreground">
          {formatQueryDate(startOfWeek)} 〜 {formatQueryDate(endOfWeek)}
        </p>
        <div className="flex space-x-2">
          {hasPrevWeek ? (
            <LinkButton
              href={`?month=${selectedMonthStr}&week=${formatQueryDate(prevWeekDate)}`}
              variant="outline"
            >
              前週
            </LinkButton>
          ) : (
            <LinkButton href="#" variant="outline" className="pointer-events-none opacity-40">
              前週
            </LinkButton>
          )}
          {hasNextWeek ? (
            <LinkButton
              href={`?month=${selectedMonthStr}&week=${formatQueryDate(nextWeekDate)}`}
              variant="outline"
            >
              次週
            </LinkButton>
          ) : (
            <LinkButton href="#" variant="outline" className="pointer-events-none opacity-40">
              次週
            </LinkButton>
          )}
        </div>
      </div>

      {tasks.length === 0 ? (
        <div className="border border-dashed rounded-lg p-12 text-center">
          <p className="text-muted-foreground mb-4">
            {selectedYear}年{selectedMonth}月のマイタスクが登録されていません。
          </p>
          <LinkButton href={`/user/tasks?month=${selectedMonthStr}`}>
            マイタスクを登録する
          </LinkButton>
        </div>
      ) : (
        <TimesheetTable key={dates[0]} tasks={tasks} dates={dates} initialWorkloads={workloads} targetMonth={selectedMonthStr} />
      )}
    </div>
  )
}
