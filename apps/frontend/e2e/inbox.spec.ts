import { test } from '@playwright/test';

test.describe('inbox flow', () => {
  test.skip(true, 'requires seeded conversations and a running app');
});
