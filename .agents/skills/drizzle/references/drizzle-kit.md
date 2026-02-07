# Drizzle Kit CLI

Complete reference for `drizzle-kit` - the Drizzle ORM CLI for database migrations.

## Installation

```bash
npm i -D drizzle-kit
# or
pnpm add -D drizzle-kit
```

## Configuration (drizzle.config.ts)

```typescript
import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  // Required
  dialect: 'postgresql',  // 'postgresql' | 'mysql' | 'sqlite' | 'turso' | 'mssql'
  schema: './src/schema.ts',  // Path to schema file(s)
  
  // Database connection
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
  
  // Optional
  out: './drizzle',           // Migration output directory
  strict: true,               // Confirm before data-destructive changes
  verbose: true,              // Detailed output
  
  // Advanced
  schemaFilter: ['public'],   // Only specific schemas
  tablesFilter: ['!_*'],      // Exclude tables starting with _
  
  // For RLS/Roles
  entities: {
    roles: true,  // Enable role management
  },
});
```

### Multiple Configs

```bash
# Use different configs for different environments
npx drizzle-kit push --config=drizzle-dev.config.ts
npx drizzle-kit push --config=drizzle-prod.config.ts
```

## Commands Overview

| Command | Description |
|---------|-------------|
| `generate` | Generate SQL migration files from schema changes |
| `migrate` | Apply migrations to database |
| `push` | Push schema directly to database (no migration files) |
| `pull` | Introspect database and generate TypeScript schema |
| `studio` | Launch Drizzle Studio GUI |
| `check` | Check for migration collisions |
| `up` | Upgrade migration snapshots |

## drizzle-kit generate

Generate SQL migration files from schema changes:

```bash
npx drizzle-kit generate
```

**Output:**
```
📦 drizzle/
  └ 📜 0000_initial_migration.sql
  └ 📜 0001_add_users_table.sql
  └ 📜 meta/
      └ 📜 _journal.json
      └ 📜 0000_snapshot.json
```

### Options

```bash
# Custom output directory
npx drizzle-kit generate --out=./migrations

# Custom config
npx drizzle-kit generate --config=drizzle.config.ts

# With name
npx drizzle-kit generate --name=add_users_table
```

### Generated Migration Example

```sql
-- 0001_add_users_table.sql
CREATE TABLE IF NOT EXISTS "users" (
  "id" serial PRIMARY KEY NOT NULL,
  "email" text NOT NULL,
  "name" text,
  "created_at" timestamp DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS "users_email_idx" ON "users" ("email");
```

## drizzle-kit migrate

Apply migrations to database:

```bash
npx drizzle-kit migrate
```

### Options

```bash
# Specific config
npx drizzle-kit migrate --config=drizzle.config.ts
```

### Programmatic Migration

Run migrations from your application:

```typescript
import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { Pool } from 'pg';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const db = drizzle(pool);

// Run migrations
await migrate(db, { migrationsFolder: './drizzle' });
```

## drizzle-kit push

Push schema directly to database without migration files:

```bash
npx drizzle-kit push
```

**Best for:**
- Development/prototyping
- Serverless environments (Neon, PlanetScale)
- When you don't need migration history

### Options

```bash
# Force push (skip confirmation)
npx drizzle-kit push --force

# Strict mode (confirm destructive changes)
npx drizzle-kit push --strict
```

### Push vs Generate+Migrate

| Feature | `push` | `generate` + `migrate` |
|---------|--------|------------------------|
| Migration files | No | Yes |
| Version control | Schema only | Full history |
| Rollback | Manual | With custom migrations |
| Team workflows | Schema-based | Migration-based |
| CI/CD | Simple | More control |

## drizzle-kit pull

Introspect database and generate TypeScript schema:

```bash
npx drizzle-kit pull
```

**Output:**
```
📦 drizzle/
  └ 📜 schema.ts      # Generated schema
  └ 📜 relations.ts   # Generated relations
```

### Database-First Workflow

```bash
# 1. Modify database directly (or via external tool)

# 2. Pull schema changes
npx drizzle-kit pull

# 3. Schema is updated automatically
```

### Options

```bash
# Custom output directory
npx drizzle-kit pull --out=./src/db/schema

# Include specific schemas
npx drizzle-kit pull --schemaFilter=public,app
```

