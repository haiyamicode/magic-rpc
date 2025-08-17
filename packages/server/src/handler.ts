import * as h from "@haiyami/hyperstruct";
import type DataLoader from "dataloader";
import { InputError, ServerError } from "./errors";
import { DataResolver } from "./resolver";
import type {
  CustomLoaders,
  FieldMappings,
  Infer,
  ResolverSchema,
  RpcMethodHandler,
  RpcPayload,
  RpcSchema,
  TypeRegistry,
} from "./types";

// biome-ignore lint/complexity/noBannedTypes: Generic default type
type EmptyObject = {};

export interface RpcHandlerConfig<
  TSchema extends RpcSchema = RpcSchema,
  TCustomContext extends object = EmptyObject,
  TTypeRegistry extends TypeRegistry = TypeRegistry,
  TCustomLoaders extends CustomLoaders = CustomLoaders,
  TTypeLoaders extends {
    [K in keyof TTypeRegistry]: DataLoader<
      string,
      Infer<TTypeRegistry[K]> | null
    >;
  } = {
    [K in keyof TTypeRegistry]: DataLoader<
      string,
      Infer<TTypeRegistry[K]> | null
    >;
  },
  TAllLoaders extends TTypeLoaders & TCustomLoaders = TTypeLoaders &
    TCustomLoaders,
  TContext extends TCustomContext & {
    loaders: TAllLoaders;
  } = TCustomContext & { loaders: TAllLoaders },
> {
  schema: TSchema;
  handlers: {
    [K in keyof TSchema]: RpcMethodHandler<
      Infer<TSchema[K][0]>,
      Infer<TSchema[K][1]>,
      TContext
    >;
  };
  types?: TTypeRegistry;
  customContext?: TCustomContext;
  resolvers?: ResolverSchema<TTypeRegistry, TCustomLoaders>;
  createLoaders?: (context: TCustomContext) => TTypeLoaders;
  createCustomLoaders?: (
    context: TCustomContext & { loaders: TTypeLoaders }
  ) => TCustomLoaders;
  onError?: (error: Error, payload: RpcPayload, context: TContext) => void;
  validateInput?: boolean;
  validateOutput?: boolean;
  coerceInput?: boolean;
  maskOutput?: boolean;
}

export class RpcHandler<
  TSchema extends RpcSchema = RpcSchema,
  TCustomContext extends object = EmptyObject,
  TTypeRegistry extends TypeRegistry = TypeRegistry,
  TCustomLoaders extends CustomLoaders = CustomLoaders,
  TTypeLoaders extends {
    [K in keyof TTypeRegistry]: DataLoader<
      string,
      Infer<TTypeRegistry[K]> | null
    >;
  } = {
    [K in keyof TTypeRegistry]: DataLoader<
      string,
      Infer<TTypeRegistry[K]> | null
    >;
  },
  TAllLoaders extends TTypeLoaders & TCustomLoaders = TTypeLoaders &
    TCustomLoaders,
  TContext extends TCustomContext & {
    loaders: TAllLoaders;
  } = TCustomContext & { loaders: TAllLoaders },
