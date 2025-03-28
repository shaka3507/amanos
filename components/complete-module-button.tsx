"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { completeModule } from "@/app/prepare/[moduleId]/complete/actions"

interface CompleteModuleButtonProps {
  moduleId: string
}

export function CompleteModuleButton({ moduleId }: CompleteModuleButtonProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleComplete = async () => {
    setLoading(true)
    setError(null)

    try {
      const result = await completeModule(moduleId)
      if (!result.success) {
        throw new Error("Failed to complete module")
      }
    } catch (err: any) {
      setError(err.message || "Failed to complete module")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      <Button
        onClick={handleComplete}
        className="w-full bg-red-600 hover:bg-red-700 text-white"
        disabled={loading}
      >
        {loading ? "Completing..." : "Mark as Complete"}
      </Button>
    </div>
  )
} 