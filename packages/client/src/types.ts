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

// Simplified type inference - client doesn't need to know about schema internals
export type InferInput<T> = any;
export type InferOutput<T> = any;

export type TypedRpcClient<TSchema extends RpcSchema> = {
  [K in keyof TSchema]: (
    input: any,
    mappings?: FieldMappings
  ) => Promise<any>;
};