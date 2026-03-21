"use server"

import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

export type MonthlyStats = {
  [month: string]: number // "04", "05", ..., "03"
}

export type UserStats = {
  id: string
  name: string
  months: MonthlyStats
  total: number
}

export type ProjectStatsResult = {
  users: UserStats[]
  monthTotals: MonthlyStats
  grandTotal: number
  projects: { id: string, name: string }[]
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
    return { users: [], monthTotals: {}, grandTotal: 0, projects: [] }
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
      }
    }
  })

  // 4. 集計
  const months = ["01", "02", "03", "04", "05", "06", "07", "08", "09", "10", "11", "12"]
  const userMap: Record<string, UserStats> = {}
  const monthTotals: MonthlyStats = {}
  months.forEach(m => monthTotals[m] = 0)
  let grandTotal = 0

  workloads.forEach(w => {
    const d = new Date(w.date)
    const month = String(d.getMonth() + 1).padStart(2, "0")
    
    if (!userMap[w.userId]) {
      userMap[w.userId] = {
        id: w.userId,
        name: w.user.name,
        months: {},
        total: 0
      }
      months.forEach(m => userMap[w.userId].months[m] = 0)
    }

    userMap[w.userId].months[month] += w.hours
    userMap[w.userId].total += w.hours
    monthTotals[month] += w.hours
    grandTotal += w.hours
  })

  // 並び替え (ユーザー名順など)
  const users = Object.values(userMap).sort((a, b) => a.name.localeCompare(b.name, 'ja'))

  return {
    users,
    monthTotals,
    grandTotal,
    projects
  }
}
