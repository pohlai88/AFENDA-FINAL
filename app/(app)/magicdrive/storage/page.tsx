/**
 * @domain magicdrive
 * @layer ui
 * @responsibility MagicDrive storage page - storage management and analytics
 */

import type { Metadata } from "next"
import { Button } from "@afenda/shadcn"
import { Card, CardContent, CardHeader, CardTitle } from "@afenda/shadcn"
import { Progress } from "@afenda/shadcn"
import { HardDrive, Cloud, TrendingUp, Zap } from "lucide-react"

export const metadata: Metadata = {
  title: "Storage",
  description: "Manage your MagicDrive storage usage, limits, and plans",
}

export default function MagicdriveStoragePage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Storage</h1>
          <p className="text-muted-foreground">Manage your storage usage and limits</p>
        </div>
        <Button>
          <Zap className="mr-2 h-4 w-4" />
          Upgrade Storage
        </Button>
      </div>

      {/* Storage Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <HardDrive className="h-5 w-5" />
            Storage Overview
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>45.2 GB of 100 GB used</span>
              <span>45.2%</span>
            </div>
            <Progress value={45.2} className="h-3" />
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4">
            <div className="text-center">
              <p className="text-2xl font-bold">45.2 GB</p>
              <p className="text-sm text-muted-foreground">Used</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold">54.8 GB</p>
              <p className="text-sm text-muted-foreground">Available</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold">1,234</p>
              <p className="text-sm text-muted-foreground">Files</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold">89</p>
              <p className="text-sm text-muted-foreground">Shared</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Storage by Type */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Cloud className="h-5 w-5" />
              Storage by File Type
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm">Documents</span>
              <span className="text-sm font-medium">12.3 GB (27.2%)</span>
            </div>
            <Progress value={27.2} className="h-2" />
            
            <div className="flex items-center justify-between">
              <span className="text-sm">Images</span>
              <span className="text-sm font-medium">18.7 GB (41.4%)</span>
            </div>
            <Progress value={41.4} className="h-2" />
            
            <div className="flex items-center justify-between">
              <span className="text-sm">Videos</span>
              <span className="text-sm font-medium">10.2 GB (22.6%)</span>
            </div>
            <Progress value={22.6} className="h-2" />
            
            <div className="flex items-center justify-between">
              <span className="text-sm">Audio</span>
              <span className="text-sm font-medium">4.0 GB (8.8%)</span>
            </div>
            <Progress value={8.8} className="h-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Storage Plans
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="p-3 border rounded-lg">
              <div className="flex items-center justify-between mb-1">
                <span className="font-medium">Free Plan</span>
                <span className="text-sm text-muted-foreground">Current</span>
              </div>
              <p className="text-sm text-muted-foreground">5 GB Storage</p>
            </div>
            
            <div className="p-3 border rounded-lg">
              <div className="flex items-center justify-between mb-1">
                <span className="font-medium">Pro Plan</span>
                <span className="text-sm text-primary">$9.99/month</span>
              </div>
              <p className="text-sm text-muted-foreground">100 GB Storage</p>
            </div>
            
            <div className="p-3 border rounded-lg">
              <div className="flex items-center justify-between mb-1">
                <span className="font-medium">Enterprise</span>
                <span className="text-sm text-primary">$29.99/month</span>
              </div>
              <p className="text-sm text-muted-foreground">1 TB Storage</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
