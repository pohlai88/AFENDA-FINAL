/**
 * @domain magictodo
 * @layer ui
 * @responsibility MagicTodo settings page with links to configuration
 */

import Link from "next/link"
import { routes } from "@afenda/shared/constants"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@afenda/shadcn"
import {
  Columns3,
  Bell,
  Timer,
  Palette,
  ArrowRight,
} from "lucide-react"

const settingsCards = [
  {
    title: "Custom Fields",
    description: "Define custom fields for your tasks with various types like text, number, date, and more.",
    href: routes.ui.magictodo.settingsCustomFields(),
    icon: Columns3,
  },
  {
    title: "Notifications",
    description: "Configure how and when you receive task reminders and updates.",
    href: "#",
    icon: Bell,
    disabled: true,
  },
  {
    title: "Focus Mode",
    description: "Customize your focus session settings, break times, and daily goals.",
    href: "#",
    icon: Timer,
    disabled: true,
  },
  {
    title: "Appearance",
    description: "Personalize the look and feel of your task views and cards.",
    href: "#",
    icon: Palette,
    disabled: true,
  },
]

export default function MagictodoSettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">
          Configure your MagicTodo experience
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {settingsCards.map((card) => {
          const Icon = card.icon
          const content = (
            <Card
              className={`transition-all ${
                card.disabled
                  ? "cursor-not-allowed opacity-60"
                  : "cursor-pointer hover:shadow-md"
              }`}
            >
              <CardHeader className="pb-2">
                <div className="mb-2 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                  <Icon className="h-5 w-5" />
                </div>
                <CardTitle className="flex items-center justify-between text-base">
                  {card.title}
                  {!card.disabled && (
                    <ArrowRight className="h-4 w-4 opacity-50" />
                  )}
                  {card.disabled && (
                    <span className="text-xs font-normal text-muted-foreground">
                      Coming Soon
                    </span>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>{card.description}</CardDescription>
              </CardContent>
            </Card>
          )

          if (card.disabled) {
            return <div key={card.title}>{content}</div>
          }

          return (
            <Link key={card.title} href={card.href}>
              {content}
            </Link>
          )
        })}
      </div>
    </div>
  )
}
