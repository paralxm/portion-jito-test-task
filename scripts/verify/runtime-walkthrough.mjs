// Runtime walkthrough of both journeys against the built app (vite preview on :4173).
// Screenshots go to .verification/runtime/ (ignored); the tracked manifest is
// docs/design-system/verification-manifest.md.
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const base = process.env.BASE ?? 'http://localhost:4173/';
const out = fileURLToPath(new URL('../../.verification/runtime/', import.meta.url));
mkdirSync(out, { recursive: true });

const browser = await chromium.launch();
const errors = [];
const log = (...a) => console.log(...a);
let passed = 0;
let failed = 0;

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
const visibleText = () => page.locator('[data-screen]:not([hidden])').innerText();

// Full-page captures extend the document past the viewport, where a fixed dialog backdrop
// cannot reach; while a dialog is open the capture is the viewport, so the scrim in the
// image is the scrim a user sees.
const shot = async (page, name) => {
  const modal = await page.evaluate(() => Boolean(document.querySelector('dialog[open]')));
  await page.screenshot({ path: `${out}${name}.png`, fullPage: !modal });
};

async function check(page, name, fn) {
  try {
    const ok = await fn();
    log(`${ok ? 'PASS' : 'FAIL'} ${name}`);
    ok ? passed++ : failed++;
  } catch (e) {
    log(`FAIL ${name}: ${e.message.split('\n')[0]}`);
    failed++;
  }
}

/** Adds a manually entered food to today so populated states can be captured on any page. */
async function addManualFood(page, name, kcal) {
  await scoped().getByRole('button', { name: /Log (first )?food/ }).first().click();
  await scoped().getByRole('button', { name: /Enter manually/ }).click();
  await scoped().getByLabel('Food or dish name').fill(name);
  await scoped().getByLabel('Calories').fill(String(kcal));
  await scoped().getByRole('button', { name: 'Continue to review' }).click();
  await scoped().getByRole('button', { name: 'Add to today' }).click();
  await page.waitForTimeout(200);
}

// --- Journey 1: calories for a food, added to today -------------------------
let page = await newPage(390, 844);
await shot(page, '01-home-empty');
await check(page, 'rendered font is Inter Variable', async () => {
  const fam = await page.evaluate(() => getComputedStyle(document.querySelector('h1')).fontFamily);
  const loaded = await page.evaluate(() => [400, 500, 600, 700].every((w) => document.fonts.check(`${w} 16px "Inter Variable"`)));
  log('   font-family:', fam, '| 400/500/600 loaded:', loaded);
  return loaded;
});
await check(page, 'launch is S01-1: no entries, no goal, Home current', async () => {
  const t = await visibleText();
  const current = await page.locator('nav:visible [aria-current="page"]').innerText();
  return t.includes('Nothing logged today') && t.includes('Not set') && current.includes('Home');
});

await scoped().getByRole('button', { name: 'Log first food' }).click();
await page.waitForTimeout(350);
await shot(page, '02-method-sheet');
await check(page, 'method sheet is a modal dialog with focus inside, laid out 2 × 2', async () => {
  return page.evaluate(() => {
    const d = document.querySelector('dialog[open]');
    const tile = d?.querySelector('button:not([aria-label="Close"])');
    const columns = tile ? getComputedStyle(tile.parentElement).gridTemplateColumns.split(' ').length : 0;
    return !!d && d.contains(document.activeElement) && columns === 2;
  });
});
await scoped().getByRole('button', { name: /Search food/ }).click();
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
await scoped().getByRole('button', { name: 'Add to today' }).click();
await page.waitForTimeout(250);
await shot(page, '07-home-populated');
await check(page, 'Add to today returns Home (S01-2) with 1 entry · 540 kcal', async () => {
  const t = await visibleText();
  const current = await page.locator('nav:visible [aria-current="page"]').innerText();
  return t.includes('1 entry · 540 kcal') && t.includes('Vegetable rice bowl') && current.includes('Home');
});

