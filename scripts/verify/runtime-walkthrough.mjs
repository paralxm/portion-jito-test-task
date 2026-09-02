// Runtime walkthrough of both journeys against the built app (vite preview on :4173).
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const base = process.env.BASE ?? 'http://localhost:4173/';
const out = fileURLToPath(new URL('../../.verification/runtime/', import.meta.url));
mkdirSync(out, { recursive: true });

const browser = await chromium.launch();
const errors = [];
const log = (...a) => console.log(...a);

async function newPage(width, height, extraCss) {
  const ctx = await browser.newContext({ viewport: { width, height }, deviceScaleFactor: 2, hasTouch: true, isMobile: true });
  const page = await ctx.newPage();
  page.on('console', (m) => {
    if (m.type() === 'error' || m.type() === 'warning') errors.push(`[console.${m.type()}] ${m.text()}`);
  });
  page.on('pageerror', (e) => errors.push(`[pageerror] ${e.message}`));
  await page.goto(base);
  if (extraCss) await page.addStyleTag({ content: extraCss });
  return page;
}

// Hidden (mounted) screens stay in the DOM; every query is scoped to the visible screen or open dialog.
const scoped = () => page.locator('[data-screen]:not([hidden]), dialog[open]');

const shot = (page, name) => page.screenshot({ path: `${out}${name}.png`, fullPage: true });

async function check(page, name, fn) {
  try {
    const ok = await fn();
    log(`${ok ? 'PASS' : 'FAIL'} ${name}`);
  } catch (e) {
    log(`FAIL ${name}: ${e.message.split('\n')[0]}`);
  }
}

// --- Journey 1: calories for a food -----------------------------------------
let page = await newPage(390, 844);
await shot(page, '01-calculate-empty');
await check(page, 'rendered font is Inter Variable', async () => {
  const fam = await page.evaluate(() => getComputedStyle(document.querySelector('h1')).fontFamily);
  const loaded = await page.evaluate(() => document.fonts.check('600 28px "Inter Variable"'));
  log('   font-family:', fam, '| loaded:', loaded);
  return loaded;
});

await scoped().getByRole('button', { name: 'Add food' }).click();
await page.waitForTimeout(350);
await shot(page, '02-method-sheet');
await check(page, 'method sheet is a modal dialog with focus inside', async () => {
  return page.evaluate(() => {
    const d = document.querySelector('dialog[open]');
    return !!d && d.contains(document.activeElement);
  });
});
await scoped().getByRole('button', { name: 'Search food' }).click();
await scoped().getByRole('searchbox').fill('rice');
await page.waitForTimeout(300);
await shot(page, '03-search-loading');
await page.waitForTimeout(700);
await shot(page, '04-search-food-results');
await scoped().getByRole('button', { name: /Vegetable rice bowl/ }).click();
await page.waitForTimeout(200);
await shot(page, '05-review-default');
await scoped().getByLabel('Amount to calculate').fill('300');
await page.waitForTimeout(100);
await shot(page, '06-review-300');
await check(page, 'C at 300 g shows 540 kcal on review', async () => (await page.locator('main:visible').innerText()).includes('540'));
await scoped().getByRole('button', { name: 'Confirm and calculate' }).click();
await page.waitForTimeout(200);
await shot(page, '07-calculate-result');
await check(page, 'Calculate shows 540 kcal and Calculate tab current', async () => {
  const text = await page.locator('main:visible').innerText();
  const current = await page.locator('nav:visible [aria-current="page"]').innerText();
  return text.includes('540') && current.includes('Calculate');
});
await scoped().getByLabel('Amount', { exact: true }).fill('250');
await page.waitForTimeout(100);
await check(page, 'C at 250 g recalculates locally to 450 kcal', async () => (await page.locator('main:visible').innerText()).includes('450'));
await scoped().getByLabel('Amount', { exact: true }).fill('abc');
await page.locator('h1:visible').first().click();
await page.waitForTimeout(150);
await shot(page, '08-calculate-invalid-stale');
await check(page, 'invalid amount shows stale result, not 450', async () => {
  const text = await page.locator('main:visible').innerText();
  return !text.includes('450 kcal') && /Enter a number/.test(text);
});
await scoped().getByLabel('Amount', { exact: true }).fill('300');
await scoped().getByRole('button', { name: 'Change unit, currently g' }).click();
await page.waitForTimeout(300);
await shot(page, '09-unit-sheet');
await scoped().getByRole('radio', { name: /serving/ }).check();
await scoped().getByRole('button', { name: 'Confirm', exact: true }).click();
await page.waitForTimeout(200);
await shot(page, '10-calculate-servings');
await check(page, 'switching g → serving keeps the portion (1 serving, 540 kcal)', async () => {
  const value = await scoped().getByLabel('Amount', { exact: true }).inputValue();
  const text = await page.locator('main:visible').innerText();
  return value === '1' && text.includes('540') && text.includes('For 1 serving (300 g)');
});
await scoped().getByRole('button', { name: 'Show all nutrition' }).click();
await page.waitForTimeout(200);
await shot(page, '11-calculate-expanded');

