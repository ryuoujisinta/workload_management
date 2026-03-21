"use client"

import { Button, ButtonProps } from "@/components/ui/button"
import { ReactNode } from "react"

interface DeleteButtonProps extends ButtonProps {
  formAction: (formData: FormData) => void | Promise<void>
  confirmMessage?: string
  children: ReactNode
}

export function DeleteButton({ 
  formAction, 
  confirmMessage = "本当に削除しますか？\nこの操作は取り消せません。関連するタスクもすべて削除されます。", 
  children,
  ...props 
}: DeleteButtonProps) {
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    if (!window.confirm(confirmMessage)) {
      e.preventDefault()
    }
  }

  return (
    <form action={formAction} onSubmit={handleSubmit} className="inline">
      <Button type="submit" {...props}>
        {children}
      </Button>
    </form>
  )
}
