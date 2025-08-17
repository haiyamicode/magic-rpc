import type { RpcResponseError } from "./types";

export interface ErrorData {
  code?: string;
  cause?: unknown;
  [key: string]: unknown;
}

export class RpcError extends Error {
  code?: string;
  // biome-ignore lint/suspicious/noExplicitAny: Error data can be anything
  data?: any;

  constructor(error: RpcResponseError) {
    super(error.message);
    this.name = "RpcError";
    this.data = error.data;
    this.code = error.code;
  }
}
