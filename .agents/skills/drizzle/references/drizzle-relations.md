# Drizzle Relations

Complete reference for defining and querying relations in Drizzle ORM.

## Relations Fundamentals

### Database Normalization

Relations help eliminate data redundancy through normalization:

**1NF (First Normal Form):**
- Eliminate repeating groups
- Create separate table for each set of related data
- Identify each record with a primary key

**2NF (Second Normal Form):**
- Meet 1NF requirements
- Remove partial dependencies
- Each non-key column depends on the entire primary key

**3NF (Third Normal Form):**
- Meet 2NF requirements
- Remove transitive dependencies
- Non-key columns depend only on the primary key

### Foreign Keys vs Relations

**Foreign Keys** (Database-level):
- Enforced by database on insert/update/delete
- Throws error on constraint violation
- Creates actual database constraint

**Relations** (Application-level):
- Used by Drizzle's Relational Queries API
- No database schema changes
- Can work without foreign keys

```typescript
// Foreign key - database enforced
const posts = pgTable('posts', {
  authorId: integer().references(() => users.id),
});

// Relation - application level only
const relations = defineRelations({ users, posts }, (r) => ({
  posts: {
    author: r.one.users({
      from: r.posts.authorId,
      to: r.users.id,
    }),
  },
}));
```

## Relations V2 API (Drizzle 1.0+)

The new `defineRelations` API provides cleaner, more flexible relations:

```typescript
import { defineRelations } from 'drizzle-orm';
import { pgTable, integer, text } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: integer().primaryKey(),
  name: text(),
});

export const posts = pgTable('posts', {
  id: integer().primaryKey(),
  content: text(),
  authorId: integer(),
});

export const relations = defineRelations({ users, posts }, (r) => ({
  posts: {
    author: r.one.users({
      from: r.posts.authorId,
      to: r.users.id,
    }),
  },
  users: {
    posts: r.many.posts(),
  },
}));
```

### one() Options

```typescript
r.one.targetTable({
  from: r.sourceTable.sourceColumn,   // Source column
  to: r.targetTable.targetColumn,      // Target column
  optional: false,                      // Make relation required (type-level)
  alias: 'custom_name',                 // Disambiguate multiple relations
  where: {                              // Predefined filter (polymorphic)
    verified: true,
  },
});
```

### many() Options

```typescript
r.many.targetTable({
  from: r.sourceTable.sourceColumn,
  to: r.targetTable.targetColumn,
  optional: false,
  alias: 'custom_name',
  where: {
    approved: true,
  },
});
```

## Relationship Types

### One-to-One

User has one profile:

```typescript
export const users = pgTable('users', {
  id: integer().primaryKey(),
  name: text(),
});

export const profileInfo = pgTable('profile_info', {
  id: serial().primaryKey(),
  userId: integer().references(() => users.id),
  metadata: jsonb(),
});

export const relations = defineRelations({ users, profileInfo }, (r) => ({
  users: {
    profileInfo: r.one.profileInfo({
      from: r.users.id,
      to: r.profileInfo.userId,
    }),
  },
}));
```

Self-referencing one-to-one (user invites user):

```typescript
export const users = pgTable('users', {
  id: integer().primaryKey(),
  name: text(),
  invitedBy: integer(),
});

export const relations = defineRelations({ users }, (r) => ({
  users: {
    invitee: r.one.users({
      from: r.users.invitedBy,
      to: r.users.id,
    }),
  },
}));
```

### One-to-Many

User has many posts:

```typescript
export const users = pgTable('users', {
  id: integer().primaryKey(),
  name: text(),
});

export const posts = pgTable('posts', {
  id: integer().primaryKey(),
  content: text(),
  authorId: integer(),
});

export const comments = pgTable('comments', {
  id: integer().primaryKey(),
  text: text(),
  authorId: integer(),
  postId: integer(),
});

export const relations = defineRelations({ users, posts, comments }, (r) => ({
  posts: {
    author: r.one.users({
      from: r.posts.authorId,
      to: r.users.id,
    }),
    comments: r.many.comments(),
  },
  users: {
    posts: r.many.posts(),
  },
  comments: {
    post: r.one.posts({
      from: r.comments.postId,
      to: r.posts.id,
    }),
  },
}));
```

### Many-to-Many

Users belong to many groups via junction table:

```typescript
export const users = pgTable('users', {
  id: integer().primaryKey(),
  name: text(),
});

export const groups = pgTable('groups', {
  id: integer().primaryKey(),
  name: text(),
});

// Junction table
export const usersToGroups = pgTable('users_to_groups', {
  userId: integer().notNull().references(() => users.id),
  groupId: integer().notNull().references(() => groups.id),
}, (t) => [
  primaryKey({ columns: [t.userId, t.groupId] }),
]);

// Use 'through' for many-to-many
export const relations = defineRelations(
  { users, groups, usersToGroups },
  (r) => ({
    users: {
      groups: r.many.groups({
        from: r.users.id.through(r.usersToGroups.userId),
        to: r.groups.id.through(r.usersToGroups.groupId),
      }),
    },
    groups: {
      participants: r.many.users(),
    },
  })
);
```

