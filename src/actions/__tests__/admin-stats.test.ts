import { buildProjectStatsCsv } from "@/lib/project-stats-csv"
import type { ProjectStatsResult } from "../admin-stats"

describe("admin-stats csv", () => {
  const stats: ProjectStatsResult = {
    users: [
      {
        id: "user-1",
        name: "山田 太郎",
        months: {
          "01": 2.5,
          "02": 0,
          "03": 0,
          "04": 0,
          "05": 0,
          "06": 0,
          "07": 0,
          "08": 0,
          "09": 0,
          "10": 0,
          "11": 0,
          "12": 0,
        },
        total: 2.5,
      },
    ],
    tasks: [
      {
        id: "task-1",
        name: "設計",
        projectName: "案件A",
        months: {
          "01": 1.5,
          "02": 0,
          "03": 0,
          "04": 0,
          "05": 0,
          "06": 0,
          "07": 0,
          "08": 0,
          "09": 0,
          "10": 0,
          "11": 0,
          "12": 0,
        },
        total: 1.5,
      },
    ],
    taskUserStats: [
      {
        taskId: "task-1",
        taskName: "設計",
        projectName: "案件A",
        users: [
          {
            userId: "user-1",
            userName: "山田 太郎",
            months: {
              "01": 1.5,
              "02": 0,
              "03": 0,
              "04": 0,
              "05": 0,
              "06": 0,
              "07": 0,
              "08": 0,
              "09": 0,
              "10": 0,
              "11": 0,
              "12": 0,
            },
            total: 1.5,
          },
        ],
        total: 1.5,
      },
    ],
    monthTotals: {
      "01": 2.5,
      "02": 0,
      "03": 0,
      "04": 0,
      "05": 0,
      "06": 0,
      "07": 0,
      "08": 0,
      "09": 0,
      "10": 0,
      "11": 0,
      "12": 0,
    },
    grandTotal: 2.5,
    projects: [
      { id: "project-1", name: "案件A" },
    ],
  }

  it("builds task csv with header, row, and total", () => {
    const csv = buildProjectStatsCsv(stats, "task")

    expect(csv.startsWith("\uFEFF")).toBe(true)
    expect(csv).toContain("\"プロジェクト名\",\"タスク名\",\"1月\"")
    expect(csv).toContain("\"案件A\",\"設計\",\"1.5\"")
    expect(csv).toContain("\"合計\",\"\",\"2.5\",\"0.0\"")
  })

  it("builds user csv with header, row, and total", () => {
    const csv = buildProjectStatsCsv(stats, "user")

    expect(csv).toContain("\"ユーザー名\",\"1月\"")
    expect(csv).toContain("\"山田 太郎\",\"2.5\"")
    expect(csv).toContain("\"合計\",\"2.5\",\"0.0\"")
  })

  it("builds taskUser csv with header, row, and total", () => {
    const csv = buildProjectStatsCsv(stats, "taskUser")

    expect(csv).toContain("\"プロジェクト名\",\"タスク名\",\"ユーザー名\",\"1月\"")
    expect(csv).toContain("\"案件A\",\"設計\",\"山田 太郎\",\"1.5\"")
    expect(csv).toContain("\"合計\",\"\",\"\",\"2.5\",\"0.0\"")
  })
})
