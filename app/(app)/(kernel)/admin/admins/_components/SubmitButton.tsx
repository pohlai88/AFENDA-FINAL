"use client";

/**
 * Submit Button with useFormStatus
 * Disables during pending for form feedback.
 */

import { useFormStatus } from "react-dom";
import { Button } from "@afenda/shadcn";

interface SubmitButtonProps {
  children: React.ReactNode;
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
  className?: string;
}

export function SubmitButton({ children, variant = "default", className }: SubmitButtonProps) {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" variant={variant} disabled={pending} className={className}>
      {pending ? "Saving…" : children}
    </Button>
  );
}
