"use server"

import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import Papa from "papaparse"

export async function importData(formData: FormData) {
  const session = await auth()
  if (session?.user?.role !== "ADMIN") throw new Error("Unauthorized")

  const file = formData.get("file") as File
  if (!file) throw new Error("No file uploaded")

  const arrayBuffer = await file.arrayBuffer()
  const csvText = Buffer.from(arrayBuffer).toString("utf-8")
  
  const { data, errors } = Papa.parse(csvText, {
    header: true,
    skipEmptyLines: true,
  })

  if (errors.length > 0) {
    console.error("CSV Parsing errors:", errors)
    throw new Error("Failed to parse CSV")
  }

  // year, projectName, taskName
  const rows = data as { year: string; projectName: string; taskName: string }[]

  for (const row of rows) {
    const year = parseInt(row.year, 10)
    const projectName = row.projectName?.trim()
    const taskName = row.taskName?.trim()

    if (isNaN(year) || !projectName || !taskName) {
      console.warn("Skipping invalid row:", row)
      continue
    }

    // 1. Find or create Project
    let project = await prisma.project.findUnique({
      where: { name: projectName }
    })

    if (!project) {
      project = await prisma.project.create({
        data: {
          name: projectName,
          year: year,
        }
      })
    } else if (project.year !== year) {
      // プロジェクト名はユニークなので、名前が同じで年が違う場合は既存のプロジェクトを優先するかエラーにするか。
      // 今回は既存のプロジェクト（名前一致）を使う。
      console.warn(`Project "${projectName}" already exists with year ${project.year}. Using existing project.`)
    }

    // 2. Find or create Task
    const existingTask = await prisma.task.findFirst({
      where: {
        name: taskName,
        projectId: project.id
      }
    })

    if (!existingTask) {
      await prisma.task.create({
        data: {
          name: taskName,
          projectId: project.id
        }
      })
    }
  }

  revalidatePath("/admin/tasks")
}
