import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { createUser, deleteUser } from "@/actions/admin-users"

export default async function AdminUsersPage() {
  const session = await auth()
  if (session?.user?.role !== "ADMIN") {
    redirect("/")
  }

  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" }
  })

  return (
    <div className="container mx-auto p-4 md:p-8 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">ユーザー管理</h1>
          <p className="text-muted-foreground">システムを利用するユーザーの一覧と登録を行います。</p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-[1fr_300px]">
        <Card className="order-2 md:order-1">
          <CardHeader>
            <CardTitle>ユーザー一覧</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="border rounded-md overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-muted">
                  <tr>
                    <th className="p-3 font-medium">名前</th>
                    <th className="p-3 font-medium">メールアドレス</th>
                    <th className="p-3 font-medium">権限</th>
                    <th className="p-3 font-medium text-right">操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {users.map((u) => (
                    <tr key={u.id} className="hover:bg-muted/50 transition-colors">
                      <td className="p-3">{u.name}</td>
                      <td className="p-3">{u.email}</td>
                      <td className="p-3">{u.role === "ADMIN" ? "管理者" : "一般"}</td>
                      <td className="p-3 text-right">
                        {session.user.id !== u.id && (
                          <form action={deleteUser.bind(null, u.id)} className="inline">
                            <Button type="submit" variant="destructive" size="sm">削除</Button>
                          </form>
                        )}
                      </td>
                    </tr>
                  ))}
                  {users.length === 0 && (
                    <tr>
                      <td colSpan={4} className="p-3 text-center text-muted-foreground">登録されているユーザーはいません。</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        <Card className="order-1 md:order-2 h-fit">
          <CardHeader>
            <CardTitle>新規ユーザー登録</CardTitle>
          </CardHeader>
          <CardContent>
            <form action={createUser} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">氏名</Label>
                <Input id="name" name="name" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">メールアドレス</Label>
                <Input id="email" name="email" type="email" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="role">権限</Label>
                <select id="role" name="role" className="w-full border rounded-md px-3 h-10 text-sm bg-background cursor-pointer" required>
                  <option value="USER">一般ユーザー</option>
                  <option value="ADMIN">管理者</option>
                </select>
              </div>
              <div className="pt-2">
                <Button type="submit" className="w-full">登録する</Button>
                <p className="text-xs text-muted-foreground text-center mt-2">※パスワードは一律 password123 で発行されます</p>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
