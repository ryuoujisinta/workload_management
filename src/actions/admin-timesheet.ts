"use server"

import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"

export async function getMonthlyUserTimesheet(userId: string, targetMonth: string) {
  const session = await auth()
  if (session?.user?.role !== "ADMIN") {
    throw new Error("Unauthorized")
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, name: true, email: true }
  })

  if (!user) {
    throw new Error("User not found")
  }

  // targetMonth format: "YYYY-MM"
  const [yearStr, monthStr] = targetMonth.split("-")
  const year = parseInt(yearStr, 10)
  const month = parseInt(monthStr, 10)

  // Start and end of the month in UTC
  const startDate = new Date(Date.UTC(year, month - 1, 1))
  const endDate = new Date(Date.UTC(year, month, 0, 23, 59, 59, 999))

  // Find all tasks the user has selected for this month
  const userTasks = await prisma.userTask.findMany({
    where: {
      userId,
      task: {
        targetMonth
      }
    },
    include: {
      task: {
        include: {
          project: true
        }
      }
    }
  })

  // Also find all workloads for this user in this month, in case they logged time for a task they no longer have in UserTask
  const workloads = await prisma.workload.findMany({
    where: {
      userId,
      date: {
        gte: startDate,
        lte: endDate
      }
    },
    include: {
      task: {
        include: {
          project: true
        }
      }
    }
  })

  // Map to collect all unique tasks
  const taskMap = new Map<string, { id: string, name: string, projectName: string }>()

  userTasks.forEach(ut => {
    taskMap.set(ut.task.id, {
      id: ut.task.id,
      name: ut.task.name,
      projectName: ut.task.project.name
    })
  })

  workloads.forEach(wl => {
    if (!taskMap.has(wl.task.id)) {
      taskMap.set(wl.task.id, {
        id: wl.task.id,
        name: wl.task.name,
        projectName: wl.task.project.name
      })
    }
  })

  return {
    user,
    tasks: Array.from(taskMap.values()),
    workloads: workloads.map(w => ({
      id: w.id,
      taskId: w.taskId,
      // Store date as ISO string (YYYY-MM-DD)
      date: w.date.toISOString().split('T')[0],
      hours: w.hours,
      status: w.status
    }))
  }
}