**V2 Improvement:** No need to manually query junction table:
```typescript
// Direct query - returns groups directly
const res = await db.query.users.findMany({
  with: { 
    groups: true,  // Returns { id, name }[] not { usersToGroups: [...] }
  },
});
```

### Polymorphic Relations (Predefined Filters)

Filter relations with WHERE conditions:

```typescript
export const relations = defineRelations(schema, (r) => ({
  groups: {
    // Only fetch verified users
    verifiedUsers: r.many.users({
      from: r.groups.id.through(r.usersToGroups.groupId),
      to: r.users.id.through(r.usersToGroups.userId),
      where: {
        verified: true,  // Filter on target table (users)
      },
    }),
  },
}));

await db.query.groups.findMany({
  with: {
    verifiedUsers: true,  // Only verified users returned
  },
});
```

## Disambiguating Relations

When multiple relations exist between same tables, use `alias`:

```typescript
export const posts = pgTable('posts', {
  id: integer().primaryKey(),
  content: text(),
  authorId: integer(),
  reviewerId: integer(),
});

export const relations = defineRelations({ users, posts }, (r) => ({
  users: {
    // Author's posts
    posts: r.many.posts({
      alias: 'author',
    }),
    // Posts user reviewed
    reviewedPosts: r.many.posts({
      alias: 'reviewer',
    }),
  },
  posts: {
    author: r.one.users({
      from: r.posts.authorId,
      to: r.users.id,
      alias: 'author',
    }),
    reviewer: r.one.users({
      from: r.posts.reviewerId,
      to: r.users.id,
      alias: 'reviewer',
    }),
  },
}));
```

## Splitting Relations (defineRelationsPart)

Split large relation definitions across files:

```typescript
// relations/users.ts
import { defineRelationsPart } from 'drizzle-orm';

export const userRelations = defineRelationsPart(schema, (r) => ({
  users: {
    invitee: r.one.users({
      from: r.users.invitedBy,
      to: r.users.id,
    }),
    posts: r.many.posts(),
  },
}));

// relations/posts.ts
export const postRelations = defineRelationsPart(schema, (r) => ({
  posts: {
    author: r.one.users({
      from: r.posts.authorId,
      to: r.users.id,
    }),
  },
}));

// relations/index.ts - Main must come first!
export const relations = defineRelations(schema, (r) => ({}));

// db.ts
const db = drizzle(process.env.DB_URL, { 
  relations: { ...relations, ...userRelations, ...postRelations } 
});
```

**Rules:**
1. Main `defineRelations` must come first when spreading
2. If only using parts, one must be empty: `defineRelationsPart(schema)`

## Performance: Index Recommendations

### One-to-One / One-to-Many

Index the foreign key column on the target table:

```typescript
export const profileInfo = pgTable('profile_info', {
  id: integer().primaryKey(),
  userId: integer().references(() => users.id),
  metadata: jsonb(),
}, (table) => [
  index('profile_info_user_id_idx').on(table.userId),
]);

export const posts = pgTable('posts', {
  id: integer().primaryKey(),
  authorId: integer(),
}, (t) => [
  index('posts_author_id_idx').on(t.authorId),
]);
```

### Many-to-Many

Index both foreign keys and create composite index:

```typescript
export const usersToGroups = pgTable('users_to_groups', {
  userId: integer().notNull().references(() => users.id),
  groupId: integer().notNull().references(() => groups.id),
}, (t) => [
  primaryKey({ columns: [t.userId, t.groupId] }),
  // Individual indexes
  index('users_to_groups_user_id_idx').on(t.userId),
  index('users_to_groups_group_id_idx').on(t.groupId),
  // Composite index
  index('users_to_groups_composite_idx').on(t.userId, t.groupId),
]);
```

## Setting Up Relations

```typescript
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from './schema';
import { relations } from './relations';

// Pass relations to drizzle instance
const db = drizzle(process.env.DATABASE_URL, { 
  schema,
  relations,
});

// Now use relational queries
const result = await db.query.posts.findMany({
  with: {
    author: true,
  },
});
```

## Related References

- [drizzle-queries.md](./drizzle-queries.md) - Query patterns including relational queries
- [drizzle-constraints.md](./drizzle-constraints.md) - Foreign key constraints
- [drizzle-schema.md](./drizzle-schema.md) - Table declaration
