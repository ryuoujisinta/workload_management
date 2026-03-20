import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { approveWorkloads, rejectWorkloads, revokeApproval } from "@/actions/admin-approvals"

export default async function AdminApprovalsPage() {
  const session = await auth()
  if (session?.user?.role !== "ADMIN") redirect("/")

  const workloads = await prisma.workload.findMany({
    where: { status: { in: ["PENDING", "APPROVED"] } },
    include: { user: true, task: true },
    orderBy: { date: "desc" }
  })

  // Group by userId + date
  const grouped = workloads.reduce((acc, w) => {
    const dStr = w.date.toISOString().split("T")[0]
    const key = `${w.userId}_${dStr}`
    if (!acc[key]) {
      acc[key] = {
        userId: w.userId,
        userName: w.user.name,
        dateStr: dStr,
        status: w.status,
        totalHours: 0,
        details: [] as string[]
      }
    }
    acc[key].totalHours += w.hours
    acc[key].details.push(`[${w.task.project}] ${w.task.name} (${w.hours}h)`)
    return acc
  }, {} as Record<string, any>)

  const pendingList = Object.values(grouped).filter(g => g.status === "PENDING")
  const approvedList = Object.values(grouped).filter(g => g.status === "APPROVED")

  return (
    <div className="container mx-auto p-4 md:p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">工数承認ダッシュボード</h1>
        <p className="text-muted-foreground">ユーザーから申請された日別工数を確認し、承認または却下を行います。</p>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>承認待ち一覧 (Pending)</CardTitle>
            <CardDescription>現在承認を待っている申請です。</CardDescription>
          </CardHeader>
          <CardContent>
            {pendingList.length === 0 ? (
               <p className="text-muted-foreground text-center py-8 border border-dashed rounded-lg">承認待ちの申請はありません。</p>
            ) : (
              <div className="border rounded-md overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="bg-muted">
                    <tr>
                      <th className="p-3 font-medium">申請者</th>
                      <th className="p-3 font-medium">日付</th>
                      <th className="p-3 font-medium">総時間</th>
                      <th className="p-3 font-medium">内訳</th>
                      <th className="p-3 font-medium text-right">操作</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {pendingList.map((g, idx) => (
                      <tr key={idx} className="hover:bg-muted/50">
                        <td className="p-3">{g.userName}</td>
                        <td className="p-3">{g.dateStr}</td>
                        <td className="p-3">{g.totalHours} h</td>
                        <td className="p-3 text-xs text-muted-foreground">
                          {g.details.map((d: string, i: number) => <div key={i}>{d}</div>)}
                        </td>
                        <td className="p-3 text-right space-x-2 whitespace-nowrap">
                          <form action={rejectWorkloads.bind(null, g.userId, g.dateStr)} className="inline">
                            <Button type="submit" variant="destructive" size="sm">却下</Button>
                          </form>
                          <form action={approveWorkloads.bind(null, g.userId, g.dateStr)} className="inline">
                            <Button type="submit" variant="default" size="sm">承認</Button>
                          </form>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>承認済み一覧 (Approved)</CardTitle>
            <CardDescription>直近の承認済みデータです。</CardDescription>
          </CardHeader>
          <CardContent>
            {approvedList.length === 0 ? (
               <p className="text-muted-foreground text-center py-8 border border-dashed rounded-lg">承認済みの申請はありません。</p>
            ) : (
              <div className="border rounded-md overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="bg-muted">
                    <tr>
                      <th className="p-3 font-medium">申請者</th>
                      <th className="p-3 font-medium">日付</th>
                      <th className="p-3 font-medium">総時間</th>
                      <th className="p-3 font-medium">内訳</th>
                      <th className="p-3 font-medium text-right">操作</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {approvedList.map((g, idx) => (
                      <tr key={idx} className="hover:bg-muted/50">
                        <td className="p-3">{g.userName}</td>
                        <td className="p-3">{g.dateStr}</td>
                        <td className="p-3">{g.totalHours} h</td>
                        <td className="p-3 text-xs text-muted-foreground">
                          {g.details.map((d: string, i: number) => <div key={i}>{d}</div>)}
                        </td>
                        <td className="p-3 text-right">
                          <form action={revokeApproval.bind(null, g.userId, g.dateStr)}>
                            <Button type="submit" variant="outline" size="sm">承認取り消し</Button>
                          </form>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
