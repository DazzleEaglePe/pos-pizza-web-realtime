import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable, tap } from 'rxjs';
import { AuditService } from './audit.service';
import type { Request } from 'express';

const AUDITED_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

function extractEntityType(url: string): string {
  const clean = url.split('?')[0].replace(/^\/+/, '');
  const segments = clean.split('/');
  return segments[0] || 'unknown';
}

function extractEntityId(url: string): string | undefined {
  const clean = url.split('?')[0].replace(/^\/+/, '');
  const segments = clean.split('/');
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  for (let i = segments.length - 1; i >= 0; i--) {
    if (uuidRegex.test(segments[i])) return segments[i];
  }
  return undefined;
}

function methodToAction(method: string): string {
  switch (method) {
    case 'POST':
      return 'CREATE';
    case 'PUT':
    case 'PATCH':
      return 'UPDATE';
    case 'DELETE':
      return 'DELETE';
    default:
      return method;
  }
}

function sanitizeBody(body: unknown): Record<string, unknown> | undefined {
  if (!body || typeof body !== 'object') return undefined;
  const clone = { ...(body as Record<string, unknown>) };
  const sensitiveKeys = ['password', 'passwordHash', 'refreshToken', 'token', 'secret'];
  for (const key of sensitiveKeys) {
    if (key in clone) clone[key] = '***';
  }
  return clone;
}

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(private readonly auditService: AuditService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const req = context.switchToHttp().getRequest<Request>();
    const method = req.method;

    if (!AUDITED_METHODS.has(method)) return next.handle();

    const user = req.user as { id: string; email: string; role: string } | undefined;
    const action = methodToAction(method);
    const entityType = extractEntityType(req.url);
    const entityId = extractEntityId(req.url);
    const ip =
      (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
      req.socket.remoteAddress ||
      null;

    return next.handle().pipe(
      tap({
        next: () => {
          // Fire and forget — don't await
          this.auditService
            .log({
              userId: user?.id,
              action,
              entityType,
              entityId,
              details: sanitizeBody(req.body),
              ipAddress: ip ?? undefined,
            })
            .catch(() => {});
        },
      }),
    );
  }
}
