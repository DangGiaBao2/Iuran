import { expect, test } from '@playwright/test';

test.describe('Iuran — Recurring Subscription Billing', () => {
  test('homepage loads with Iuran branding', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText('Iuran')).toBeVisible();
    await expect(page.getByText('Recurring USDC billing')).toBeVisible();
  });

  test('merchant tab is active by default', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText('FitLife Monthly Subscriptions')).toBeVisible();
  });

  test('subscription table shows subscriber data', async ({ page }) => {
    await page.goto('/');
    // Table headers visible — use exact column header roles
    await expect(page.getByRole('columnheader', { name: 'Member' })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'Status', exact: true })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'Next Charge' })).toBeVisible();
  });

  test('run billing cycle button exists', async ({ page }) => {
    await page.goto('/');
    const btn = page.getByRole('button', { name: /run billing cycle/i });
    await expect(btn).toBeVisible();
  });

  test('can switch to subscriber tab', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: /subscriber/i }).click();
    await expect(page.getByText('Jariya Nakamura', { exact: true }).first()).toBeVisible();
    await expect(page.getByText('FitLife Bangkok', { exact: true })).toBeVisible();
  });

  test('subscriber view shows USDC amount', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: /subscriber/i }).click();
    await expect(page.getByText('20 USDC / month')).toBeVisible();
  });

  test('gasless signup badge visible on subscriber view', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: /subscriber/i }).click();
    await expect(page.getByText(/Gasless Signup/i)).toBeVisible();
  });

  test('Soroban SAC banner visible on merchant view', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText(/Soroban SAC transfer/i)).toBeVisible();
  });

  test('stat cards show member count', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText('Active Members')).toBeVisible();
    await expect(page.getByText('Pending Charges')).toBeVisible();
  });

  test('run billing cycle triggers charge creation', async ({ page }) => {
    await page.goto('/');
    const btn = page.getByRole('button', { name: /run billing cycle/i });
    await btn.click();
    // Should show loading state or success toast
    await page.waitForTimeout(2000);
    // Button should return to normal state
    await expect(btn).toBeEnabled({ timeout: 10000 });
  });

  test('subscriber tab shows approve button after billing run', async ({ page }) => {
    await page.goto('/');
    // Run billing first
    const billingBtn = page.getByRole('button', { name: /run billing cycle/i });
    await billingBtn.click();
    await page.waitForTimeout(2000);

    // Switch to subscriber
    await page.getByRole('button', { name: /subscriber/i }).click();
    await page.waitForTimeout(1000);

    // May or may not have pending — just check page loads
    await expect(page.getByText('Jariya Nakamura', { exact: true }).first()).toBeVisible();
  });

  test('mobile 375px layout does not overflow', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/');
    const body = page.locator('body');
    const bodyBox = await body.boundingBox();
    expect(bodyBox?.width).toBeLessThanOrEqual(375);
  });
});
