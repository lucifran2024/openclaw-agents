import { Migrator } from '@mikro-orm/migrations';
import { defineConfig } from '@mikro-orm/postgresql';
import { TenantValidationSubscriber } from './src/common/database/tenant-validation.subscriber';

export default defineConfig({
  host: process.env.DATABASE_HOST || 'localhost',
  port: parseInt(process.env.DATABASE_PORT || '5432', 10),
  dbName: process.env.DATABASE_NAME || 'omnichannel',
  user: process.env.DATABASE_USER || 'postgres',
  password: process.env.DATABASE_PASSWORD || 'postgres',
  entities: ['./dist/modules/**/*.entity.js'],
  entitiesTs: ['./src/modules/**/*.entity.ts'],
  discovery: { warnWhenNoEntities: false },
  extensions: [Migrator],
  subscribers: [new TenantValidationSubscriber()],
  migrations: {
    path: './src/common/database/migrations',
    pathTs: './src/common/database/migrations',
  },
  debug: process.env.NODE_ENV === 'development',
});
