"use client";

import Link from "next/link";

import { cn } from "../../lib/marketing.cn";
import { marketingSiteConfig } from "../../constant/marketing.site-config";
import { AfendaIcon } from "./afenda-icon";

/**
 * Marketing domain site logo component.
 * Uses Official Afenda Icon (Triangle compass with morphic E)
 */
export function MarketingSiteLogo({
  className,
  showText = true,
}: {
  className?: string;
  showText?: boolean;
}) {
  return (
    <Link
      href="/"
      className={cn("flex items-center gap-2 font-medium", className)}
    >
      <div className="bg-primary text-primary-foreground flex size-6 items-center justify-center rounded-md">
        <AfendaIcon className="size-4" />
      </div>
      {showText && <span>{marketingSiteConfig.name}</span>}
    </Link>
  );
}
