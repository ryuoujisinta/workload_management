"use client"

import { useState } from "react"
import { Button, type ButtonProps } from "@/components/ui/button"

type ProjectStatsCsvButtonProps = ButtonProps & {
  url: string
}

type SaveFilePickerOptions = {
  suggestedName?: string
  types?: Array<{
    description?: string
    accept: Record<string, string[]>
  }>
}

type SaveFilePickerHandle = {
  createWritable: () => Promise<{
    write: (data: Blob) => Promise<void>
    close: () => Promise<void>
  }>
}

type WindowWithSavePicker = Window & {
  showSaveFilePicker?: (options?: SaveFilePickerOptions) => Promise<SaveFilePickerHandle>
}

function getFilenameFromDisposition(contentDisposition: string | null): string | null {
  if (!contentDisposition) {
    return null
  }

  const utf8Match = contentDisposition.match(/filename\*=UTF-8''([^;]+)/i)
  if (utf8Match) {
    return decodeURIComponent(utf8Match[1])
  }

  const filenameMatch = contentDisposition.match(/filename="([^"]+)"/i)
  if (filenameMatch) {
    return filenameMatch[1]
  }

  return null
}

async function downloadWithAnchor(blob: Blob, filename: string) {
  const blobUrl = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = blobUrl
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(blobUrl)
}

export function ProjectStatsCsvButton({ url, children, ...props }: ProjectStatsCsvButtonProps) {
  const [isPending, setIsPending] = useState(false)

  const handleClick = async () => {
    setIsPending(true)

    try {
      const response = await fetch(url, { method: "GET" })
      if (!response.ok) {
        throw new Error(`Failed to download CSV: ${response.status}`)
      }

      const blob = await response.blob()
      const filename = getFilenameFromDisposition(response.headers.get("Content-Disposition")) ?? "project-stats.csv"
      const pickerWindow = window as WindowWithSavePicker

      if (pickerWindow.showSaveFilePicker) {
        const handle = await pickerWindow.showSaveFilePicker({
          suggestedName: filename,
          types: [
            {
              description: "CSV files",
              accept: { "text/csv": [".csv"] },
            },
          ],
        })

        const writable = await handle.createWritable()
        await writable.write(blob)
        await writable.close()
        return
      }

      await downloadWithAnchor(blob, filename)
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        return
      }

      console.error("CSV download error:", error)
      window.alert("CSVのダウンロードに失敗しました")
    } finally {
      setIsPending(false)
    }
  }

  return (
    <Button type="button" onClick={handleClick} disabled={isPending} {...props}>
      {isPending ? "CSV準備中..." : children}
    </Button>
  )
}
