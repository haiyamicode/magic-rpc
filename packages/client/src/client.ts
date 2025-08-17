import * as h from "@haiyami/hyperstruct";
import { RpcError } from "./errors";
import type { RpcClientConfig, RpcRequest, RpcResponse } from "./types";

export class RpcClient {
  private config: RpcClientConfig & Required<Omit<RpcClientConfig, "schema">>;

  constructor(config: RpcClientConfig) {
    this.config = {
      timeout: 5000,
      headers: {},
      ...config,
    };
  }

  // biome-ignore lint/suspicious/noExplicitAny: Generic default type
  async call<TOutput = any>(request: RpcRequest): Promise<TOutput> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

    try {
      const response = await fetch(this.config.baseUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...this.config.headers,
        },
        body: JSON.stringify(request),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result: RpcResponse<TOutput> = await response.json();

      if (result.error) {
        throw new RpcError(result.error);
      }

      if (!result.result) {
        throw new Error("No result in response");
      }
      return this.validateAndCoerce(result.result, request.method);
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  }

  // biome-ignore lint/suspicious/noExplicitAny: Generic default type
  async batch<TOutput = any>(requests: RpcRequest[]): Promise<TOutput[]> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

    try {
      const response = await fetch(this.config.baseUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...this.config.headers,
        },
        body: JSON.stringify(requests),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const results: RpcResponse<TOutput>[] = await response.json();

      return results.map((result, index) => {
        if (result.error) {
          throw new RpcError(result.error);
        }

        if (!result.result) {
          throw new Error(`No result in response for request ${index}`);
        }
        return this.validateAndCoerce(result.result, requests[index].method);
      });
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  }

  private validateAndCoerce<T>(result: T, method: string): T {
    // Apply hyperstruct validation with coercion if schema is available
    if (this.config.schema?.[method]) {
      const [, outputSchema] = this.config.schema[method];
      const [error, value] = h.validate(result, outputSchema, {
        coerce: true,
        mask: true,
      });
      if (error) throw error;
      return value as T;
    }

    return result;
  }
}
