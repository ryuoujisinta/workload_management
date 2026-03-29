"use server"

import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

const MONTHS = ["01", "02", "03", "04", "05", "06", "07", "08", "09", "10", "11", "12"] as const

export type MonthlyStats = {
  [month: string]: number // "04", "05", ..., "03"
}

export type UserStats = {
  id: string
  name: string
  months: MonthlyStats
  total: number
}

export type TaskStats = {
  id: string
  name: string
  projectName: string
  months: MonthlyStats
  total: number
}

export type TaskUserStats = {
  taskId: string
  taskName: string
  projectName: string
  users: {
    userId: string
    userName: string
    months: MonthlyStats
    total: number
  }[]
  total: number
}

export type ProjectStatsResult = {
  users: UserStats[]
  tasks: TaskStats[]
  taskUserStats: TaskUserStats[]
  monthTotals: MonthlyStats
  grandTotal: number
  projects: { id: string, name: string }[]
}

function createEmptyMonthStats(): MonthlyStats {
  return Object.fromEntries(MONTHS.map((month) => [month, 0]))
}

/**
 * プロジェクトごとの工数集計を取得する
 * @param year 年度 (例: 2025)
 * @param projectId 特定のプロジェクトID (任意)
 */
export async function getProjectStats(year: number, projectId?: string): Promise<ProjectStatsResult> {
  const session = await auth()
  if (session?.user?.role !== "ADMIN") throw new Error("Unauthorized")

  // 1. 指定年度のプロジェクトを取得
  const projects = await prisma.project.findMany({
    where: { year },
    select: { id: true, name: true },
    orderBy: { name: "asc" }
  })

  if (projects.length === 0) {
    return {
      users: [],
      tasks: [],
      taskUserStats: [],
      monthTotals: createEmptyMonthStats(),
      grandTotal: 0,
      projects: [],
    }
  }

  const projectIds = projectId ? [projectId] : projects.map(p => p.id)

  // 2. 年度に対応する期間の指定
  // ここでは既存のプロジェクト管理ロジックに合わせ、カレンダー年（1月〜12月）を1年度として扱います
  const startDate = new Date(year, 0, 1) // 1月1日
  const endDate = new Date(year, 11, 31, 23, 59, 59) // 12月31日

  // 3. Workload データの取得
  const workloads = await prisma.workload.findMany({
    where: {
      status: "APPROVED",
      taskId: {
        in: await prisma.task.findMany({
          where: { projectId: { in: projectIds } },
          select: { id: true }
        }).then(tasks => tasks.map(t => t.id))
      },
      date: {
        gte: startDate,
        lte: endDate
      }
    },
    include: {
      user: {
        select: { id: true, name: true }
      },
      task: {
        select: { 
          id: true, 
          name: true,
          project: { select: { name: true } }
        }
      }
    }
  })

  // 4. 集計
  const userMap: Record<string, UserStats> = {}
  const taskMap: Record<string, TaskStats> = {}
  const taskUserMap: Record<string, Record<string, { userId: string, userName: string, months: MonthlyStats, total: number }>> = {}
  const monthTotals = createEmptyMonthStats()
  let grandTotal = 0

  workloads.forEach(w => {
    const d = new Date(w.date)
    const month = String(d.getMonth() + 1).padStart(2, "0")
    
    // ユーザー別の集計
    if (!userMap[w.userId]) {
      userMap[w.userId] = {
        id: w.userId,
        name: w.user.name,
        months: {},
        total: 0
      }
      MONTHS.forEach(m => userMap[w.userId].months[m] = 0)
    }
    userMap[w.userId].months[month] += w.hours
    userMap[w.userId].total += w.hours

    // タスク別の集計
    if (!taskMap[w.taskId]) {
      taskMap[w.taskId] = {
        id: w.taskId,
        name: w.task.name,
        projectName: w.task.project.name,
        months: {},
        total: 0
      }
      MONTHS.forEach(m => taskMap[w.taskId].months[m] = 0)
    }
    taskMap[w.taskId].months[month] += w.hours
    taskMap[w.taskId].total += w.hours

    // タスク×ユーザー別の集計
    if (!taskUserMap[w.taskId]) {
      taskUserMap[w.taskId] = {}
    }
    if (!taskUserMap[w.taskId][w.userId]) {
      taskUserMap[w.taskId][w.userId] = {
        userId: w.userId,
        userName: w.user.name,
        months: {},
        total: 0
      }
      MONTHS.forEach(m => taskUserMap[w.taskId][w.userId].months[m] = 0)
    }
    taskUserMap[w.taskId][w.userId].months[month] += w.hours
    taskUserMap[w.taskId][w.userId].total += w.hours

    monthTotals[month] += w.hours
    grandTotal += w.hours
  })

  // 並び替え (ユーザー名順、またはプロジェクト名+タスク名順)
  const users = Object.values(userMap).sort((a, b) => a.name.localeCompare(b.name, 'ja'))
  const tasks = Object.values(taskMap).sort((a, b) => {
    const pComp = a.projectName.localeCompare(b.projectName, 'ja')
    if (pComp !== 0) return pComp
    return a.name.localeCompare(b.name, 'ja')
  })

  // タスク×ユーザー別の集計結果を整形
  const taskUserStats: TaskUserStats[] = tasks.map(t => {
    const usersInTask = Object.values(taskUserMap[t.id] || {}).sort((a, b) => a.userName.localeCompare(b.userName, 'ja'))
    return {
      taskId: t.id,
      taskName: t.name,
      projectName: t.projectName,
      users: usersInTask,
      total: t.total
    }
  })

  return {
    users,
    tasks,
    taskUserStats,
    monthTotals,
    grandTotal,
    projects
  }
}
