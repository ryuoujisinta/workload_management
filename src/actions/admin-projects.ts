"use server"

import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"

export async function createProject(formData: FormData) {
  const session = await auth()
  if (session?.user?.role !== "ADMIN") throw new Error("Unauthorized")

  const name = formData.get("name") as string

  if (!name) throw new Error("Invalid data")

  await prisma.project.create({
    data: {
      name,
    }
  })

  revalidatePath("/admin/tasks")
}

export async function deleteProject(projectId: string) {
  const session = await auth()
  if (session?.user?.role !== "ADMIN") throw new Error("Unauthorized")

  await prisma.project.delete({ where: { id: projectId } })
  revalidatePath("/admin/tasks")
}
