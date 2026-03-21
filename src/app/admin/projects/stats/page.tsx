import { Fragment } from "react"
import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { getProjectStats } from "@/actions/admin-stats"
import { LinkButton } from "@/components/link-button"

export default async function ProjectStatsPage(props: {
  searchParams?: Promise<{ year?: string; projectId?: string }>
}) {
  const session = await auth()
  if (session?.user?.role !== "ADMIN") {
    redirect("/")
  }

  const searchParams = await props.searchParams
  const now = new Date()
  const currentYear = now.getFullYear()
  
  const selectedYear = searchParams?.year ? parseInt(searchParams.year, 10) : currentYear
  const selectedProjectId = searchParams?.projectId || undefined

  // データ取得
  const stats = await getProjectStats(selectedYear, selectedProjectId)
  
  // 年度選択肢 (前後5年分)
  const years = Array.from({ length: 11 }).map((_, i) => currentYear - 5 + i)
  
  const months = ["01", "02", "03", "04", "05", "06", "07", "08", "09", "10", "11", "12"]

  return (
    <div className="container mx-auto p-4 md:p-8 space-y-6">
      <div className="flex justify-between items-center flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">プロジェクト別工数集計</h1>
          <p className="text-muted-foreground">プロジェクトごとの工数実績を確認します。</p>
        </div>
        <LinkButton href="/admin" variant="outline">ダッシュボードへ戻る</LinkButton>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>フィルター設定</CardTitle>
          <CardDescription>集計対象の年度とプロジェクトを選択してください。</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
          <div className="flex items-center gap-4">
            <div className="space-y-2">
              <Label>集計年度</Label>
              <div className="flex items-center gap-2">
                <LinkButton 
                  href={`?year=${selectedYear - 1}${selectedProjectId ? `&projectId=${selectedProjectId}` : ""}`}
                  variant="outline"
                  size="sm"
                >
                  &larr; {selectedYear - 1}年度
                </LinkButton>
                <div className="px-4 py-1.5 bg-muted rounded-md font-bold text-sm">
                  {selectedYear}年度
                </div>
                <LinkButton 
                  href={`?year=${selectedYear + 1}${selectedProjectId ? `&projectId=${selectedProjectId}` : ""}`}
                  variant="outline"
                  size="sm"
                >
                  {selectedYear + 1}年度 &rarr;
                </LinkButton>
              </div>
            </div>
          </div>

          <form className="flex items-end gap-4 w-full md:w-auto">
            <input type="hidden" name="year" value={selectedYear} />
            <div className="space-y-2 flex-1 md:w-64">
              <Label htmlFor="projectId">プロジェクト</Label>
              <select 
                id="projectId" 
                name="projectId" 
                defaultValue={selectedProjectId || ""}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                <option value="">全プロジェクト</option>
                {stats.projects.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
            
            <button type="submit" className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground shadow hover:bg-primary/90 h-9 px-4 py-2">
              選択
            </button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>
            ユーザー別集計 ({selectedYear}年 {selectedProjectId ? stats.projects.find(p => p.id === selectedProjectId)?.name : "全プロジェクト"})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {stats.users.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              該当するデータが見つかりませんでした。
            </div>
          ) : (
            <div className="border rounded-md overflow-x-auto">
              {/* Existing User Table */}
              <table className="w-full text-sm text-center border-collapse">
                <thead className="bg-muted">
                  <tr>
                    <th className="p-3 font-medium text-left border-b border-r sticky left-0 bg-muted z-10 w-40">ユーザー名</th>
                    {months.map(m => (
                      <th key={m} className="p-3 font-medium border-b min-w-[70px]">{parseInt(m)}月</th>
                    ))}
                    <th className="p-3 font-medium border-b border-l bg-muted/30 sticky right-0 z-10 w-24">合計</th>
                  </tr>
                </thead>
                <tbody className="divide-y text-right">
                  {stats.users.map(u => (
                    <tr key={u.id} className="hover:bg-muted/50 transition-colors">
                      <td className="p-3 text-left border-r sticky left-0 bg-background z-10 font-medium">{u.name}</td>
                      {months.map(m => (
                        <td key={m} className="p-3 border-r last:border-r-0">
                          {u.months[m] > 0 ? u.months[m].toLocaleString(undefined, { minimumFractionDigits: 1 }) : "-"}
                        </td>
                      ))}
                      <td className="p-3 border-l bg-muted/5 sticky right-0 z-10 font-bold">
                        {u.total.toLocaleString(undefined, { minimumFractionDigits: 1 })}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-muted/30 font-bold text-right border-t-2">
                  <tr>
                    <td className="p-3 text-left border-r sticky left-0 bg-muted z-10">合計</td>
                    {months.map(m => (
                      <td key={m} className="p-3 border-r last:border-r-0">
                        {stats.monthTotals[m] > 0 ? stats.monthTotals[m].toLocaleString(undefined, { minimumFractionDigits: 1 }) : "-"}
                      </td>
                    ))}
                    <td className="p-3 border-l bg-muted/30 sticky right-0 z-10">
                      {stats.grandTotal.toLocaleString(undefined, { minimumFractionDigits: 1 })}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>
            タスク別集計 ({selectedYear}年 {selectedProjectId ? stats.projects.find(p => p.id === selectedProjectId)?.name : "全プロジェクト"})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {stats.tasks.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              該当するデータが見つかりませんでした。
            </div>
          ) : (
            <div className="border rounded-md overflow-x-auto">
              <table className="w-full text-sm text-center border-collapse">
                <thead className="bg-muted">
                  <tr>
                    <th className="p-3 font-medium text-left border-b border-r sticky left-0 bg-muted z-10 w-64">プロジェクト / タスク名</th>
                    {months.map(m => (
                      <th key={m} className="p-3 font-medium border-b min-w-[70px]">{parseInt(m)}月</th>
                    ))}
                    <th className="p-3 font-medium border-b border-l bg-muted/30 sticky right-0 z-10 w-24">合計</th>
                  </tr>
                </thead>
                <tbody className="divide-y text-right">
                  {stats.tasks.map(t => (
                    <tr key={t.id} className="hover:bg-muted/50 transition-colors">
                      <td className="p-3 text-left border-r sticky left-0 bg-background z-10 font-medium whitespace-nowrap overflow-hidden text-ellipsis max-w-64">
                        <div className="text-xs text-muted-foreground">{t.projectName}</div>
                        <div>{t.name}</div>
                      </td>
                      {months.map(m => (
                        <td key={m} className="p-3 border-r last:border-r-0">
                          {t.months[m] > 0 ? t.months[m].toLocaleString(undefined, { minimumFractionDigits: 1 }) : "-"}
                        </td>
                      ))}
                      <td className="p-3 border-l bg-muted/5 sticky right-0 z-10 font-bold">
                        {t.total.toLocaleString(undefined, { minimumFractionDigits: 1 })}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-muted/30 font-bold text-right border-t-2">
                  <tr>
                    <td className="p-3 text-left border-r sticky left-0 bg-muted z-10">合計</td>
                    {months.map(m => (
                      <td key={m} className="p-3 border-r last:border-r-0">
                        {stats.monthTotals[m] > 0 ? stats.monthTotals[m].toLocaleString(undefined, { minimumFractionDigits: 1 }) : "-"}
                      </td>
                    ))}
                    <td className="p-3 border-l bg-muted/30 sticky right-0 z-10">
                      {stats.grandTotal.toLocaleString(undefined, { minimumFractionDigits: 1 })}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>
            タスク×ユーザー別集計 ({selectedYear}年 {selectedProjectId ? stats.projects.find(p => p.id === selectedProjectId)?.name : "全プロジェクト"})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {stats.taskUserStats.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              該当するデータが見つかりませんでした。
            </div>
          ) : (
            <div className="border rounded-md overflow-x-auto">
              <table className="w-full text-sm text-center border-collapse">
                <thead className="bg-muted">
                  <tr>
                    <th className="p-3 font-medium text-left border-b border-r sticky left-0 bg-muted z-10 w-48">プロジェクト / タスク名</th>
                    <th className="p-3 font-medium text-left border-b border-r sticky left-48 bg-muted z-10 w-32">ユーザー名</th>
                    {months.map(m => (
                      <th key={m} className="p-3 font-medium border-b min-w-[70px]">{parseInt(m)}月</th>
                    ))}
                    <th className="p-3 font-medium border-b border-l bg-muted/30 sticky right-0 z-10 w-24">合計</th>
                  </tr>
                </thead>
                <tbody className="divide-y text-right">
                  {stats.taskUserStats.map(t => (
                    <Fragment key={t.taskId}>
                      {t.users.map((u, uIdx) => (
                        <tr key={`${t.taskId}-${u.userId}`} className="hover:bg-muted/50 transition-colors">
                          {uIdx === 0 && (
                            <td rowSpan={t.users.length} className="p-3 text-left border-r sticky left-0 bg-background z-10 font-medium align-top whitespace-nowrap overflow-hidden text-ellipsis max-w-48">
                              <div className="text-xs text-muted-foreground">{t.projectName}</div>
                              <div>{t.taskName}</div>
                            </td>
                          )}
                          <td className="p-3 text-left border-r sticky left-48 bg-background z-10 font-medium">{u.userName}</td>
                          {months.map(m => (
                            <td key={m} className="p-3 border-r last:border-r-0">
                              {u.months[m] > 0 ? u.months[m].toLocaleString(undefined, { minimumFractionDigits: 1 }) : "-"}
                            </td>
                          ))}
                          <td className="p-3 border-l bg-muted/5 sticky right-0 z-10 font-bold">
                            {u.total.toLocaleString(undefined, { minimumFractionDigits: 1 })}
                          </td>
                        </tr>
                      ))}
                    </Fragment>
                  ))}
                </tbody>
                <tfoot className="bg-muted/30 font-bold text-right border-t-2">
                  <tr>
                    <td colSpan={2} className="p-3 text-left border-r sticky left-0 bg-muted z-10">合計</td>
                    {months.map(m => (
                      <td key={m} className="p-3 border-r last:border-r-0">
                        {stats.monthTotals[m] > 0 ? stats.monthTotals[m].toLocaleString(undefined, { minimumFractionDigits: 1 }) : "-"}
                      </td>
                    ))}
                    <td className="p-3 border-l bg-muted/30 sticky right-0 z-10">
                      {stats.grandTotal.toLocaleString(undefined, { minimumFractionDigits: 1 })}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
