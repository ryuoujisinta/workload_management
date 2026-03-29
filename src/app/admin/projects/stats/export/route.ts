import { auth } from "@/auth"
import { getProjectStats } from "@/actions/admin-stats"
import { buildProjectStatsCsv, type StatsTab } from "@/lib/project-stats-csv"

function parseYear(value: string | null): number {
  const fallbackYear = new Date().getFullYear()
  if (!value) {
    return fallbackYear
  }

  const year = Number.parseInt(value, 10)
  return Number.isNaN(year) ? fallbackYear : year
}

function parseTab(value: string | null): StatsTab {
  if (value === "user" || value === "taskUser") {
    return value
  }

  return "task"
}

export async function GET(request: Request) {
  const session = await auth()
  if (session?.user?.role !== "ADMIN") {
    return new Response("Unauthorized", { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const year = parseYear(searchParams.get("year"))
  const projectId = searchParams.get("projectId") || undefined
  const tab = parseTab(searchParams.get("tab"))

  const stats = await getProjectStats(year, projectId)
  const csv = buildProjectStatsCsv(stats, tab)
  const filename = `project-stats-${tab}-${year}.csv`

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  })
}
