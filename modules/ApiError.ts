export class ApiError extends Error {
  statusCode: string;

  constructor(message: string, code: string) {
    super(`${code ? code + ": " : ""} ${message}`);
    this.statusCode = code;
  }
}
