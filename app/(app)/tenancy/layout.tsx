/**
 * Tenancy domain layout. Secondary nav + children.
 *
 * @domain tenancy
 * @layer route-ui
 */

import type { Metadata } from "next";
import { routes } from "@afenda/shared/constants";
import Link from "next/link";
import { IconBuilding, IconUsers, IconUserCircle } from "@tabler/icons-react";

export const metadata: Metadata = {
  title: { template: "%s | Tenancy", default: "Tenancy - Multi-tenancy Governance" },
  description: "Manage organizations, teams, and memberships.",
  robots: { index: false, follow: false },
};

const navItems = [
  { href: routes.ui.tenancy.organizations.list(), label: "Organizations", icon: IconBuilding },
  { href: routes.ui.tenancy.teams.list(), label: "Teams", icon: IconUsers },
  { href: routes.ui.tenancy.memberships(), label: "Memberships", icon: IconUserCircle },
];

export default function TenancyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-6">
      <nav className="flex gap-2 border-b pb-2">
        {navItems.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <Icon className="h-4 w-4" />
            {label}
          </Link>
        ))}
      </nav>
      {children}
    </div>
  );
}
