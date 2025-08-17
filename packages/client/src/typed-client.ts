import { RpcClient } from "./client";
import type { RpcClientConfig, RpcSchema, TypedRpcClient } from "./types";

export function createTypedClient<TSchema extends RpcSchema>(
  schema: TSchema,
  config: RpcClientConfig
): TypedRpcClient<TSchema> {
  const client = new RpcClient({ ...config, schema });

  const typedClient = {} as TypedRpcClient<TSchema>;

  for (const method in schema) {
    // biome-ignore lint/suspicious/noExplicitAny: Dynamic property assignment
    (typedClient as any)[method] = async (
      // biome-ignore lint/suspicious/noExplicitAny: Input type is unknown
      input: any,
      // biome-ignore lint/suspicious/noExplicitAny: Mappings can be deeply nested
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
