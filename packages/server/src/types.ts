import * as h from "@haiyami/hyperstruct";
import DataLoader from "dataloader";

// Re-export TypeSchema and Infer for compatibility
export { Struct as TypeSchema, Infer } from "@haiyami/hyperstruct";

// User-friendly type definitions
export type RpcMethodSchema = [h.Struct<any>, h.Struct<any>];
export type RpcSchema<T extends Record<string, RpcMethodSchema> = Record<string, RpcMethodSchema>> = T;

export interface RpcPayload<T = any> {
  method: string;
  input?: T;
  mappings?: FieldMappings;
}

export interface RpcContext {
  [key: string]: any;
}

export interface RpcHandlerOptions<TContext = RpcContext> {
  context: TContext;
  loaders?: Record<string, DataLoader<any, any, any>>;
}

export interface RpcMethodHandler<TInput = any, TOutput = any, TContext = RpcContext> {
  (params: { input: TInput; mappings: FieldMappings }, context: TContext): Promise<TOutput>;
}

export type RpcMethodHandlers<TContext = RpcContext> = Record<string, RpcMethodHandler<any, any, TContext>>;

export type FieldMappings = Record<string, FieldMapping>;
export type FieldMapping = 1 | Record<string, any>;
export type FieldMappingLike = FieldMapping | FieldMapping;

export type TypeRegistry = Record<string, h.Struct<any>>;

export type CustomLoaders = Record<string, DataLoader<any, any, any>>;

export type ResolverSchema<TTypeRegistry extends TypeRegistry, TCustomLoaders extends CustomLoaders> = {
  [K in keyof TTypeRegistry]: ResolverTypeSchema<TTypeRegistry, TCustomLoaders, h.Infer<TTypeRegistry[K]>>;
};

interface ResolverTypeSchema<TTypeRegistry extends TypeRegistry, TCustomLoaders extends CustomLoaders, T> {
  [key: string]: ResolverFieldSchema<TTypeRegistry, TCustomLoaders, T>;
}

interface SingleResolverFieldSchema<TTypeRegistry extends TypeRegistry, TCustomLoaders extends CustomLoaders, T> {
  type: keyof TTypeRegistry;
  resolve: (
    data: T,
    context: ResolverContext<TTypeRegistry, TCustomLoaders>,
  ) => Promise<h.Infer<TTypeRegistry[this["type"]]> | null> | h.Infer<TTypeRegistry[this["type"]]> | null;
}

interface SchemaResolverFieldSchema<TTypeRegistry extends TypeRegistry, TCustomLoaders extends CustomLoaders, T> {
  type: h.Struct<any>;
  resolve: (
    data: T,
    context: ResolverContext<TTypeRegistry, TCustomLoaders>,
  ) => Promise<h.Infer<this["type"]>> | h.Infer<this["type"]>;
}

export type ResolverFieldSchema<TTypeRegistry extends TypeRegistry, TCustomLoaders extends CustomLoaders, T> =
  | SchemaResolverFieldSchema<TTypeRegistry, TCustomLoaders, T>
  | SingleResolverFieldSchema<TTypeRegistry, TCustomLoaders, T>;

export interface ResolverContext<TTypeRegistry extends TypeRegistry, TCustomLoaders extends CustomLoaders = {}> {
  loaders: TCustomLoaders & {
    [K in keyof TTypeRegistry]: DataLoader<string, h.Infer<TTypeRegistry[K]> | null>;
  };
  requestContext: RpcContext;
}