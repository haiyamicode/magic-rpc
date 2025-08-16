import * as h from "@haiyami/hyperstruct";
import DataLoader from "dataloader";

// Re-export TypeSchema and Infer for compatibility
export { Struct as TypeSchema, Infer } from "@haiyami/hyperstruct";

export type RpcSchema<T extends Record<string, [h.Struct<any>, h.Struct<any>]> = Record<string, [h.Struct<any>, h.Struct<any>]>> = T;

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

export type TypesSchema = Record<string, h.Struct<any>>;

export type CustomLoaders = Record<string, DataLoader<any, any, any>>;

export type ResolverSchema<S extends TypesSchema, C extends CustomLoaders> = {
  [K in keyof S]: ResolverTypeSchema<S, C, h.Infer<S[K]>>;
};

interface ResolverTypeSchema<S extends TypesSchema, C extends CustomLoaders, T> {
  [key: string]: ResolverFieldSchema<S, C, T>;
}

interface SingleResolverFieldSchema<S extends TypesSchema, C extends CustomLoaders, T> {
  type: keyof S;
  resolve: (
    data: T,
    context: ResolverContext<S, C>,
  ) => Promise<h.Infer<S[this["type"]]> | null> | h.Infer<S[this["type"]]> | null;
}

interface SchemaResolverFieldSchema<S extends TypesSchema, C extends CustomLoaders, T> {
  type: h.Struct<any>;
  resolve: (
    data: T,
    context: ResolverContext<S, C>,
  ) => Promise<h.Infer<this["type"]>> | h.Infer<this["type"]>;
}

export type ResolverFieldSchema<S extends TypesSchema, C extends CustomLoaders, T> =
  | SchemaResolverFieldSchema<S, C, T>
  | SingleResolverFieldSchema<S, C, T>;

export interface ResolverContext<S extends TypesSchema, C extends CustomLoaders = {}> {
  loaders: C & {
    [K in keyof S]: DataLoader<string, h.Infer<S[K]> | null>;
  };
  requestContext: RpcContext;
}