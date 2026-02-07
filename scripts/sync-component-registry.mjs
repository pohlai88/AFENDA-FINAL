#!/usr/bin/env node
/**
 * @file sync-component-registry.mjs
 * @description Auto-generates component-registry.json by scanning the shadcn-components package
 * @usage pnpm run sync:registry (runs automatically on postinstall)
 */

import { readdir, readFile, writeFile, stat as _stat } from "fs/promises"
import { join, basename, extname } from "path"
import { fileURLToPath } from "url"
import { dirname } from "path"

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const SHADCN_ROOT = join(__dirname, "..", "packages", "shadcn-components")
const SRC_DIR = join(SHADCN_ROOT, "src")
const OUTPUT_FILE = join(SHADCN_ROOT, "component-registry.json")

/**
 * Extract export names from a TypeScript/TSX file
 */
async function extractExports(filePath) {
  try {
    const content = await readFile(filePath, "utf-8")
    const exports = []

    // Match: export function Name, export const Name, export { Name }
    const functionExports = content.matchAll(/export\s+(?:async\s+)?function\s+(\w+)/g)
    const constExports = content.matchAll(/export\s+const\s+(\w+)/g)
    const namedExports = content.matchAll(/export\s+\{\s*([^}]+)\s*\}/g)
    const defaultExports = content.matchAll(/export\s+default\s+(?:function\s+)?(\w+)/g)
    const typeExports = content.matchAll(/export\s+(?:type|interface)\s+(\w+)/g)

    for (const match of functionExports) exports.push({ name: match[1], kind: "function" })
    for (const match of constExports) exports.push({ name: match[1], kind: "const" })
    for (const match of defaultExports) exports.push({ name: match[1], kind: "default" })
    for (const match of typeExports) exports.push({ name: match[1], kind: "type" })
    
    for (const match of namedExports) {
      const names = match[1].split(",").map(n => n.trim().split(/\s+as\s+/).pop().trim())
      names.forEach(name => {
        if (name && !exports.some(e => e.name === name)) {
          exports.push({ name, kind: "named" })
        }
      })
    }

    return exports.filter(e => e.name && !e.name.startsWith("_"))
  } catch {
    return []
  }
}

/**
 * Categorize a component based on its name
 */
function categorizeComponent(name) {
  const categories = {
    layout: ["Card", "AspectRatio", "Separator", "ScrollArea", "Collapsible", "Sidebar", "Sheet", "Drawer", "BentoGrid"],
    form: ["Input", "Textarea", "Select", "Checkbox", "RadioGroup", "Switch", "Slider", "Form", "Field", "Label", "Combobox", "DatePicker", "PasswordInput", "InputOTP", "NativeSelect"],
    action: ["Button", "ButtonGroup", "Toggle", "ToggleGroup"],
    navigation: ["Breadcrumb", "NavigationMenu", "Menubar", "Tabs", "Pagination", "DropdownMenu", "ContextMenu", "Command"],
    feedback: ["Alert", "AlertDialog", "Dialog", "Sonner", "Tooltip", "HoverCard", "Popover", "Progress", "Skeleton", "Spinner", "Empty"],
    display: ["Avatar", "Badge", "Calendar", "Carousel", "Chart", "Table", "Accordion", "Kbd", "Item"],
    effect: ["BorderBeam", "DotPattern", "RetroGrid", "ShimmerButton", "NumberTicker"],
  }

  for (const [category, components] of Object.entries(categories)) {
    if (components.some(c => name.includes(c))) return category
  }
  return "misc"
}

/**
 * Check if a file is a component file (not index, not types only)
 */
function isComponentFile(filename) {
  const name = basename(filename)
  return (
    (name.endsWith(".tsx") || name.endsWith(".ts")) &&
    !name.startsWith("index") &&
    !name.endsWith(".d.ts") &&
    !name.startsWith("_")
  )
}

/**
 * Scan a directory for components
 */
