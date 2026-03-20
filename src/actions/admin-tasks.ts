"use server"

import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"

export async function createTask(formData: FormData) {
  const session = await auth()
  if (session?.user?.role !== "ADMIN") throw new Error("Unauthorized")

  const project = formData.get("project") as string
  const name = formData.get("name") as string
  const targetMonth = formData.get("targetMonth") as string

  if (!project || !name || !targetMonth) throw new Error("Invalid data")

  await prisma.task.create({
    data: {
      project,
      name,
      targetMonth
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
