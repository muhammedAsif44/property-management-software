import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  constructor() {
    super({
      log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
    });
  }

  async onModuleInit() {
    await this.$connect();

    // Global Soft Delete Middleware (supported on Prisma versions <= 5)
    if (typeof (this as any).$use === 'function') {
      (this as any).$use(async (params: any, next: any) => {
        const softDeleteModels = ['Organization', 'User', 'Property', 'Booking'];

        if (softDeleteModels.includes(params.model as string)) {
          if (params.action === 'findUnique' || params.action === 'findFirst') {
            params.action = 'findFirst';
            params.args.where = { ...params.args.where, deletedAt: null };
          }
          if (params.action === 'findMany' || params.action === 'count') {
            if (params.args.where !== undefined) {
              if (params.args.where.deletedAt === undefined) {
                params.args.where.deletedAt = null;
              }
            } else {
              params.args.where = { deletedAt: null };
            }
          }
        }
        return next(params);
      });
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
