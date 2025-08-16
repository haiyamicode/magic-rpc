# Hami RPC

A standalone RPC server with GraphQL-like resolver mechanism for efficient data fetching and field resolution.

## Features

- **RPC Method Handling**: Define methods with input/output validation using Superstruct schemas
- **GraphQL-like Resolvers**: Resolve nested fields on-demand based on client mappings
- **DataLoader Integration**: Automatic batching and caching for efficient data fetching
- **Type Safety**: Full TypeScript support with inferred types
- **Flexible Architecture**: Pluggable loaders and custom resolvers

## Installation

```bash
npm install hami-rpc
```

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

## Usage Example

### Basic RPC Call

```typescript
const result = await rpcHandler.handle(
  {
    method: "getUser",
    input: { userId: "user1" },
  },
  context
);
```

### With Nested Resolution (GraphQL-like)

```typescript
const result = await rpcHandler.handle(
  {
    method: "getUser",
    input: { userId: "user1" },
    mappings: {
      avatar: 1, // Resolve avatar field
      followedUsers: {
        // Resolve followed users
        avatar: 1, // And their avatars
      },
    },
  },
  context
);
```

### Complex Nested Resolution

```typescript
const feed = await rpcHandler.handle(
  {
    method: "getFeed",
    input: { userId: "user1", limit: "10" },
    mappings: {
      posts: {
        user: {
          avatar: 1, // Post author's avatar
        },
        image: 1, // Post image
        comments: {
          // Post comments
          user: 1, // Comment author
        },
        isLiked: 1, // Dynamic field based on context
      },
    },
  },
  context
);
```

## Field Mappings

The `mappings` parameter controls which relational fields to resolve:

- `1` - Resolve this field
- `{ someNestedEntity: 1 }` - Resolve nested relational entity inside the field
- Omitted relational fields are not resolved (remain as IDs or null).

Note: Only relational object fields need this mapping, normal value fields are included automatically, we do not support excluding normal fields from result since that only introduces extra inconsistency in response schema without any significant size savings.

This allows clients to request only the data they need, similar to GraphQL field selection.

## Running the Example

```bash
# Install dependencies
npm install

# Build the library
npm run build

# Run the example
npx ts-node example/server.ts
```

## Benefits

1. **Efficient Data Fetching**: Only resolve requested fields
2. **Automatic Batching**: DataLoader prevents N+1 queries
3. **Type Safety**: Full TypeScript support
4. **Flexible**: Works with any data source
5. **Simple**: No complex query language, just RPC with mappings

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
