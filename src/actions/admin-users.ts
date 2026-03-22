"use server"

import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"
import { revalidatePath } from "next/cache"

import crypto from "crypto"

export type CreateUserResponse = {
  success: boolean
  error?: string
  password?: string
}

export async function createUser(_prevState: any, formData: FormData): Promise<CreateUserResponse> {
  const session = await auth()
  if (session?.user?.role !== "ADMIN") return { success: false, error: "Unauthorized" }

  const name = formData.get("name") as string
  const email = formData.get("email") as string
  const role = formData.get("role") as "ADMIN" | "USER"

  if (!name || !email || !role) return { success: false, error: "Invalid data" }

  // デフォルトパスワードをランダム生成
  const defaultPassword = crypto.randomBytes(8).toString('hex') 
  const passwordHash = await bcrypt.hash(defaultPassword, 10)

  try {
    await prisma.user.create({
      data: {
        name,
        email,
        role,
        passwordHash
      }
    })

    revalidatePath("/admin/users")
    return { success: true, password: defaultPassword }
  } catch (error) {
    console.error("Failed to create user:", error)
    return { success: false, error: "ユーザーの作成に失敗しました。メールアドレスが既に登録されている可能性があります。" }
  }
}

export async function deleteUser(userId: string) {
  const session = await auth()
  if (session?.user?.role !== "ADMIN") throw new Error("Unauthorized")

  await prisma.user.delete({ where: { id: userId } })
  revalidatePath("/admin/users")
}
