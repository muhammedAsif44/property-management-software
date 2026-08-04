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

    // Global Soft Delete Middleware
    // Automatically injects `deletedAt: null` into read queries to prevent data leaks.
    this.$use(async (params, next) => {
      // List of models that use soft deletes
      const softDeleteModels = ['Organization', 'User', 'Property', 'Booking'];

      if (softDeleteModels.includes(params.model as string)) {
        if (params.action === 'findUnique' || params.action === 'findFirst') {
          // findUnique fails if the where clause includes non-unique fields (like deletedAt)
          // so we map it to findFirst
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

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
