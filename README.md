# Magic RPC

**Type-safe JSON-RPC with GraphQL-like field resolution and automatic data loading.**

Magic RPC extends the JSON-RPC protocol to bridge the gap between traditional RPC and GraphQL by providing:

- **Simple RPC calls** with method names and typed parameters
- **GraphQL-style field selection** to fetch only the data you need
- **Automatic batching and caching** to prevent N+1 queries
- **Full TypeScript safety** with compile-time validation

Instead of making multiple API calls or overfetching data, clients send JSON-RPC requests specifying exactly which nested fields they want resolved. The server intelligently batches database queries and resolves relationships on-demand, returning structured JSON responses.

## Why Magic RPC?

**The Problem**: Traditional REST APIs either require multiple round trips for related data or return massive objects with unnecessary fields. GraphQL solves this but adds complexity with its query language and schema definition.

**The Solution**: Magic RPC gives you GraphQL's selective field resolution with JSON-RPC's simplicity. Define typed methods, specify which nested fields to resolve in standard JSON requests, and let the library handle efficient data fetching automatically.

**Key Benefits**:

- 🎯 **Precise data fetching** - Request exactly the fields you need
- ⚡ **Automatic optimization** - Built-in batching prevents N+1 queries
- 🔒 **Type safety** - Full TypeScript support with runtime validation
- 🚀 **Simple integration** - Standard JSON-RPC protocol, no complex query language
- 🔧 **Flexible** - Works with any data source or server framework

## Packages

This is a monorepo containing:

- **[@magic-rpc/server](./packages/server)** - Server-side RPC handler with GraphQL-like resolvers
- **[@magic-rpc/client](./packages/client)** - Type-safe client for making RPC calls

## Installation

```bash
# Server package
yarn add @magic-rpc/server

# Client package  
yarn add @magic-rpc/client
```

## Quick Example

### Server Setup

```typescript
import { RpcHandler } from "@magic-rpc/server";

// Simple JSON-RPC call
const user = await rpc.handle({
  method: "getUser",
  input: { userId: "123" },
});

// With nested field resolution (GraphQL-like) via JSON
const userWithRelations = await rpc.handle({
  method: "getUser",
  input: { userId: "123" },
  mappings: {
    avatar: 1, // Resolve user's avatar
    posts: {
      // Resolve user's posts
      comments: {
        // And their comments
        author: 1, // And comment authors
      },
    },
  },
});
```

### Client Usage

```typescript
import { RpcClient, createTypedClient } from "@magic-rpc/client";

// Basic client
const client = new RpcClient({ baseUrl: "http://localhost:3000/json-rpc" });
const user = await client.call({
  method: "getUser",
  input: { userId: "123" },
  mappings: { avatar: 1 },
});

// Type-safe client
const typedClient = createTypedClient(schema, {
  baseUrl: "http://localhost:3000/json-rpc",
});
const user = await typedClient.getUser({ userId: "123" }, { avatar: 1 });
```

The request/response format follows JSON-RPC conventions with additional `mappings` field for field selection:

## Core Concepts

### 1. RPC Schema

Define your RPC methods with input and output schemas:

```typescript
const rpcSchema = {
  getUser: [GetUserInputSchema, GetUserOutputSchema],
  getUserPosts: [GetPostsInputSchema, GetPostsOutputSchema],
};
```

### 2. Type Definitions

Register your domain types for the resolver system:

```typescript
const types = {
  User: UserSchema,
  Post: PostSchema,
  Comment: CommentSchema,
};
```

### 3. Resolvers

Define how to resolve nested fields (similar to GraphQL):

```typescript
const resolvers = {
  User: {
    avatar: {
      type: "Asset",
      resolve: async (user, context) => {
        return context.loaders.Asset.load(user.avatarId);
      },
    },
  },
  Post: {
    user: {
      type: "User",
      resolve: async (post, context) => {
        return context.loaders.User.load(post.userId);
      },
    },
  },
};
```

### 4. DataLoaders

Create efficient data loaders for batching:

```typescript
function createLoaders() {
  return {
    User: new DataLoader(async (ids) => {
      // Batch fetch users
      return ids.map((id) => db.users.get(id));
    }),
  };
}
```

## Complete Example

See the [example package](./packages/example) for a full working demo showing:

- Server setup with RPC handlers and resolvers
- Efficient DataLoader batching
- GraphQL-like nested field resolution
- Type-safe client usage

```bash
# Run the example server
yarn example

# In another terminal, run the client
yarn workspace example client
```

## Field Mappings

The `mappings` parameter controls which relational fields to resolve:

- `1` - Resolve this field
- `{ someNestedEntity: 1 }` - Resolve nested relational entity inside the field
- Omitted relational fields are not resolved (remain as IDs or null).

Note: Only relational object fields need this mapping, normal value fields are included automatically, we do not support excluding normal fields from result since that only introduces extra inconsistency in response schema without any significant size savings.

This allows clients to request only the data they need, similar to GraphQL field selection.

## Development

```bash
# Install dependencies
yarn install

# Build all packages
yarn build

# Run development mode (watch)
yarn dev

# Run the example server
yarn example

# Run the example client
yarn workspace example client

# Lint and format code
yarn check

# Clean all build artifacts
yarn clean

# Type check all packages
yarn type-check

# Publish packages to npm
yarn npm-publish
```

## How It Works

**Traditional approach** (multiple API calls):

```typescript
const user = await api.getUser(userId);
const posts = await api.getUserPosts(userId);
const comments = await Promise.all(
  posts.map((post) => api.getPostComments(post.id))
); // N+1 queries!
```

**Magic RPC approach** (single optimized call):

```typescript
const result = await rpc.handle({
  method: "getUser",
  input: { userId },
  mappings: {
    posts: { comments: 1 }, // Specify what you need
  },
});
// Automatically batched, no N+1 queries
```

The library intelligently:

1. **Batches queries** using DataLoader to prevent N+1 problems
2. **Resolves only requested fields** based on your mappings
3. **Validates data** with runtime type checking
4. **Caches results** within the same request context

## API Reference

### RpcHandler

```typescript
new RpcHandler({
  schema: RpcSchema, // Method definitions
  handlers: RpcMethodHandlers, // Method implementations
  types: TypesSchema, // Type definitions
  resolvers: ResolverSchema, // Field resolvers
  createLoaders: Function, // DataLoader factory
  createCustomLoaders: Function, // Custom loader factory
  validateInput: boolean, // Validate inputs (default: true)
  validateOutput: boolean, // Validate outputs (default: true)
  coerceInput: boolean, // Coerce input types (default: true)
  maskOutput: boolean, // Mask extra output fields (default: true)
});
```

### Methods

- `handle(payload, context)` - Handle single RPC call
- `handleBatch(payloads, context)` - Handle multiple RPC calls
- `getHandler(method)` - Get method handler
- `getMethods()` - List available methods
- `getSchema(method)` - Get method schema

## License

MIT