// Barcode with an existing calculation → replacement warning
await scoped().getByRole('button', { name: 'Add food' }).click();
await scoped().getByRole('button', { name: 'Scan barcode' }).click();
await page.waitForTimeout(300);
await shot(page, '12-barcode-scanning');
await scoped().getByRole('button', { name: 'Simulate a matched product' }).click();
await page.waitForTimeout(150);
await shot(page, '13-barcode-looking-up');
await page.waitForTimeout(800);
await shot(page, '14-review-barcode-replaces');
await check(page, 'barcode review explains replacement', async () => (await page.locator('main:visible').innerText()).includes('replaces'));
await scoped().getByRole('button', { name: 'Back' }).click();
await page.waitForTimeout(150);
await shot(page, '15-barcode-paused-after-back');
await scoped().getByRole('button', { name: 'Scan again' }).click();
await scoped().getByRole('button', { name: 'Simulate an unknown product' }).click();
await page.waitForTimeout(900);
await shot(page, '16-barcode-not-found');
await scoped().getByRole('button', { name: 'Scan again' }).click();
await scoped().getByRole('button', { name: 'Simulate a failed lookup' }).click();
await page.waitForTimeout(900);
await shot(page, '17-barcode-lookup-failed');
await scoped().getByRole('button', { name: 'Enter manually' }).click();
await page.waitForTimeout(150);
await shot(page, '18-manual-empty');
await scoped().getByRole('button', { name: 'Continue to review' }).click();
await page.waitForTimeout(150);
await shot(page, '19-manual-errors');
await check(page, 'manual entry focuses first invalid field', async () => page.evaluate(() => document.activeElement?.id?.includes('manual-name') ?? false));
await scoped().getByLabel('Food or dish name').fill('Lentil soup');
await scoped().getByLabel('Calories').fill('150');
await scoped().getByLabel(/^Protein/).fill('8');
await scoped().getByRole('button', { name: 'Continue to review' }).click();
await page.waitForTimeout(150);
await shot(page, '20-review-manual');
await scoped().getByRole('button', { name: 'Back' }).click();
await page.waitForTimeout(150);
await check(page, 'back from review restores manual draft', async () => (await scoped().getByLabel('Food or dish name').inputValue()) === 'Lentil soup');
await scoped().getByRole('button', { name: 'Back' }).click();
await page.waitForTimeout(300);
await shot(page, '21-manual-discard-dialog');
await check(page, 'dirty manual entry asks before discarding', async () => page.evaluate(() => !!document.querySelector('dialog[open][role="alertdialog"]')));
await scoped().getByRole('button', { name: 'Keep editing' }).click();
await page.waitForTimeout(150);
await check(page, 'keep editing preserves the draft', async () => (await scoped().getByLabel('Food or dish name').inputValue()) === 'Lentil soup');

