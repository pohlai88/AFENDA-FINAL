#!/usr/bin/env node

/**
 * Validate Neon Auth Developer Credentials
 * 
 * This script validates that all required Neon Auth environment variables
 * are properly configured for development.
 * 
 * Usage:
 *   node scripts/validate-neon-auth-credentials.mjs
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const projectRoot = path.resolve(__dirname, '..')

// ANSI color codes
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  gray: '\x1b[90m',
}

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`)
}

function separator() {
  log('─'.repeat(80), 'gray')
}

function success(message) {
  log(`✅ ${message}`, 'green')
}

function error(message) {
  log(`❌ ${message}`, 'red')
}

function warning(message) {
  log(`⚠️  ${message}`, 'yellow')
}

function info(message) {
  log(`ℹ️  ${message}`, 'blue')
}

function header(message) {
  separator()
  log(message, 'cyan')
  separator()
}

// Load environment variables
function loadEnv(filePath) {
  if (!fs.existsSync(filePath)) {
    return {}
  }

  const content = fs.readFileSync(filePath, 'utf-8')
  const env = {}

  content.split('\n').forEach((line) => {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) return

    const [key, ...valueParts] = trimmed.split('=')
    if (key) {
      env[key] = valueParts.join('=').replace(/^["']|["']$/g, '')
    }
  })

  return env
}

/**
 * Load env vars from .env (single env file for this project).
 * process.env (shell/CI) overrides file values.
 */
function loadProjectEnv() {
  const fromFile = loadEnv(path.join(projectRoot, ".env"))
  return { ...fromFile, ...process.env }
}

// Required variables for Neon Auth (current repo contract)
const REQUIRED_VARS = {
  NEON_AUTH_BASE_URL: {
    description: 'Neon Auth base URL',
    pattern: /^https:\/\//,
  },
  NEON_AUTH_COOKIE_SECRET: {
    description: 'Cookie secret for Neon Auth session management',
  },
}

// Optional variables (only required for specific features/workflows)
const OPTIONAL_VARS = {
  DATABASE_URL: {
    description: 'PostgreSQL connection string (required for DB access/migrations)',
    pattern: /^postgres(ql)?:\/\//,
  },
  NEON_PROJECT_ID: {
    description: 'Neon project ID (optional)',
  },
  NEON_BRANCH_ID: {
    description: 'Neon branch ID (optional)',
  },
  NEON_DATA_API_URL: {
    description: 'Neon Data API base URL (optional; only if using the Data API client)',
    pattern: /^https:\/\//,
  },
  NEXT_PUBLIC_APP_URL: {
    description: 'Public app base URL (optional)',
    pattern: /^https?:\/\//,
  },
  NEXT_PUBLIC_NEON_AUTH_URL: {
    description: 'Public Neon Auth URL (optional)',
    pattern: /^https?:\/\//,
  },
  NEON_API_KEY: {
    description: 'Neon API key for CLI operations (optional)',
  },
}

const OAUTH_VARS = {
  GOOGLE_CLIENT_ID: {
    description: 'Google OAuth 2.0 Client ID',
  },
  GOOGLE_CLIENT_SECRET: {
    description: 'Google OAuth 2.0 Client Secret',
  },
  GITHUB_ID: {
    description: 'GitHub OAuth App ID',
  },
  GITHUB_SECRET: {
    description: 'GitHub OAuth App Secret',
  },
}

// Validate URL pattern
function validateUrl(url, pattern) {
  if (!url) return false
  return pattern ? pattern.test(url) : /^https?:\/\//.test(url)
}

async function validateDatabaseConnection(dbUrl) {
  try {
    const postgres = (await import('postgres')).default
    const sql = postgres(dbUrl, { max: 1, idle_timeout: 5 })
    try {
      await sql`SELECT 1 as ok;`
      return true
    } finally {
      await sql.end({ timeout: 5 })
    }
  } catch (error) {
    console.error('Database connection error:', error?.message ?? String(error))
    return false
  }
}

async function fetchWithTimeout(url, init, timeoutMs) {
  const controller = new AbortController()
  const t = setTimeout(() => controller.abort(), timeoutMs)
  try {
    return await fetch(url, { ...init, signal: controller.signal })
  } finally {
    clearTimeout(t)
  }
}

// Validate Neon Auth endpoint (via JWKS reachability)
async function validateNeonAuthEndpoints(baseUrl) {
  try {
    const response = await fetchWithTimeout(`${baseUrl}/.well-known/jwks.json`, {
      method: 'GET',
      headers: { 'User-Agent': 'neon-auth-validator/1.0' },
    }, 5000)

    if (!response.ok) return false
    const data = await response.json().catch(() => null)
    return Boolean(data && data.keys && Array.isArray(data.keys) && data.keys.length > 0)
  } catch {
    return false
  }
}

