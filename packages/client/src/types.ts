export interface RpcRequest<TInput = any> {
  method: string;
  input: TInput;
  mappings?: FieldMappings;
}

export interface RpcResponse<TOutput = any> {
  result?: TOutput;
  error?: {
    code: number;
    message: string;
    data?: any;
  };
}

import { Infer, Struct } from "@haiyami/hyperstruct";

export interface RpcClientConfig {
  baseUrl: string;
  timeout?: number;
  headers?: Record<string, string>;
}

// Core schema types - shared between client and server  
export type RpcMethodSchema = [any, any];
export type RpcSchema = Record<string, RpcMethodSchema>;

// Field mappings for GraphQL-like field selection
export type FieldMapping = 1 | Record<string, 1 | Record<string, any>>;
export type FieldMappings = Record<string, FieldMapping>;

// Type inference for client - extracts raw types from schema tuples
export type InferInput<T> = T extends [infer InputSchema, any] 
  ? InputSchema extends Struct<any, any> 
    ? Infer<InputSchema> 
    : any 
  : any;
export type InferOutput<T> = T extends [any, infer OutputSchema] 
  ? OutputSchema extends Struct<any, any> 
    ? Infer<OutputSchema> 
    : any 
  : any;

export type TypedRpcClient<TSchema extends RpcSchema> = {
  [K in keyof TSchema]: (
    input: InferInput<TSchema[K]>,
    mappings?: FieldMappings
  ) => Promise<InferOutput<TSchema[K]>>;
};