// Photo
await scoped().getByRole('button', { name: 'Back' }).click();
await scoped().getByRole('button', { name: 'Discard' }).click();
await page.waitForTimeout(150);
await check(page, 'discard returns to barcode step, calculation intact', async () => (await page.locator('h1:visible').innerText()).includes('Scan barcode'));
await scoped().getByRole('button', { name: 'Back' }).click();
await page.waitForTimeout(150);
await check(page, 'calculation survives the cancelled journey', async () => (await page.locator('main:visible').innerText()).includes('Vegetable rice bowl'));
await scoped().getByRole('button', { name: 'Add food' }).click();
await scoped().getByRole('button', { name: 'Take a photo' }).click();
await page.waitForTimeout(300);
await shot(page, '22-photo-capture');
await scoped().getByRole('button', { name: 'Take photo' }).click();
await page.waitForTimeout(150);
await shot(page, '23-photo-preview');
await scoped().getByRole('button', { name: 'Analyse photo' }).click();
await page.waitForTimeout(150);
await shot(page, '24-photo-analysing');
await page.waitForTimeout(1000);
await shot(page, '25-photo-suggestions');
await scoped().getByRole('button', { name: /Lentil soup/ }).click();
await page.waitForTimeout(150);
await shot(page, '26-review-photo');
await scoped().getByRole('button', { name: 'Cancel' }).click();
await scoped().getByRole('button', { name: 'Retake photo' }).click();
await scoped().getByRole('button', { name: 'Take photo' }).click();
await scoped().getByRole('button', { name: 'Analyse with a simulated failure' }).click();
await page.waitForTimeout(1100);
await shot(page, '27-photo-failed');
await scoped().getByRole('button', { name: 'Simulate camera denied' }).count(); // no-op

// --- Journey 2: recipes -------------------------------------------------------
await scoped().getByRole('button', { name: 'Back' }).click();
await scoped().getByRole('button', { name: 'Recipes' }).click();
await page.waitForTimeout(700);
await shot(page, '28-recipes-browse');
await scoped().getByRole('button', { name: /^Filters/ }).click();
await page.waitForTimeout(350);
await shot(page, '29-filters-sheet');
await scoped().getByRole('radio', { name: 'Vegan' }).click();
await scoped().getByLabel('Maximum').fill('100');
await scoped().getByLabel('Minimum').fill('300');
await scoped().getByRole('button', { name: 'Apply filters' }).click();
await page.waitForTimeout(150);
await shot(page, '30-filters-invalid-range');
await check(page, 'min > max is refused', async () => (await page.locator('dialog[open]').innerText()).includes('at least the minimum'));
await scoped().getByLabel('Maximum').fill('500');
await scoped().getByLabel('Protein per serving, at least').fill('10');
await scoped().getByRole('button', { name: 'Apply filters' }).click();
await page.waitForTimeout(300);
await shot(page, '31-recipes-filtered');
await check(page, 'filtered browse shows evidence per card', async () => (await page.locator('main:visible').innerText()).includes('Matches'));
await scoped().getByRole('button', { name: /Remove filter: Vegan/ }).click();
await page.waitForTimeout(150);
await shot(page, '32-recipes-chip-removed');
await scoped().getByRole('button', { name: /^Filters/ }).click();
await scoped().getByLabel('Preparation time, at most').fill('5');
await scoped().getByRole('button', { name: 'Apply filters' }).click();
await page.waitForTimeout(300);
await shot(page, '33-recipes-no-match');
await scoped().getByRole('button', { name: 'Change filters' }).click();
await scoped().getByRole('button', { name: 'Reset all' }).click();
await scoped().getByRole('button', { name: 'Apply filters' }).click();
await page.waitForTimeout(300);
await check(page, 'reset + apply clears filters', async () => (await page.locator('main:visible').innerText()).includes('All recipes'));
await scoped().getByRole('button', { name: /^Filters/ }).click();
await scoped().getByLabel('Maximum').fill('460');
await scoped().getByRole('button', { name: 'Apply filters' }).click();
await page.waitForTimeout(300);
await page.evaluate(() => window.scrollTo(0, 400));
await page.waitForTimeout(100);
const beforeY = await page.evaluate(() => window.scrollY);
await scoped().getByRole('button', { name: 'Lentil soup' }).click();
await page.waitForTimeout(150);
await shot(page, '34-recipe-loading');
await check(page, 'details keeps Recipes selected while loading', async () => (await page.locator('nav:visible [aria-current="page"]').innerText()).includes('Recipes'));
await page.waitForTimeout(700);
await shot(page, '35-recipe-loaded');
await scoped().getByRole('button', { name: 'Show all nutrition' }).click();
await page.waitForTimeout(150);
await shot(page, '36-recipe-expanded');
await check(page, 'R per serving 450 kcal, fibre nested, Vitamin D not available', async () => {
  const t = await page.locator('main:visible').innerText();
  return t.includes('450') && t.includes('of which fibre') && /Vitamin D[\s\S]*Not available/.test(t);
});
await scoped().getByRole('button', { name: 'Back to results' }).click();
await page.waitForTimeout(200);
const afterY = await page.evaluate(() => window.scrollY);
log('   scroll before/after:', beforeY, afterY);
await check(page, 'Back restores the list scroll', async () => Math.abs(beforeY - afterY) < 5);

