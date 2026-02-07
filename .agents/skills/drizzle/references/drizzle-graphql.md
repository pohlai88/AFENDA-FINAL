# drizzle-graphql Reference

`drizzle-graphql` generates a complete GraphQL schema from Drizzle ORM schemas, enabling automatic queries and mutations with full customization capabilities.

## Installation

```bash
# With Apollo Server
npm i drizzle-graphql @apollo/server graphql

# With GraphQL Yoga
npm i drizzle-graphql graphql-yoga graphql
```

## Version Requirements

- **Drizzle ORM:** v0.30.9 or greater

## Quick Start

### Apollo Server

```typescript
import { buildSchema } from 'drizzle-graphql';
import { drizzle } from 'drizzle-orm/...';
import { ApolloServer } from '@apollo/server';
import { startStandaloneServer } from '@apollo/server/standalone';
import * as dbSchema from './schema';

// Connect to database with schema
const db = drizzle({ client, schema: dbSchema });

// Build GraphQL schema from Drizzle schema
const { schema } = buildSchema(db);

// Create Apollo Server
const server = new ApolloServer({ schema });

// Start server
const { url } = await startStandaloneServer(server);
console.log(`🚀 Server ready at ${url}`);
```

### GraphQL Yoga

```typescript
import { buildSchema } from 'drizzle-graphql';
import { drizzle } from 'drizzle-orm/...';
import { createYoga } from 'graphql-yoga';
import { createServer } from 'node:http';
import * as dbSchema from './schema';

// Connect to database with schema
const db = drizzle({ schema: dbSchema });

// Build GraphQL schema from Drizzle schema
const { schema } = buildSchema(db);

// Create Yoga server
const yoga = createYoga({ schema });

// Create HTTP server
const server = createServer(yoga);

server.listen(4000, () => {
  console.info('Server is running on http://localhost:4000/graphql');
});
```

## buildSchema Output

The `buildSchema` function returns:

```typescript
const { schema, entities } = buildSchema(db);

// schema: GraphQLSchema - Complete executable schema
// entities: Object containing:
//   - queries: Auto-generated query resolvers
//   - mutations: Auto-generated mutation resolvers
//   - types: GraphQL object types for each table
//   - inputs: GraphQL input types (filters, insert, update)
```

## Auto-Generated Operations

### Queries

For each table, `buildSchema` generates:

```graphql
type Query {
  # Get single record
  usersSingle(where: UsersFilters): UsersItem
  
  # Get multiple records
  users(
    where: UsersFilters
    orderBy: UsersOrderBy
    offset: Int
    limit: Int
  ): [UsersItem!]!
}
```

### Mutations

For each table, `buildSchema` generates:

```graphql
type Mutation {
  # Insert single record
  insertIntoUsers(values: UsersInsertInput!): UsersItem
  
  # Insert multiple records
  insertIntoUsersBatch(values: [UsersInsertInput!]!): [UsersItem!]!
  
  # Update records
  updateUsers(
    set: UsersUpdateInput!
    where: UsersFilters
  ): [UsersItem!]!
  
  # Delete records  
  deleteFromUsers(where: UsersFilters): [UsersItem!]!
}
```

## Customizing Schema

Use `entities` to build custom schemas:

```typescript
import { buildSchema } from 'drizzle-graphql';
import { 
  GraphQLList, 
  GraphQLNonNull, 
  GraphQLObjectType, 
  GraphQLSchema 
} from 'graphql';
import { createYoga } from 'graphql-yoga';
import { createServer } from 'node:http';
import * as dbSchema from './schema';

const db = drizzle({ schema: dbSchema });
const { entities } = buildSchema(db);

// Build custom schema with selected operations
const schema = new GraphQLSchema({
  query: new GraphQLObjectType({
    name: 'Query',
    fields: {
      // Include only specific auto-generated queries
      users: entities.queries.users,
      customer: entities.queries.customersSingle,
      
      // Add custom queries
      customUsers: {
        // Reuse types from generated schema
        type: new GraphQLList(new GraphQLNonNull(entities.types.UsersItem)),
        args: {
          // Reuse inputs from generated schema
          where: { type: entities.inputs.UsersFilters }
        },
        resolve: async (source, args, context, info) => {
          // Custom logic
          const result = await db.select(dbSchema.users).where()...
          return result;
        }
      }
    }
  }),
  
  // Include all auto-generated mutations
  mutation: new GraphQLObjectType({
    name: 'Mutation',
    fields: entities.mutations
  }),
  
  // Include types for schema introspection
  types: [
    ...Object.values(entities.types),
    ...Object.values(entities.inputs)
  ]
});

const yoga = createYoga({ schema });
const server = createServer(yoga);
server.listen(4000);
```

