# XQuery (eXtended Query)

XQuery is a sophisticated TypeScript wrapper for TanStack React Query, designed to enhance developer productivity with OpenAPI-generated clients. It enables developers to build and execute queries using fully type-safe factories instead of managing query keys manually, providing robust compile-time safety, excellent IDE support, and automatic synchronization between related queries.

## Key Features

### Type Safety & Integration
- 🛡️ Complete TypeScript type inference from your API client
- 🔑 Automatic query key management based on namespaces and parameters
- 🔄 Seamless integration with OpenAPI-generated clients
- 🚫 Type-safe query and mutation definitions

### Query Management
- ⚡ Actions pattern combining queries and mutations in one abstraction
- 🔄 Automatic invalidation and refreshing of related queries
- 🛠️ Support for parameterized queries with type safety
- 📦 Composable query components

### Developer Experience
- 💡 Full IDE IntelliSense support
- 🔧 Refactoring-friendly design
- 📝 Clear and concise API
- 🧩 Built-in solutions for common patterns (auto-save, infinite scroll)

## Installation

```bash
npm install @eleven-am/xquery
```

This package requires the following peer dependencies:

```bash
npm install @tanstack/react-query react react-dom
```

## Core Concepts

This library is designed to streamline the process of working with TanStack Query by providing factories and utilities that make it easier to create type-safe, reusable queries and mutations.

### Automatic Query Key Management

One of the main benefits of xQuery is automatic query key management. When you create queries using the factory functions, the library automatically generates and manages query keys based on:

1. The namespace you provide
2. The property name in your query definition
3. Any parameters passed to parameterized queries

This eliminates the need to manually define and track query keys throughout your application, reducing errors and inconsistencies.

### OpenAPI Client Integration

xQuery is designed to work seamlessly with OpenAPI-generated clients. It maintains complete type safety from your API definitions all the way through to your React components.

### Actions Pattern

The Actions pattern is a unique feature that combines query and mutation capabilities:

- **Initial Data Loading**: Actions use queries to load initial data
- **Data Modification**: They provide mutation functions to update that data
- **Automatic Synchronization**: When mutations occur, related queries are automatically invalidated and refreshed
- **Consistent State**: Your UI always reflects the latest state of your data

### Query Factory

The `queryFactory` function creates a factory for generating queries, mutations, actions, and infinite queries with consistent type safety.

## Usage Examples

### Setting up the Factory

```typescript
import { queryFactory } from '@eleven-am/xquery';

// Define your API client type
interface ApiClient {
  getUsers: () => Promise<{ data: User[], error: Error }>;
  getUser: (id: string) => Promise<{ data: User, error: Error }>;
  createUser: (data: UserInput) => Promise<{ data: User, error: Error }>;
  // ... other API methods
}

// Create a query factory
const factory = queryFactory<ApiClient, Error>({
  clientGetter: (signal) => {
    // Return your API client instance
    return apiClient;
  },
  queryClientGetter: () => {
    // Return your QueryClient instance
    return queryClient;
  },
  mapResponse: (shouldToast) => {
    // Map the response and handle errors
    return (response) => {
      if (response.error) {
        if (shouldToast) {
          // Display error toast
        }
        throw response.error;
      }
      return response.data;
    };
  }
});
```

### Creating Queries

```typescript
const userQueries = factory.createQueries('users', {
  list: {
    queryFn: (client) => client.getUsers(),
    staleTime: 1000 * 60 * 5, // 5 minutes
  },
  detail: (id: string) => ({
    queryFn: (client) => client.getUser(id),
    queryKey: [id],
  }),
});

// Use in components
function UsersList() {
  const users = useQuery(userQueries.list);
  // ...
}

function UserDetail({ id }) {
  const user = useQuery(userQueries.detail(id));
  // ...
}
```

### Creating Mutations

```typescript
const userMutations = factory.createMutations({
  create: {
    mutationFn: (client, data: UserInput) => client.createUser(data),
    invalidateKeys: [userQueries.all.queryKey],
  },
});

// Use in components
function CreateUserForm() {
  const { mutate } = useMutation(userMutations.create);
  
  const handleSubmit = (data) => {
    mutate(data);
  };
  
  // ...
}
```

### Creating Actions (combined query + mutation)

Actions combine the power of queries and mutations in a single abstraction:

```typescript
const profileActions = factory.createActions('profile', {
  updateProfile: {
    // Query part - loads initial data
    queryFn: (client) => client.getProfile(),
    // Mutation part - updates the data
    mutationFn: (client, data) => client.updateProfile(data),
    // Automatically invalidates these queries when mutation completes
    invalidateKeys: [userQueries.all.queryKey],
  },
});

// Use in components
function ProfileEditor() {
  const { 
    data,       // Data from the query part
    mutate,     // Mutation function
    isPending,  // Loading state for the mutation
    ...rest     // All other query and mutation properties
  } = useAction(profileActions.updateProfile);
  
  // Both loads initial data AND provides a way to update it
  // After mutation, related queries are automatically refreshed
  
  const handleUpdate = (newData) => {
    mutate(newData);
    // After mutate completes, all queries with keys in invalidateKeys will refresh
  };
  
  // ...
}
```

### Auto-save functionality

```typescript
function ProfileEditorWithAutoSave() {
  const [data, setData] = useAutoSaveAction({
    delay: 1000, // Auto-save after 1 second of inactivity
    options: profileActions.updateProfile,
  });
  
  // Changes to data will automatically be saved after the delay
  // ...
}
```

### Infinite Scrolling

```typescript
const postsInfinite = factory.createInfiniteQueries('posts', {
  feed: {
    queryFn: (client, page) => client.getPosts(page),
  },
});

function PostsFeed() {
  const [posts, lastElementRef] = useInfiniteScroll(postsInfinite.feed);
  
  return (
    <div>
      {posts.map((post, index) => (
        <div key={post.id}>
          {/* Post content */}
          {index === posts.length - 1 && <div ref={lastElementRef} />}
        </div>
      ))}
    </div>
  );
}
```

## Additional Hooks

- `usePrevious`: Track the previous value of a variable
- `useTimer`: Controlled timeouts with start/stop functionality
- `useIsVisible`: IntersectionObserver hook to detect when elements are visible

## Type Safety

This library is built with TypeScript and provides comprehensive type safety. The factory functions infer types from your API client and ensure type consistency throughout your application.

## License

GPL-3.0

## Author

Roy OSSAI
