/**
 * @domain magicdrive
 * @layer page
 * @responsibility Hash audit: verify R2 object SHA-256 matches DB
 */

"use client"

import { useState } from "react"
import Link from "next/link"
import { routes } from "@afenda/shared/constants"
import { Button } from "@afenda/shadcn"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@afenda/shadcn"
import { Alert, AlertDescription, AlertTitle } from "@afenda/shadcn"
import { Badge } from "@afenda/shadcn"
import { Input } from "@afenda/shadcn"
import { ArrowLeft, ShieldCheck, AlertCircle, CheckCircle, Loader2 } from "lucide-react"

type AuditResult = {
  sampled: number
  checked: number
  matched: number
  mismatched: Array<{ versionId: string; objectId: string; expected: string; actual: string }>
  errors: Array<{ versionId: string; error: string }>
}

export default function AuditPage() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<AuditResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [sampleSize, setSampleSize] = useState(20)

  const handleSampleChange = (value: string) => {
    const n = Number(value)
    if (!Number.isNaN(n)) setSampleSize(Math.min(100, Math.max(1, n)))
  }

  const runAudit = async () => {
    setLoading(true)
    setError(null)
    setResult(null)
    try {
      const res = await fetch(
        `${routes.api.magicdrive.v1.auditHash()}?sample=${Math.min(100, Math.max(1, sampleSize))}`,
        { credentials: "include" }
      )
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data?.error?.message ?? "Audit failed")
      }
      const data = await res.json()
      setResult(data.data ?? null)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Audit failed")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container max-w-4xl py-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href={routes.ui.magicdrive.root()}>
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold">MagicDrive Audit</h1>
            <p className="text-muted-foreground">
              Verify stored objects match database (SHA-256 hash check)
            </p>
          </div>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5" />
            Hash audit
          </CardTitle>
          <CardDescription>
            Sample document versions, re-download from storage, and compare SHA-256 with the database.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="flex items-center gap-2">
            <label className="text-sm text-muted-foreground" htmlFor="sample">
              Sample size (1–100):
            </label>
            <Input
              id="sample"
              type="number"
              min={1}
              max={100}
              value={sampleSize}
              onChange={(e) => handleSampleChange(e.target.value)}
              className="w-20"
            />
            <Button onClick={runAudit} disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Running...
                </>
              ) : (
                "Run audit"
              )}
            </Button>
          </div>

          {result && (
            <div className="space-y-4 pt-4 border-t">
              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary">Sampled: {result.sampled}</Badge>
                <Badge variant="secondary">Checked: {result.checked}</Badge>
                <Badge variant="default" className="bg-emerald-600">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Matched: {result.matched}
                </Badge>
                {result.mismatched.length > 0 && (
                  <Badge variant="destructive">
                    <AlertCircle className="h-3 w-3 mr-1" />
                    Mismatched: {result.mismatched.length}
                  </Badge>
                )}
                {result.errors.length > 0 && (
                  <Badge variant="destructive">Errors: {result.errors.length}</Badge>
                )}
              </div>
              {result.mismatched.length > 0 && (
                <Alert variant="destructive">
                  <AlertTitle>Mismatches</AlertTitle>
                  <AlertDescription>
                    <ul className="list-disc pl-4 mt-2 space-y-1 text-sm">
                      {result.mismatched.map((m) => (
                        <li key={m.versionId}>
                          Version {m.versionId.slice(0, 8)}… — expected {m.expected.slice(0, 16)}…, got {m.actual.slice(0, 16)}…
                        </li>
                      ))}
                    </ul>
                  </AlertDescription>
                </Alert>
              )}
              {result.errors.length > 0 && (
                <Alert variant="destructive">
                  <AlertTitle>Errors</AlertTitle>
                  <AlertDescription>
                    <ul className="list-disc pl-4 mt-2 space-y-1 text-sm">
                      {result.errors.map((e) => (
                        <li key={e.versionId}>
                          {e.versionId.slice(0, 8)}…: {e.error}
                        </li>
                      ))}
                    </ul>
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
