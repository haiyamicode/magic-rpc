# @magic-rpc/client

Type-safe client for making Magic RPC calls with support for field selection and automatic batching.

## Installation

```bash
npm install @magic-rpc/client
```

## Usage

### Basic Client

```typescript
import { RpcClient } from "@magic-rpc/client";

const client = new RpcClient({
  baseUrl: "http://localhost:3000/json-rpc",
  timeout: 5000,
  headers: {
    Authorization: "Bearer token",
  },
});

// Make RPC calls
const user = await client.call({
  method: "getUser",
  input: { userId: "123" },
  mappings: {
    avatar: 1,
    posts: { comments: 1 },
  },
});

// Batch multiple calls
const results = await client.batch([
  { method: "getUser", input: { userId: "1" } },
  { method: "getUser", input: { userId: "2" } },
]);
```

### Type-Safe Client

```typescript
import { createTypedClient } from "@magic-rpc/client";

// Define your schema (shared with server)
const schema = {
  getUser: [GetUserInputSchema, GetUserOutputSchema],
  getUserPosts: [GetPostsInputSchema, GetPostsOutputSchema],
};

const client = createTypedClient(schema, {
  baseUrl: "http://localhost:3000/json-rpc",
});

// Fully typed method calls
const user = await client.getUser(
  { userId: "123" }, // Typed input
  { avatar: 1, posts: 1 } // Optional field mappings
);
```

## Features

- **Type Safety**: Full TypeScript support with inferred types
- **Field Selection**: Specify which nested fields to resolve
- **Automatic Batching**: Batch multiple requests efficiently
- **Error Handling**: Proper error propagation from server
- **Timeout Support**: Configurable request timeouts
- **Custom Headers**: Support for authentication and custom headers

## API Reference

### RpcClient

```typescript
class RpcClient {
  constructor(config: RpcClientConfig);
  call<T>(request: RpcRequest): Promise<T>;
  batch<T>(requests: RpcRequest[]): Promise<T[]>;
}
```

### createTypedClient

```typescript
function createTypedClient<TSchema>(
  schema: TSchema,
  config: RpcClientConfig
): TypedRpcClient<TSchema>;
```

### Types

```typescript
interface RpcClientConfig {
  baseUrl: string;
  timeout?: number;
  headers?: Record<string, string>;
}

interface RpcRequest {
  method: string;
  input: any;
  mappings?: Record<string, any>;
}
```
