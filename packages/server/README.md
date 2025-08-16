# @magic-rpc/server

Server-side Magic RPC handler with GraphQL-like resolver mechanism for efficient data fetching and field resolution.

## Installation

```bash
npm install @magic-rpc/server
```

## Usage

```typescript
import { RpcHandler } from '@magic-rpc/server';
import DataLoader from 'dataloader';

// Define your RPC methods
const schema = {
  getUser: [GetUserInputSchema, GetUserOutputSchema],
  getUserPosts: [GetPostsInputSchema, GetPostsOutputSchema],
};

// Create efficient data loaders
function createLoaders() {
  return {
    User: new DataLoader(async (ids) => {
      return ids.map((id) => db.users.get(id));
    }),
  };
}

// Define resolvers for nested fields
const resolvers = {
  User: {
    avatar: {
      type: "Asset",
      resolve: async (user, context) => {
        return context.loaders.Asset.load(user.avatarId);
      },
    },
  },
};

// Create RPC handler
const rpc = new RpcHandler({
  schema,
  handlers: {
    getUser: async ({ input }) => {
      return db.users.get(input.userId);
    },
  },
  types: { User: UserSchema },
  resolvers,
  createLoaders,
});

// Handle requests
const result = await rpc.handle({
  method: "getUser",
  input: { userId: "123" },
  mappings: { avatar: 1 }
}, context);
```

## Features

- **RPC Method Handling**: Define methods with input/output validation using Hyperstruct schemas
- **GraphQL-like Resolvers**: Resolve nested fields on-demand based on client mappings
- **DataLoader Integration**: Automatic batching and caching for efficient data fetching
- **Type Safety**: Full TypeScript support with inferred types
- **Flexible Architecture**: Pluggable loaders and custom resolvers

## API Reference

See the [main README](../../README.md) for detailed API documentation.