import { cn as shadcnCn } from "@afenda/shadcn/lib/utils";

export const cn = shadcnCn;

// Client-side logger
export { logger, type LogContext } from "./client-logger";

export type ParsedTaskInput = {
  title: string;
  dueDate?: string;
  priority?: "low" | "medium" | "high" | "urgent";
  tags?: string[];
};

const PRIORITY_WORDS: Array<ParsedTaskInput["priority"]> = [
  "urgent",
  "high",
  "medium",
  "low",
];

const DATE_KEYWORDS: Record<string, () => Date> = {
  today: () => new Date(),
  tomorrow: () => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d;
  },
  "next week": () => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    return d;
  },
};

function formatDate(date: Date): string {
  return date.toISOString().split("T")[0] || date.toISOString();
}

/**
 * Minimal natural language parser for task input.
 * Extracts due date keywords, priority words, and #tags.
 */
export function parseNaturalLanguage(input: string): ParsedTaskInput {
  const working = input.trim();
  const tags = Array.from(working.matchAll(/#([\w-]+)/g)).map((m) => m[1]);

  const priority = PRIORITY_WORDS.find((word) =>
    new RegExp(`\\b${word}\\b`, "i").test(working)
  );

  let dueDate: string | undefined;
  const dateMatch = working.match(/\bby\s+(\d{4}-\d{2}-\d{2})\b/i);
  if (dateMatch?.[1]) {
    dueDate = dateMatch[1];
  } else {
    for (const [keyword, resolver] of Object.entries(DATE_KEYWORDS)) {
      if (new RegExp(`\\b${keyword}\\b`, "i").test(working)) {
        dueDate = formatDate(resolver());
        break;
      }
    }
  }

  const title = working
    .replace(/\bby\s+\d{4}-\d{2}-\d{2}\b/gi, "")
    .replace(/\b(today|tomorrow|next week)\b/gi, "")
    .replace(/#([\w-]+)/g, "")
    .replace(new RegExp(`\\b(${PRIORITY_WORDS.join("|")})\\b`, "gi"), "")
    .replace(/\s+/g, " ")
    .trim();

  return {
    title: title.length > 0 ? title : working,
    dueDate,
    priority,
    tags: tags.length ? tags : undefined,
  };
}
