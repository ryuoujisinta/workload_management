"use client"

import Link from "next/link"
import { buttonVariants } from "@/components/ui/button"
import { VariantProps } from "class-variance-authority"
import { ComponentProps } from "react"
import { cn } from "@/lib/utils"

type LinkButtonProps = ComponentProps<typeof Link> & VariantProps<typeof buttonVariants>

export function LinkButton({ className, variant, size, ...props }: LinkButtonProps) {
  return (
    <Link className={cn(buttonVariants({ variant, size, className }))} {...props} />
  )
}
