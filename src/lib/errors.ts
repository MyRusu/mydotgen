export type AppErrorCode =
  | 'BAD_REQUEST'
  | 'UNAUTHORIZED'
  | 'RATE_LIMITED'
  | 'UPSTREAM_ERROR'
  | 'INVALID_CONFIG'
  | 'INTERNAL_ERROR';

export class AppError extends Error {
  code: AppErrorCode;
  causeRaw?: unknown;
  status: number;

  constructor(code: AppErrorCode, message: string, options?: { cause?: unknown; status?: number }) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.causeRaw = options?.cause;
    this.status = options?.status ?? 500;
  }
}

export function toHttpStatus(code: AppErrorCode): number {
  switch (code) {
    case 'BAD_REQUEST':
      return 400;
    case 'UNAUTHORIZED':
      return 401;
    case 'RATE_LIMITED':
      return 429;
    case 'INVALID_CONFIG':
      return 500;
    case 'UPSTREAM_ERROR':
      return 502;
    default:
      return 500;
  }
}

export function userMessage(err: unknown): string {
  if (err instanceof AppError) return err.message;
  return 'Unexpected error occurred. Please try again later.';
}

