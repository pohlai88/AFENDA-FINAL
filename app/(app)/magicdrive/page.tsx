/**
 * @domain magicdrive
 * @layer ui
 * @responsibility MagicDrive landing page dashboard with storage stats, quick actions, and file overview.
 * Server Component; uses shadcn Card, Progress, Button, Badge, Separator.
 */

import Link from "next/link"
import { routes } from "@afenda/shared/constants"
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Badge,
  Progress,
  Separator,
} from "@afenda/shadcn"
import {
  Folder,
  FileText,
  Image as ImageIcon,
  Music,
  Video,
  Archive,
  Share2,
  Clock,
  HardDrive,
  Upload,
  Plus,
  ArrowRight,
  File,
  Users,
  Download,
} from "lucide-react"

// Quick stats cards
const statsCards = [
  {
    title: "Total Files",
    value: "1,234",
    change: "+12%",
    icon: File,
    color: "text-blue-600",
  },
  {
    title: "Storage Used",
    value: "45.2 GB",
    change: "+5.2 GB",
    icon: HardDrive,
    color: "text-purple-600",
  },
  {
    title: "Shared Files",
    value: "89",
    change: "+8",
    icon: Share2,
    color: "text-green-600",
  },
  {
    title: "Recent Uploads",
    value: "23",
    change: "Today",
    icon: Clock,
    color: "text-orange-600",
  },
]

// File type cards
const fileTypeCards = [
  {
    title: "Documents",
    description: "PDFs, Word, Excel files",
    href: routes.ui.magicdrive.documents(),
    icon: FileText,
    count: "342",
    color: "bg-blue-100 text-blue-700",
  },
  {
    title: "Images",
    description: "Photos, graphics, designs",
    href: routes.ui.magicdrive.images(),
    icon: ImageIcon,
    count: "567",
    color: "bg-green-100 text-green-700",
  },
  {
    title: "Videos",
    description: "Movies, recordings, clips",
    href: routes.ui.magicdrive.videos(),
    icon: Video,
    count: "89",
    color: "bg-purple-100 text-purple-700",
  },
  {
    title: "Audio",
    description: "Music, podcasts, recordings",
    href: routes.ui.magicdrive.audio(),
    icon: Music,
    count: "123",
    color: "bg-pink-100 text-pink-700",
  },
  {
    title: "Archives",
    description: "ZIP, RAR, 7z files",
    href: routes.ui.magicdrive.archives(),
    icon: Archive,
    count: "45",
    color: "bg-yellow-100 text-yellow-700",
  },
  {
    title: "All Files",
    description: "Browse all your files",
    href: routes.ui.magicdrive.files(),
    icon: Folder,
    count: "1,234",
    color: "bg-gray-100 text-gray-700",
  },
]

// Quick actions
const quickActions = [
  {
    title: "Upload Files",
    description: "Add new files to your drive",
    icon: Upload,
    href: routes.ui.magicdrive.files(),
    primary: true,
  },
  {
    title: "Create Folder",
    description: "Organize files in folders",
    icon: Plus,
    href: routes.ui.magicdrive.files(),
    primary: false,
  },
  {
    title: "Share Files",
    description: "Collaborate with your team",
    icon: Users,
    href: routes.ui.magicdrive.shared(),
    primary: false,
  },
  {
    title: "View Storage",
    description: "Check your storage usage",
    icon: HardDrive,
    href: routes.ui.magicdrive.storage(),
    primary: false,
  },
]

export default function MagicdrivePage() {
  return (
    <div className="space-y-6">
      {/* Page header */}
      <header className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">MagicDrive</h1>
          <p className="text-muted-foreground">
            Manage your files with intelligent organization and seamless collaboration
          </p>
        </div>
        <Button asChild className="shrink-0">
          <Link href={routes.ui.magicdrive.files()}>
            <Upload className="mr-2 h-4 w-4" />
            Upload Files
          </Link>
        </Button>
      </header>

      <Separator className="my-6" />

      {/* Storage Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <HardDrive className="h-5 w-5" />
            Storage Overview
          </CardTitle>
          <CardDescription>
            Your current storage usage and allocation
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between text-sm">
              <span>45.2 GB of 100 GB used</span>
              <span className="text-muted-foreground">45.2%</span>
            </div>
            <Progress value={45.2} className="h-2" />
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-blue-600" />
                <span>Documents: 12.3 GB</span>
              </div>
              <div className="flex items-center gap-2">
                <ImageIcon className="h-4 w-4 text-green-600" aria-hidden />
                <span>Images: 18.7 GB</span>
              </div>
              <div className="flex items-center gap-2">
                <Video className="h-4 w-4 text-purple-600" />
                <span>Videos: 10.2 GB</span>
              </div>
              <div className="flex items-center gap-2">
                <Music className="h-4 w-4 text-pink-600" />
                <span>Audio: 4.0 GB</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Separator className="my-6" />

      {/* Stats Grid */}
      <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-4" aria-label="Storage statistics">
        {statsCards.map((stat) => {
          const Icon = stat.icon
          return (
            <Card key={stat.title}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {stat.title}
                </CardTitle>
                <Icon className={`h-4 w-4 ${stat.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-muted-foreground">
                  {stat.change} from last month
                </p>
              </CardContent>
            </Card>
          )
        })}
      </section>

      <Separator className="my-6" />

      {/* File Types Grid */}
      <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-3" aria-label="File types">
        {fileTypeCards.map((card) => {
          const _Icon = card.icon
          return (
            <Card key={card.title} className="hover:shadow-md transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {card.title}
                </CardTitle>
                <Badge variant="secondary" className={card.color}>
                  {card.count}
                </Badge>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground mb-3">
                  {card.description}
                </p>
                <Button variant="outline" size="sm" className="w-full" asChild>
                  <Link href={card.href}>
                    Browse
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          )
        })}
      </section>

      <Separator className="my-6" />

      {/* Quick Actions */}
      <section aria-labelledby="quick-actions-heading">
        <h2 id="quick-actions-heading" className="text-xl font-semibold mb-4">
          Quick Actions
        </h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {quickActions.map((action) => {
            const Icon = action.icon
            return (
              <Card 
                key={action.title} 
                className="hover:shadow-md transition-shadow cursor-pointer"
              >
                <Link href={action.href}>
                  <CardHeader className="text-center">
                    <Icon className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                    <CardTitle className="text-sm">{action.title}</CardTitle>
                    <CardDescription className="text-xs">
                      {action.description}
                    </CardDescription>
                  </CardHeader>
                </Link>
              </Card>
            )
          })}
        </div>
      </section>

      <Separator className="my-6" />

      {/* Recent Files Preview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Recent Files
            </span>
            <Button variant="outline" size="sm" asChild>
              <Link href={routes.ui.magicdrive.recent()}>
                View All
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <FileText className="h-8 w-8 text-blue-600" />
                  <div>
                    <p className="text-sm font-medium">Document-{i}.pdf</p>
                    <p className="text-xs text-muted-foreground">
                      Modified 2 hours ago • 2.3 MB
                    </p>
                  </div>
                </div>
                <Button variant="ghost" size="sm">
                  <Download className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
