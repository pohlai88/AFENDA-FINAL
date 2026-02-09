# `app/`

[← Back to root README](../README.md)

## What lives here

- **App Router routes and layouts** (`layout.tsx`, `page.tsx`, route handlers in `app/api/**/route.ts`)
- Route-segment colocation (components or helpers near routes, if needed)

## Route groups / URLs

This app uses route groups:

- `(public)`: public pages like `/` and `/login`
- `(app)`: the authenticated app shell under `/app/*`

Key routes:

- `/`: public home
- `/login`: auth entry
- `/app`: authenticated shell home
- `/app/modules`: module registry
- `/app/modules/[slug]`: iframe/embed modules
- `/components`: UI playground
- `/api/v1/*`: API routes using the standard envelope

## Performance Optimizations

### Next.js production checklist (applied)

- **Root layout**: `reactStrictMode`, `poweredByHeader: false`, explicit viewport metadata; root uses `headers()` for CSP nonce (intentional dynamic).
- **Loading/error**: Segment-level `loading.tsx` and `error.tsx` across (app), (public), magicdrive, magictodo, tenancy, admin; `global-error.tsx` and `global-not-found.tsx` for full-app fallbacks.
- **Proxy**: Next.js 16 `proxy.ts` (replaces deprecated middleware); matcher limited to app/API routes; auth redirect and tenant header injection.
- **Bundle**: `optimizePackageImports` for Radix, workspace packages, Neon Auth; Serwist PWA with cache-on-navigation; heavy UI (e.g. HealthHistoryChart) lazy-loaded with `next/dynamic`.
- **SEO**: `metadataBase`, sitemap, robots, OG/twitter metadata, JSON-LD in layout.
- **Images**: Use `next/image` for stable URLs (CMS, static assets). For blob or transient thumbnail URLs (e.g. MagicDrive thumbnails), keep `<img>` with `eslint-disable-next-line @next/next/no-img-element` and appropriate `alt`/error handling.

### Proxy Middleware (`proxy.ts`)

The proxy middleware has been enhanced to:

- Generate unique request IDs for tracing
- Propagate tenant context from cookies
- Use standardized constants from `lib/constants`

```typescript
// Headers injected by proxy
x-request-id: unique-id-for-tracing
x-tenant-id: tenant-context (if authenticated)
```

### API Routes

API routes follow optimized patterns:

- Use enhanced API client with caching
- Implement proper error handling with Result type
- Use standardized constants for status codes
- Include request IDs for debugging

```typescript
// Example API route
import { success, error } from "@/lib/server/api/response";
import { HTTP_STATUS, API_ERROR_CODES } from "@/lib/constants";

export async function GET(request: Request) {
  try {
    const data = await fetchResource();
    return success(data);
  } catch (err) {
    return error(
      "Failed to fetch resource",
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
      API_ERROR_CODES.INTERNAL_ERROR,
    );
  }
}
```

### Client Components

Client components leverage optimized utilities:

- Debounced search inputs
- Cached API calls
- Error boundaries with Result type
- Performance monitoring

## Best Practices

### Route Handlers

1. **Use API Helpers**: Import from `lib/server/api/*`
2. **Validate Input**: Use Zod schemas from `lib/contracts/*`
3. **Handle Errors**: Use standardized error classes
4. **Cache Responses**: Use appropriate cache tags

### Pages and Layouts

1. **Server Components**: Default for better performance
2. **Client Components**: Only when needed for interactivity
3. **Data Fetching**: Use Server Components when possible
4. **Loading States**: Implement loading.tsx and error.tsx

### Authentication Flow

1. **Public Routes**: No auth required
2. **Protected Routes**: Redirect to login if not authenticated
3. **Role-based Access**: Check permissions in middleware
4. **Session Management**: Use the repository auth system (Neon Auth) with proper configuration

## Request Flow

1. **Request arrives** → Proxy middleware injects headers
2. **Authentication check** → Verify session and permissions
3. **Route handler** → Process request with optimized helpers
4. **Response** → Consistent envelope format with proper headers

## Performance Tips

### For API Routes

```typescript
// Good: Use caching for GET requests
export async function GET() {
  revalidateTag("users"); // Set cache tag
  const data = await getUsers();
  return success(data);
}

// Good: Clear cache on mutations
export async function POST() {
  const result = await createUser(data);
  revalidateTag("users"); // Invalidate cache
  return success(result);
}
```

### For Pages

```typescript
// Good: Server component for data fetching
export default async function UserPage({ params }: { params: { id: string } }) {
  const user = await getUser(params.id)
  return <UserProfile user={user} />
}

// Good: Client component with debounced input
'use client'
export default function SearchInput() {
  const [query, setQuery] = useState('')
  const debouncedQuery = useDebounce(query, 300)

  useEffect(() => {
    if (debouncedQuery) {
      search(debouncedQuery)
    }
  }, [debouncedQuery])
}
```

## Notes

- Route handlers should use `lib/server/api/*` helpers for consistent envelopes.
- Request headers like `x-request-id` and (optionally) `x-tenant-id` are injected by the proxy middleware in `proxy.ts`.
- Use standardized constants from `lib/constants` instead of magic strings.
- Leverage the enhanced API client for caching and retry logic.
- Implement proper error handling with the Result type pattern.
