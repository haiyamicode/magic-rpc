// biome-ignore lint/suspicious/noExplicitAny: Generic default type
export interface RpcRequest<TInput = any> {
  method: string;
  input: TInput;
  mappings?: FieldMappings;
}

export interface RpcResponseError {
  code?: string;
  message: string;
  // biome-ignore lint/suspicious/noExplicitAny: Error data can be anything
  data?: any;
}
// biome-ignore lint/suspicious/noExplicitAny: Generic default type
export interface RpcResponse<TOutput = any> {
  result?: TOutput;
  error?: RpcResponseError;
}

import type { Infer, Struct } from "@haiyami/hyperstruct";

export type { Infer, Struct } from "@haiyami/hyperstruct";

export interface RpcClientConfig {
  baseUrl: string;
  timeout?: number;
  headers?: Record<string, string>;
  schema?: RpcSchema;
}

// Core schema types - shared between client and server
// biome-ignore lint/suspicious/noExplicitAny: Schema types are runtime validated
export type RpcMethodSchema = [any, any];
export type RpcSchema = Record<string, RpcMethodSchema>;

// Field mappings for GraphQL-like field selection
// biome-ignore lint/suspicious/noExplicitAny: Deep nested mappings
export type FieldMapping = 1 | Record<string, 1 | Record<string, any>>;
export type FieldMappings = Record<string, FieldMapping>;

// Type inference for client - extracts raw types from schema tuples
// biome-ignore lint/suspicious/noExplicitAny: Type inference utility
export type InferInput<T> = T extends [infer InputSchema, any]
  ? // biome-ignore lint/suspicious/noExplicitAny: Type inference utility
    InputSchema extends Struct<any, any>
    ? Infer<InputSchema>
    : // biome-ignore lint/suspicious/noExplicitAny: Type inference utility
      any
  : // biome-ignore lint/suspicious/noExplicitAny: Type inference utility
    any;
// biome-ignore lint/suspicious/noExplicitAny: Type inference utility
export type InferOutput<T> = T extends [any, infer OutputSchema]
  ? // biome-ignore lint/suspicious/noExplicitAny: Type inference utility
    OutputSchema extends Struct<any, any>
    ? Infer<OutputSchema>
    : // biome-ignore lint/suspicious/noExplicitAny: Type inference utility
      any
  : // biome-ignore lint/suspicious/noExplicitAny: Type inference utility
    any;

export type TypedRpcClient<TSchema extends RpcSchema> = {
  [K in keyof TSchema]: (
    input: InferInput<TSchema[K]>,
    mappings?: FieldMappings
  ) => Promise<InferOutput<TSchema[K]>>;
};
