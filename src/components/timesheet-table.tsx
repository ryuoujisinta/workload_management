"use client"

import { useState, useTransition } from "react"
import { Task, Workload } from "@prisma/client"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { saveWorkload, submitDay, cancelSubmitDay } from "@/actions/timesheet"

type Props = {
  tasks: Task[]
  dates: string[]
  initialWorkloads: Workload[]
  targetMonth: string
}

const DAY_NAMES = ["日", "月", "火", "水", "木", "金", "土"]

export default function TimesheetTable({ tasks, dates, initialWorkloads, targetMonth }: Props) {
  const [isPending, startTransition] = useTransition()
  
  // State: Record<date, Record<taskId, hours>>
  const [hoursGrid, setHoursGrid] = useState<Record<string, Record<string, string>>>(() => {
    const grid: Record<string, Record<string, string>> = {}
    dates.forEach(d => {
      grid[d] = {}
      tasks.forEach(t => {
        grid[d][t.id] = ""
      })
    })
    initialWorkloads.forEach(w => {
      const d = w.date.toISOString().split('T')[0]
      if (grid[d] && grid[d][w.taskId] !== undefined) {
        grid[d][w.taskId] = w.hours.toString()
      }
    })
    return grid
  })

  // Helper: check if a date is locked (Pending or Approved)
  const getDateStatus = (date: string) => {
    const entries = initialWorkloads.filter(w => w.date.toISOString().split('T')[0] === date)
    if (entries.some(e => e.status === "APPROVED")) return "APPROVED"
    if (entries.some(e => e.status === "PENDING")) return "PENDING"
    return "DRAFT"
  }

  const handleHoursChange = (date: string, taskId: string, value: string) => {
    setHoursGrid(prev => ({
      ...prev,
      [date]: { ...prev[date], [taskId]: value }
    }))
  }

  const handleSaveDraft = (date: string) => {
    startTransition(async () => {
      const entries = tasks.map(t => ({
        taskId: t.id,
        date,
        hours: parseFloat(hoursGrid[date][t.id] || "0")
      }))
      await saveWorkload(entries)
    })
  }

  const handleSubmit = (date: string) => {
    startTransition(async () => {
      // Auto-save first
      const entries = tasks.map(t => ({
        taskId: t.id,
        date,
        hours: parseFloat(hoursGrid[date][t.id] || "0")
      }))
      await saveWorkload(entries)
      await submitDay(date)
    })
  }

  const handleCancelSubmit = (date: string) => {
    startTransition(async () => {
      await cancelSubmitDay(date)
    })
  }

  return (
    <div className="w-full overflow-x-auto bg-white dark:bg-zinc-950 border rounded-lg shadow-sm">
      <table className="w-full text-sm border-collapse min-w-[800px]">
        <thead>
          <tr className="bg-muted/50 border-b">
            <th className="p-3 text-left w-48 font-medium">タスク</th>
            {dates.map((date) => {
              const isOutOfMonth = date.slice(0, 7) !== targetMonth
              const [y, m, dt] = date.split('-').map(Number)
              const dayIndex = new Date(y, m - 1, dt).getDay()
              return (
                <th key={date} className={`p-3 text-center border-l font-medium ${isOutOfMonth ? "opacity-40 bg-black/5 dark:bg-white/5" : ""}`}>
                  {date.slice(5)}<br/>
                  <span className="text-xs text-muted-foreground">({DAY_NAMES[dayIndex]})</span>
                </th>
              )
            })}
          </tr>
        </thead>
        <tbody>
          {tasks.map(task => (
            <tr key={task.id} className="border-b">
              <td className="p-3 border-r font-medium text-xs break-words">
                <span className="text-muted-foreground mr-1">[{task.project}]</span>
                <br/>{task.name}
              </td>
              {dates.map(date => {
                const isOutOfMonth = date.slice(0, 7) !== targetMonth
                const status = getDateStatus(date)
                const isLocked = status === "PENDING" || status === "APPROVED"
                return (
                  <td key={`${task.id}-${date}`} className={`p-2 border-r align-top ${isOutOfMonth ? "bg-black/5 dark:bg-white/5" : ""}`}>
                    <Input 
                      type="number" 
                      min="0" max="24" step="0.5"
                      value={hoursGrid[date][task.id]}
                      onChange={(e) => handleHoursChange(date, task.id, e.target.value)}
                      disabled={isLocked || isPending || isOutOfMonth}
                      className={`h-8 text-center ${isOutOfMonth ? "opacity-50" : ""}`}
                      placeholder="-"
                    />
                  </td>
                )
              })}
            </tr>
          ))}
          {/* Action Buttons Row */}
          <tr className="bg-muted/20">
            <td className="p-3 border-r font-bold text-right text-muted-foreground">アクション</td>
            {dates.map(date => {
              const isOutOfMonth = date.slice(0, 7) !== targetMonth
              const status = getDateStatus(date)
              return (
                <td key={`actions-${date}`} className={`p-3 border-r align-top space-y-2 ${isOutOfMonth ? "bg-black/5 dark:bg-white/5" : ""}`}>
                  {!isOutOfMonth && (
                    <>
                      {status === "APPROVED" && (
                        <div className="text-xs text-center font-bold text-green-600 bg-green-50 p-2 rounded">承認済</div>
                      )}
                      {status === "PENDING" && (
                        <>
                          <div className="text-xs text-center font-bold text-blue-600 bg-blue-50 py-1 rounded">申請中</div>
                          <Button 
                            variant="outline" size="sm" className="w-full text-xs h-7" 
                            onClick={() => handleCancelSubmit(date)}
                            disabled={isPending}
                          >
                            取り消し
                          </Button>
                        </>
                      )}
                      {status === "DRAFT" && (
                        <>
                          <Button 
                            variant="secondary" size="sm" className="w-full text-xs h-7" 
                            onClick={() => handleSaveDraft(date)}
                            disabled={isPending}
                          >
                            保存
                          </Button>
                          <Button 
                            variant="default" size="sm" className="w-full text-xs h-7" 
                            onClick={() => handleSubmit(date)}
                            disabled={isPending}
                          >
                            申請
                          </Button>
                        </>
                      )}
                    </>
                  )}
                </td>
              )
            })}
          </tr>
        </tbody>
      </table>
    </div>
  )
}