// Existing-entry edit: stale draft, unit change, expanded nutrition, update.
await scoped().getByRole('button', { name: /Vegetable rice bowl/ }).click();
await page.waitForTimeout(200);
await shot(page, '08-entry-edit');
await scoped().getByLabel('Amount to calculate').fill('abc');
await page.locator('h1:visible').first().click();
await page.waitForTimeout(150);
await shot(page, '09-entry-invalid-stale');
await check(page, 'invalid amount shows a stale result, not the old number', async () => {
  const text = await page.locator('main:visible').innerText();
  return !text.includes('540 kcal') && /Enter a number/.test(text) && text.includes('Enter a valid amount');
});
await scoped().getByLabel('Amount to calculate').fill('250');
await page.waitForTimeout(100);
await check(page, 'C at 250 g recalculates locally to 450 kcal', async () => (await page.locator('main:visible').innerText()).includes('450'));
await scoped().getByLabel('Amount to calculate').fill('300');
await scoped().getByRole('button', { name: 'Change unit, currently g' }).click();
await page.waitForTimeout(300);
await shot(page, '10-unit-sheet');
await scoped().getByRole('radio', { name: /serving/ }).check();
await scoped().getByRole('button', { name: 'Confirm', exact: true }).click();
await page.waitForTimeout(200);
await shot(page, '11-entry-servings');
await check(page, 'switching g → serving keeps the portion (1 serving, 540 kcal)', async () => {
  const value = await scoped().getByLabel('Amount to calculate').inputValue();
  const text = await page.locator('main:visible').innerText();
  return value === '1' && text.includes('540') && text.includes('For 1 serving (300 g)');
});
await scoped().getByRole('button', { name: 'Show all nutrition' }).click();
await page.waitForTimeout(200);
await shot(page, '12-entry-expanded');
await scoped().getByRole('button', { name: 'Update entry' }).click();
await page.waitForTimeout(250);
await check(page, 'Update entry commits to the same entry (still 1 entry)', async () => (await visibleText()).includes('1 entry · 540 kcal'));

// Daily goal
await scoped().getByRole('button', { name: 'Set a daily goal' }).click();
await page.waitForTimeout(350);
await shot(page, '13-goal-sheet');
await scoped().getByRole('textbox', { name: 'Daily goal' }).fill('2200');
await scoped().getByRole('button', { name: 'Apply' }).click();
await page.waitForTimeout(250);
await shot(page, '14-home-goal');
await check(page, 'goal 2,200 with 540 logged shows 1,660 remaining and 25 %', async () => {
  const t = await visibleText();
  const label = await page.locator('[data-screen="home"] svg[role="img"]').getAttribute('aria-label');
  return t.includes('1,660') && t.includes('kcal remaining') && label === '540 of 2,200 kcal logged today, 25 %';
});

// Task origin (docs/design/hifi-decisions.md D-4): Log food from Home → Search food switches
// to the Search root; Done from the review returns to Home, the surface that opened Log food.
await scoped().getByRole('button', { name: 'Log food' }).first().click();
await scoped().getByRole('button', { name: /Search food/ }).click();
await page.waitForTimeout(300);
await check(page, 'Search food from Home opens the Search root with Search selected', async () => (await page.locator('[data-screen="search"]:visible h1').innerText()) === 'Search');
await scoped().getByRole('searchbox').fill('rice');
await page.waitForTimeout(900);
await scoped().getByRole('button', { name: /Vegetable rice bowl/ }).click();
await page.waitForTimeout(300);
await shot(page, '14b-review-from-home-origin');
await scoped().getByRole('button', { name: 'Done' }).click();
await page.waitForTimeout(300);
await check(page, 'Done returns to Home, the invoking surface, without logging', async () => {
  const home = await page.locator('[data-screen="home"]:visible').count();
  return home === 1 && (await visibleText()).includes('1 entry · 540 kcal');
});

