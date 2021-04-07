export class ApiError extends Error {
  statusCode: string;

  constructor(message: string, code: string) {
    super(message);
    this.statusCode = code;
  }
}
