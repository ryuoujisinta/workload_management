"use server"

import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"

export async function approveWorkloads(userId: string, date: string) {
  const session = await auth()
  if (session?.user?.role !== "ADMIN") throw new Error("Unauthorized")
  const dateObj = new Date(date)

  await prisma.workload.updateMany({
    where: { userId, date: dateObj, status: "PENDING" },
    data: { status: "APPROVED" }
  })
  
  revalidatePath("/admin/approvals")
}

export async function rejectWorkloads(userId: string, date: string) {
  const session = await auth()
  if (session?.user?.role !== "ADMIN") throw new Error("Unauthorized")
  const dateObj = new Date(date)

  await prisma.workload.updateMany({
    where: { userId, date: dateObj, status: "PENDING" },
    data: { status: "REJECTED" }
  })
  
  revalidatePath("/admin/approvals")
}

export async function revokeApproval(userId: string, date: string) {
  const session = await auth()
  if (session?.user?.role !== "ADMIN") throw new Error("Unauthorized")
  const dateObj = new Date(date)

  await prisma.workload.updateMany({
    where: { userId, date: dateObj, status: "APPROVED" },
    data: { status: "DRAFT" }
  })
  
  revalidatePath("/admin/approvals")
}
