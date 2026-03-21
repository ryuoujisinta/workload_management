"use server"

import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"

export async function createProject(formData: FormData) {
  const session = await auth()
  if (session?.user?.role !== "ADMIN") throw new Error("Unauthorized")

  const name = formData.get("name") as string
  const yearStr = formData.get("year") as string
  const year = parseInt(yearStr, 10)

  if (!name || isNaN(year)) throw new Error("Invalid data")

  try {
    const existing = await prisma.project.findUnique({ where: { name } })
    if (existing) {
      if (existing.year === year) {
        // 同じ年・同じ名前なら何もしないか、エラーを投げる
        return
      }
      // 名前は重複不可なのでエラー
      throw new Error("Project name already exists")
    }

    await prisma.project.create({
      data: {
        name,
        year,
      }
    })

    revalidatePath("/admin/tasks")
  } catch (error) {
    console.error("Project creation error:", error)
    throw error
  }
}

export async function deleteProject(projectId: string) {
  const session = await auth()
  if (session?.user?.role !== "ADMIN") throw new Error("Unauthorized")

  try {
    // 1. プロジェクトに関連するタスクを取得
    const tasks = await prisma.task.findMany({
      where: { projectId },
      select: { id: true }
    })
    const taskIds = tasks.map(t => t.id)

    // 2. トランザクションで削除実行 (Cascadeが上手く動かない場合への対策)
    await prisma.$transaction(async (tx) => {
      if (taskIds.length > 0) {
        // Workload, UserTask, MonthlyTask は Task の onDelete: Cascade で消えるはずだが、
        // 明示的に消すことで不整合を防ぐ (特に一部のDB/Adapter環境で有用)
        await tx.workload.deleteMany({ where: { taskId: { in: taskIds } } })
        await tx.userTask.deleteMany({ where: { taskId: { in: taskIds } } })
        await tx.monthlyTask.deleteMany({ where: { taskId: { in: taskIds } } })
        await tx.task.deleteMany({ where: { projectId } })
      }
      await tx.project.delete({ where: { id: projectId } })
    })

    revalidatePath("/admin/tasks")
  } catch (error) {
    console.error("Project deletion error:", error)
    throw error
  }
}
