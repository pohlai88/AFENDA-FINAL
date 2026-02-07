#!/usr/bin/env node
/**
 * Replace @/lib/* imports in app/ with package imports per plan.
 * Run from repo root: node scripts/replace-lib-imports.mjs
 */
import { readFileSync, writeFileSync } from "fs"
import { join } from "path"
import { readdirSync, statSync as _statSync } from "fs"

const APP_DIR = join(process.cwd(), "app")
const replacements = [
  [/from ["']@\/lib\/routes["']/g, 'from "@afenda/shared/constants"'],
  [/from ['"]@\/lib\/routes['"]/g, "from \"@afenda/shared/constants\""],
  [/from ["']@\/lib\/utils["']/g, 'from "@afenda/shared/utils"'],
  [/from ["']@\/lib\/api\/client["']/g, 'from "@afenda/shared/query"'],
  [/from ["']@\/lib\/constants["']/g, 'from "@afenda/shared/constants"'],
  [/from ["']@\/lib\/constants\/auth["']/g, 'from "@afenda/shared/constants"'],
  [/from ["']@\/lib\/constants\/magicfolder["']/g, 'from "@afenda/shared/constants/magicfolder"'],
  [/from ["']@\/lib\/constants\/feature-flags["']/g, 'from "@afenda/shared/constants"'],
  [/from ["']@\/lib\/constants\/headers["']/g, 'from "@afenda/shared/constants"'],
  [/from ["']@\/lib\/config\/site["']/g, 'from "@afenda/shared/constants"'],
  [/from ["']@\/lib\/env\/public["']/g, 'from "@afenda/shared/env"'],
  [/from ["']@\/lib\/env\/server["']/g, 'from "@afenda/shared/env"'],
  [/from ["']@\/lib\/server\/only["']/g, 'from "@afenda/shared/server/only"'],
  [/from ["']@\/lib\/server\/logger["']/g, 'from "@afenda/shared/logger"'],
  [/from ["']@\/lib\/server\/db["']/g, 'from "@afenda/shared/db"'],
  [/from ["']@\/lib\/server\/base-url["']/g, 'from "@afenda/shared/server"'],
  [/from ["']@\/lib\/server\/api\/errors["']/g, 'from "@afenda/shared/server/errors"'],
  [/from ["']@\/lib\/server\/api\/response["']/g, 'from "@afenda/shared/server/response"'],
  [/from ["']@\/lib\/server\/api\/validate["']/g, 'from "@afenda/shared/server/validate"'],
  [/from ["']@\/lib\/server\/api\/cron-auth["']/g, 'from "@afenda/shared/server/cron-auth"'],
  [/from ["']@\/lib\/server\/base-url["']/g, 'from "@afenda/shared/server/base-url"'],
  [/from ["']@\/lib\/server\/tenant\/context["']/g, 'from "@afenda/tenancy/server"'],
  [/from ["']@\/lib\/shared\/modules["']/g, 'from "@afenda/shared/utils"'],
  [/from ["']@\/lib\/shared\/nl-parser["']/g, 'from "@afenda/shared/utils"'],
  [/from ["']@\/lib\/client\/hooks\/useAuth["']/g, 'from "@afenda/auth/hooks"'],
  [/from ["']@\/lib\/client\/hooks\/use-auth["']/g, 'from "@afenda/auth/hooks"'],
  [/from ["']@\/lib\/client\/hooks\/usePermissions["']/g, 'from "@afenda/shared/hooks"'],
  [/from ["']@\/lib\/client\/hooks\/useFeatureFlags["']/g, 'from "@afenda/shared/hooks"'],
  [/from ["']@\/lib\/client\/hooks\/use-token-refresh["']/g, 'from "@afenda/auth/hooks"'],
  [/from ["']@\/lib\/client\/hooks\/use-task-indicators["']/g, 'from "@afenda/shared/hooks"'],
  [/from ["']@\/lib\/client\/store\/tasks["']/g, 'from "@afenda/magictodo/zustand"'],
  [/from ["']@\/lib\/client\/store\/projects["']/g, 'from "@afenda/magictodo/zustand"'],
  [/from ["']@\/lib\/client\/store\/analytics["']/g, 'from "@afenda/shared/zustand"'],
  [/from ["']@\/lib\/client\/store\/magicfolder-enhanced["']/g, 'from "@afenda/magicfolder/zustand"'],
  [/from ["']@\/lib\/client\/clear-app-cache["']/g, 'from "@afenda/shared/client"'],
  [/from ["']@\/lib\/client\/export-to-file["']/g, 'from "@afenda/shared/client"'],
  [/from ["']@\/lib\/contracts\/tasks["']/g, 'from "@afenda/magictodo/zod"'],
  [/from ["']@\/lib\/contracts\/hierarchy["']/g, 'from "@afenda/magictodo/zod"'],
  [/from ["']@\/lib\/contracts\/custom-fields["']/g, 'from "@afenda/magictodo/zod"'],
  [/from ["']@\/lib\/contracts\/auth["']/g, 'from "@afenda/auth/zod"'],
  [/from ["']@\/lib\/contracts\/sessions["']/g, 'from "@afenda/auth/zod"'],
  [/from ["']@\/lib\/contracts\/analytics["']/g, 'from "@afenda/shared/zod"'],
  [/from ["']@\/lib\/contracts\/magicfolder["']/g, 'from "@afenda/magicfolder/zod"'],
]

function* walk(dir) {
  const entries = readdirSync(dir, { withFileTypes: true })
  for (const e of entries) {
    const full = join(dir, e.name)
    if (e.isDirectory() && e.name !== "node_modules") yield* walk(full)
    else if (e.isFile() && /\.(tsx?|jsx?|mjs)$/.test(e.name)) yield full
  }
}

let total = 0
for (const file of walk(APP_DIR)) {
  let content = readFileSync(file, "utf8")
  let changed = false
  for (const [re, replacement] of replacements) {
    const next = content.replace(re, replacement)
    if (next !== content) {
      content = next
      changed = true
    }
  }
  if (changed) {
    writeFileSync(file, content)
    total++
    console.log(file)
  }
}
console.log("Files updated:", total)