// Browse → Search snapshot, scopes, failure
await scoped().getByRole('button', { name: 'Search recipes' }).click();
await page.waitForTimeout(150);
await shot(page, '37-search-recipes-scope-snapshot');
await check(page, 'search opens in Recipes scope with snapshot criteria', async () => {
  const t = await page.locator('main:visible').innerText();
  return t.includes('Under 460 kcal') && (await scoped().getByRole('radio', { name: 'Recipes' }).getAttribute('aria-checked')) === 'true';
});
await scoped().getByRole('searchbox').fill('lentil');
await page.waitForTimeout(1000);
await shot(page, '38-search-recipes-results');
await scoped().getByRole('radio', { name: 'Food' }).click();
await page.waitForTimeout(1000);
await shot(page, '39-search-food-scope-keeps-query');
await check(page, 'food scope keeps the query and is unfiltered', async () => {
  const t = await page.locator('main:visible').innerText();
  return (await scoped().getByRole('searchbox').inputValue()) === 'lentil' && !t.includes('Under 460');
});
await scoped().getByRole('searchbox').fill('offline');
await page.waitForTimeout(1000);
await shot(page, '40-search-failure');
await scoped().getByRole('searchbox').fill('zzzz');
await page.waitForTimeout(1000);
await shot(page, '41-search-no-match');
await scoped().getByRole('button', { name: 'Recipes', exact: true }).click();
await page.waitForTimeout(150);
await check(page, 'browse criteria untouched by search edits', async () => (await page.locator('main:visible').innerText()).includes('Under 460 kcal'));
await page.close();

// --- Responsive / enlarged text ----------------------------------------------
for (const width of [320, 393, 430]) {
  page = await newPage(width, 800);
  await shot(page, `50-calculate-${width}`);
  await page.close();
}
page = await newPage(320, 800, 'html { font-size: 200% !important; }');
await page.waitForTimeout(200);
await shot(page, '51-calculate-320-200pct');
await check(page, 'nav falls back to the 2x2 arrangement at 320 + 200%', async () => (await page.locator('nav:visible').getAttribute('data-layout')) === 'stacked');
await scoped().getByRole('button', { name: 'Recipes' }).click();
await page.waitForTimeout(700);
await shot(page, '52-recipes-320-200pct');
await page.close();
page = await newPage(390, 844, 'html { font-size: 200% !important; }');
await scoped().getByRole('button', { name: 'Add food' }).click();
await scoped().getByRole('button', { name: 'Enter manually' }).click();
await page.waitForTimeout(200);
await shot(page, '53-manual-390-200pct');
await page.close();

await browser.close();
log('\nConsole/page errors:', errors.length ? '\n' + errors.join('\n') : 'none');
