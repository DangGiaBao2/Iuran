import { chromium } from '@playwright/test';
import { mkdir } from 'node:fs/promises';

async function main() {
  const baseUrl = process.env.BASE_URL ?? 'http://localhost:3002';
  const outputDir = 'screen-shot';

  await mkdir(outputDir, { recursive: true });
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({
    viewport: { width: 1440, height: 1000 },
    deviceScaleFactor: 1,
  });

  await page.goto(baseUrl, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(700);
  await page.screenshot({ path: `${outputDir}/01-merchant-dashboard.png`, fullPage: true });

  await page.getByRole('button', { name: /subscriber/i }).click();
  await page.waitForTimeout(500);
  await page.screenshot({ path: `${outputDir}/02-subscriber-approval.png`, fullPage: true });

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(baseUrl, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(700);
  await page.screenshot({ path: `${outputDir}/03-mobile-dashboard.png`, fullPage: true });

  await browser.close();
  console.log(`Screenshots saved to ${outputDir}/`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
