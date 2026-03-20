import "next-auth"

declare module "next-auth" {
  interface User {
    id: string
    role: "ADMIN" | "USER"
  }

  interface Session {
    user: User
  }
}
