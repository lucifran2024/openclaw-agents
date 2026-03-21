import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { ConfigService } from '@nestjs/config';
import { PostgreSqlDriver } from '@mikro-orm/postgresql';
import { Migrator } from '@mikro-orm/migrations';
import { TenantValidationSubscriber } from './tenant-validation.subscriber';

@Module({
  imports: [
    MikroOrmModule.forRootAsync({
      driver: PostgreSqlDriver,
      useFactory: (config: ConfigService) => ({
        driver: PostgreSqlDriver,
        host: config.get('database.host'),
        port: config.get('database.port'),
        dbName: config.get('database.name'),
        user: config.get('database.user'),
        password: config.get('database.password'),
        entities: ['./dist/modules/**/*.entity.js'],
        entitiesTs: ['./src/modules/**/*.entity.ts'],
        discovery: { warnWhenNoEntities: false },
        extensions: [Migrator],
        subscribers: [new TenantValidationSubscriber()],
        migrations: {
          path: './src/common/database/migrations',
          pathTs: './src/common/database/migrations',
        },
        debug: config.get('NODE_ENV') === 'development',
      }),
      inject: [ConfigService],
    }),
  ],
})
export class DatabaseModule {}