> {
  constructor(
    private config: RpcHandlerConfig<
      TSchema,
      TCustomContext,
      TTypeRegistry,
      TCustomLoaders,
      TTypeLoaders,
      TAllLoaders,
      TContext
    >
  ) {}

  private createDataResolver(
    context: TContext
  ): DataResolver<TTypeRegistry, TCustomLoaders> | null {
    if (!this.config.types || !this.config.resolvers) {
      return null;
    }

    return new DataResolver(this.config.types, this.config.resolvers, context);
  }

  private composeHandler<K extends keyof TSchema>(
    method: K,
    options: {
      // biome-ignore lint/suspicious/noExplicitAny: payload types are unknown
      resolve?: (result: any, mappings: FieldMappings) => Promise<any>;
      // biome-ignore lint/suspicious/noExplicitAny: result types are unknown
      validateResult?: (result: any) => any;
    } = {}
  ): RpcMethodHandler<Infer<TSchema[K][0]>, Infer<TSchema[K][1]>, TContext> {
    const handler = this.config.handlers[method];
    if (!handler) {
      throw new ServerError(`Method handler not found: ${String(method)}`);
    }

    return async (params, context) => {
      let result = structuredClone(await handler(params, context));

      if (options.resolve && params.mappings) {
        result = await options.resolve(result, params.mappings);
      }

      if (options.validateResult) {
        return options.validateResult(result);
      }

      return result;
    };
  }

  async handle<K extends keyof TSchema>(
    payload: RpcPayload<Infer<TSchema[K][0]>> & { method: K },
    customContext: TCustomContext
  ): Promise<Infer<TSchema[K][1]>> {
    if (!payload || !payload.method) {
      throw new InputError("Invalid payload: method is required");
    }

    const schema = this.config.schema[payload.method];
    if (!schema) {
      throw new InputError(`Invalid method: ${String(payload.method)}`);
    }

    const handler = this.config.handlers[payload.method];
    if (!handler) {
      throw new ServerError(
        `Method not implemented: ${String(payload.method)}`
      );
    }

    // Create full context with auto-populated loaders
    const typeLoaders = (this.config.createLoaders?.(customContext) ??
      ({} as TTypeLoaders)) satisfies TTypeLoaders;
    const typeLoaderContext = {
      ...customContext,
      loaders: typeLoaders,
    } satisfies TCustomContext & { loaders: TTypeLoaders };
    const customLoaders =
      this.config.createCustomLoaders?.(typeLoaderContext) ??
      ({} as TCustomLoaders satisfies TCustomLoaders);
    const allLoaders = { ...typeLoaders, ...customLoaders } as TAllLoaders;
    const context = { ...customContext, loaders: allLoaders } as TContext;

    const [inputSchema, outputSchema] = schema;
    const input = payload.input || {};

    let transformedInput = input;
    if (this.config.validateInput !== false) {
      const [error, validated] = inputSchema.validate(input, {
        coerce: this.config.coerceInput !== false,
      });
      if (error) {
        throw new InputError(`Input validation error: ${error.message}`, {
          cause: error,
        });
      }
      transformedInput = validated;
    }

    const resolver = this.createDataResolver(context);
    const handleAndResolve = this.composeHandler(payload.method, {
      resolve: resolver
        ? async (result, mappings) => {
            await resolver.resolve(result, outputSchema, mappings);
            return result;
          }
        : undefined,
      validateResult:
        this.config.validateOutput !== false
          ? (result) => {
              const maskedResult =
                this.config.maskOutput !== false
                  ? h.mask(result, outputSchema)
                  : result;
              const [resultError, coercedResult] = h.validate(
                maskedResult,
                outputSchema,
                { coerce: true }
              );
              if (resultError) {
                const errorMessage = `Output validation error: ${resultError.message}`;
                if (this.config.onError) {
                  this.config.onError(
                    new ServerError(errorMessage, { cause: resultError }),
                    payload,
                    context
                  );
                }
                throw new ServerError(errorMessage, { cause: resultError });
              }
              return coercedResult;
            }
          : undefined,
    });

    try {
      return await handleAndResolve(
        {
          input: transformedInput,
          mappings: payload.mappings || {},
        },
        context
      );
    } catch (error) {
      if (this.config.onError) {
        this.config.onError(error as Error, payload, context);
      }
      throw error;
    }
  }

  async handleBatch<K extends keyof TSchema>(
    payloads: Array<RpcPayload<Infer<TSchema[K][0]>> & { method: K }>,
    customContext: TCustomContext
  ): Promise<Array<Infer<TSchema[K][1]>>> {
    return Promise.all(
      payloads.map((payload) => this.handle(payload, customContext))
    );
  }

  getHandler<K extends keyof TSchema>(
    method: K
  ):
    | RpcMethodHandler<Infer<TSchema[K][0]>, Infer<TSchema[K][1]>, TContext>
    | undefined {
    return this.config.handlers[method];
  }

  getMethods(): Array<keyof TSchema> {
    return Object.keys(this.config.handlers) as Array<keyof TSchema>;
  }

  getSchema<K extends keyof TSchema>(method: K): TSchema[K] | undefined {
    return this.config.schema[method];
  }
}
