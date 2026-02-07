# Drizzle Data Querying

Complete reference for querying data with Drizzle ORM.

## Query Approaches

Drizzle provides two query APIs:

| API | Style | Best For |
|-----|-------|----------|
| **SQL-like** | `db.select().from()` | Complex queries, full control, joins |
| **Relational** | `db.query.table.find*()` | Nested data, simple relations |

## SQL-like Queries

### Select All

```typescript
import { eq, gt, and, or, desc, asc } from 'drizzle-orm';

// Select all columns
const allUsers = await db.select().from(users);
// → SELECT * FROM users

// Select specific columns
const userNames = await db.select({
  id: users.id,
  name: users.name,
}).from(users);
// → SELECT id, name FROM users
```

### Computed/Derived Columns

```typescript
import { sql } from 'drizzle-orm';

const result = await db.select({
  id: users.id,
  fullName: sql<string>`${users.firstName} || ' ' || ${users.lastName}`,
  upperName: sql<string>`UPPER(${users.name})`,
}).from(users);
```

### Conditional Select (Dynamic Columns)

```typescript
async function getUsers(withEmail: boolean) {
  return db
    .select({
      id: users.id,
      name: users.name,
      ...(withEmail && { email: users.email }),
    })
    .from(users);
}
```

### Where Clauses

```typescript
import { eq, ne, gt, gte, lt, lte, like, ilike, between, inArray, isNull, isNotNull, and, or, not } from 'drizzle-orm';

// Equality
await db.select().from(users).where(eq(users.id, 1));
// → WHERE id = 1

// Not equal
await db.select().from(users).where(ne(users.status, 'banned'));

// Comparison
await db.select().from(users).where(gt(users.age, 18));   // > 18
await db.select().from(users).where(gte(users.age, 18)); // >= 18
await db.select().from(users).where(lt(users.age, 65));  // < 65
await db.select().from(users).where(lte(users.age, 65)); // <= 65

// Pattern matching
await db.select().from(users).where(like(users.name, 'Jo%'));   // Case-sensitive
await db.select().from(users).where(ilike(users.name, 'jo%'));  // Case-insensitive (PG)

// Range
await db.select().from(users).where(between(users.age, 18, 65));

// Array membership
await db.select().from(users).where(inArray(users.role, ['admin', 'moderator']));

// Null checks
await db.select().from(users).where(isNull(users.deletedAt));
await db.select().from(users).where(isNotNull(users.email));

// Combinators
await db.select().from(users).where(
  and(
    eq(users.status, 'active'),
    gt(users.age, 18),
    or(
      eq(users.role, 'admin'),
      eq(users.role, 'moderator')
    )
  )
);

// Negation
await db.select().from(users).where(not(eq(users.status, 'banned')));
```

### Order By

```typescript
import { asc, desc } from 'drizzle-orm';

// Single column
await db.select().from(users).orderBy(users.createdAt);        // ASC default
await db.select().from(users).orderBy(asc(users.name));
await db.select().from(users).orderBy(desc(users.createdAt));

// Multiple columns
await db.select().from(users).orderBy(
  desc(users.createdAt),
  asc(users.name)
);
```

### Limit & Offset

```typescript
// Pagination
const page = 2;
const pageSize = 10;

await db.select()
  .from(users)
  .limit(pageSize)
  .offset((page - 1) * pageSize);
```

### Distinct

```typescript
await db.selectDistinct().from(users);

// Distinct on specific columns (PostgreSQL)
await db.selectDistinctOn([users.status]).from(users);
```

## Joins

### Inner Join

```typescript
// Explicit join
const result = await db
  .select({
    user: users,
    post: posts,
  })
  .from(users)
  .innerJoin(posts, eq(users.id, posts.authorId));

// Partial fields
const result = await db
  .select({
    userName: users.name,
    postTitle: posts.title,
  })
  .from(users)
  .innerJoin(posts, eq(users.id, posts.authorId));
```

### Left Join

```typescript
const result = await db
  .select()
  .from(users)
  .leftJoin(posts, eq(users.id, posts.authorId));
```

### Right Join

