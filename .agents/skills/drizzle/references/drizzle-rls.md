# Drizzle Row Level Security (RLS)

Complete reference for implementing Row Level Security with Drizzle ORM for PostgreSQL.

## Overview

Row Level Security (RLS) restricts which rows users can access at the database level. Drizzle provides:

- Policy definition API
- Role management
- Provider-specific helpers (Neon, Supabase)
- Migration support via drizzle-kit

## Enable RLS on Tables

### Using withRLS (v1.0.0-beta.1+)

```typescript
import { integer, pgTable } from 'drizzle-orm/pg-core';

// Enable RLS without policies (default-deny)
export const users = pgTable.withRLS('users', {
  id: integer(),
});
```

> **Note:** If you add a policy to a table, RLS is enabled automatically.

## Defining Roles

```typescript
import { pgRole } from 'drizzle-orm/pg-core';

// Create new role
export const admin = pgRole('admin', {
  createRole: true,
  createDb: true,
  inherit: true,
});

// Reference existing role (don't manage in migrations)
export const existingRole = pgRole('existing_role').existing();
```

## Defining Policies

### Basic Policy

```typescript
import { sql } from 'drizzle-orm';
import { integer, pgPolicy, pgRole, pgTable } from 'drizzle-orm/pg-core';

export const admin = pgRole('admin');

export const users = pgTable('users', {
  id: integer(),
}, (t) => [
  pgPolicy('policy', {
    as: 'permissive',     // or 'restrictive'
    to: admin,            // Role(s) - can be array
    for: 'delete',        // 'all' | 'select' | 'insert' | 'update' | 'delete'
    using: sql`...`,      // Row filter for SELECT/UPDATE/DELETE
    withCheck: sql`...`,  // Row filter for INSERT/UPDATE
  }),
]);
```

### Policy Options

| Option | Values | Description |
|--------|--------|-------------|
| `as` | `'permissive'`, `'restrictive'` | Policy type |
| `to` | Role, array of roles, `'public'` | Target roles |
| `for` | `'all'`, `'select'`, `'insert'`, `'update'`, `'delete'` | Operations |
| `using` | SQL expression | Filter for read/modify operations |
| `withCheck` | SQL expression | Filter for insert/update new rows |

### Multiple Policies Example

```typescript
export const posts = pgTable('posts', {
  id: serial().primaryKey(),
  authorId: uuid(),
  status: text(),
}, (table) => [
  // Users can read published posts
  pgPolicy('select_published', {
    for: 'select',
    to: 'public',
    using: sql`${table.status} = 'published'`,
  }),
  
  // Users can only update their own posts
  pgPolicy('update_own', {
    for: 'update',
    to: authenticatedRole,
    using: sql`${table.authorId} = auth.uid()`,
    withCheck: sql`${table.authorId} = auth.uid()`,
  }),
  
  // Admins can do anything
  pgPolicy('admin_all', {
    for: 'all',
    to: admin,
    using: sql`true`,
    withCheck: sql`true`,
  }),
]);
```

### Link Policy to Existing Table

For database provider tables (Neon, Supabase):

```typescript
import { sql } from 'drizzle-orm';
import { pgPolicy } from 'drizzle-orm/pg-core';
import { authenticatedRole, realtimeMessages } from 'drizzle-orm/supabase';

export const policy = pgPolicy('authenticated role insert policy', {
  for: 'insert',
  to: authenticatedRole,
  using: sql``,
}).link(realtimeMessages);  // Link to existing table
```

## Neon Integration

Drizzle provides Neon-specific helpers:

```typescript
import { crudPolicy } from 'drizzle-orm/neon';
import { integer, pgRole, pgTable } from 'drizzle-orm/pg-core';

export const admin = pgRole('admin');

export const users = pgTable('users', {
  id: integer(),
}, (t) => [
  // Quick CRUD policy generation
  crudPolicy({ 
    role: admin, 
    read: true, 
    modify: false,
  }),
]);
```

### Neon Predefined Roles & Functions

