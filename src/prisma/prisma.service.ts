import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import { parse } from 'pg-connection-string';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private pool: Pool;

  constructor() {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      throw new Error('DATABASE_URL is not set in environment variables');
    }
    const parsed = parse(connectionString);
    const pool = new Pool({
      host: process.env.DB_HOST || parsed.host || 'localhost',
      port: parseInt(
        process.env.DB_PORT || (parsed.port?.toString() ?? '5432'),
        10,
      ),
      user: process.env.DB_USER || parsed.user || 'postgres',
      password: process.env.DB_PASSWORD || parsed.password || '',
      database: process.env.DB_NAME || parsed.database || 'postgres',
      ssl: parsed.ssl ? { rejectUnauthorized: false } : undefined,
    });

    const adapter = new PrismaPg(pool);
    super({ adapter });

    this.pool = pool;
  }

  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
    await this.pool.end();
  }
}