## Entities Structure

### entities.queries

Contains all auto-generated query field configs:

```typescript
entities.queries = {
  // For each table, two queries:
  users: FieldConfig,           // List query
  usersSingle: FieldConfig,     // Single record query
  posts: FieldConfig,
  postsSingle: FieldConfig,
  // ...for each table
}
```

### entities.mutations

Contains all auto-generated mutation field configs:

```typescript
entities.mutations = {
  // For each table, four mutations:
  insertIntoUsers: FieldConfig,
  insertIntoUsersBatch: FieldConfig,
  updateUsers: FieldConfig,
  deleteFromUsers: FieldConfig,
  // ...for each table
}
```

### entities.types

Contains GraphQL object types for each table:

```typescript
entities.types = {
  UsersItem: GraphQLObjectType,
  PostsItem: GraphQLObjectType,
  // ...for each table
}
```

### entities.inputs

Contains input types for operations:

```typescript
entities.inputs = {
  // Filter inputs
  UsersFilters: GraphQLInputObjectType,
  
  // Insert inputs
  UsersInsertInput: GraphQLInputObjectType,
  
  // Update inputs
  UsersUpdateInput: GraphQLInputObjectType,
  
  // Order by inputs
  UsersOrderBy: GraphQLInputObjectType,
  
  // ...for each table
}
```

## Example: Drizzle Schema to GraphQL

### Drizzle Schema

```typescript
// schema.ts
import { pgTable, text, integer, timestamp } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: integer().generatedAlwaysAsIdentity().primaryKey(),
  name: text().notNull(),
  email: text().notNull().unique(),
  createdAt: timestamp().defaultNow()
});

export const posts = pgTable('posts', {
  id: integer().generatedAlwaysAsIdentity().primaryKey(),
  title: text().notNull(),
  content: text(),
  authorId: integer().references(() => users.id)
});
```

### Generated GraphQL Schema

```graphql
type UsersItem {
  id: Int!
  name: String!
  email: String!
  createdAt: String
}

type PostsItem {
  id: Int!
  title: String!
  content: String
  authorId: Int
}

input UsersFilters {
  id: IntFilter
  name: StringFilter
  email: StringFilter
  createdAt: StringFilter
}

input UsersInsertInput {
  name: String!
  email: String!
  createdAt: String
}

input UsersUpdateInput {
  name: String
  email: String
  createdAt: String
}

type Query {
  users(
    where: UsersFilters
    orderBy: UsersOrderBy
    offset: Int
    limit: Int
  ): [UsersItem!]!
  
  usersSingle(where: UsersFilters): UsersItem
  
  posts(
    where: PostsFilters
    orderBy: PostsOrderBy
    offset: Int
    limit: Int
  ): [PostsItem!]!
  
  postsSingle(where: PostsFilters): PostsItem
}

type Mutation {
  insertIntoUsers(values: UsersInsertInput!): UsersItem
  insertIntoUsersBatch(values: [UsersInsertInput!]!): [UsersItem!]!
  updateUsers(set: UsersUpdateInput!, where: UsersFilters): [UsersItem!]!
  deleteFromUsers(where: UsersFilters): [UsersItem!]!
  
  insertIntoPosts(values: PostsInsertInput!): PostsItem
  insertIntoPostsBatch(values: [PostsInsertInput!]!): [PostsItem!]!
  updatePosts(set: PostsUpdateInput!, where: PostsFilters): [PostsItem!]!
  deleteFromPosts(where: PostsFilters): [PostsItem!]!
}
```

## Common Patterns

### Adding Authentication

