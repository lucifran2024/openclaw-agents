import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { MikroORM } from '@mikro-orm/core';
import { IS_PUBLIC_KEY } from '../auth/public.decorator';

/**
 * TenantContextInterceptor — Core multi-tenancy mechanism.
 *
 * Wraps every authenticated request in an explicit transaction and sets
 * `SET LOCAL app.current_tenant_id` so PostgreSQL RLS policies filter by tenant.
 *
 * Defense layer 1 of 3:
 *   1. This interceptor (SET LOCAL inside transaction)
 *   2. TenantValidationSubscriber (validates tenant_id before flush)
 *   3. RLS policies in PostgreSQL (final barrier)
 *
 * IMPORTANT: SET LOCAL only works inside a transaction (BEGIN...COMMIT).
 * PgBouncer must run in transaction mode with server_reset_query = DISCARD ALL.
 */
@Injectable()
export class TenantContextInterceptor implements NestInterceptor {
  constructor(
    private readonly orm: MikroORM,
    private readonly reflector: Reflector,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    // Check if route is marked @Public()
    const isPublic =
      this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
        context.getHandler(),
        context.getClass(),
      ]);

    // Public routes: no RLS, no tenant context
    if (isPublic) {
      return next.handle();
    }

    // Guard: reject if no tenant context on non-public route
    if (!user?.tid) {
      throw new ForbiddenException('Tenant context required');
    }

    return new Observable((subscriber) => {
      const em = this.orm.em.fork();

      // Wrap in explicit transaction so SET LOCAL persists
      em.transactional(async (txEm) => {
        const knex = (txEm as any).getKnex();
        await knex.raw('SET LOCAL app.current_tenant_id = ?', [user.tid]);

        // Inject transactional EntityManager into request for services to use
        request.em = txEm;

        return new Promise<void>((resolve, reject) => {
          next.handle().subscribe({
            next: (val) => subscriber.next(val),
            error: (err) => reject(err),
            complete: () => {
              subscriber.complete();
              resolve();
            },
          });
        });
      }).catch((err) => subscriber.error(err));
    });
  }
}
