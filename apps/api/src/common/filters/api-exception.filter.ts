import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import type { Request, Response } from 'express';

type ApiErrorBody = {
  statusCode: number;
  code: string;
  message: string;
  details?: unknown;
  path: string;
  timestamp: string;
};

function extractCodeAndDetails(response: unknown): {
  code: string;
  details?: unknown;
} {
  if (typeof response === 'string') {
    return { code: response };
  }

  if (!response || typeof response !== 'object') {
    return { code: 'UNKNOWN_ERROR' };
  }

  const r: any = response;

  // Preferred shape: { code, details }
  if (typeof r.code === 'string') {
    return { code: r.code, details: r.details };
  }

  // Nest default shape: { statusCode, message, error }
  // - if message is string -> use it as code
  // - if message is object with code -> unwrap
  if (typeof r.message === 'string') {
    return { code: r.message };
  }

  if (r.message && typeof r.message === 'object') {
    if (typeof r.message.code === 'string') {
      return { code: r.message.code, details: r.message.details };
    }

    return { code: 'BAD_REQUEST', details: r.message };
  }

  if (Array.isArray(r.message)) {
    return { code: 'VALIDATION_ERROR', details: r.message };
  }

  return { code: 'BAD_REQUEST' };
}

@Catch()
export class ApiExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const res = ctx.getResponse<Response>();
    const req = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let code = 'INTERNAL_SERVER_ERROR';
    let details: unknown = undefined;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const payload = exception.getResponse();
      const extracted = extractCodeAndDetails(payload);
      code = extracted.code || code;
      details = extracted.details;
    }

    const body: ApiErrorBody = {
      statusCode: status,
      code,
      message: code,
      details,
      path: req.url,
      timestamp: new Date().toISOString(),
    };

    res.status(status).json(body);
  }
}