```typescript
import { 
  authenticatedRole, 
  anonymousRole, 
  authUid,
  neonIdentitySchema,
  usersSync,
} from 'drizzle-orm/neon';

// Use Neon's auth functions
const posts = pgTable('posts', {
  id: serial().primaryKey(),
  authorId: text(),
}, (t) => [
  pgPolicy('owner_policy', {
    for: 'all',
    to: authenticatedRole,
    using: authUid(t.authorId),  // auth.user_id() = authorId
  }),
]);
```

### Neon Auth Helpers

```typescript
// drizzle-orm/neon exports:
export const authenticatedRole = pgRole('authenticated').existing();
export const anonymousRole = pgRole('anonymous').existing();
export const authUid = (userIdColumn: AnyPgColumn) => 
  sql`(select auth.user_id() = ${userIdColumn})`;

// Neon Identity schema
export const neonIdentitySchema = pgSchema('neon_identity');
export const usersSync = neonIdentitySchema.table('users_sync', {
  rawJson: jsonb('raw_json').notNull(),
  id: text().primaryKey().notNull(),
  name: text(),
  email: text(),
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }),
  deletedAt: timestamp('deleted_at', { withTimezone: true, mode: 'string' }),
});
```

## Supabase Integration

Drizzle provides Supabase-specific helpers:

```typescript
import { 
  anonRole,
  authenticatedRole,
  serviceRole,
  postgresRole,
  supabaseAuthAdminRole,
  authUsers,
  authUid,
  realtimeTopic,
  realtimeMessages,
} from 'drizzle-orm/supabase';
```

### Supabase Example

```typescript
import { foreignKey, pgPolicy, pgTable, text, uuid } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { authenticatedRole, authUsers } from 'drizzle-orm/supabase';

export const profiles = pgTable('profiles', {
  id: uuid().primaryKey().notNull(),
  email: text().notNull(),
}, (table) => [
  // Reference Supabase auth.users
  foreignKey({
    columns: [table.id],
    foreignColumns: [authUsers.id],
    name: 'profiles_id_fk',
  }).onDelete('cascade'),
  
  // Allow authenticated users to view all profiles
  pgPolicy('authenticated can view all profiles', {
    for: 'select',
    to: authenticatedRole,
    using: sql`true`,
  }),
]);
```

### Supabase Auth Helpers

```typescript
// drizzle-orm/supabase exports:
export const anonRole = pgRole('anon').existing();
export const authenticatedRole = pgRole('authenticated').existing();
export const serviceRole = pgRole('service_role').existing();
export const postgresRole = pgRole('postgres_role').existing();
export const supabaseAuthAdminRole = pgRole('supabase_auth_admin').existing();

// Auth schema
const auth = pgSchema('auth');
export const authUsers = auth.table('users', {
  id: uuid().primaryKey().notNull(),
});

// Realtime
const realtime = pgSchema('realtime');
export const realtimeMessages = realtime.table('messages', {
  id: bigserial({ mode: 'bigint' }).primaryKey(),
  topic: text().notNull(),
  extension: text({
    enum: ['presence', 'broadcast', 'postgres_changes'],
  }).notNull(),
});

// Helper functions
export const authUid = sql`(select auth.uid())`;
export const realtimeTopic = sql`realtime.topic()`;
```

### Supabase RLS Transaction Wrapper

Full implementation for Supabase RLS in Drizzle:

```typescript
type SupabaseToken = {
  iss?: string;
  sub?: string;
  aud?: string[] | string;
  exp?: number;
  nbf?: number;
  iat?: number;
  jti?: string;
  role?: string;
};

export function createDrizzle(
  token: SupabaseToken,
  { admin, client }: { admin: PgDatabase<any>; client: PgDatabase<any> }
) {
  return {
    admin,
    rls: (async (transaction, ...rest) => {
      return await client.transaction(async (tx) => {
        try {
          // Set Supabase auth context
          await tx.execute(sql`
            select set_config('request.jwt.claims', '${sql.raw(
              JSON.stringify(token)
            )}', TRUE);
            select set_config('request.jwt.claim.sub', '${sql.raw(
              token.sub ?? ""
            )}', TRUE);
            set local role ${sql.raw(token.role ?? "anon")};
          `);
          return await transaction(tx);
        } finally {
          // Reset context
          await tx.execute(sql`
            select set_config('request.jwt.claims', NULL, TRUE);
            select set_config('request.jwt.claim.sub', NULL, TRUE);
            reset role;
          `);
        }
      }, ...rest);
    }) as typeof client.transaction,
  };
}

// Usage
async function getRooms() {
  const db = await createDrizzleSupabaseClient();
  return db.rls((tx) => tx.select().from(rooms));
}
```