```typescript
import { buildSchema } from 'drizzle-graphql';
import { GraphQLObjectType, GraphQLSchema, GraphQLString } from 'graphql';

const { entities } = buildSchema(db);

// Wrap resolvers with auth check
function withAuth(fieldConfig) {
  const originalResolve = fieldConfig.resolve;
  return {
    ...fieldConfig,
    resolve: async (source, args, context, info) => {
      if (!context.user) {
        throw new Error('Unauthorized');
      }
      return originalResolve(source, args, context, info);
    }
  };
}

const schema = new GraphQLSchema({
  query: new GraphQLObjectType({
    name: 'Query',
    fields: {
      // Public queries
      posts: entities.queries.posts,
      
      // Protected queries
      users: withAuth(entities.queries.users)
    }
  }),
  mutation: new GraphQLObjectType({
    name: 'Mutation',
    fields: Object.fromEntries(
      Object.entries(entities.mutations).map(([name, config]) => [
        name,
        withAuth(config)
      ])
    )
  })
});
```

### Adding Custom Resolvers

```typescript
const { entities } = buildSchema(db);

const schema = new GraphQLSchema({
  query: new GraphQLObjectType({
    name: 'Query',
    fields: {
      // Auto-generated queries
      ...entities.queries,
      
      // Custom query
      usersByAge: {
        type: new GraphQLList(entities.types.UsersItem),
        args: {
          minAge: { type: GraphQLInt },
          maxAge: { type: GraphQLInt }
        },
        resolve: async (_, { minAge, maxAge }) => {
          return db.select()
            .from(users)
            .where(and(
              gt(users.age, minAge),
              lt(users.age, maxAge)
            ));
        }
      }
    }
  })
});
```

### Pagination Pattern

```typescript
const { entities } = buildSchema(db);

// GraphQL query with pagination
const paginatedUsers = {
  type: new GraphQLObjectType({
    name: 'PaginatedUsers',
    fields: {
      data: { type: new GraphQLList(entities.types.UsersItem) },
      total: { type: GraphQLInt },
      hasMore: { type: GraphQLBoolean }
    }
  }),
  args: {
    offset: { type: GraphQLInt, defaultValue: 0 },
    limit: { type: GraphQLInt, defaultValue: 10 },
    where: { type: entities.inputs.UsersFilters }
  },
  resolve: async (_, { offset, limit, where }) => {
    const [data, countResult] = await Promise.all([
      db.select().from(users).offset(offset).limit(limit),
      db.select({ count: count() }).from(users)
    ]);
    
    const total = countResult[0].count;
    return {
      data,
      total,
      hasMore: offset + limit < total
    };
  }
};
```

### Combining with Apollo Federation

```typescript
import { buildSchema } from 'drizzle-graphql';
import { buildSubgraphSchema } from '@apollo/subgraph';

const { entities } = buildSchema(db);

// Add federation directives to type definitions
const typeDefs = gql`
  extend schema @link(url: "https://specs.apollo.dev/federation/v2.0", import: ["@key"])
  
  type User @key(fields: "id") {
    id: Int!
    name: String!
    email: String!
  }
`;

// Build federated subgraph
const schema = buildSubgraphSchema([
  { typeDefs, resolvers: { User: entities.types.UsersItem } }
]);
```

## Filter Types

Generated filter inputs support standard operations:

```graphql
input IntFilter {
  eq: Int
  ne: Int
  gt: Int
  gte: Int
  lt: Int
  lte: Int
  in: [Int!]
  notIn: [Int!]
  isNull: Boolean
}

input StringFilter {
  eq: String
  ne: String
  gt: String
  gte: String
  lt: String
  lte: String
  in: [String!]
  notIn: [String!]
  like: String
  ilike: String
  isNull: Boolean
}
```

## Usage Examples

### Query with Filters

```graphql
query {
  users(where: { 
    name: { like: "%John%" }
    createdAt: { gt: "2024-01-01" }
  }, limit: 10) {
    id
    name
    email
  }
}
```

### Insert Mutation

```graphql
mutation {
  insertIntoUsers(values: { 
    name: "Jane Doe"
    email: "jane@example.com"
  }) {
    id
    name
    email
  }
}
```

### Update Mutation

```graphql
mutation {
  updateUsers(
    set: { name: "John Smith" }
    where: { id: { eq: 1 } }
  ) {
    id
    name
  }
}
```

### Delete Mutation

```graphql
mutation {
  deleteFromUsers(where: { id: { eq: 1 } }) {
    id
  }
}
```

## External Resources

- [Official Documentation](https://orm.drizzle.team/docs/graphql)
- [GitHub Repository](https://github.com/drizzle-team/drizzle-orm/tree/main/drizzle-graphql)
- [Apollo Server](https://www.apollographql.com/docs/apollo-server/)
- [GraphQL Yoga](https://the-guild.dev/graphql/yoga-server)
