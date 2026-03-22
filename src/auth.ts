import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import Google from "next-auth/providers/google"
import { PrismaAdapter } from "@auth/prisma-adapter"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      allowDangerousEmailAccountLinking: true,
    }),
    Credentials({
// ... (omitted for brevity in replace_file_content, but I'll make sure the target content is correct)
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null

        const user = await prisma.user.findUnique({
          where: { email: credentials.email as string }
        })

        if (!user || !user.passwordHash) return null

        const passwordsMatch = await bcrypt.compare(
          credentials.password as string,
          user.passwordHash
        )

        if (passwordsMatch) {
          return { id: user.id, name: user.name, email: user.email, role: user.role }
        }

        return null
      }
    })
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      // 10人未満の小規模運用のためのホワイトリストチェック（DB参照）
      if (account?.provider === "google") {
        if (!user.email) return false

        // 管理者が事前に登録したユーザーのみログインを許可
        const existingUser = await prisma.user.findUnique({
          where: { email: user.email }
        })

        if (!existingUser) {
          return false // 登録されていないユーザーは拒否
        }
      }
      return true
    },
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.role = (user as any).role
        token.id = user.id
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.role = token.role as any
        session.user.id = token.id as string
      }
      return session
    }
  },
  pages: {
    signIn: "/login",
  }
})
