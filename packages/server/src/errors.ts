export interface ErrorData {
  code?: string;
  cause?: unknown;
  [key: string]: unknown;
}

export class InputError extends Error {
  constructor(message: string, public data?: ErrorData) {
    super(message);
    this.name = "InputError";
  }
}

export class ServerError extends Error {
  constructor(message: string, public data?: ErrorData) {
    super(message);
    this.name = "ServerError";
  }
}
