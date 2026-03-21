import { Migrator } from '@mikro-orm/migrations';
import { defineConfig } from '@mikro-orm/postgresql';
import { TenantValidationSubscriber } from './src/common/database/tenant-validation.subscriber';
import { getDatabaseConnectionConfig } from './src/config/connection-url.util';

const database = getDatabaseConnectionConfig();

export default defineConfig({
  clientUrl: database.url,
  host: database.host,
  port: database.port,
  dbName: database.name,
  user: database.user,
  password: database.password,
  driverOptions: {
    connection: {
      ssl: database.ssl ? { rejectUnauthorized: false } : false,
    },
  },
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
