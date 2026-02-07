"use client";

import { cn } from "../../lib/marketing.cn";

/**
 * Official Afenda Icon: Triangle compass with morphic E
 * Represents NexusCanon · AXIS brand identity
 */
export function AfendaIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 512 512"
      fill="none"
      className={cn(
        "inline-block shrink-0 max-w-full max-h-full min-w-0 min-h-0",
        className
      )}
      aria-hidden="true"
      role="img"
      preserveAspectRatio="xMidYMid meet"
    >
      {/* Main triangle - AXIS direction */}
      <path
        d="M256 64 L464 448 L48 448 Z"
        fill="currentColor"
        className="transition-colors duration-200"
      />
      {/* Three morphic E lines - properly centered and proportioned */}
      <rect
        x="160"
        y="288"
        width="192"
        height="28"
        rx="6"
        className="fill-background transition-colors duration-200"
      />
      <rect
        x="160"
        y="340"
        width="136"
        height="28"
        rx="6"
        className="fill-background transition-colors duration-200"
      />
      <rect
        x="160"
        y="392"
        width="192"
        height="28"
        rx="6"
        className="fill-background transition-colors duration-200"
      />
    </svg>
  );
}
