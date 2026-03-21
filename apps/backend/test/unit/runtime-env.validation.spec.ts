import {
  CORE_RUNTIME_ENV_KEYS,
  validateRuntimeEnv,
} from '../../src/config/runtime-env.validation';

describe('validateRuntimeEnv', () => {
  const validConfig = Object.fromEntries(
    CORE_RUNTIME_ENV_KEYS.map((key) => [key, `${key.toLowerCase()}_value`]),
  );

  it('accepts the config when all split connection variables are present', () => {
    const config = {
      ...validConfig,
      DATABASE_HOST: 'localhost',
      DATABASE_PORT: '5432',
      DATABASE_NAME: 'omnichannel',
      DATABASE_USER: 'postgres',
      DATABASE_PASSWORD: 'postgres',
      REDIS_HOST: 'localhost',
      REDIS_PORT: '6379',
    };

    expect(validateRuntimeEnv(config)).toEqual(config);
  });

  it('accepts the config when DATABASE_URL and REDIS_URL are provided', () => {
    const config = {
      ...validConfig,
      DATABASE_URL: 'postgresql://postgres:postgres@localhost:5432/omnichannel',
      REDIS_URL: 'redis://localhost:6379',
    };

    expect(validateRuntimeEnv(config)).toEqual(config);
  });

  it('throws an explicit error when core runtime variables are missing', () => {
    expect(() =>
      validateRuntimeEnv({
        ...validConfig,
        DATABASE_URL: '',
        REDIS_URL: '',
        DATABASE_HOST: '',
        DATABASE_PORT: '',
        DATABASE_NAME: '',
        DATABASE_USER: '',
        DATABASE_PASSWORD: '',
        REDIS_HOST: '',
        REDIS_PORT: '',
        OPENAI_API_KEY: undefined,
      }),
    ).toThrow(
      'Missing required runtime environment variables: OPENAI_API_KEY, DATABASE_HOST, DATABASE_PORT, DATABASE_NAME, DATABASE_USER, DATABASE_PASSWORD, REDIS_HOST, REDIS_PORT.',
    );
  });
});
