import { pipeString, pipeInt } from "./_zod.pipeline";

export const zTitle = pipeString()
  .trim()
  .singleLine()
  .collapseSpaces()
  .min(1)
  .max(200)
  .schema();

export const zPage = pipeInt().clamp(1, 1_000_000, 1).default(1).schema();
