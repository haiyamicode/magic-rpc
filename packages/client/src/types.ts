export interface RpcRequest<TInput = any> {
  method: string;
  input: TInput;
  mappings?: Record<string, any>;
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

export type RpcSchema = Record<string, [any, any]>;

// Simplified type inference - client doesn't need to know about schema internals
export type InferInput<T> = any;
export type InferOutput<T> = any;

export type TypedRpcClient<TSchema extends RpcSchema> = {
  [K in keyof TSchema]: (
    input: any,
    mappings?: Record<string, any>
  ) => Promise<any>;
};