// Barcode → review → back, unknown, failed lookup, manual entry, discard
await scoped().getByRole('button', { name: 'Log food' }).first().click();
await scoped().getByRole('button', { name: /Scan barcode/ }).click();
await page.waitForTimeout(300);
await shot(page, '15-barcode-scanning');
await scoped().getByRole('button', { name: 'Simulate a matched product' }).click();
await page.waitForTimeout(150);
await shot(page, '16-barcode-looking-up');
await page.waitForTimeout(800);
await shot(page, '17-review-barcode');
await check(page, 'barcode review explains the match', async () => (await page.locator('main:visible').innerText()).includes('Matched from the barcode'));
await scoped().getByRole('button', { name: 'Back' }).click();
await page.waitForTimeout(150);
await shot(page, '18-barcode-paused-after-back');
await scoped().getByRole('button', { name: 'Scan again' }).click();
await scoped().getByRole('button', { name: 'Simulate an unknown product' }).click();
await page.waitForTimeout(900);
await shot(page, '19-barcode-not-found');
await scoped().getByRole('button', { name: 'Scan again' }).click();
await scoped().getByRole('button', { name: 'Simulate a failed lookup' }).click();
await page.waitForTimeout(900);
await shot(page, '20-barcode-lookup-failed');
await scoped().getByRole('button', { name: 'Enter manually' }).click();
await page.waitForTimeout(150);
await shot(page, '21-manual-empty');
await scoped().getByRole('button', { name: 'Continue to review' }).click();
await page.waitForTimeout(150);
await shot(page, '22-manual-errors');
await check(page, 'manual entry focuses first invalid field', async () => page.evaluate(() => document.activeElement?.id?.includes('manual-name') ?? false));
await scoped().getByLabel('Food or dish name').fill('Lentil soup');
await scoped().getByLabel('Calories').fill('150');
await scoped().getByLabel(/^Protein/).fill('8');
await scoped().getByRole('button', { name: 'Continue to review' }).click();
await page.waitForTimeout(150);
await shot(page, '23-review-manual');
await scoped().getByRole('button', { name: 'Back' }).click();
await page.waitForTimeout(150);
await check(page, 'back from review restores manual draft', async () => (await scoped().getByLabel('Food or dish name').inputValue()) === 'Lentil soup');
await scoped().getByRole('button', { name: 'Back' }).click();
await page.waitForTimeout(300);
await shot(page, '24-manual-discard-dialog');
await check(page, 'dirty manual entry asks before discarding', async () => page.evaluate(() => !!document.querySelector('dialog[open][role="alertdialog"]')));
await scoped().getByRole('button', { name: 'Keep editing' }).click();
await page.waitForTimeout(150);
await check(page, 'keep editing preserves the draft', async () => (await scoped().getByLabel('Food or dish name').inputValue()) === 'Lentil soup');
await scoped().getByRole('button', { name: 'Back' }).click();
await scoped().getByRole('button', { name: 'Discard' }).click();
await page.waitForTimeout(150);
await check(page, 'discard returns to the barcode step', async () => (await page.locator('h1:visible').innerText()).includes('Scan barcode'));
await scoped().getByRole('button', { name: 'Back' }).click();
await page.waitForTimeout(150);
await check(page, "today's entry survives the cancelled journey", async () => (await visibleText()).includes('1 entry · 540 kcal'));

// Photo → suggestions → review → Done (no logging); failure
await scoped().getByRole('button', { name: 'Log food' }).first().click();
await scoped().getByRole('button', { name: /Take a photo/ }).click();
await page.waitForTimeout(300);
await shot(page, '25-photo-capture');
await scoped().getByRole('button', { name: 'Take photo' }).click();
await page.waitForTimeout(150);
await shot(page, '26-photo-preview');
await scoped().getByRole('button', { name: 'Analyse photo' }).click();
await page.waitForTimeout(150);
await shot(page, '27-photo-analysing');
await page.waitForTimeout(1000);
await shot(page, '28-photo-suggestions');
await scoped().getByRole('radio', { name: /Lentil soup/ }).check();
await scoped().getByRole('button', { name: 'Review selected match' }).click();
await page.waitForTimeout(150);
await shot(page, '29-review-photo');
await scoped().getByRole('button', { name: 'Done' }).click();
await page.waitForTimeout(200);
await check(page, 'Done closes the task to Home without logging', async () => {
  const t = await visibleText();
  return (await page.locator('h1:visible').innerText()).includes('Home') && t.includes('1 entry · 540 kcal');
});
await scoped().getByRole('button', { name: 'Log food' }).first().click();
await scoped().getByRole('button', { name: /Take a photo/ }).click();
await scoped().getByRole('button', { name: 'Take photo' }).click();
await scoped().getByRole('button', { name: 'Analyse with a simulated failure' }).click();
await page.waitForTimeout(1100);
await shot(page, '30-photo-failed');

