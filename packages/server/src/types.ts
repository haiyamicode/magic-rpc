import type * as h from "@haiyami/hyperstruct";
import type DataLoader from "dataloader";

// Re-export TypeSchema and Infer for compatibility
export { Infer, Struct as TypeSchema } from "@haiyami/hyperstruct";

// User-friendly type definitions
// biome-ignore lint/suspicious/noExplicitAny: Schema types are runtime validated
export type RpcMethodSchema = [h.Struct<any>, h.Struct<any>];
export type RpcSchema<
  T extends Record<string, RpcMethodSchema> = Record<string, RpcMethodSchema>,
> = T;

// biome-ignore lint/suspicious/noExplicitAny: Generic default type
export interface RpcPayload<T = any> {
  method: string;
  input?: T;
  mappings?: FieldMappings;
}

export type RpcMethodHandler<TInput, TOutput, TContext> = (
  params: { input: TInput; mappings: FieldMappings },
  context: TContext
) => Promise<TOutput>;

export type RpcMethodHandlers<TContext = EmptyObject> = Record<
  string,
  // biome-ignore lint/suspicious/noExplicitAny: Handler types are runtime validated
  RpcMethodHandler<any, any, TContext>
>;

export type FieldMappings = Record<string, FieldMapping>;
// biome-ignore lint/suspicious/noExplicitAny: Deep nested mappings
export type FieldMapping = 1 | Record<string, any>;
export type FieldMappingLike = FieldMapping | FieldMapping;

// biome-ignore lint/suspicious/noExplicitAny: Registry for runtime types
export type TypeRegistry = Record<string, h.Struct<any>>;

// biome-ignore lint/suspicious/noExplicitAny: Loader types are runtime validated
export type CustomLoaders = Record<string, DataLoader<any, any, any>>;

export type ResolverSchema<
  TTypeRegistry extends TypeRegistry,
  TCustomLoaders extends CustomLoaders,
> = {
  [K in keyof TTypeRegistry]: ResolverTypeSchema<
    TTypeRegistry,
    TCustomLoaders,
    h.Infer<TTypeRegistry[K]>
  >;
};

interface ResolverTypeSchema<
  TTypeRegistry extends TypeRegistry,
  TCustomLoaders extends CustomLoaders,
  T,
> {
  [key: string]: ResolverFieldSchema<TTypeRegistry, TCustomLoaders, T>;
}

interface SingleResolverFieldSchema<
  TTypeRegistry extends TypeRegistry,
  TCustomLoaders extends CustomLoaders,
  T,
> {
  type: keyof TTypeRegistry;
  resolve: (
    data: T,
    context: ResolverContext<TTypeRegistry, TCustomLoaders>
  ) =>
    | Promise<h.Infer<TTypeRegistry[this["type"]]> | null>
    | h.Infer<TTypeRegistry[this["type"]]>
    | null;
}

interface SchemaResolverFieldSchema<
  TTypeRegistry extends TypeRegistry,
  TCustomLoaders extends CustomLoaders,
  T,
> {
  // biome-ignore lint/suspicious/noExplicitAny: Runtime type validation
  type: h.Struct<any>;
  resolve: (
    data: T,
    context: ResolverContext<TTypeRegistry, TCustomLoaders>
  ) => Promise<h.Infer<this["type"]>> | h.Infer<this["type"]>;
}

export type ResolverFieldSchema<
  TTypeRegistry extends TypeRegistry,
  TCustomLoaders extends CustomLoaders,
  T,
> =
  | SchemaResolverFieldSchema<TTypeRegistry, TCustomLoaders, T>
  | SingleResolverFieldSchema<TTypeRegistry, TCustomLoaders, T>;

// biome-ignore lint/complexity/noBannedTypes: Generic default type
type EmptyObject = {};

export type ResolverContext<
  TTypeRegistry extends TypeRegistry,
  TCustomLoaders extends CustomLoaders = EmptyObject,
  TCustomContext extends object = EmptyObject,
> = {
  loaders: TCustomLoaders & {
    [K in keyof TTypeRegistry]: DataLoader<
      string,
      h.Infer<TTypeRegistry[K]> | null
    >;
  };
} & TCustomContext;
