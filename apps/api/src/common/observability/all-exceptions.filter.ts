import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from "@nestjs/common";
import { ErrorReporter } from "./error-reporter";

/**
 * Global exception filter: produces a consistent JSON error envelope, logs
 * structured details, and forwards server-side (5xx) errors to the
 * ErrorReporter. Client (4xx) errors are logged at debug to avoid noise.
 */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger("ExceptionFilter");

  constructor(private readonly reporter: ErrorReporter) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    // Only HTTP is handled here; WS/other transports fall through.
    if (host.getType() !== "http") throw exception;

    const ctx = host.switchToHttp();
    const res = ctx.getResponse();
    const req = ctx.getRequest();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const message = resolveMessage(exception, status);
    const path = req?.url;
    const method = req?.method;

    if (status >= 500) {
      this.logger.error(
        `${method} ${path} -> ${status}: ${message}`,
        exception instanceof Error ? exception.stack : undefined,
      );
      this.reporter.report({
        message,
        statusCode: status,
        path,
        method,
        stack: exception instanceof Error ? exception.stack : undefined,
        timestamp: new Date().toISOString(),
      });
    } else {
      this.logger.debug?.(`${method} ${path} -> ${status}: ${message}`);
    }

    res?.status?.(status).json({
      statusCode: status,
      message,
      timestamp: new Date().toISOString(),
      path,
    });
  }
}

function resolveMessage(exception: unknown, status: number): string {
  if (exception instanceof HttpException) {
    const response = exception.getResponse();
    if (typeof response === "string") return response;
    if (response && typeof response === "object" && "message" in response) {
      const m = (response as { message: unknown }).message;
      return Array.isArray(m) ? m.join(", ") : String(m);
    }
    return exception.message;
  }
  // Never leak internal error details to clients on a 500.
  return status >= 500
    ? "Internal server error"
    : exception instanceof Error
      ? exception.message
      : "Error";
}