// Main validation function
async function validateNeonAuthCredentials() {
  const env = loadProjectEnv()

  header('NEON AUTH DEVELOPER CREDENTIALS VALIDATION')

  let allValid = true
  const results = {
    required: { valid: [], invalid: [], missing: [] },
    optional: { valid: [], configured: [], missing: [] },
    oauth: { valid: [], configured: [], missing: [] },
    endpoints: { valid: [], invalid: [] },
  }

  // Validate required variables
  log('\n📋 Checking Required Variables:', 'cyan')
  separator()

  for (const [key, config] of Object.entries(REQUIRED_VARS)) {
    const value = env[key]

    if (!value) {
      error(`${key} - NOT SET`)
      results.required.missing.push(key)
      allValid = false
    } else if (config.pattern && !validateUrl(value, config.pattern)) {
      warning(`${key} - INVALID FORMAT`)
      console.log(`   Expected pattern: ${config.pattern}`)
      console.log(`   Got: ${value.substring(0, 80)}...`)
      results.required.invalid.push(key)
      allValid = false
    } else {
      success(`${key} - ${config.description}`)
      results.required.valid.push(key)
    }
  }

  // Validate optional variables
  log('\n⚙️  Checking Optional Variables:', 'cyan')
  separator()

  for (const [key, _config] of Object.entries(OPTIONAL_VARS)) {
    const value = env[key]

    if (value) {
      success(`${key} - Configured`)
      results.optional.configured.push(key)
    } else {
      info(`${key} - Not configured (optional)`)
      results.optional.missing.push(key)
    }
  }

  // Validate OAuth configuration
  log('\n🔐 Checking OAuth Configuration:', 'cyan')
  separator()

  const configuredOAuth = []
  const _missingOAuth = []

  for (const [key, _config] of Object.entries(OAUTH_VARS)) {
    const value = env[key]

    if (value) {
      // Show only first/last few characters for secrets
      const masked =
        key.includes('SECRET') || key.includes('PRIVATE')
          ? value.substring(0, 4) + '...' + value.substring(value.length - 4)
          : value.substring(0, 20) + '...'

      success(`${key} - ${masked}`)
      configuredOAuth.push(key)
      results.oauth.configured.push(key)
    } else {
      warning(`${key} - Not configured`)
      results.oauth.missing.push(key)
    }
  }

  // Validate endpoints (async operations)
  if (env.NEON_AUTH_BASE_URL || env.DATABASE_URL) {
    log('\n🌐 Checking Endpoint Accessibility:', 'cyan')
    separator()

    if (env.NEON_AUTH_BASE_URL) {
      info('Validating Neon Auth endpoint...')
      const authValid = await validateNeonAuthEndpoints(env.NEON_AUTH_BASE_URL)
      if (authValid) {
        success('Neon Auth endpoint is accessible')
        results.endpoints.valid.push('NEON_AUTH_BASE_URL')
      } else {
        warning(
          'Neon Auth endpoint validation failed - may be offline or require authentication'
        )
        results.endpoints.invalid.push('NEON_AUTH_BASE_URL')
      }
    }

    if (env.DATABASE_URL) {
      info('Validating database connectivity (DATABASE_URL)...')
      const dbValid = await validateDatabaseConnection(env.DATABASE_URL)
      if (dbValid) {
        success('Database connection OK')
        results.endpoints.valid.push('DATABASE_URL')
      } else {
        warning('Database connection failed (check DATABASE_URL)')
        results.endpoints.invalid.push('DATABASE_URL')
      }
    }
  }

  // Summary
  log('\n📊 VALIDATION SUMMARY:', 'cyan')
  separator()

  const requiredAllValid = results.required.missing.length === 0 && results.required.invalid.length === 0
  const oauthConfigured = results.oauth.configured.length > 0

  if (requiredAllValid) {
    success('All required Neon Auth variables are configured correctly')
  } else {
    error(
      `Missing or invalid required variables: ${results.required.missing.length + results.required.invalid.length}`
    )
  }

  if (oauthConfigured) {
    success(`OAuth configured: ${results.oauth.configured.length} provider(s)`)
  } else {
    info('No OAuth providers configured (optional)')
  }

  if (results.optional.configured.length > 0) {
    success(`${results.optional.configured.length} optional variables configured`)
  }

  // Detailed missing variables
  if (results.required.missing.length > 0) {
    log('\n❌ Missing Required Variables:', 'red')
    results.required.missing.forEach((key) => {
      const config = REQUIRED_VARS[key]
      console.log(`   • ${key}: ${config.description}`)
    })
  }

  if (results.required.invalid.length > 0) {
    log('\n⚠️  Invalid Variable Formats:', 'yellow')
    results.required.invalid.forEach((key) => {
      const config = REQUIRED_VARS[key]
      console.log(`   • ${key}: ${config.description}`)
      if (config.pattern) {
        console.log(`     Expected pattern: ${config.pattern}`)
      }
    })
  }

  if (results.oauth.missing.length > 0) {
    log('\n⚠️  Missing OAuth Variables:', 'yellow')
    results.oauth.missing.forEach((key) => {
      const config = OAUTH_VARS[key]
      console.log(`   • ${key}: ${config.description}`)
    })
  }

  // Final recommendation
  log('\n💡 RECOMMENDATIONS:', 'cyan')
  separator()

  if (!requiredAllValid) {
    error('Please configure all required variables before proceeding')
    console.log('Required variables:')
    Object.entries(REQUIRED_VARS).forEach(([key, config]) => {
      console.log(`  - ${key}: ${config.description}`)
    })
  } else if (!oauthConfigured) {
    warning('OAuth is not fully configured. Configure at least one provider for user authentication.')
  } else {
    success('Neon Auth developer credentials are properly configured!')
    success('You can now run: npm run dev')
  }

  separator()

  process.exit(allValid && requiredAllValid ? 0 : 1)
}

// Run validation
await validateNeonAuthCredentials()