async function scanDirectory(dir, relativePath = "") {
  const components = []
  
  try {
    const entries = await readdir(dir, { withFileTypes: true })
    
    for (const entry of entries) {
      const fullPath = join(dir, entry.name)
      const relPath = relativePath ? `${relativePath}/${entry.name}` : entry.name
      
      if (entry.isDirectory() && !entry.name.startsWith(".")) {
        // Skip subdirectories that have their own barrel exports
        continue
      }
      
      if (entry.isFile() && isComponentFile(entry.name)) {
        const exports = await extractExports(fullPath)
        const componentExports = exports.filter(e => 
          e.kind !== "type" && 
          e.name[0] === e.name[0].toUpperCase() // PascalCase = component
        )
        
        if (componentExports.length > 0) {
          const modulePath = `./${basename(entry.name, extname(entry.name))}`
          
          for (const exp of componentExports) {
            components.push({
              name: exp.name,
              path: modulePath,
              file: relPath,
              category: categorizeComponent(exp.name),
              kind: exp.kind,
            })
          }
        }
      }
    }
  } catch (error) {
    console.warn(`Warning: Could not scan ${dir}:`, error.message)
  }
  
  return components
}

/**
 * Scan hooks directory
 */
async function scanHooks(dir) {
  const hooks = []
  
  try {
    const entries = await readdir(dir, { withFileTypes: true })
    
    for (const entry of entries) {
      if (entry.isFile() && entry.name.startsWith("use-") && entry.name.endsWith(".ts")) {
        const fullPath = join(dir, entry.name)
        const exports = await extractExports(fullPath)
        
        for (const exp of exports) {
          if (exp.name.startsWith("use") && exp.kind === "function") {
            hooks.push({
              name: exp.name,
              path: `./hooks/${basename(entry.name, ".ts")}`,
              file: `hooks/${entry.name}`,
              description: await extractDescription(fullPath, exp.name),
            })
          }
        }
      }
    }
  } catch (error) {
    console.warn(`Warning: Could not scan hooks:`, error.message)
  }
  
  return hooks
}

/**
 * Extract JSDoc description for a function
 */
async function extractDescription(filePath, functionName) {
  try {
    const content = await readFile(filePath, "utf-8")
    const regex = new RegExp(`\\/\\*\\*([\\s\\S]*?)\\*\\/\\s*export\\s+(?:async\\s+)?function\\s+${functionName}`)
    const match = content.match(regex)
    
    if (match) {
      const jsdoc = match[1]
      const descMatch = jsdoc.match(/@description\s+(.+)|^\s*\*\s+([^@\n]+)/m)
      if (descMatch) return (descMatch[1] || descMatch[2]).trim()
    }
    
    // Fallback: use file header description
    const headerMatch = content.match(/@responsibility\s+(.+)/)
    if (headerMatch) return headerMatch[1].trim()
    
    return ""
  } catch {
    return ""
  }
}

/**
 * Scan blocks directory
 */
async function scanBlocks(dir) {
  const blocks = []
  
  try {
    const entries = await readdir(dir, { withFileTypes: true })
    
    for (const entry of entries) {
      if (entry.isFile() && isComponentFile(entry.name) && !entry.name.includes("button") && !entry.name.includes("input")) {
        const fullPath = join(dir, entry.name)
        const exports = await extractExports(fullPath)
        
        const componentExports = exports.filter(e => 
          e.kind !== "type" && 
          e.name[0] === e.name[0].toUpperCase()
        )
        
        for (const exp of componentExports) {
          // Skip internal primitives (button, input, etc. copied for blocks)
          const isInternal = ["Button", "Input", "Label", "Select", "Checkbox", "Card", "Separator", "Popover"].includes(exp.name)
          if (isInternal) continue
          
          blocks.push({
            name: exp.name,
            path: `./blocks/${basename(entry.name, extname(entry.name))}`,
            file: `blocks/${entry.name}`,
            category: categorizeBlock(exp.name),
          })
        }
      }
    }
  } catch (error) {
    console.warn(`Warning: Could not scan blocks:`, error.message)
  }
  
  return blocks
}

