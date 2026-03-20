"use server"

import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"

export async function addUserTask(taskId: string) {
  const session = await auth()
  if (!session?.user?.id) throw new Error("Unauthorized")

  try {
    await prisma.userTask.create({
      data: {
        userId: session.user.id,
        taskId
      }
    })
    revalidatePath("/user/tasks")
  } catch (error) {
    // Ignore unique constraint errors
    console.error(error)
  }
}

export async function removeUserTask(taskId: string) {
  const session = await auth()
  if (!session?.user?.id) throw new Error("Unauthorized")

  try {
    await prisma.userTask.delete({
      where: {
        userId_taskId: {
          userId: session.user.id,
          taskId
        }
      }
    })
    revalidatePath("/user/tasks")
  } catch (error) {
    console.error(error)
  }
}