## RLS on Views

Use `security_invoker` for RLS on views:

```typescript
import { getColumns } from 'drizzle-orm';

export const roomsUsersProfiles = pgView('rooms_users_profiles')
  .with({
    securityInvoker: true,  // Apply RLS from underlying tables
  })
  .as((qb) =>
    qb
      .select({
        ...getColumns(roomsUsers),
        email: profiles.email,
      })
      .from(roomsUsers)
      .innerJoin(profiles, eq(roomsUsers.userId, profiles.id))
  );
```

## drizzle-kit Role Management

Configure role management in `drizzle.config.ts`:

```typescript
import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  dialect: 'postgresql',
  schema: './drizzle/schema.ts',
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
  entities: {
    // Enable role management
    roles: true,
  },
});
```

### Exclude Roles

```typescript
entities: {
  roles: {
    exclude: ['admin'],  // Don't manage these roles
  },
}
```

### Include Specific Roles

```typescript
entities: {
  roles: {
    include: ['app_user', 'app_admin'],  // Only manage these
  },
}
```

### Provider-Specific Configuration

```typescript
// Neon - exclude Neon-defined roles
entities: {
  roles: {
    provider: 'neon',
  },
}

// Supabase - exclude Supabase-defined roles  
entities: {
  roles: {
    provider: 'supabase',
  },
}

// Provider + custom exclusions
entities: {
  roles: {
    provider: 'supabase',
    exclude: ['new_supabase_role'],  // Additional exclusions
  },
}
```

## Complete Neon RLS Example

```typescript
import { sql } from 'drizzle-orm';
import { 
  pgTable, pgPolicy, serial, text, uuid, timestamp, integer 
} from 'drizzle-orm/pg-core';
import { crudPolicy, authenticatedRole, authUid } from 'drizzle-orm/neon';

// Users table - authenticated users only
export const users = pgTable('users', {
  id: uuid().primaryKey().defaultRandom(),
  email: text().notNull().unique(),
  name: text(),
  createdAt: timestamp().defaultNow(),
}, (t) => [
  // Only see own record
  pgPolicy('users_select_own', {
    for: 'select',
    to: authenticatedRole,
    using: authUid(t.id),
  }),
  // Can update own record
  pgPolicy('users_update_own', {
    for: 'update',
    to: authenticatedRole,
    using: authUid(t.id),
    withCheck: authUid(t.id),
  }),
]);

// Posts table - public read, authenticated write
export const posts = pgTable('posts', {
  id: serial().primaryKey(),
  title: text().notNull(),
  content: text(),
  authorId: uuid().notNull(),
  published: boolean().default(false),
  createdAt: timestamp().defaultNow(),
}, (t) => [
  // Anyone can read published posts
  pgPolicy('posts_select_published', {
    for: 'select',
    to: 'public',
    using: sql`${t.published} = true`,
  }),
  // Authenticated can read own posts
  pgPolicy('posts_select_own', {
    for: 'select',
    to: authenticatedRole,
    using: authUid(t.authorId),
  }),
  // Author CRUD
  crudPolicy({
    role: authenticatedRole,
    read: authUid(t.authorId),
    modify: authUid(t.authorId),
  }),
]);
```

## Related References

- [drizzle-schema.md](./drizzle-schema.md) - Table declaration
- [drizzle-constraints.md](./drizzle-constraints.md) - Constraints and indexes
- [drizzle-kit.md](./drizzle-kit.md) - Migration CLI
