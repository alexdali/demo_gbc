export class AppError extends Error {
  statusCode: number;
  details?: string;

  constructor(message: string, statusCode = 400, details?: string) {
    super(message);
    this.name = "AppError";
    this.statusCode = statusCode;
    this.details = details;
  }
}

export function getReadableError(error: unknown, fallbackMessage: string) {
  if (error instanceof AppError) {
    return {
      message: error.message,
      statusCode: error.statusCode,
      details: error.details ?? null,
    };
  }

  if (error instanceof Error) {
    return {
      message: error.message,
      statusCode: 500,
      details: null,
    };
  }

  return {
    message: fallbackMessage,
    statusCode: 500,
    details: null,
  };
}
