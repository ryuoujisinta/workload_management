"use client"

import { useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Upload } from "lucide-react"

interface ImportCSVButtonProps {
  action: (formData: FormData) => Promise<void>
  label?: string
}

export function ImportCSVButton({ action, label = "CSVで一括インポート" }: ImportCSVButtonProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isPending, setIsPending] = useState(false)

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsPending(true)
    const formData = new FormData()
    formData.append("file", file)

    try {
      await action(formData)
      alert("インポートが完了しました")
    } catch (error) {
      console.error("Import error:", error)
      alert("インポートに失敗しました")
    } finally {
      setIsPending(false)
      // Reset input
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    }
  }

  return (
    <>
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleUpload}
        accept=".csv"
        className="hidden"
      />
      <Button 
        variant="outline" 
        className="w-full" 
        onClick={() => fileInputRef.current?.click()}
        disabled={isPending}
      >
        <Upload className="mr-2 h-4 w-4" />
        {isPending ? "読み込み中..." : label}
      </Button>
    </>
  )
}
