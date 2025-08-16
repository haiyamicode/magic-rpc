export interface ErrorData {
  code?: string;
  cause?: unknown;
  [key: string]: unknown;
}

export class RpcClientError extends Error {
  constructor(
    message: string,
    public data?: ErrorData
  ) {
    super(message);
    this.name = "RpcClientError";
  }
}