/**
 * Categorize a block based on its name
 */
function categorizeBlock(name) {
  if (name.includes("Nav") || name.includes("Sidebar") || name.includes("Header")) return "navigation"
  if (name.includes("Login") || name.includes("Signup") || name.includes("OTP") || name.includes("Auth")) return "auth"
  if (name.includes("Chart")) return "chart"
  if (name.includes("Calendar") || name.includes("Date")) return "calendar"
  if (name.includes("Table") || name.includes("Data")) return "data"
  if (name.includes("Form") || name.includes("Editor")) return "form"
  if (name.includes("Theme") || name.includes("Settings")) return "settings"
  return "layout"
}

/**
 * Scan custom components directory
 */
async function scanCustom(dir) {
  const custom = []
  
  try {
    const entries = await readdir(dir, { withFileTypes: true })
    
    for (const entry of entries) {
      if (entry.isFile() && isComponentFile(entry.name)) {
        const fullPath = join(dir, entry.name)
        const exports = await extractExports(fullPath)
        
        const componentExports = exports.filter(e => 
          e.kind !== "type" && 
          e.name[0] === e.name[0].toUpperCase()
        )
        
        for (const exp of componentExports) {
          custom.push({
            name: exp.name,
            path: `./custom/${basename(entry.name, extname(entry.name))}`,
            file: `custom/${entry.name}`,
            category: categorizeComponent(exp.name),
          })
        }
      }
    }
  } catch (error) {
    console.warn(`Warning: Could not scan custom:`, error.message)
  }
  
  return custom
}

/**
 * Read package.json for version info
 */
async function getPackageInfo() {
  try {
    const pkgPath = join(SHADCN_ROOT, "package.json")
    const content = await readFile(pkgPath, "utf-8")
    return JSON.parse(content)
  } catch {
    return { name: "@afenda/shadcn", version: "0.0.0" }
  }
}

/**
 * Main function
 */
async function main() {
  console.log("🔍 Scanning shadcn-components for registry sync...")
  
  const pkg = await getPackageInfo()
  
  // Scan all directories
  const [primitives, hooks, custom, blocks] = await Promise.all([
    scanDirectory(SRC_DIR),
    scanHooks(join(SRC_DIR, "hooks")),
    scanCustom(join(SRC_DIR, "custom")),
    scanBlocks(join(SRC_DIR, "blocks")),
  ])
  
  // Build registry
  const registry = {
    $schema: "./component-registry.schema.json",
    name: pkg.name,
    version: pkg.version,
    generatedAt: new Date().toISOString(),
    stats: {
      primitives: primitives.length,
      hooks: hooks.length,
      custom: custom.length,
      blocks: blocks.length,
      total: primitives.length + hooks.length + custom.length + blocks.length,
    },
    exports: pkg.exports || {},
    components: {
      primitives: primitives.sort((a, b) => a.name.localeCompare(b.name)),
      hooks: hooks.sort((a, b) => a.name.localeCompare(b.name)),
      custom: custom.sort((a, b) => a.name.localeCompare(b.name)),
      blocks: blocks.sort((a, b) => a.name.localeCompare(b.name)),
    },
  }
  
  // Write registry
  await writeFile(OUTPUT_FILE, JSON.stringify(registry, null, 2) + "\n", "utf-8")
  
  console.log(`✅ Registry synced: ${OUTPUT_FILE}`)
  console.log(`   📦 ${registry.stats.primitives} primitives`)
  console.log(`   🪝 ${registry.stats.hooks} hooks`)
  console.log(`   🎨 ${registry.stats.custom} custom components`)
  console.log(`   🧱 ${registry.stats.blocks} blocks`)
  console.log(`   📊 ${registry.stats.total} total exports`)
}

main().catch(error => {
  console.error("❌ Registry sync failed:", error)
  process.exit(1)
})
