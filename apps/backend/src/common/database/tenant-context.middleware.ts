import { Injectable, NestMiddleware } from '@nestjs/common';
import { MikroORM } from '@mikro-orm/core';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class TenantContextMiddleware implements NestMiddleware {
  constructor(private readonly orm: MikroORM) {}

  async use(req: Request, _res: Response, next: NextFunction) {
    const user = (req as any).user;
    if (user?.tid) {
      const em = this.orm.em.fork();
      const knex = (em as any).getKnex();
      await knex.raw(`SET LOCAL app.current_tenant_id = ?`, [user.tid]);
      (req as any).em = em;
    }
    next();
  }
}
