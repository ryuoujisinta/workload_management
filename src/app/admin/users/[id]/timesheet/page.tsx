import { getMonthlyUserTimesheet } from "@/actions/admin-timesheet"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ChevronLeft, ChevronRight, ArrowLeft } from "lucide-react"

export default async function AdminUserTimesheetPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ month?: string }>
}) {
  const { id } = await params
  const resolvedSearchParams = await searchParams
  
  const now = new Date()
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  const targetMonth = resolvedSearchParams.month || currentMonth

  const data = await getMonthlyUserTimesheet(id, targetMonth)

  const [yearStr, monthStr] = targetMonth.split("-")
  const year = parseInt(yearStr, 10)
  const monthNum = parseInt(monthStr, 10)
  const daysInMonth = new Date(year, monthNum, 0).getDate()

  // Calculate Previous and Next months
  const prevDate = new Date(year, monthNum - 2, 1) // monthNum is 1-indexed, so -1 to get 0-indexed month, then -1 for prev
  const nextDate = new Date(year, monthNum, 1)

  const prevMonthStr = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, '0')}`
  const nextMonthStr = `${nextDate.getFullYear()}-${String(nextDate.getMonth() + 1).padStart(2, '0')}`

  // Build a matrix map: map[taskId][dateStr] = hours
  const hoursMap: Record<string, Record<string, number>> = {}
  data.tasks.forEach(t => { hoursMap[t.id] = {} })

  data.workloads.forEach(wl => {
    if (!hoursMap[wl.taskId]) {
      hoursMap[wl.taskId] = {}
    }
    // ensure date from DB matches local format if possible, but wl.date is 'YYYY-MM-DD'
    hoursMap[wl.taskId][wl.date] = wl.hours
  })

  // Determine the status of each day
  const dayStatusMap: Record<string, string> = {}
  data.workloads.forEach(wl => {
    if (!dayStatusMap[wl.date] || wl.status === 'APPROVED') {
      dayStatusMap[wl.date] = wl.status
    }
  })

  // Calculate totals
  const dailyTotals: Record<string, number> = {}
  const taskTotals: Record<string, number> = {}
  let grandTotal = 0

  const days = Array.from({ length: daysInMonth }, (_, i) => {
    const d = i + 1
    const dateStr = `${yearStr}-${monthStr}-${String(d).padStart(2, '0')}`
    return { day: d, dateStr }
  })

  // Initialize task totals
  data.tasks.forEach(t => { taskTotals[t.id] = 0 })

  days.forEach(d => {
    let dayTotal = 0
    data.tasks.forEach(t => {
      const hours = hoursMap[t.id]?.[d.dateStr] || 0
      dayTotal += hours
      taskTotals[t.id] += hours
      grandTotal += hours
    })
    dailyTotals[d.dateStr] = dayTotal
  })

  return (
    <div className="container mx-auto p-4 md:p-8 space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/admin/users">
          <Button type="button" variant="outline" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{data.user.name} の工数一覧</h1>
          <p className="text-muted-foreground">{data.user.email}</p>
        </div>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-4">
          <CardTitle>月次タイムシート ({targetMonth})</CardTitle>
          <div className="flex items-center space-x-2">
            <Link href={`?month=${prevMonthStr}`}>
              <Button type="button" variant="outline" size="icon">
                <ChevronLeft className="h-4 w-4" />
              </Button>
            </Link>
            <span className="font-medium text-sm w-20 text-center">{year}年{monthNum}月</span>
            <Link href={`?month=${nextMonthStr}`}>
              <Button type="button" variant="outline" size="icon">
                <ChevronRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          {data.tasks.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">この月のタスクや工数データはありません。</p>
          ) : (
            <div className="border rounded-md overflow-x-auto">
              <table className="w-full text-sm text-center whitespace-nowrap">
                <thead className="bg-muted">
                  <tr>
                    <th className="p-3 font-medium border-r bg-muted sticky left-0 z-10 w-24">日付</th>
                    {data.tasks.map(t => (
                      <th key={t.id} className="p-3 font-medium border-r min-w-[200px]">
                        <div className="text-xs text-muted-foreground truncate" title={t.projectName}>{t.projectName}</div>
                        <div className="truncate" title={t.name}>{t.name}</div>
                      </th>
                    ))}
                    <th className="p-3 font-medium font-bold bg-muted sticky right-0 z-10 w-32">日別合計</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {days.map(d => {
                    const isApproved = dayStatusMap[d.dateStr] === "APPROVED"
                    return (
                    <tr key={d.day} className={`transition-colors ${isApproved ? "bg-green-100/80 hover:bg-green-200/60 dark:bg-green-900/30 dark:hover:bg-green-900/40" : "hover:bg-muted/50"}`}>
                      <td className={`p-3 border-r sticky left-0 z-10 font-medium ${isApproved ? "bg-green-200/80 dark:bg-green-800/50" : "bg-background/95"}`}>
                        {monthNum}/{d.day}({new Date(year, monthNum - 1, d.day).toLocaleDateString('ja-JP', { weekday: 'short' })})
                      </td>
                      {data.tasks.map(t => {
                        const hours = hoursMap[t.id]?.[d.dateStr] || 0
                        return (
                          <td key={t.id} className="p-3 border-r">
                            {hours > 0 ? hours.toFixed(1) : "-"}
                          </td>
                        )
                      })}
                      <td className={`p-3 font-bold sticky right-0 z-10 ${isApproved ? "bg-green-200/80 dark:bg-green-800/50" : "bg-muted/20"}`}>
                        {dailyTotals[d.dateStr] > 0 ? dailyTotals[d.dateStr].toFixed(1) : "-"}
                      </td>
                    </tr>
                  )})}
                  <tr className="bg-muted/50 font-bold border-t-2">
                    <td className="p-3 border-r bg-muted sticky left-0 z-10">タスク別合計</td>
                    {data.tasks.map(t => (
                      <td key={t.id} className="p-3 border-r text-primary">
                        {taskTotals[t.id] > 0 ? taskTotals[t.id].toFixed(1) : "-"}
                      </td>
                    ))}
                    <td className="p-3 text-primary sticky right-0 z-10 bg-muted">
                      {grandTotal > 0 ? grandTotal.toFixed(1) : "-"}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
