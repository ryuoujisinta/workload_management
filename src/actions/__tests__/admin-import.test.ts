import { importData } from "../admin-import"
import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"

jest.mock("@/auth", () => ({
  auth: jest.fn()
}))

jest.mock("@/lib/prisma", () => ({
  prisma: {
    project: {
      findUnique: jest.fn(),
      create: jest.fn()
    },
    task: {
      findFirst: jest.fn(),
      create: jest.fn()
    }
  }
}))

jest.mock("next/cache", () => ({
  revalidatePath: jest.fn()
}))

describe("admin-import", () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it("should import project and task from CSV", async () => {
    ;(auth as jest.Mock).mockResolvedValue({ user: { role: "ADMIN" } })
    
    const csvContent = "year,projectName,taskName\n2024,Test Project,Test Task"
    const file = new File([csvContent], "test.csv", { type: "text/csv" })
    file.arrayBuffer = jest.fn().mockResolvedValue(Buffer.from(csvContent))
    const formData = new FormData()
    formData.append("file", file)

    // Mock project not existing
    ;(prisma.project.findUnique as jest.Mock).mockResolvedValue(null)
    ;(prisma.project.create as jest.Mock).mockResolvedValue({ id: "proj-123", name: "Test Project", year: 2024 })
    
    // Mock task not existing
    ;(prisma.task.findFirst as jest.Mock).mockResolvedValue(null)

    await importData(formData)

    expect(prisma.project.create).toHaveBeenCalledWith({
      data: { name: "Test Project", year: 2024 }
    })
    expect(prisma.task.create).toHaveBeenCalledWith({
      data: { name: "Test Task", projectId: "proj-123" }
    })
  })

  it("should use existing project if name matches", async () => {
    ;(auth as jest.Mock).mockResolvedValue({ user: { role: "ADMIN" } })
    
    const csvContent = "year,projectName,taskName\n2024,Existing Project,New Task"
    const file = new File([csvContent], "test.csv", { type: "text/csv" })
    file.arrayBuffer = jest.fn().mockResolvedValue(Buffer.from(csvContent))
    const formData = new FormData()
    formData.append("file", file)

    // Mock project existing
    ;(prisma.project.findUnique as jest.Mock).mockResolvedValue({ id: "proj-456", name: "Existing Project", year: 2024 })
    
    // Mock task not existing
    ;(prisma.task.findFirst as jest.Mock).mockResolvedValue(null)

    await importData(formData)

    expect(prisma.project.create).not.toHaveBeenCalled()
    expect(prisma.task.create).toHaveBeenCalledWith({
      data: { name: "New Task", projectId: "proj-456" }
    })
  })
})
