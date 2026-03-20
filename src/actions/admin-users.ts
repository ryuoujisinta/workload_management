"use server"

import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"
import { revalidatePath } from "next/cache"

export async function createUser(formData: FormData) {
  const session = await auth()
  if (session?.user?.role !== "ADMIN") throw new Error("Unauthorized")

  const name = formData.get("name") as string
  const email = formData.get("email") as string
  const role = formData.get("role") as "ADMIN" | "USER"

  if (!name || !email || !role) throw new Error("Invalid data")

  // デフォルトパスワード（実運用では初期パスワード変更フローを推奨）
  const defaultPassword = "password123" 
  const passwordHash = await bcrypt.hash(defaultPassword, 10)

  await prisma.user.create({
    data: {
      name,
      email,
      role,
      passwordHash
    }
  })

  revalidatePath("/admin/users")
}

export async function deleteUser(userId: string) {
  const session = await auth()
  if (session?.user?.role !== "ADMIN") throw new Error("Unauthorized")

  await prisma.user.delete({ where: { id: userId } })
  revalidatePath("/admin/users")
}
