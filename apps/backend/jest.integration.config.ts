import baseConfig from './jest.config';

export default {
  ...baseConfig,
  testRegex: 'test/integration/.*\\.spec\\.ts$',
  passWithNoTests: true,
  testTimeout: 60_000,
};
