import type { RpcRequest, RpcResponse, RpcClientConfig } from "./types";

export class RpcClient {
  private config: Required<RpcClientConfig>;

  constructor(config: RpcClientConfig) {
    this.config = {
      timeout: 5000,
      headers: {},
      ...config,
    };
  }

  async call<TOutput = any>(
    request: RpcRequest
  ): Promise<TOutput> {
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
        const error = new Error(result.error.message);
        (error as any).code = result.error.code;
        (error as any).data = result.error.data;
        throw error;
      }

      return result.result!;
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  }

  async batch<TOutput = any>(
    requests: RpcRequest[]
  ): Promise<TOutput[]> {
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

      return results.map((result) => {
        if (result.error) {
          const error = new Error(result.error.message);
          (error as any).code = result.error.code;
          (error as any).data = result.error.data;
          throw error;
        }
        return result.result!;
      });
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  }
}