```typescript
const result = await db
  .select()
  .from(posts)
  .rightJoin(users, eq(users.id, posts.authorId));
```

### Full Join

```typescript
const result = await db
  .select()
  .from(users)
  .fullJoin(posts, eq(users.id, posts.authorId));
```

### Multiple Joins

```typescript
const result = await db
  .select({
    user: users.name,
    post: posts.title,
    comment: comments.text,
  })
  .from(users)
  .leftJoin(posts, eq(users.id, posts.authorId))
  .leftJoin(comments, eq(posts.id, comments.postId));
```

### Self-Join with Alias

```typescript
import { alias } from 'drizzle-orm';

const parent = alias(users, 'parent');

const result = await db
  .select({
    user: users.name,
    parentName: parent.name,
  })
  .from(users)
  .leftJoin(parent, eq(users.parentId, parent.id));
```

## Subqueries

### Subquery in Select

```typescript
const postCount = db
  .select({ count: sql<number>`count(*)` })
  .from(posts)
  .where(eq(posts.authorId, users.id))
  .as('post_count');

const result = await db
  .select({
    user: users,
    postCount: postCount.count,
  })
  .from(users)
  .leftJoin(postCount, sql`true`);
```

### Subquery in Where (EXISTS)

```typescript
const hasPublishedPosts = db
  .select()
  .from(posts)
  .where(and(
    eq(posts.authorId, users.id),
    eq(posts.status, 'published')
  ));

const authorsWithPublished = await db
  .select()
  .from(users)
  .where(exists(hasPublishedPosts));
```

### Subquery in From

```typescript
const sq = db
  .select({
    authorId: posts.authorId,
    postCount: sql<number>`count(*)`.as('post_count'),
  })
  .from(posts)
  .groupBy(posts.authorId)
  .as('sq');

const result = await db
  .select({
    userName: users.name,
    postCount: sq.postCount,
  })
  .from(users)
  .leftJoin(sq, eq(users.id, sq.authorId));
```

## Aggregations

```typescript
import { count, sum, avg, min, max } from 'drizzle-orm';

// Count
const userCount = await db.select({ count: count() }).from(users);
const activeCount = await db.select({ count: count(users.id) })
  .from(users)
  .where(eq(users.status, 'active'));

// Sum, Average, Min, Max
const stats = await db.select({
  total: sum(orders.amount),
  average: avg(orders.amount),
  minimum: min(orders.amount),
  maximum: max(orders.amount),
}).from(orders);
```

### Group By

```typescript
const postsByAuthor = await db
  .select({
    authorId: posts.authorId,
    postCount: count(),
  })
  .from(posts)
  .groupBy(posts.authorId);
```

### Having

```typescript
const prolificAuthors = await db
  .select({
    authorId: posts.authorId,
    postCount: count(),
  })
  .from(posts)
  .groupBy(posts.authorId)
  .having(gt(count(), 10));
```

## Dynamic WHERE Builders

Build conditions dynamically:

```typescript
function buildUserFilter(filters: {
  status?: string;
  minAge?: number;
  maxAge?: number;
  roles?: string[];
}) {
  const conditions = [];

  if (filters.status) {
    conditions.push(eq(users.status, filters.status));
  }
  if (filters.minAge) {
    conditions.push(gte(users.age, filters.minAge));
  }
  if (filters.maxAge) {
    conditions.push(lte(users.age, filters.maxAge));
  }
  if (filters.roles?.length) {
    conditions.push(inArray(users.role, filters.roles));
  }

  return conditions.length > 0 ? and(...conditions) : undefined;
}

// Usage
const result = await db
  .select()
  .from(users)
  .where(buildUserFilter({ status: 'active', minAge: 18 }));
```

## Relational Queries

The Relational Queries API simplifies fetching nested data:

### Setup

```typescript
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from './schema';
import { relations } from './relations';

const db = drizzle(process.env.DATABASE_URL, { 
  schema,
  relations,
});
```

### findMany

