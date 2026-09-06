import { defineConfig } from 'vitest/config'

/**
 * Vitest configuration for MizoramStay.
 *
 * - Resolves the `@/*` path alias (mirrors tsconfig.json) so tests can import
 *   from `src/` using the same alias as application code.
 * - Restricts the test include glob to `tests/unit` and `tests/api`. The
 *   Playwright specs under `tests/e2e` are executed by `npm run test:e2e`
 *   (playwright.config.ts), not by Vitest.
 */
export default defineConfig({
  test: {
    alias: {
      '@': new URL('./src/', import.meta.url).pathname,
    },
    include: [
      'tests/unit/**/*.{test,spec}.{ts,tsx}',
      'tests/api/**/*.{test,spec}.{ts,tsx}',
    ],
    environment: 'node',
  },
})