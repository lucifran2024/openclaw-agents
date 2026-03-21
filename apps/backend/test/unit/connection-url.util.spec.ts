import {
  getDatabaseConnectionConfig,
  getRedisConnectionConfig,
} from '../../src/config/connection-url.util';

describe('connection-url util', () => {
  it('parses DATABASE_URL into MikroORM-friendly fields', () => {
    const config = getDatabaseConnectionConfig({
      DATABASE_URL: 'postgresql://postgres:secret@db.internal:6543/omnichannel',
      DATABASE_SSL: 'true',
    });

    expect(config).toEqual({
      url: 'postgresql://postgres:secret@db.internal:6543/omnichannel',
      host: 'db.internal',
      port: 6543,
      name: 'omnichannel',
      user: 'postgres',
      password: 'secret',
      ssl: true,
    });
  });

  it('parses REDIS_URL into BullMQ-friendly fields', () => {
    const config = getRedisConnectionConfig({
      REDIS_URL: 'redis://default:secret@redis.internal:6380',
      REDIS_TLS_ENABLED: 'true',
    });

    expect(config).toEqual({
      url: 'redis://default:secret@redis.internal:6380',
      host: 'redis.internal',
      port: 6380,
      tls: true,
    });
  });
});