```typescript
// All posts with authors
const postsWithAuthors = await db.query.posts.findMany({
  with: {
    author: true,
  },
});
// → [{ id, content, author: { id, name } }, ...]

// Select specific columns
const posts = await db.query.posts.findMany({
  columns: {
    id: true,
    title: true,
  },
  with: {
    author: {
      columns: {
        name: true,
      },
    },
  },
});

// Exclude columns
const posts = await db.query.posts.findMany({
  columns: {
    content: false,  // Exclude content
  },
});
```

### findFirst

```typescript
const user = await db.query.users.findFirst({
  where: eq(users.id, 1),
  with: {
    posts: true,
    profileInfo: true,
  },
});
```

### Nested Relations

```typescript
const posts = await db.query.posts.findMany({
  with: {
    author: true,
    comments: {
      with: {
        author: true,  // Nested: comment's author
      },
    },
  },
});
// → [{ 
//     id, title, 
//     author: { id, name },
//     comments: [{ 
//       id, text, 
//       author: { id, name } 
//     }]
//   }]
```

### Filtering Relations

```typescript
const users = await db.query.users.findMany({
  with: {
    posts: {
      where: eq(posts.status, 'published'),
      orderBy: desc(posts.createdAt),
      limit: 5,
    },
  },
});
```

### Extras (Computed Fields)

```typescript
const posts = await db.query.posts.findMany({
  extras: {
    titleLength: sql<number>`LENGTH(${posts.title})`.as('title_length'),
  },
});
// → [{ id, title, titleLength: 42 }, ...]
```

## Prepared Statements

Pre-compile queries for better performance:

```typescript
import { placeholder } from 'drizzle-orm';

// With SQL-like API
const prepared = db
  .select()
  .from(users)
  .where(eq(users.id, placeholder('userId')))
  .prepare('get_user_by_id');

// Execute with parameters
const user = await prepared.execute({ userId: 1 });

// With Relational Query API
const prepared = db.query.users.findFirst({
  where: eq(users.id, placeholder('userId')),
  with: {
    posts: true,
  },
}).prepare('get_user_with_posts');

const result = await prepared.execute({ userId: 1 });
```

## Transactions

```typescript
// Basic transaction
const result = await db.transaction(async (tx) => {
  const user = await tx.insert(users).values({ name: 'Alice' }).returning();
  await tx.insert(posts).values({ 
    title: 'First Post', 
    authorId: user[0].id 
  });
  return user;
});

// With rollback
await db.transaction(async (tx) => {
  await tx.insert(users).values({ name: 'Bob' });
  
  if (someCondition) {
    tx.rollback();  // Rollback entire transaction
  }
  
  await tx.insert(posts).values({ ... });
});
```

## Insert

```typescript
// Single insert
await db.insert(users).values({
  name: 'Alice',
  email: 'alice@example.com',
});

// Multiple inserts
await db.insert(users).values([
  { name: 'Alice', email: 'alice@example.com' },
  { name: 'Bob', email: 'bob@example.com' },
]);

// Insert with returning
const [newUser] = await db.insert(users).values({
  name: 'Alice',
}).returning();

// Upsert (on conflict)
await db.insert(users)
  .values({ id: 1, name: 'Alice' })
  .onConflictDoUpdate({
    target: users.id,
    set: { name: 'Alice Updated' },
  });

await db.insert(users)
  .values({ id: 1, name: 'Alice' })
  .onConflictDoNothing();
```

## Update

```typescript
// Update with where
await db.update(users)
  .set({ status: 'active' })
  .where(eq(users.id, 1));

// Update with returning
const [updated] = await db.update(users)
  .set({ name: 'Alice' })
  .where(eq(users.id, 1))
  .returning();

// Increment
await db.update(users)
  .set({ 
    loginCount: sql`${users.loginCount} + 1`,
  })
  .where(eq(users.id, 1));
```

## Delete

```typescript
// Delete with where
await db.delete(users).where(eq(users.id, 1));

// Delete with returning
const [deleted] = await db.delete(users)
  .where(eq(users.status, 'inactive'))
  .returning();

// Delete all (careful!)
await db.delete(users);
```

## Related References

- [drizzle-relations.md](./drizzle-relations.md) - Defining relations
- [drizzle-schema.md](./drizzle-schema.md) - Table declaration
- [drizzle-rls.md](./drizzle-rls.md) - Row Level Security
