import path from 'node:path';
import { defineConfig } from 'prisma/config';
import 'dotenv/config';

export default defineConfig({
  earlyAccess: true,
  schema: path.join(__dirname, 'prisma/schema.prisma'),
  migrate: {
    async adapter() {
      const { PrismaPg } = await import('@prisma/adapter-pg');
      const { default: pg } = await import('pg');
      const pool = new pg.Pool({
        host: 'db.olkuscfibhbkhfdzdqzr.supabase.co',
        port: 5432,
        database: 'postgres',
        user: 'postgres',
        password: process.env.DB_PASSWORD,
        ssl: { rejectUnauthorized: false },
      });
      return new PrismaPg(pool);
    },
  },
  datasource: {
    url: process.env.DATABASE_URL!,
  },
});