// --- Journey 2: recipes -------------------------------------------------------
await scoped().getByRole('button', { name: 'Back' }).click();
await scoped().getByRole('button', { name: 'Recipes', exact: true }).click();
await page.waitForTimeout(700);
await shot(page, '31-recipes-browse');
await scoped().getByRole('button', { name: /^Filters/ }).click();
await page.waitForTimeout(350);
await shot(page, '32-filters-sheet');
await scoped().getByRole('radio', { name: 'Vegan' }).click();
await scoped().getByLabel('Maximum').fill('100');
await scoped().getByLabel('Minimum').fill('300');
await scoped().getByRole('button', { name: 'Apply filters' }).click();
await page.waitForTimeout(150);
await shot(page, '33-filters-invalid-range');
await check(page, 'min > max is refused', async () => (await page.locator('dialog[open]').innerText()).includes('at least the minimum'));
await scoped().getByLabel('Maximum').fill('500');
await scoped().getByLabel('Protein per serving, at least').fill('10');
await scoped().getByRole('button', { name: 'Apply filters' }).click();
await page.waitForTimeout(300);
await shot(page, '34-recipes-filtered');
await check(page, 'filtered browse shows evidence per card', async () => (await page.locator('main:visible').innerText()).includes('Matches'));
await scoped().getByRole('button', { name: /Remove filter: Vegan/ }).click();
await page.waitForTimeout(150);
await shot(page, '35-recipes-chip-removed');
await scoped().getByRole('button', { name: /^Filters/ }).click();
await scoped().getByLabel('Preparation time, at most').fill('5');
await scoped().getByRole('button', { name: 'Apply filters' }).click();
await page.waitForTimeout(300);
await shot(page, '36-recipes-no-match');
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
await shot(page, '37-recipe-loading');
await check(page, 'details keeps Recipes selected while loading', async () => (await page.locator('nav:visible [aria-current="page"]').innerText()).includes('Recipes'));
await page.waitForTimeout(700);
await shot(page, '38-recipe-loaded');
await scoped().getByRole('button', { name: 'Show all nutrition' }).click();
await page.waitForTimeout(150);
await shot(page, '39-recipe-expanded');
await check(page, 'R per serving 450 kcal, fibre nested, Vitamin D not available', async () => {
  const t = await page.locator('main:visible').innerText();
  return t.includes('450') && t.includes('of which fibre') && /Vitamin D[\s\S]*Not available/.test(t);
});
await scoped().getByRole('button', { name: 'Back to results' }).click();
await page.waitForTimeout(200);
const afterY = await page.evaluate(() => window.scrollY);
log('   scroll before/after:', beforeY, afterY);
await check(page, 'Back restores the list scroll', async () => Math.abs(beforeY - afterY) < 5);

// Home summarises the applied browse criteria
await scoped().getByRole('button', { name: 'Home' }).click();
await page.waitForTimeout(150);
await shot(page, '40-home-recipe-criteria');
await check(page, 'Home shows the applied browse filters and See matching recipes', async () => {
  const t = await visibleText();
  return t.includes('Under 460 kcal') && t.includes('See matching recipes');
});
await scoped().getByRole('button', { name: 'See matching recipes' }).click();
await page.waitForTimeout(150);
await check(page, 'See matching recipes restores filtered browse', async () => (await page.locator('main:visible').innerText()).includes('Matching recipes'));

// Browse → Search snapshot, scopes, failure
await scoped().getByRole('button', { name: 'Search recipes' }).click();
await page.waitForTimeout(150);
await shot(page, '41-search-recipes-scope-snapshot');
await check(page, 'search opens in Recipes scope with snapshot criteria', async () => {
  const t = await page.locator('main:visible').innerText();
  return t.includes('Under 460 kcal') && (await scoped().getByRole('tab', { name: 'Recipes' }).getAttribute('aria-selected')) === 'true';
});
await scoped().getByRole('searchbox').fill('lentil');
await page.waitForTimeout(1000);
await shot(page, '42-search-recipes-results');
await scoped().getByRole('tab', { name: 'Food' }).click();
await page.waitForTimeout(1000);
await shot(page, '43-search-food-scope-keeps-query');
await check(page, 'food scope keeps the query and is unfiltered', async () => {
  const t = await page.locator('main:visible').innerText();
  return (await scoped().getByRole('searchbox').inputValue()) === 'lentil' && !t.includes('Under 460');
});
await scoped().getByRole('searchbox').fill('offline');
await page.waitForTimeout(1000);
await shot(page, '44-search-failure');
await scoped().getByRole('searchbox').fill('zzzz');
await page.waitForTimeout(1000);
await shot(page, '45-search-no-match');
await scoped().getByRole('button', { name: 'Recipes', exact: true }).click();
await page.waitForTimeout(150);
await check(page, 'browse criteria untouched by search edits', async () => (await page.locator('main:visible').innerText()).includes('Under 460 kcal'));

// Remove entry
await scoped().getByRole('button', { name: 'Home' }).click();
await page.waitForTimeout(150);
await scoped().getByRole('button', { name: /Vegetable rice bowl/ }).click();
await page.waitForTimeout(150);
await scoped().getByRole('button', { name: 'Remove entry' }).click();
await page.waitForTimeout(300);
await shot(page, '46-remove-entry-dialog');
await scoped().getByRole('button', { name: 'Keep entry' }).click();
await page.waitForTimeout(150);
await scoped().getByRole('button', { name: 'Remove entry' }).click();
await page.waitForTimeout(200);
await scoped().getByRole('button', { name: 'Remove', exact: true }).click();
await page.waitForTimeout(250);
await shot(page, '47-home-after-remove');
await check(page, 'confirmed removal returns Home to S01-1 with the goal kept', async () => {
  const t = await visibleText();
  return t.includes('Nothing logged today') && t.includes('2,200 kcal') && t.includes('kcal remaining');
});
await page.close();

