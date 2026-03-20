import "next-auth"
import "next-auth/jwt"

// role の型定義を一箇所に集約
interface AuthFields {
  role: "ADMIN" | "USER"
}

declare module "next-auth" {
  interface User extends AuthFields {
    id: string
  }

  interface Session {
    user: User
  }
}

declare module "next-auth/jwt" {
  interface JWT extends AuthFields {
    // NextAuth ベースの JWT は id?: string (optional) のため
    // optional を上書きするために直接宣言する
    id: string
  }
}
