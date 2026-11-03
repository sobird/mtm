export class AppError extends Error {
  readonly code: string;

  readonly status: number;

  constructor(code: string, status: number, message: string = code) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.status = status;
  }
}
