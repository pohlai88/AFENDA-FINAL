# Zustand Best Practices

Following official Zustand documentation:
- [Advanced TypeScript](https://zustand.docs.pmnd.rs/guides/advanced-typescript)
- [Next.js Guide](https://zustand.docs.pmnd.rs/guides/nextjs)
- [Slices Pattern](https://zustand.docs.pmnd.rs/guides/slices-pattern)
- [Persist Middleware](https://zustand.docs.pmnd.rs/middlewares/persist)

## Table of Contents

1. [Basic Store Creation](#basic-store-creation)
2. [TypeScript Patterns](#typescript-patterns)
3. [Next.js App Router](#nextjs-app-router)
4. [Slices Pattern](#slices-pattern)
5. [Persistence](#persistence)
6. [Middleware](#middleware)
7. [Testing](#testing)

---

## Basic Store Creation

### Simple Store (Global)

```typescript
import { create } from 'zustand'

interface BearState {
  bears: number
  increase: (by: number) => void
}

// Note: create<T>()(...) - extra parentheses for TypeScript
const useBearStore = create<BearState>()((set) => ({
  bears: 0,
  increase: (by) => set((state) => ({ bears: state.bears + by })),
}))
```

### Using the Store

```typescript
// In component - always use selectors
const bears = useBearStore((state) => state.bears)
const increase = useBearStore((state) => state.increase)

// For objects, use shallow to prevent unnecessary re-renders
import { shallow } from 'zustand/shallow'
const { bears, increase } = useBearStore(
  (state) => ({ bears: state.bears, increase: state.increase }),
  shallow
)
```

---

## TypeScript Patterns

### Separate State and Actions

```typescript
// Recommended: separate state and actions types
type CounterState = {
  count: number
}

type CounterActions = {
  increment: () => void
  decrement: () => void
  reset: () => void
}

type CounterStore = CounterState & CounterActions

const defaultState: CounterState = { count: 0 }

const useCounterStore = create<CounterStore>()((set) => ({
  ...defaultState,
  increment: () => set((s) => ({ count: s.count + 1 })),
  decrement: () => set((s) => ({ count: s.count - 1 })),
  reset: () => set(defaultState),
}))
```

### Using `combine` for Inference

```typescript
import { create } from 'zustand'
import { combine } from 'zustand/middleware'

// State is inferred from the first argument
const useBearStore = create(
  combine({ bears: 0 }, (set) => ({
    increase: (by: number) => set((state) => ({ bears: state.bears + by })),
  }))
)
```

---

## Next.js App Router

### Key Principles

1. **No global stores** - Create stores per request on the server
2. **RSCs cannot use stores** - Only Client Components can read/write state
3. **Use Context for client-side state**

### Store Factory Pattern

```typescript
// src/stores/counter-store.ts
import { createStore } from 'zustand/vanilla'

export type CounterState = {
  count: number
}

export type CounterActions = {
  increment: () => void
  decrement: () => void
}

export type CounterStore = CounterState & CounterActions

export const defaultInitState: CounterState = {
  count: 0,
}

export const createCounterStore = (
  initState: CounterState = defaultInitState,
) => {
  return createStore<CounterStore>()((set) => ({
    ...initState,
    increment: () => set((state) => ({ count: state.count + 1 })),
    decrement: () => set((state) => ({ count: state.count - 1 })),
  }))
}
```

### Store Provider

```typescript
// src/providers/counter-store-provider.tsx
'use client'

import { type ReactNode, createContext, useContext, useState } from 'react'
import { useStore } from 'zustand'
import { type CounterStore, createCounterStore } from '@/stores/counter-store'

export type CounterStoreApi = ReturnType<typeof createCounterStore>

export const CounterStoreContext = createContext<CounterStoreApi | undefined>(
  undefined,
)

export function CounterStoreProvider({ children }: { children: ReactNode }) {
  // useState ensures store is created once per component instance
  const [store] = useState(() => createCounterStore())
  
  return (
    <CounterStoreContext.Provider value={store}>
      {children}
    </CounterStoreContext.Provider>
  )
}

export function useCounterStore<T>(
  selector: (store: CounterStore) => T,
): T {
  const store = useContext(CounterStoreContext)
  if (!store) {
    throw new Error('useCounterStore must be used within CounterStoreProvider')
  }
  return useStore(store, selector)
}
```

### Use in Layout

```typescript
// src/app/layout.tsx
import { CounterStoreProvider } from '@/providers/counter-store-provider'

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html>
      <body>
        <CounterStoreProvider>{children}</CounterStoreProvider>
      </body>
    </html>
  )
}
```

### Use in Client Component

```typescript
// src/components/counter.tsx
'use client'

import { useCounterStore } from '@/providers/counter-store-provider'

export function Counter() {
  const count = useCounterStore((state) => state.count)
  const increment = useCounterStore((state) => state.increment)
  
  return (
    <div>
      <span>{count}</span>
      <button onClick={increment}>+1</button>
    </div>
  )
}
```

---

## Slices Pattern

### Define Slices

```typescript
import type { StateCreator } from 'zustand'

interface BearSlice {
  bears: number
  addBear: () => void
  eatFish: () => void
}

interface FishSlice {
  fishes: number
  addFish: () => void
}

type BoundStore = BearSlice & FishSlice

// Note the StateCreator type parameters:
// StateCreator<FullState, Middlewares, [], SliceType>
const createBearSlice: StateCreator<
  BoundStore,
  [],
  [],
  BearSlice
> = (set) => ({
  bears: 0,
  addBear: () => set((state) => ({ bears: state.bears + 1 })),
  eatFish: () => set((state) => ({ fishes: state.fishes - 1 })),
})

const createFishSlice: StateCreator<
  BoundStore,
  [],
  [],
  FishSlice
> = (set) => ({
  fishes: 0,
  addFish: () => set((state) => ({ fishes: state.fishes + 1 })),
})
```

### Combine Slices

```typescript
import { create } from 'zustand'

const useBoundStore = create<BoundStore>()((...a) => ({
  ...createBearSlice(...a),
  ...createFishSlice(...a),
}))
```

### Slices with Devtools

When using devtools, add the mutator to the StateCreator:

```typescript
const createBearSlice: StateCreator<
  BoundStore,
  [['zustand/devtools', never]],
  [],
  BearSlice
> = (set) => ({
  bears: 0,
  addBear: () =>
    set(
      (state) => ({ bears: state.bears + 1 }),
      undefined,
      'bear/addBear' // Action name for devtools
    ),
})
```

---

## Persistence

### Basic Persistence

```typescript
import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

interface BearState {
  bears: number
  addBear: () => void
}

const useBearStore = create<BearState>()(
  persist(
    (set, get) => ({
      bears: 0,
      addBear: () => set({ bears: get().bears + 1 }),
    }),
    {
      name: 'bear-storage', // unique key in localStorage
    },
  ),
)
```

### Partial Persistence

```typescript
const useBearStore = create<BearState>()(
  persist(
    (set, get) => ({
      bears: 0,
      temporary: 'not persisted',
      addBear: () => set({ bears: get().bears + 1 }),
    }),
    {
      name: 'bear-storage',
      partialize: (state) => ({ bears: state.bears }), // Only persist bears
    },
  ),
)
```

### Version Migration

```typescript
const useBearStore = create<BearState>()(
  persist(
    (set) => ({
      bears: 0,
      honey: 0, // New field in v2
    }),
    {
      name: 'bear-storage',
      version: 2,
      migrate: (persistedState, version) => {
        if (version === 0) {
          // Migration from v0 to v2
          return { ...persistedState, honey: 0 }
        }
        return persistedState as BearState
      },
    },
  ),
)
```

### SessionStorage

```typescript
import { persist, createJSONStorage } from 'zustand/middleware'

const useSessionStore = create<SessionState>()(
  persist(
    (set) => ({ token: null }),
    {
      name: 'session',
      storage: createJSONStorage(() => sessionStorage),
    },
  ),
)
```

### SSR with skipHydration

```typescript
const useBearStore = create<BearState>()(
  persist(
    (set) => ({ bears: 0 }),
    {
      name: 'bear-storage',
      skipHydration: true, // Don't hydrate on server
    },
  ),
)

// Manually hydrate in useEffect
useEffect(() => {
  useBearStore.persist.rehydrate()
}, [])
```

---

## Middleware

### Middleware Order

Apply devtools last (outermost):

```typescript
import { create } from 'zustand'
import { devtools, persist, subscribeWithSelector } from 'zustand/middleware'

const useBearStore = create<BearState>()(
  devtools(
    persist(
      subscribeWithSelector(
        (set) => ({
          bears: 0,
          increase: (by) => set((state) => ({ bears: state.bears + by })),
        }),
      ),
      { name: 'bear-storage' },
    ),
    { name: 'BearStore' },
  ),
)
```

### Middleware Mutator Types

When using slices with middleware, declare the mutators:

| Middleware | Mutator Type |
|------------|--------------|
| `devtools` | `["zustand/devtools", never]` |
| `persist` | `["zustand/persist", PersistedState]` |
| `immer` | `["zustand/immer", never]` |
| `subscribeWithSelector` | `["zustand/subscribeWithSelector", never]` |

---

## Testing

### Reset Stores Between Tests

```typescript
// stores/counter-store.ts
const initialState = { count: 0 }

export const useCounterStore = create<CounterStore>()((set) => ({
  ...initialState,
  increment: () => set((s) => ({ count: s.count + 1 })),
  reset: () => set(initialState),
}))

// test file
afterEach(() => {
  useCounterStore.getState().reset()
})
```

### Mock Store for Component Tests

```typescript
import { createMockStore } from './_zustand.testing'

const mockStore = createMockStore({
  count: 5,
  increment: vi.fn(),
})

// Use with your provider
render(
  <StoreContext.Provider value={mockStore}>
    <Counter />
  </StoreContext.Provider>
)
```

### Test Store State

```typescript
import { getStoreState, setStoreState } from './_zustand.testing'

test('increment increases count', () => {
  setStoreState(useCounterStore, { count: 0 })
  
  useCounterStore.getState().increment()
  
  expect(getStoreState(useCounterStore).count).toBe(1)
})
```

---

## Utilities in This Package

### `createStoreContext`

Creates a Next.js-compatible store provider and hook:

```typescript
import { createStoreContext } from '@afenda/afenda/zustand'

const { Provider, useStore } = createStoreContext(createCounterStore)
```

### Slice Helpers

Pre-built slices for common patterns:

```typescript
import {
  createLoadingSlice,
  createPaginationSlice,
  createModalSlice,
  createSelectionSlice,
} from '@afenda/afenda/zustand'
```

### Persist Helpers

```typescript
import {
  createPersistConfig,
  createSessionPersistConfig,
  createMergeMigration,
  createVersionedMigration,
} from '@afenda/afenda/zustand'
```

### Testing Helpers

```typescript
import {
  createMockStore,
  getStoreState,
  setStoreState,
  waitForCondition,
  spyOnAction,
} from '@afenda/afenda/zustand'
```