// --- Responsive / enlarged text ----------------------------------------------
for (const width of [320, 393, 430]) {
  page = await newPage(width, 800);
  await addManualFood(page, 'Oatmeal with mixed berries', 550);
  await addManualFood(page, 'Grilled chicken Caesar salad', 800);
  await scoped().getByRole('button', { name: 'Set a daily goal' }).click();
  await scoped().getByRole('textbox', { name: 'Daily goal' }).fill('2200');
  await scoped().getByRole('button', { name: 'Apply' }).click();
  await page.waitForTimeout(250);
  await shot(page, `50-home-${width}`);
  await check(page, `no horizontal overflow on Home at ${width}`, async () => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1));
  if (width === 320) {
    await scoped().getByRole('button', { name: 'Log food' }).first().click();
    await page.waitForTimeout(350);
    await shot(page, '54-method-sheet-320');
    await check(page, 'method sheet keeps the 2 x 2 grid at 320 with no tile overflow', async () =>
      page.evaluate(() => {
        const tiles = Array.from(document.querySelectorAll('dialog[open] button:not([aria-label="Close"])'));
        if (tiles.length !== 4) return false;
        const columns = getComputedStyle(tiles[0].parentElement).gridTemplateColumns.split(' ').length;
        return columns === 2 && tiles.every((t) => t.scrollWidth <= t.clientWidth + 1 && getComputedStyle(t).flexDirection === 'column');
      }),
    );
  }
  await page.close();
}
page = await newPage(320, 800, 'html { font-size: 200% !important; }');
await addManualFood(page, 'Oatmeal with mixed berries', 550);
await page.waitForTimeout(200);
await shot(page, '51-home-320-200pct');
await check(page, 'navigation group fills up to a 16 px gap before the 56 px Log food circle and stacks the active label at 320 + 200%', async () =>
  page.evaluate(() => {
    const nav = document.querySelector('nav:not([hidden])');
    const group = nav?.querySelector('button[aria-current="page"]')?.parentElement;
    const action = nav?.querySelector('button[aria-label="Log food"]');
    const active = nav?.querySelector('button[aria-current="page"]');
    if (!nav || !group || !action || !active) return false;
    const g = group.getBoundingClientRect();
    const a = action.getBoundingClientRect();
    const cells = Array.from(group.children).map((c) => c.getBoundingClientRect().width);
    return nav.scrollWidth <= nav.clientWidth + 1 && Math.abs(a.left - g.right - 16) < 2 && Math.max(...cells) - Math.min(...cells) < 1.5 && Math.round(a.width) === 56 && Math.round(a.height) === 56 && getComputedStyle(active).flexDirection === 'column';
  }),
);
await check(page, 'calorie ring stacks its figure under a medium ring at 320 + 200%', async () => (await page.locator('[data-screen="home"] [data-layout]').first().getAttribute('data-layout')) === 'stacked');
await check(page, 'no horizontal overflow on Home at 320 + 200%', async () => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1));
await scoped().getByRole('button', { name: 'Recipes', exact: true }).click();
await page.waitForTimeout(700);
await shot(page, '52-recipes-320-200pct');
await page.close();
page = await newPage(390, 844, 'html { font-size: 200% !important; }');
await scoped().getByRole('button', { name: 'Log first food' }).click();
await page.waitForTimeout(350);
await shot(page, '55-method-sheet-390-200pct');
await check(page, 'method sheet falls back to one column of rows at 390 + 200%', async () =>
  page.evaluate(() => {
    const tile = document.querySelector('dialog[open] button:not([aria-label="Close"])');
    return tile ? getComputedStyle(tile.parentElement).gridTemplateColumns.split(' ').length === 1 && getComputedStyle(tile).flexDirection === 'row' : false;
  }),
);
await scoped().getByRole('button', { name: /Enter manually/ }).click();
await page.waitForTimeout(200);
await shot(page, '53-manual-390-200pct');
await page.close();

await browser.close();
log(`\n${passed} passed, ${failed} failed`);
log('Console/page errors:', errors.length ? '\n' + errors.join('\n') : 'none');
process.exitCode = failed > 0 || errors.length > 0 ? 1 : 0;
