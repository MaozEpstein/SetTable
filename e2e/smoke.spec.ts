import { test, expect } from '@playwright/test';

// Most basic smoke test: the app loads and shows the login screen.
// If this fails, something fundamental is broken (font loading,
// JS bundle, Firebase init).
test('app loads and shows login choices', async ({ page }) => {
  await page.goto('/');

  // The login screen has both Google and username sign-in options.
  await expect(page.getByText('שולחן ערוך').first()).toBeVisible({ timeout: 15000 });
  await expect(page.getByText('התחבר עם Google')).toBeVisible();
  await expect(page.getByText('התחבר עם שם משתמש')).toBeVisible();
});

test('can navigate to register from login', async ({ page }) => {
  await page.goto('/');

  // Click "הירשם כאן" to go to the registration screen
  await page.getByText('הירשם כאן').click();

  // Registration screen has the four required fields
  await expect(page.getByText('יצירת חשבון')).toBeVisible();
  await expect(page.getByText('שם משתמש').first()).toBeVisible();
  await expect(page.getByText('אימייל (לשחזור סיסמה)')).toBeVisible();
});

test('can navigate to username sign-in form', async ({ page }) => {
  await page.goto('/');

  await page.getByText('התחבר עם שם משתמש').click();

  await expect(page.getByText('שכחתי סיסמה')).toBeVisible();
  // The "back" link returns to choose mode
  await page.getByText('← חזור').click();
  await expect(page.getByText('התחבר עם Google')).toBeVisible();
});
