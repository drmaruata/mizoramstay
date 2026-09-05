import { test, expect } from '@playwright/test'
test('homepage smoke', async ({ page }) => { await page.goto('/'); await expect(page.getByRole('heading',{name:/Discover Mizoram/i})).toBeVisible(); await expect(page.getByRole('link',{name:/Stays/i}).first()).toBeVisible() })
