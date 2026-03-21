import {
  CORE_RUNTIME_ENV_KEYS,
  validateRuntimeEnv,
} from '../../src/config/runtime-env.validation';

describe('validateRuntimeEnv', () => {
  const validConfig = Object.fromEntries(
    CORE_RUNTIME_ENV_KEYS.map((key) => [key, `${key.toLowerCase()}_value`]),
  );

  it('accepts the config when all core runtime variables are present', () => {
    expect(validateRuntimeEnv(validConfig)).toEqual(validConfig);
  });

  it('throws an explicit error when core runtime variables are missing', () => {
    expect(() =>
      validateRuntimeEnv({
        ...validConfig,
        DATABASE_HOST: '',
        OPENAI_API_KEY: undefined,
      }),
    ).toThrow(
      'Missing required runtime environment variables: DATABASE_HOST, OPENAI_API_KEY.',
    );
  });
});
