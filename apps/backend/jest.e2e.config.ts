import baseConfig from './jest.config';

export default {
  ...baseConfig,
  testRegex: 'test/e2e/.*\\.spec\\.ts$',
  passWithNoTests: true,
  testTimeout: 60_000,
};
