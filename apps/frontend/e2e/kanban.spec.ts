import { test } from '@playwright/test';

test.describe('kanban flow', () => {
  test.skip(true, 'requires seeded board data and a running app');
});
