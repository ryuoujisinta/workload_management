"use server"

import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"

export async function createTask(formData: FormData) {
  const session = await auth()
  if (session?.user?.role !== "ADMIN") throw new Error("Unauthorized")

  const projectId = formData.get("projectId") as string
  const name = formData.get("name") as string

  if (!projectId || !name) throw new Error("Invalid data")

  await prisma.task.create({
    data: {
      projectId,
      name,
    }
  })

  revalidatePath("/admin/tasks")
}

export async function deleteTask(taskId: string) {
  const session = await auth()
  if (session?.user?.role !== "ADMIN") throw new Error("Unauthorized")

  await prisma.task.delete({ where: { id: taskId } })
  revalidatePath("/admin/tasks")
}

export async function toggleMonthlyTask(taskId: string, targetMonth: string, isActive: boolean) {
  const session = await auth()
  if (session?.user?.role !== "ADMIN") throw new Error("Unauthorized")

  if (isActive) {
    await prisma.monthlyTask.upsert({
      where: {
        taskId_targetMonth: { taskId, targetMonth }
      },
      update: {},
      create: { taskId, targetMonth }
    })
  } else {
    await prisma.monthlyTask.deleteMany({
      where: { taskId, targetMonth }
    })
  }
  revalidatePath("/admin/tasks")
}
