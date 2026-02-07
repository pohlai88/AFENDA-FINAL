# Drizzle PostgreSQL Extensions

Complete reference for PostgreSQL extensions supported by Drizzle ORM.

## pg_vector

[pgvector](https://github.com/pgvector/pgvector) provides vector similarity search for embedding-based applications (AI/ML, RAG, semantic search).

### Vector Column Type

```typescript
import { pgTable, serial } from 'drizzle-orm/pg-core';
import { vector } from 'drizzle-orm/pg-core';

const items = pgTable('items', {
  id: serial().primaryKey(),
  embedding: vector({ dimensions: 384 }),  // 384-dimensional vector
});
```

### Vector Indexes

Choose index type based on dataset size and accuracy needs:

#### HNSW Index (Recommended for most cases)

```typescript
import { index, vector } from 'drizzle-orm/pg-core';

const items = pgTable('items', {
  embedding: vector({ dimensions: 384 }),
}, (table) => [
  // L2 distance (Euclidean)
  index('l2_idx').using('hnsw', table.embedding.op('vector_l2_ops')),
  
  // Cosine distance (most common for embeddings)
  index('cosine_idx').using('hnsw', table.embedding.op('vector_cosine_ops')),
  
  // Inner product
  index('ip_idx').using('hnsw', table.embedding.op('vector_ip_ops')),
]);
```

#### IVFFlat Index (Larger datasets)

```typescript
index('ivfflat_idx').using('ivfflat', table.embedding.op('vector_l2_ops'))
```

#### Distance Operators (pgvector 0.7.0+)

```typescript
// L1 distance (Manhattan)
index('l1_idx').using('hnsw', table.embedding.op('vector_l1_ops'))

// Hamming distance (binary vectors)
index('hamming_idx').using('hnsw', table.embedding.op('bit_hamming_ops'))

// Jaccard distance (binary vectors)
index('jaccard_idx').using('hnsw', table.embedding.op('bit_jaccard_ops'))
```

### Vector Helper Functions

```typescript
import { 
  l2Distance, 
  l1Distance, 
  innerProduct, 
  cosineDistance,
  hammingDistance,
  jaccardDistance,
} from 'drizzle-orm';

// Find similar items by L2 distance
const similar = await db
  .select()
  .from(items)
  .orderBy(l2Distance(items.embedding, [0.1, 0.2, 0.3]))
  .limit(10);

// Cosine similarity (1 - distance)
const similar = await db
  .select()
  .from(items)
  .orderBy(cosineDistance(items.embedding, queryVector))
  .limit(10);

// Get distance as column
const results = await db
  .select({
    id: items.id,
    distance: cosineDistance(items.embedding, queryVector),
  })
  .from(items)
  .orderBy(cosineDistance(items.embedding, queryVector))
  .limit(10);
```

### SQL Operators

| Function | SQL Operator | Use Case |
|----------|--------------|----------|
| `l2Distance` | `<->` | Euclidean distance |
| `l1Distance` | `<+>` | Manhattan distance |
| `innerProduct` | `<#>` | Inner product (negate for similarity) |
| `cosineDistance` | `<=>` | Cosine distance (most common) |
| `hammingDistance` | `<~>` | Binary vector distance |
| `jaccardDistance` | `<%>` | Binary vector distance |

### Subquery for Similar Items

```typescript
// Find items similar to item ID = 1
const subquery = db
  .select({ embedding: items.embedding })
  .from(items)
  .where(eq(items.id, 1));

const similar = await db
  .select()
  .from(items)
  .orderBy(l2Distance(items.embedding, subquery))
  .limit(5);
```

### Custom Distance Function

```typescript
import { sql, SQLWrapper, AnyColumn, TypedQueryBuilder } from 'drizzle-orm';

export function customDistance(
  column: SQLWrapper | AnyColumn,
  value: number[] | string[] | TypedQueryBuilder<any> | string,
): SQL {
  if (is(value, TypedQueryBuilder) || typeof value === 'string') {
    return sql`${column} <-> ${value}`;  // Your operator
  }
  return sql`${column} <-> ${JSON.stringify(value)}`;
}
```

### halfvec (Half-Precision)

For memory efficiency with large vectors:

```typescript
import { halfvec } from 'drizzle-orm/pg-core';

const items = pgTable('items', {
  embedding: halfvec({ dimensions: 1536 }),  // Half precision (16-bit)
});
```

## PostGIS

[PostGIS](https://postgis.net/) adds geospatial capabilities to PostgreSQL.

### Geometry Column Type

```typescript
import { pgTable, serial } from 'drizzle-orm/pg-core';
import { geometry } from 'drizzle-orm/pg-core';

const locations = pgTable('locations', {
  id: serial().primaryKey(),
  
  // Point geometry (tuple mode - default)
  geo: geometry('geo', { type: 'point' }),
  // Returns: [number, number]
  
  // Point geometry (xy mode)
  geoObj: geometry('geo_obj', { type: 'point', mode: 'xy' }),
  // Returns: { x: number, y: number }
  
  // With SRID (coordinate system)
  geoSrid: geometry('geo_srid', { 
    type: 'point', 
    mode: 'xy', 
    srid: 4326,  // WGS84 (GPS coordinates)
  }),
});
```

### Geometry Insert

```typescript
// Tuple mode
await db.insert(locations).values({
  geo: [40.7128, -74.0060],  // [lat, lng]
});

// XY mode
await db.insert(locations).values({
  geoObj: { x: 40.7128, y: -74.0060 },
});
```

### Geometry Indexes

```typescript
import { index } from 'drizzle-orm/pg-core';

const locations = pgTable('locations', {
  geom: geometry({ type: 'point' }),
}, (table) => [
  index('geom_idx').using('gist', table.geom),
]);
```

### Geometry Types

| Type | Description |
|------|-------------|
| `point` | Single coordinate |
| `linestring` | Line of points |
| `polygon` | Closed shape |
| `multipoint` | Collection of points |
| `multilinestring` | Collection of lines |
| `multipolygon` | Collection of polygons |
| `geometrycollection` | Mixed collection |

### Custom Geometry Types

```typescript
// For other geometry types, use string
const areas = pgTable('areas', {
  boundary: geometry('boundary', { type: 'polygon' }),
  route: geometry('route', { type: 'linestring' }),
});
```

### PostGIS Queries (Raw SQL)

```typescript
import { sql } from 'drizzle-orm';

// Distance between points (meters with geography)
const nearbyPlaces = await db
  .select()
  .from(locations)
  .where(
    sql`ST_DWithin(
      ${locations.geom}::geography,
      ST_SetSRID(ST_MakePoint(-74.0060, 40.7128), 4326)::geography,
      1000
    )`  // Within 1000 meters
  );

// Order by distance
const nearest = await db
  .select({
    id: locations.id,
    distance: sql<number>`ST_Distance(
      ${locations.geom}::geography,
      ST_SetSRID(ST_MakePoint(-74.0060, 40.7128), 4326)::geography
    )`,
  })
  .from(locations)
  .orderBy(sql`ST_Distance(${locations.geom}, ...)`)
  .limit(10);
```

## drizzle-kit Extension Filters

Exclude extension tables from introspection:

```typescript
// drizzle.config.ts
import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  dialect: 'postgresql',
  schema: './schema.ts',
  // Ignore PostGIS system tables
  extensionsFilters: ['postgis'],
});
```

## Complete pgvector Example

```typescript
import { 
  pgTable, serial, text, timestamp, index 
} from 'drizzle-orm/pg-core';
import { vector, cosineDistance } from 'drizzle-orm/pg-core';

// Documents with embeddings
export const documents = pgTable('documents', {
  id: serial().primaryKey(),
  title: text().notNull(),
  content: text().notNull(),
  embedding: vector({ dimensions: 1536 }),  // OpenAI ada-002
  createdAt: timestamp().defaultNow(),
}, (table) => [
  index('documents_embedding_idx')
    .using('hnsw', table.embedding.op('vector_cosine_ops')),
]);

// Semantic search function
async function semanticSearch(queryEmbedding: number[], limit = 10) {
  return db
    .select({
      id: documents.id,
      title: documents.title,
      content: documents.content,
      similarity: sql<number>`1 - ${cosineDistance(documents.embedding, queryEmbedding)}`,
    })
    .from(documents)
    .orderBy(cosineDistance(documents.embedding, queryEmbedding))
    .limit(limit);
}

// Insert with embedding
async function insertDocument(title: string, content: string, embedding: number[]) {
  await db.insert(documents).values({
    title,
    content,
    embedding,
  });
}
```

## Complete PostGIS Example

```typescript
import { 
  pgTable, serial, text, timestamp, index 
} from 'drizzle-orm/pg-core';
import { geometry } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

export const places = pgTable('places', {
  id: serial().primaryKey(),
  name: text().notNull(),
  location: geometry('location', { type: 'point', srid: 4326 }),
  createdAt: timestamp().defaultNow(),
}, (table) => [
  index('places_location_idx').using('gist', table.location),
]);

// Find places within radius
async function findNearby(lat: number, lng: number, radiusMeters: number) {
  return db
    .select({
      id: places.id,
      name: places.name,
      distance: sql<number>`ST_Distance(
        ${places.location}::geography,
        ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326)::geography
      )`,
    })
    .from(places)
    .where(
      sql`ST_DWithin(
        ${places.location}::geography,
        ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326)::geography,
        ${radiusMeters}
      )`
    )
    .orderBy(sql`ST_Distance(...)`);
}
```

## Related References

- [drizzle-schema.md](./drizzle-schema.md) - Column types
- [drizzle-constraints.md](./drizzle-constraints.md) - Index types
- [drizzle-queries.md](./drizzle-queries.md) - Query patterns
