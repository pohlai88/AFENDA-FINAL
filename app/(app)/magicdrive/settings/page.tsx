/**
 * @domain magicdrive
 * @layer ui
 * @responsibility MagicDrive settings page - domain settings and preferences
 */

"use client"

import { Button } from "@afenda/shadcn"
import { Card, CardContent, CardHeader, CardTitle } from "@afenda/shadcn"
import { Switch } from "@afenda/shadcn"
import { Label } from "@afenda/shadcn"
import { Separator } from "@afenda/shadcn"
import { Settings, Bell, Lock, Download, Trash2 } from "lucide-react"

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
          <p className="text-muted-foreground">Manage your MagicDrive preferences</p>
        </div>
      </div>

      {/* General Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            General Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label>Default View</Label>
              <p className="text-sm text-muted-foreground">Choose your default file view</p>
            </div>
            <select className="px-3 py-2 border rounded-md">
              <option>List View</option>
              <option>Grid View</option>
            </select>
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div>
              <Label>Language</Label>
              <p className="text-sm text-muted-foreground">Select your preferred language</p>
            </div>
            <select className="px-3 py-2 border rounded-md">
              <option>English</option>
              <option>Spanish</option>
              <option>French</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Notifications */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notifications
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label>Email Notifications</Label>
              <p className="text-sm text-muted-foreground">Receive email updates about your files</p>
            </div>
            <Switch />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div>
              <Label>Share Notifications</Label>
              <p className="text-sm text-muted-foreground">Get notified when files are shared with you</p>
            </div>
            <Switch defaultChecked />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div>
              <Label>Storage Alerts</Label>
              <p className="text-sm text-muted-foreground">Alert when storage is running low</p>
            </div>
            <Switch defaultChecked />
          </div>
        </CardContent>
      </Card>

      {/* Privacy & Security */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5" />
            Privacy & Security
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label>Two-Factor Authentication</Label>
              <p className="text-sm text-muted-foreground">Add an extra layer of security</p>
            </div>
            <Button variant="outline" size="sm">Enable</Button>
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div>
              <Label>Default Share Permission</Label>
              <p className="text-sm text-muted-foreground">Default permission when sharing files</p>
            </div>
            <select className="px-3 py-2 border rounded-md">
              <option>View Only</option>
              <option>Can Edit</option>
              <option>Can Comment</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Data Management */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Data Management
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label>Export Data</Label>
              <p className="text-sm text-muted-foreground">Download all your files and data</p>
            </div>
            <Button variant="outline" size="sm">
              <Download className="mr-2 h-4 w-4" />
              Export
            </Button>
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div>
              <Label>Delete Account</Label>
              <p className="text-sm text-destructive">Permanently delete your account and all data</p>
            </div>
            <Button variant="destructive" size="sm">
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
