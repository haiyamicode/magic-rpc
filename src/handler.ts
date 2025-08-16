import * as h from "@haiyami/hyperstruct";
import DataLoader from "dataloader";
import { DataResolver } from "./resolver";
import {
  CustomLoaders,
  FieldMappings,
  Infer,
  ResolverSchema,
  RpcContext,
  RpcMethodHandler,
  RpcPayload,
  RpcSchema,
  TypesSchema,
} from "./types";

export interface RpcHandlerConfig<
  TSchema extends RpcSchema = RpcSchema,
  TTypes extends TypesSchema = TypesSchema,
  TCustomLoaders extends CustomLoaders = CustomLoaders,
  TContext extends RpcContext = RpcContext
> {
  schema: TSchema;
  handlers: {
    [K in keyof TSchema]: RpcMethodHandler<
      Infer<TSchema[K][0]>,
      Infer<TSchema[K][1]>,
      TContext
    >;
  };
  types?: TTypes;
  resolvers?: ResolverSchema<TTypes, TCustomLoaders>;
  createLoaders?: (context: TContext) => {
    [K in keyof TTypes]: DataLoader<string, Infer<TTypes[K]> | null>;
  };
  createCustomLoaders?: (context: TContext) => TCustomLoaders;
  onError?: (error: Error, payload: RpcPayload, context: TContext) => void;
  validateInput?: boolean;
  validateOutput?: boolean;
  coerceInput?: boolean;
  maskOutput?: boolean;
}

export class RpcHandler<
  TSchema extends RpcSchema = RpcSchema,
  TTypes extends TypesSchema = TypesSchema,
  TCustomLoaders extends CustomLoaders = CustomLoaders,
  TContext extends RpcContext = RpcContext
> {
  constructor(
    private config: RpcHandlerConfig<TSchema, TTypes, TCustomLoaders, TContext>
  ) {}

  private createDataResolver(
    context: TContext
  ): DataResolver<TTypes, TCustomLoaders> | null {
    if (!this.config.types || !this.config.resolvers) {
      return null;
    }

    const loaders = {
      ...(this.config.createLoaders?.(context) || {}),
      ...(this.config.createCustomLoaders?.(context) || {}),
    } as any;

    return new DataResolver(this.config.types, this.config.resolvers, {
      loaders,
      requestContext: context,
    });
  }

  private composeHandler<K extends keyof TSchema>(
    method: K,
    options: {
      resolve?: (result: any, mappings: FieldMappings) => Promise<any>;
      validateResult?: (result: any) => any;
    } = {}
  ): RpcMethodHandler<Infer<TSchema[K][0]>, Infer<TSchema[K][1]>, TContext> {
    const handler = this.config.handlers[method];
    if (!handler) {
      throw new Error(`Method handler not found: ${String(method)}`);
    }

    return async (params, context) => {
      let result = await handler(params, context);

      if (options.resolve && params.mappings) {
        result = await options.resolve(result, params.mappings);
      }

      if (options.validateResult) {
        result = options.validateResult(result);
      }

      return result;
    };
  }

  async handle<K extends keyof TSchema>(
    payload: RpcPayload<Infer<TSchema[K][0]>> & { method: K },
    context: TContext
  ): Promise<Infer<TSchema[K][1]>> {
    if (!payload || !payload.method) {
      throw new Error("Invalid payload: method is required");
    }

    const schema = this.config.schema[payload.method];
    if (!schema) {
      throw new Error(`Invalid method: ${String(payload.method)}`);
    }

    const handler = this.config.handlers[payload.method];
    if (!handler) {
      throw new Error(`Method not implemented: ${String(payload.method)}`);
    }

    const [inputSchema, outputSchema] = schema;
    const input = payload.input || {};

    let transformedInput = input;
    if (this.config.validateInput !== false) {
      const [error, validated] = inputSchema.validate(input, {
        coerce: this.config.coerceInput !== false,
      });
      if (error) {
        throw new Error(`Input validation error: ${error.message}`);
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
              const [resultError] = outputSchema.validate(maskedResult);
              if (resultError) {
                const errorMessage = `Output validation error: ${resultError.message}`;
                if (this.config.onError) {
                  this.config.onError(
                    new Error(errorMessage),
                    payload,
                    context
                  );
                }
                throw new Error(errorMessage);
              }
              return maskedResult;
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
    context: TContext
  ): Promise<Array<Infer<TSchema[K][1]>>> {
    return Promise.all(
      payloads.map((payload) => this.handle(payload, context))
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
