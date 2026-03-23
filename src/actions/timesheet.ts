"use server"

import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"

type WorkloadEntry = {
  taskId: string
  date: string // YYYY-MM-DD
  hours: number
}

export async function saveWorkload(entries: WorkloadEntry[]) {
  const session = await auth()
  if (!session?.user?.id) throw new Error("Unauthorized")
  const userId = session.user.id

  if (entries.length === 0) return

  await prisma.$transaction(
    entries.map((entry) => {
      // Ensure date is treated as midnight UTC for consistency
      const dateObj = new Date(entry.date)
      if (isNaN(dateObj.getTime())) {
        throw new Error(`Invalid date: ${entry.date}`)
      }

      return prisma.workload.upsert({
        where: {
          userId_taskId_date: {
            userId,
            taskId: entry.taskId,
            date: dateObj
          }
        },
        update: {
          hours: entry.hours,
        },
        create: {
          userId,
          taskId: entry.taskId,
          date: dateObj,
          hours: entry.hours,
          status: "DRAFT"
        }
      })
    })
  )

  revalidatePath("/user/timesheet")
}

export async function submitDay(date: string) {
  const session = await auth()
  if (!session?.user?.id) throw new Error("Unauthorized")
  const userId = session.user.id
  const dateObj = new Date(date)

  await prisma.workload.updateMany({
    where: { 
      userId, 
      date: dateObj,
      status: { in: ["DRAFT", "REJECTED"] }
    },
    data: { status: "PENDING" }
  })
  
  revalidatePath("/user/timesheet")
}

export async function cancelSubmitDay(date: string) {
  const session = await auth()
  if (!session?.user?.id) throw new Error("Unauthorized")
  const userId = session.user.id
  const dateObj = new Date(date)

  await prisma.workload.updateMany({
    where: { 
      userId, 
      date: dateObj,
      status: "PENDING"
    },
    data: { status: "DRAFT" }
  })

  revalidatePath("/user/timesheet")
}
