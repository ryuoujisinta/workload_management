import type { ProjectStatsResult } from "@/actions/admin-stats"

const MONTHS = ["01", "02", "03", "04", "05", "06", "07", "08", "09", "10", "11", "12"] as const

export type StatsTab = "task" | "user" | "taskUser"

function formatHoursForCsv(value: number): string {
  return value.toFixed(1)
}

function escapeCsvCell(value: string): string {
  return `"${value.replace(/"/g, "\"\"")}"`
}

function stringifyCsvRow(values: (string | number)[]): string {
  return values
    .map((value) => escapeCsvCell(String(value)))
    .join(",")
}

export function buildProjectStatsCsv(stats: ProjectStatsResult, tab: StatsTab): string {
  const monthHeaders = MONTHS.map((month) => `${parseInt(month, 10)}月`)
  const rows: string[] = []

  if (tab === "user") {
    rows.push(stringifyCsvRow(["ユーザー名", ...monthHeaders, "合計"]))
    stats.users.forEach((user) => {
      rows.push(stringifyCsvRow([
        user.name,
        ...MONTHS.map((month) => formatHoursForCsv(user.months[month] ?? 0)),
        formatHoursForCsv(user.total),
      ]))
    })
    rows.push(stringifyCsvRow([
      "合計",
      ...MONTHS.map((month) => formatHoursForCsv(stats.monthTotals[month] ?? 0)),
      formatHoursForCsv(stats.grandTotal),
    ]))
  }

  if (tab === "task") {
    rows.push(stringifyCsvRow(["プロジェクト名", "タスク名", ...monthHeaders, "合計"]))
    stats.tasks.forEach((task) => {
      rows.push(stringifyCsvRow([
        task.projectName,
        task.name,
        ...MONTHS.map((month) => formatHoursForCsv(task.months[month] ?? 0)),
        formatHoursForCsv(task.total),
      ]))
    })
    rows.push(stringifyCsvRow([
      "合計",
      "",
      ...MONTHS.map((month) => formatHoursForCsv(stats.monthTotals[month] ?? 0)),
      formatHoursForCsv(stats.grandTotal),
    ]))
  }

  if (tab === "taskUser") {
    rows.push(stringifyCsvRow(["プロジェクト名", "タスク名", "ユーザー名", ...monthHeaders, "合計"]))
    stats.taskUserStats.forEach((taskUser) => {
      taskUser.users.forEach((user) => {
        rows.push(stringifyCsvRow([
          taskUser.projectName,
          taskUser.taskName,
          user.userName,
          ...MONTHS.map((month) => formatHoursForCsv(user.months[month] ?? 0)),
          formatHoursForCsv(user.total),
        ]))
      })
    })
    rows.push(stringifyCsvRow([
      "合計",
      "",
      "",
      ...MONTHS.map((month) => formatHoursForCsv(stats.monthTotals[month] ?? 0)),
      formatHoursForCsv(stats.grandTotal),
    ]))
  }

  return `\uFEFF${rows.join("\r\n")}\r\n`
}