## drizzle-kit studio

Launch Drizzle Studio GUI:

```bash
npx drizzle-kit studio
```

Opens browser at `https://local.drizzle.studio`

### Features

- Browse tables and data
- Execute queries
- Edit data visually
- View relations

### Options

```bash
# Custom port
npx drizzle-kit studio --port=3001

# Verbose logging
npx drizzle-kit studio --verbose
```

## drizzle-kit check

Check for migration collisions:

```bash
npx drizzle-kit check
```

**Use when:**
- Multiple developers generate migrations
- Checking for race conditions
- CI/CD validation

## drizzle-kit up

Upgrade migration snapshots after Drizzle Kit updates:

```bash
npx drizzle-kit up
```

## Workflow Examples

### Development Workflow (push)

```bash
# 1. Modify schema
# 2. Push to database
npx drizzle-kit push

# 3. View in studio
npx drizzle-kit studio
```

### Production Workflow (generate + migrate)

```bash
# 1. Modify schema
# 2. Generate migration
npx drizzle-kit generate --name=add_feature

# 3. Review migration file
cat drizzle/0002_add_feature.sql

# 4. Apply migration
npx drizzle-kit migrate
```

### Database-First Workflow (pull)

```bash
# 1. Changes made to database externally
# 2. Pull schema
npx drizzle-kit pull

# 3. Update application to use new schema
```

### CI/CD Pipeline

```yaml
# GitHub Actions example
jobs:
  deploy:
    steps:
      - uses: actions/checkout@v4
      
      - name: Install dependencies
        run: pnpm install
        
      - name: Check migrations
        run: npx drizzle-kit check
        
      - name: Run migrations
        run: npx drizzle-kit migrate
        env:
          DATABASE_URL: ${{ secrets.DATABASE_URL }}
```

## Configuration Options Reference

```typescript
import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  // Database type
  dialect: 'postgresql',
  
  // Schema definition location
  schema: './src/schema.ts',
  // or multiple files
  schema: ['./src/schema/*.ts'],
  // or glob pattern
  schema: './src/**/*.schema.ts',
  
  // Migration output
  out: './drizzle',
  
  // Database connection
  dbCredentials: {
    // URL string
    url: process.env.DATABASE_URL,
    
    // Or individual options (PostgreSQL)
    host: 'localhost',
    port: 5432,
    user: 'postgres',
    password: 'password',
    database: 'mydb',
    ssl: true,
  },
  
  // Schema filtering
  schemaFilter: ['public', 'app'],  // Only these schemas
  tablesFilter: ['!_*', '!temp_*'], // Exclude patterns
  
  // Behavior
  strict: true,           // Confirm destructive changes
  verbose: true,          // Detailed output
  
  // Extension handling (PostGIS, etc.)
  extensionsFilters: ['postgis'],
  
  // Role management (for RLS)
  entities: {
    roles: true,
    // or with options
    roles: {
      provider: 'neon',     // or 'supabase'
      include: ['app_*'],
      exclude: ['admin'],
    },
  },
  
  // Breakpoints for transaction control
  breakpoints: true,
  
  // Migrations table name
  migrationsTable: '__drizzle_migrations',
  
  // Migrations schema (PostgreSQL)
  migrationsSchema: 'drizzle',
});
```

## Common Issues

### Migration Conflicts

```bash
# Check for conflicts
npx drizzle-kit check

# If conflicts found, regenerate
rm drizzle/0002_*.sql
npx drizzle-kit generate
```

### Schema Drift

```bash
# Compare schema to database
npx drizzle-kit push --dry-run

# Or pull current state
npx drizzle-kit pull --out=./drizzle-current
```

### Custom Migration Logic

Add custom SQL in generated migration:

```sql
-- 0002_add_feature.sql

-- Auto-generated
ALTER TABLE "users" ADD COLUMN "status" text;

-- Custom: Backfill data
UPDATE "users" SET "status" = 'active' WHERE "status" IS NULL;

-- Custom: Add constraint after backfill
ALTER TABLE "users" ALTER COLUMN "status" SET NOT NULL;
```

## Related References

- [drizzle-schema.md](./drizzle-schema.md) - Schema declaration
- [drizzle-rls.md](./drizzle-rls.md) - Role management for RLS
