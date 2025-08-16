import { RpcClient } from "./client";
import type { RpcSchema, TypedRpcClient, RpcClientConfig } from "./types";

export function createTypedClient<TSchema extends RpcSchema>(
  schema: TSchema,
  config: RpcClientConfig
): TypedRpcClient<TSchema> {
  const client = new RpcClient(config);

  const typedClient = {} as TypedRpcClient<TSchema>;

  for (const method in schema) {
    (typedClient as any)[method] = async (
      input: any,
      mappings?: Record<string, any>
    ) => {
      return client.call({
        method,
        input,
        mappings,
      });
    };
  }

  return typedClient;
}