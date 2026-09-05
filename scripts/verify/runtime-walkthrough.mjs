// Runtime walkthrough of both journeys against the built app (vite preview on :4173).
// Screenshots go to .verification/runtime/ (ignored); the tracked curated set and its
// inspection notes are verification/manifest.md.
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

async function newPage(width, height, extraCss, options = {}) {
  const ctx = await browser.newContext({ viewport: { width, height }, deviceScaleFactor: 2, hasTouch: true, isMobile: true, reducedMotion: options.reducedMotion ?? 'no-preference' });
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
const currentNav = () => page.locator('nav:visible [aria-current="page"]').innerText();

// Full-page captures extend the document past the viewport, where a fixed dialog backdrop
// or the fixed navigation cannot reach; while a dialog is open the capture is the
// viewport, so the scrim and the bar in the image are what a user sees.
const shot = async (page, name) => {
  const modal = await page.evaluate(() => Boolean(document.querySelector('dialog[open]')));
  if (!modal) {
    // Lazy thumbnails load only once scrolled into view: walk the page, wait for every image, return to the top.
    await page.evaluate(async () => {
      const y0 = window.scrollY;
      for (let y = 0; y < document.documentElement.scrollHeight; y += window.innerHeight) {
        window.scrollTo(0, y);
        await new Promise((r) => setTimeout(r, 40));
      }
      window.scrollTo(0, y0);
      // Only the visible screen's images can load; hidden mounted screens keep lazy images pending, so a bound wait stops a lost image from hanging the run.
      const visible = Array.from(document.querySelectorAll('[data-screen]:not([hidden]) img'));
      const settled = (img) => (img.complete ? Promise.resolve() : new Promise((r) => { img.onload = r; img.onerror = r; }));
      await Promise.race([Promise.all(visible.map(settled)), new Promise((r) => setTimeout(r, 5000))]);
    });
  }
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

/** The fixed navigation's geometry: bottom-anchored, no top border, content reserving its height. */
async function fixedNavigationHolds(page) {
  return page.evaluate(() => {
    const nav = document.querySelector('[data-screen]:not([hidden]) nav:not([hidden])');
    if (!nav) return false;
    const slot = nav.parentElement;
    const rect = slot.getBoundingClientRect();
    const main = document.querySelector('[data-screen]:not([hidden]) main');
    return (
      getComputedStyle(slot).position === 'fixed' &&
      Math.abs(rect.bottom - window.innerHeight) < 1 &&
      getComputedStyle(nav).borderTopWidth === '0px' &&
      parseFloat(getComputedStyle(main).paddingBlockEnd) >= nav.getBoundingClientRect().height
    );
  });
}

/** Adds a manually entered food to a meal so populated states can be captured on any page. */
async function addManualFood(page, name, kcal, meal = 'breakfast') {
  const label = { breakfast: 'Add breakfast', lunch: 'Add lunch', dinner: 'Add dinner', snack: 'Add snack' }[meal];
  const populated = { breakfast: 'Add to breakfast', lunch: 'Add to lunch', dinner: 'Add to dinner', snack: 'Add to snacks' }[meal];
  const row = scoped().getByRole('button', { name: label });
  if (await row.count()) await row.click();
  else await scoped().getByRole('button', { name: populated }).click();
  await scoped().getByRole('button', { name: /Enter manually/ }).click();
  await scoped().getByLabel('Food or dish name').fill(name);
  await scoped().getByLabel('Calories').fill(String(kcal));
  await scoped().getByRole('button', { name: 'Continue to review' }).click();
  await scoped().getByRole('button', { name: 'Add to today' }).click();
  await scoped().getByRole('button', { name: populated }).click();
  await page.waitForTimeout(250);
}

async function setGoal(page, kcal) {
  await scoped().getByRole('button', { name: 'Set goal' }).first().click();
  await scoped().getByRole('textbox', { name: 'Daily goal' }).fill(String(kcal));
  await scoped().getByRole('button', { name: 'Apply' }).click();
  await page.waitForTimeout(250);
}

// --- Journey 1: calories for a food, added to a meal --------------------------------
let page = await newPage(390, 844);
await shot(page, '01-home-empty');
await check(page, 'rendered font is Inter Variable', async () => {
  const loaded = await page.evaluate(() => [400, 500, 600, 700].every((w) => document.fonts.check(`${w} 16px "Inter Variable"`)));
  return loaded;
});
await check(page, 'launch is S01-1: no entries, no goal, all four meals, Home current, brand lockup', async () => {
  const t = await visibleText();
  const lockup = await page.locator('[data-screen="home"] header [role="img"][aria-label="Portion"]').count();
  return t.includes('Nothing logged') && t.includes('Set goal') && ['Breakfast', 'Lunch', 'Dinner', 'Snacks'].every((m) => t.includes(m)) && (await currentNav()).includes('Home') && lockup === 1;
});
await check(page, 'no goal draws no empty bar; Set goal is offered', async () => (await page.locator('[data-screen="home"] [role="meter"][aria-label="Calories logged against your goal"]').count()) === 0);
await check(page, 'navigation is fixed, borderless, and the content reserves its height', () => fixedNavigationHolds(page));

// Goal with targets
await scoped().getByRole('button', { name: 'Set goal' }).first().click();
await page.waitForTimeout(350);
await shot(page, '02-goal-sheet');
await scoped().getByRole('textbox', { name: 'Daily goal' }).fill('2000');
await scoped().getByLabel(/^Protein/).fill('120');
await scoped().getByLabel(/^Carbohydrates/).fill('220');
await scoped().getByLabel(/^Fat/).fill('65');
await scoped().getByRole('button', { name: 'Apply' }).click();
await page.waitForTimeout(250);
await shot(page, '03-home-goal-empty');
await check(page, 'goal 2,000 with nothing logged: 2,000 remaining, 0 %, targets shown', async () => {
  const t = await visibleText();
  const label = await page.locator('[data-screen="home"] [role="meter"][aria-label="Calories logged against your goal"]').getAttribute('aria-valuetext');
  log('   budget valuetext:', label);
  // The macro target renders as "0 / 120 g" (with a hidden "of" for assistive technology).
  const targets = await page.locator('[data-screen="home"] [role="meter"][aria-label="Protein against your target"]').getAttribute('aria-valuetext');
  return t.includes('kcal remaining') && t.includes('Edit goal') && label === '0 of 2,000 kcal, 0 %' && targets === '0 of 120 g';
});

// A meal row starts the task with its meal preselected.
await scoped().getByRole('button', { name: 'Add lunch' }).click();
await page.waitForTimeout(350);
await shot(page, '04-method-sheet');
await check(page, 'method sheet is a modal dialog with focus inside, laid out 2 × 2', async () =>
  page.evaluate(() => {
    const d = document.querySelector('dialog[open]');
    const tile = d?.querySelector('button:not([aria-label="Close"])');
    const columns = tile ? getComputedStyle(tile.parentElement).gridTemplateColumns.split(' ').length : 0;
    return !!d && d.contains(document.activeElement) && columns === 2;
  }),
);
await scoped().getByRole('button', { name: /Search food/ }).click();
await page.waitForTimeout(200);
await check(page, 'Search food opens the Search root (section header) with the barcode action in the field', async () => {
  const h1 = await page.locator('[data-screen="search"]:visible h1').innerText();
  return h1 === 'Search' && (await scoped().getByRole('button', { name: 'Scan barcode' }).count()) === 1;
});
await scoped().getByRole('searchbox').fill('rice');
await page.waitForTimeout(300);
await shot(page, '05-search-loading');
await page.waitForTimeout(700);
await shot(page, '06-search-food-results');
await scoped().getByRole('button', { name: /Vegetable rice bowl/ }).click();
await page.waitForTimeout(200);
await shot(page, '07-review-default');
await scoped().getByLabel('Amount to calculate').fill('300');
await page.waitForTimeout(100);
await shot(page, '08-review-300');
await check(page, 'C at 300 g shows 540 kcal on review; no bar on a focused step', async () => (await page.locator('main:visible').innerText()).includes('540') && (await page.locator('nav:visible').count()) === 0);
await scoped().getByRole('button', { name: 'Add to today' }).click();
await page.waitForTimeout(350);
await shot(page, '09-add-to-meal-sheet');
await check(page, 'Add to today opens the Add-to-meal sheet with Lunch preselected from the Home row', async () => {
  const dialog = page.locator('dialog[open]');
  const checked = await dialog.getByRole('radio', { name: 'Lunch' }).getAttribute('aria-checked');
  return (await dialog.innerText()).includes('Preselected from the meal') && checked === 'true' && (await dialog.innerText()).includes('540');
});
await scoped().getByRole('button', { name: 'Add to lunch' }).click();
await page.waitForTimeout(300);
await shot(page, '10-home-populated');
await check(page, 'Add to lunch returns Home (S01-2): 540 kcal logged under Lunch, 27 %, one confirmation', async () => {
  const t = await visibleText();
  const section = await page.locator('[data-screen="home"] section[aria-labelledby^="meal-"]', { has: page.getByRole('button', { name: /Vegetable rice bowl/ }) }).getAttribute('aria-labelledby');
  const label = await page.locator('[data-screen="home"] [role="meter"][aria-label="Calories logged against your goal"]').getAttribute('aria-valuetext');
  const status = await page.getByRole('status').filter({ hasText: 'Added to' }).innerText();
  log('   section/valuetext/status:', section, label, status);
  return t.includes('540 kcal logged') && section === 'meal-lunch' && label === '540 of 2,000 kcal, 27 %' && status.includes('Added to lunch') && (await currentNav()).includes('Home');
});

// Existing-entry edit: stale draft, unit change, expanded nutrition, meal move, update.
await scoped().getByRole('button', { name: /Vegetable rice bowl/ }).click();
await page.waitForTimeout(200);
await shot(page, '11-entry-edit');
await check(page, 'existing entry shows its meal in the picker', async () => (await scoped().getByRole('radio', { name: 'Lunch' }).getAttribute('aria-checked')) === 'true');
await scoped().getByLabel('Amount to calculate').fill('abc');
await page.locator('h1:visible').first().click();
await page.waitForTimeout(150);
await shot(page, '12-entry-invalid-stale');
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
await shot(page, '13-unit-sheet');
await scoped().getByRole('radio', { name: /serving/ }).check();
await scoped().getByRole('button', { name: 'Confirm', exact: true }).click();
await page.waitForTimeout(200);
await check(page, 'switching g → serving keeps the portion (1 serving, 540 kcal)', async () => {
  const value = await scoped().getByLabel('Amount to calculate').inputValue();
  const text = await page.locator('main:visible').innerText();
  return value === '1' && text.includes('540') && text.includes('For 1 serving (300 g)');
});
await scoped().getByRole('button', { name: 'Show all nutrition' }).click();
await page.waitForTimeout(200);
await shot(page, '14-entry-expanded');
await scoped().getByRole('radio', { name: 'Dinner' }).click();
await scoped().getByRole('button', { name: 'Update entry' }).click();
await page.waitForTimeout(250);
await check(page, 'Update entry commits portion and meal to the same entry (moved to Dinner, still 540)', async () => {
  const t = await visibleText();
  const section = await page.locator('[data-screen="home"] section[aria-labelledby^="meal-"]', { has: page.getByRole('button', { name: /Vegetable rice bowl/ }) }).getAttribute('aria-labelledby');
  return t.includes('540 kcal logged') && section === 'meal-dinner';
});

// Water: quick add, repeated taps, Undo, sheet add, edit total.
const quick = () => scoped().getByRole('button', { name: 'Add 250 millilitres of water' });
await quick().click();
await quick().click();
await page.waitForTimeout(500);
await shot(page, '15-home-water-quick-add');
await check(page, 'two quick taps accumulate to 500 ml and announce once per tap', async () => {
  const edit = await scoped().getByRole('button', { name: 'Edit water, 500 millilitres of 2 litres' }).count();
  const status = await page.getByRole('status').filter({ hasText: 'ml added' }).innerText();
  return edit === 1 && status.includes('250 ml added. 500 millilitres today.');
});
await page.getByRole('button', { name: 'Undo' }).click();
await page.waitForTimeout(200);
await check(page, 'Undo restores the previous total (250 ml)', async () => (await scoped().getByRole('button', { name: 'Edit water, 250 millilitres of 2 litres' }).count()) === 1);
await scoped().getByRole('button', { name: /^Edit water/ }).click();
await page.waitForTimeout(350);
await shot(page, '16-water-sheet');
await scoped().getByRole('radio', { name: '350 ml' }).click();
await scoped().getByRole('button', { name: 'Add water' }).click();
await page.waitForTimeout(300);
await check(page, 'the sheet adds a preset (250 + 350 = 600 ml)', async () => (await scoped().getByRole('button', { name: 'Edit water, 600 millilitres of 2 litres' }).count()) === 1);
await scoped().getByRole('button', { name: /^Edit water/ }).click();
await page.waitForTimeout(300);
await scoped().getByRole('button', { name: /Edit today/ }).click();
await page.waitForTimeout(200);
await shot(page, '17-water-edit-total');
await scoped().getByLabel("Today's total", { exact: true }).fill('1000');
await scoped().getByRole('button', { name: 'Save total' }).click();
await page.waitForTimeout(300);
await check(page, 'Save total replaces the day (1 litre)', async () => (await scoped().getByRole('button', { name: 'Edit water, 1 litre of 2 litres' }).count()) === 1);

// Task origin (ledger D-4): the bar's Log food from Home → Search food switches to the
// Search root; Done from the review returns to Home, the surface that opened Log food.
await scoped().getByRole('button', { name: 'Log food' }).first().click();
await scoped().getByRole('button', { name: /Search food/ }).click();
await page.waitForTimeout(300);
await scoped().getByRole('searchbox').fill('rice');
await page.waitForTimeout(900);
await scoped().getByRole('button', { name: /Vegetable rice bowl/ }).click();
await page.waitForTimeout(300);
await shot(page, '18-review-from-home-origin');
await scoped().getByRole('button', { name: 'Done' }).click();
await page.waitForTimeout(300);
await check(page, 'Done returns to Home, the invoking surface, without logging', async () => {
  const home = await page.locator('[data-screen="home"]:visible').count();
  return home === 1 && (await visibleText()).includes('540 kcal logged');
});

// Barcode from the Search field → sample read → lookup → review → back to the paused scanner
await scoped().getByRole('button', { name: 'Search', exact: true }).click();
await page.waitForTimeout(200);
await scoped().getByRole('button', { name: 'Scan barcode' }).click();
await page.waitForTimeout(300);
await shot(page, '19-barcode-scanning');
await check(page, 'scanner shows the dark stage, the Scanning chip and a moving scan line; no simulator controls', async () => {
  const t = await page.locator('main:visible').innerText();
  const line = await page.evaluate(() => {
    const el = document.querySelector('[data-screen="barcode"]:not([hidden]) [class*="scanLine"]');
    return el ? getComputedStyle(el).animationName !== 'none' : false;
  });
  return t.includes('Scanning') && line && !t.includes('Simulate');
});
await page.waitForTimeout(1700);
await shot(page, '20-barcode-looking-up');
await page.waitForTimeout(900);
await shot(page, '21-review-barcode');
await check(page, 'the sample read looks the product up and opens review with the barcode explanation', async () => (await page.locator('main:visible').innerText()).includes('Matched from the barcode'));
await scoped().getByRole('button', { name: 'Back' }).click();
await page.waitForTimeout(150);
await shot(page, '22-barcode-paused-after-back');
await check(page, 'Back returns to the paused scanner (detected chip, Scan again)', async () => {
  const t = await page.locator('main:visible').innerText();
  return t.includes('Scanning is paused') && (await scoped().getByRole('button', { name: 'Scan again' }).count()) === 1;
});
await scoped().getByRole('button', { name: 'Back' }).click();
await page.waitForTimeout(150);
await check(page, 'Back from the scanner returns to Search, where it was opened', async () => (await page.locator('[data-screen="search"]:visible h1').innerText()) === 'Search');

// Manual entry from a no-match search, validation, discard protection
await scoped().getByRole('searchbox').fill('zzzz');
await page.waitForTimeout(900);
await scoped().getByRole('button', { name: 'Enter manually' }).click();
await page.waitForTimeout(150);
await shot(page, '23-manual-empty');
await scoped().getByRole('button', { name: 'Continue to review' }).click();
await page.waitForTimeout(150);
await shot(page, '24-manual-errors');
await check(page, 'manual entry focuses first invalid field', async () => page.evaluate(() => document.activeElement?.id?.includes('manual-name') ?? false));
await scoped().getByLabel('Food or dish name').fill('Lentil soup');
await scoped().getByLabel('Calories').fill('150');
await scoped().getByLabel(/^Protein/).fill('8');
await scoped().getByRole('button', { name: 'Continue to review' }).click();
await page.waitForTimeout(150);
await shot(page, '25-review-manual');
await scoped().getByRole('button', { name: 'Back' }).click();
await page.waitForTimeout(150);
await check(page, 'back from review restores manual draft', async () => (await scoped().getByLabel('Food or dish name').inputValue()) === 'Lentil soup');
await scoped().getByRole('button', { name: 'Back' }).click();
await page.waitForTimeout(300);
await shot(page, '26-manual-discard-dialog');
await check(page, 'dirty manual entry asks before discarding', async () => page.evaluate(() => !!document.querySelector('dialog[open][role="alertdialog"]')));
await scoped().getByRole('button', { name: 'Keep editing' }).click();
await page.waitForTimeout(150);
await check(page, 'keep editing preserves the draft', async () => (await scoped().getByLabel('Food or dish name').inputValue()) === 'Lentil soup');
await scoped().getByRole('button', { name: 'Back' }).click();
await scoped().getByRole('button', { name: 'Discard' }).click();
await page.waitForTimeout(150);
await check(page, 'discard returns to Search with the query kept', async () => (await scoped().getByRole('searchbox').inputValue()) === 'zzzz');
await scoped().getByRole('button', { name: 'Clear search' }).click();

// Photo → suggestions → review → Done (no logging)
await scoped().getByRole('button', { name: 'Home', exact: true }).click();
await page.waitForTimeout(150);
await scoped().getByRole('button', { name: 'Log food' }).first().click();
await scoped().getByRole('button', { name: /Take a photo/ }).click();
await page.waitForTimeout(300);
await shot(page, '27-photo-capture');
await check(page, 'capture shows the dark stage, the circular guide, a 72 px shutter and no simulator controls', async () => {
  const t = await page.locator('main:visible').innerText();
  const size = await scoped().getByRole('button', { name: 'Take photo' }).boundingBox();
  return t.includes('Frame the food') && size && size.width >= 72 && !t.includes('Simulate');
});
await scoped().getByRole('button', { name: 'Take photo' }).click();
await page.waitForTimeout(150);
await shot(page, '28-photo-preview');
await scoped().getByRole('button', { name: 'Analyse photo' }).click();
await page.waitForTimeout(150);
await shot(page, '29-photo-analysing');
await page.waitForTimeout(1000);
await shot(page, '30-photo-suggestions');
await scoped().getByRole('radio', { name: /Lentil soup/ }).check();
await scoped().getByRole('button', { name: 'Review selected match' }).click();
await page.waitForTimeout(150);
await shot(page, '31-review-photo');
await scoped().getByRole('button', { name: 'Done' }).click();
await page.waitForTimeout(200);
await check(page, 'Done closes the task to Home without logging', async () => {
  const t = await visibleText();
  return (await page.locator('[data-screen="home"]:visible').count()) === 1 && t.includes('540 kcal logged');
});

// --- Journey 2: recipes -------------------------------------------------------
await scoped().getByRole('button', { name: 'Recipes', exact: true }).click();
await page.waitForTimeout(700);
await shot(page, '32-recipes-browse');
await check(page, 'every catalogue recipe shows a photograph; the filter action sits at the end of the search entry', async () => {
  const noPhoto = await page.locator('[data-screen="recipes"]:visible main').getByText('No photo').count();
  const filters = await scoped().getByRole('button', { name: 'Filters' }).count();
  return noPhoto === 0 && filters === 1;
});
await check(page, 'navigation stays fixed on Recipes', () => fixedNavigationHolds(page));
await scoped().getByRole('button', { name: /^Filters/ }).click();
await page.waitForTimeout(350);
await shot(page, '33-filters-sheet');
await scoped().getByRole('radio', { name: 'Vegan' }).click();
await scoped().getByLabel('Maximum').fill('100');
await scoped().getByLabel('Minimum').fill('300');
await scoped().getByRole('button', { name: 'Apply filters' }).click();
await page.waitForTimeout(150);
await shot(page, '34-filters-invalid-range');
await check(page, 'min > max is refused', async () => (await page.locator('dialog[open]').innerText()).includes('at least the minimum'));
await scoped().getByLabel('Maximum').fill('500');
await scoped().getByLabel('Protein per serving, at least').fill('10');
await scoped().getByRole('button', { name: 'Apply filters' }).click();
await page.waitForTimeout(300);
await shot(page, '35-recipes-filtered');
await check(page, 'filtered browse shows evidence per card and the count on the filter action', async () => {
  const t = await page.locator('main:visible').innerText();
  return t.includes('Matches') && (await scoped().getByRole('button', { name: 'Filters, 3 active' }).count()) === 1;
});
await scoped().getByRole('button', { name: /Remove filter: Vegan/ }).click();
await page.waitForTimeout(150);
await shot(page, '36-recipes-chip-removed');
await scoped().getByRole('button', { name: /^Filters/ }).click();
await scoped().getByLabel('Preparation time, at most').fill('5');
await scoped().getByRole('button', { name: 'Apply filters' }).click();
await page.waitForTimeout(300);
await shot(page, '37-recipes-no-match');
await scoped().getByRole('button', { name: 'Change filters' }).click();
await scoped().getByRole('button', { name: 'Reset all' }).click();
await scoped().getByRole('button', { name: 'Apply filters' }).click();
await page.waitForTimeout(300);
await check(page, 'reset + apply clears filters', async () => (await page.locator('main:visible').innerText()).includes('All recipes'));
await scoped().getByRole('button', { name: /^Filters/ }).click();
await scoped().getByLabel('Maximum').fill('460');
await scoped().getByRole('button', { name: 'Apply filters' }).click();
await page.waitForTimeout(300);
await page.evaluate(() => window.scrollTo(0, 200));
await page.waitForTimeout(100);
const beforeY = await page.evaluate(() => window.scrollY);
await scoped().getByRole('button', { name: 'Lentil soup' }).click();
await page.waitForTimeout(150);
await shot(page, '38-recipe-loading');
await check(page, 'details keeps Recipes selected while loading', async () => (await currentNav()).includes('Recipes'));
await page.waitForTimeout(700);
await shot(page, '39-recipe-loaded');
await check(page, 'details: hero, time chip, Add beside the title, counts, fixed bar, no sticky footer', async () => {
  const t = (await page.locator('main:visible').innerText()).replace(/ /g, ' ');
  const add = await scoped().getByRole('button', { name: 'Add Lentil soup to a meal' }).count();
  const footer = await page.locator('[data-screen="recipe"]:not([hidden]) footer').count();
  return t.includes('25 min preparation') && add === 1 && t.includes('7 items') && t.includes('3 steps') && footer === 0 && (await fixedNavigationHolds(page));
});
await scoped().getByRole('button', { name: 'Show all nutrition' }).click();
await page.waitForTimeout(150);
await shot(page, '40-recipe-expanded');
await check(page, 'R per serving 450 kcal, fibre nested, Vitamin D not available', async () => {
  const t = await page.locator('main:visible').innerText();
  return t.includes('450') && t.includes('of which fibre') && /Vitamin D[\s\S]*Not available/.test(t);
});
await scoped().getByRole('button', { name: 'Add Lentil soup to a meal' }).click();
await page.waitForTimeout(350);
await shot(page, '41-recipe-add-sheet');
await scoped().getByLabel('Servings').fill('2');
await check(page, 'the recipe sheet recalculates for 2 servings (900 kcal) and offers one Add to {meal}', async () => {
  const dialog = page.locator('dialog[open]');
  return (await dialog.innerText()).includes('900') && (await dialog.getByRole('button', { name: /^Add to / }).count()) === 1;
});
await scoped().getByRole('button', { name: 'Cancel' }).click();
await page.waitForTimeout(200);
await check(page, 'Cancel keeps the recipe screen and writes nothing', async () => (await page.locator('[data-screen="recipe"]:not([hidden])').count()) === 1);
await scoped().getByRole('button', { name: 'Add Lentil soup to a meal' }).click();
await page.waitForTimeout(350);
await scoped().getByLabel('Servings').fill('2');
await scoped().getByRole('radio', { name: 'Dinner' }).click();
await scoped().getByRole('button', { name: 'Add to dinner' }).click();
await page.waitForTimeout(300);
await shot(page, '42-home-with-recipe');
await check(page, 'the recipe entry lands under Dinner and Home totals update (540 + 900)', async () => {
  const t = await visibleText();
  return t.includes('1,440 kcal logged') && t.includes('Lentil soup') && t.includes('2 servings (600 g)');
});
await page.locator('[data-screen="home"]:not([hidden]) section[aria-labelledby="meal-dinner"]').getByRole('button', { name: /Lentil soup/ }).click();
await page.waitForTimeout(200);
await check(page, 'the recipe entry reopens in existing-entry mode with servings', async () => {
  const t = await page.locator('main:visible').innerText();
  return (await page.locator('h1:visible').innerText()).includes('Edit entry') && t.includes('serving');
});
await scoped().getByRole('button', { name: 'Back' }).click();
await page.waitForTimeout(200);

// Home's recommendation reflects the applied browse criteria; Back from details returns to the list.
await shot(page, '43-home-recommendation-with-filters');
await check(page, 'Home shows the recipe that matches the applied browse filter with its evidence', async () => {
  const t = await visibleText();
  return t.includes('Matches your filters') && t.includes('Matches all 1 filter');
});
await scoped().getByRole('button', { name: 'All recipes' }).click();
await page.waitForTimeout(200);
await check(page, 'All recipes opens the Recipes root with its criteria and scroll kept', async () => {
  const afterY = await page.evaluate(() => window.scrollY);
  log('   scroll before/after:', beforeY, afterY);
  return (await page.locator('main:visible').innerText()).includes('Matching recipes') && Math.abs(beforeY - afterY) < 5;
});

// Browse → Search snapshot, scopes, failure
await scoped().getByRole('button', { name: 'Search recipes' }).click();
await page.waitForTimeout(150);
await shot(page, '44-search-recipes-scope-snapshot');
await check(page, 'search opens in Recipes scope with snapshot criteria and the filter action in the field', async () => {
  const t = await page.locator('main:visible').innerText();
  return t.includes('Under 460 kcal') && (await scoped().getByRole('tab', { name: 'Recipes' }).getAttribute('aria-selected')) === 'true' && (await scoped().getByRole('button', { name: 'Filters, 1 active' }).count()) === 1;
});
await scoped().getByRole('searchbox').fill('lentil');
await page.waitForTimeout(1000);
await shot(page, '45-search-recipes-results');
await scoped().getByRole('tab', { name: 'Food' }).click();
await page.waitForTimeout(1000);
await shot(page, '46-search-food-scope-keeps-query');
await check(page, 'food scope keeps the query and is unfiltered', async () => {
  const t = await page.locator('main:visible').innerText();
  return (await scoped().getByRole('searchbox').inputValue()) === 'lentil' && !t.includes('Under 460');
});
await scoped().getByRole('searchbox').fill('offline');
await page.waitForTimeout(1000);
await shot(page, '47-search-failure');
await scoped().getByRole('searchbox').fill('zzzz');
await page.waitForTimeout(1000);
await shot(page, '48-search-no-match');
await scoped().getByRole('button', { name: 'Recipes', exact: true }).click();
await page.waitForTimeout(150);
await check(page, 'browse criteria untouched by search edits', async () => (await page.locator('main:visible').innerText()).includes('Under 460 kcal'));

// Remove entry
await scoped().getByRole('button', { name: 'Home', exact: true }).click();
await page.waitForTimeout(150);
await scoped().getByRole('button', { name: /Vegetable rice bowl/ }).click();
await page.waitForTimeout(150);
await scoped().getByRole('button', { name: 'Remove entry' }).click();
await page.waitForTimeout(300);
await shot(page, '49-remove-entry-dialog');
await scoped().getByRole('button', { name: 'Keep entry' }).click();
await page.waitForTimeout(150);
await scoped().getByRole('button', { name: 'Remove entry' }).click();
await page.waitForTimeout(200);
await scoped().getByRole('button', { name: 'Remove', exact: true }).click();
await page.waitForTimeout(250);
await shot(page, '50-home-after-remove');
await check(page, 'confirmed removal recalculates Home (900 kcal logged) with the goal kept', async () => {
  const t = await visibleText();
  return t.includes('900 kcal logged') && !t.includes('Vegetable rice bowl') && t.includes('Edit goal');
});
await page.close();

// --- Responsive / enlarged text ----------------------------------------------
for (const width of [320, 393, 430]) {
  page = await newPage(width, 800);
  await addManualFood(page, 'Oatmeal with mixed berries', 550, 'breakfast');
  await addManualFood(page, 'Grilled chicken Caesar salad', 800, 'lunch');
  await setGoal(page, 2200);
  await shot(page, `51-home-${width}`);
  await check(page, `no horizontal overflow on Home at ${width}`, async () => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1));
  await check(page, `fixed navigation holds at ${width}`, () => fixedNavigationHolds(page));
  if (width === 320) {
    await scoped().getByRole('button', { name: 'Log food' }).first().click();
    await page.waitForTimeout(350);
    await shot(page, '52-method-sheet-320');
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
await addManualFood(page, 'Oatmeal with mixed berries', 550, 'breakfast');
await page.waitForTimeout(200);
await shot(page, '53-home-320-200pct');
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
await check(page, 'no horizontal overflow on Home at 320 + 200%', async () => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1));
await check(page, 'content clears the taller bar at 320 + 200%', () => fixedNavigationHolds(page));
await scoped().getByRole('button', { name: 'Recipes', exact: true }).click();
await page.waitForTimeout(700);
await shot(page, '54-recipes-320-200pct');
await page.close();
page = await newPage(390, 844, 'html { font-size: 200% !important; }');
await scoped().getByRole('button', { name: 'Log food' }).first().click();
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
await shot(page, '56-manual-390-200pct');
await page.close();

// --- Reduced motion ---------------------------------------------------------------
page = await newPage(390, 844, undefined, { reducedMotion: 'reduce' });
await scoped().getByRole('button', { name: 'Add 250 millilitres of water' }).click();
await page.waitForTimeout(50);
await check(page, 'reduced motion: the water figure updates without animating', async () => (await visibleText()).includes('250'));
await scoped().getByRole('button', { name: 'Log food' }).first().click();
await scoped().getByRole('button', { name: /Scan barcode/ }).click();
await page.waitForTimeout(200);
await check(page, 'reduced motion: the scan line does not animate', async () =>
  page.evaluate(() => {
    const el = document.querySelector('[data-screen="barcode"]:not([hidden]) [class*="scanLine"]');
    return el ? getComputedStyle(el).animationName === 'none' : false;
  }),
);
await page.close();

// --- Journey 5: the populated Food tab, filters, view, persistence and the day boundary (ledger §11) ---
page = await newPage(390, 844);
await scoped().getByRole('button', { name: 'Search', exact: true }).click();
await page.waitForTimeout(200);
await shot(page, '57-search-first-use');
await check(page, 'first use: the Food tab shows the 15-item catalogue at once in the list view, without Recently added', async () => {
  const t = await visibleText();
  const rows = await scoped().locator('ul[data-view="list"] > li').count();
  const list = await scoped().getByRole('radio', { name: 'List' }).getAttribute('aria-checked');
  return t.includes('15 items') && !t.includes('Recently added') && rows === 15 && list === 'true';
});
await check(page, 'every catalogue item shows a photograph, a name and calories with a basis', async () =>
  page.evaluate(() => {
    const rows = Array.from(document.querySelectorAll('[data-screen="search"]:not([hidden]) ul[data-view="list"] > li'));
    return rows.length === 15 && rows.every((li) => li.querySelector('img') && /kcal/.test(li.textContent ?? '') && /per /.test(li.textContent ?? ''));
  }),
);
await scoped().getByRole('button', { name: 'Food filters' }).click();
await page.waitForTimeout(350);
await shot(page, '58-food-filters-sheet');
await scoped().getByRole('radio', { name: 'Drinks' }).click();
await scoped().getByRole('button', { name: 'Apply filters' }).click();
await page.waitForTimeout(350);
await shot(page, '59-search-drinks-only');
await check(page, 'Drinks only: the chip, the action count and exactly the three drinks', async () => {
  const t = await visibleText();
  const names = await scoped().locator('ul[data-view="list"] > li').allInnerTexts();
  return t.includes('3 drinks') && t.includes('Drinks only') && (await scoped().getByRole('button', { name: 'Food filters, 1 active' }).count()) === 1 && names.length === 3 && names.every((n) => /Sparkling water|Orange juice|Oat drink/.test(n));
});
await scoped().getByRole('radio', { name: 'Grid' }).click();
await page.waitForTimeout(250);
await shot(page, '60-search-grid-drinks');
await check(page, 'the grid keeps the filter and shows two columns of the same three drinks', async () =>
  page.evaluate(() => {
    const grid = document.querySelector('[data-screen="search"]:not([hidden]) ul[data-view="grid"]');
    return !!grid && grid.children.length === 3 && getComputedStyle(grid).gridTemplateColumns.split(' ').length === 2;
  }),
);
// Log a drink: it goes through the same review → Add-to-meal route and never touches water.
await scoped().getByRole('button', { name: 'Orange juice' }).click();
await page.waitForTimeout(200);
await check(page, 'a drink opens review with its volume basis and units', async () => {
  const t = await visibleText();
  return t.includes('Orange juice') && t.includes('per 100 ml') && (await scoped().getByRole('button', { name: 'Change unit, currently ml' }).count()) === 1;
});
await scoped().getByLabel('Amount to calculate').fill('250');
await scoped().getByRole('button', { name: 'Add to today' }).click();
await page.waitForTimeout(300);
await scoped().getByRole('button', { name: /^Add to (breakfast|lunch|dinner|snacks)$/ }).click();
await page.waitForTimeout(400);
await shot(page, '61-home-drink-logged');
await check(page, 'the drink is logged under a meal at 113 kcal for 250 ml and water stays at 0 ml', async () => {
  const t = await visibleText();
  return t.includes('Orange juice') && t.includes('250 ml') && t.includes('113 kcal') && t.includes('0 ml') && !t.includes('250 ml added');
});
await scoped().getByRole('button', { name: 'Search', exact: true }).click();
await page.waitForTimeout(200);
await check(page, 'the Drinks filter and the grid view survive leaving Search; the logged drink now leads Recently added', async () => {
  const t = await visibleText();
  const grid = await scoped().getByRole('radio', { name: 'Grid' }).getAttribute('aria-checked');
  const recents = await scoped().locator('ul[aria-labelledby^="search-recents"] > li').allInnerTexts();
  return t.includes('Recently added') && grid === 'true' && recents.length === 1 && /Orange juice/.test(recents[0]);
});
await scoped().getByRole('button', { name: 'Remove filter: Drinks only' }).click();
await page.waitForTimeout(250);
await shot(page, '62-search-recents-grid');
await check(page, 'without the filter: Recently added (1) above Explore foods (14), 15 items in total', async () => {
  const t = await visibleText();
  const explore = await scoped().locator('ul[aria-labelledby^="search-explore"] > li').count();
  return t.includes('15 items') && explore === 14;
});
await scoped().getByRole('searchbox').fill('oat');
await page.waitForTimeout(900);
await check(page, 'a query yields one unified set: 2 items found for “oat”, no Recently added section', async () => {
  const t = await visibleText();
  return t.includes('2 items found') && !t.includes('Recently added');
});
await scoped().getByRole('button', { name: 'Clear search' }).click();
await page.waitForTimeout(300);
// Reload: entries, water and the view preference come back from the device.
await page.reload();
await page.waitForTimeout(400);
await check(page, 'after a reload Home still shows the logged drink and 0 ml of water', async () => {
  const t = await visibleText();
  return t.includes('Orange juice') && t.includes('113 kcal') && t.includes('0 ml');
});
await scoped().getByRole('button', { name: 'Search', exact: true }).click();
await page.waitForTimeout(250);
await shot(page, '63-search-after-reload');
await check(page, 'after a reload the grid view is kept and Recently added still lists the drink with its photograph', async () => {
  const grid = await scoped().getByRole('radio', { name: 'Grid' }).getAttribute('aria-checked');
  const recent = scoped().locator('ul[aria-labelledby^="search-recents"] > li');
  return grid === 'true' && (await recent.count()) === 1 && (await recent.locator('img').count()) === 1;
});
// Day boundary: the stored record is moved to an earlier local day; after a reload it is history, not today.
await page.evaluate(() => {
  const record = JSON.parse(localStorage.getItem('portion.record'));
  for (const entry of record.entries) entry.dayKey = '2000-01-01';
  record.water = { '2000-01-01': 750 };
  localStorage.setItem('portion.record', JSON.stringify(record));
});
await page.reload();
await page.waitForTimeout(400);
await shot(page, '64-home-after-day-boundary');
await check(page, 'an earlier day never reads as today: Home shows nothing logged and 0 ml, while Recently added keeps the drink', async () => {
  const home = await visibleText();
  await scoped().getByRole('button', { name: 'Search', exact: true }).click();
  await page.waitForTimeout(250);
  const search = await visibleText();
  return home.includes('Nothing logged') && home.includes('0 ml') && !home.includes('Orange juice') && search.includes('Recently added') && search.includes('Orange juice');
});
await page.close();

// Midnight while the app stays open: the local day key rolls over without a reload.
{
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, hasTouch: true, isMobile: true });
  const clockPage = await ctx.newPage();
  clockPage.on('pageerror', (e) => errors.push('[pageerror] ' + e.message));
  const before = new Date();
  before.setHours(23, 59, 30, 0);
  await clockPage.clock.install({ time: before });
  await clockPage.goto(base);
  const local = () => clockPage.locator('[data-screen]:not([hidden]), dialog[open]');
  await local().getByRole('button', { name: 'Add 250 millilitres of water' }).click();
  await clockPage.waitForTimeout(500);
  const shownBefore = await clockPage.locator('[data-screen]:not([hidden])').innerText();
  await clockPage.clock.runFor(60 * 1000);
  await clockPage.waitForTimeout(300);
  const shownAfter = await clockPage.locator('[data-screen]:not([hidden])').innerText();
  await check(clockPage, 'past local midnight the open app shows the new day: water returns to 0 ml and the date line advances', async () => {
    const after = new Date(before.getTime() + 60 * 1000);
    const fmt = (d) => d.toLocaleDateString('en', { month: 'short', day: 'numeric' });
    return shownBefore.includes('250 ml') && shownBefore.includes(fmt(before)) && shownAfter.includes('0 ml') && shownAfter.includes(fmt(after)) && after.getDate() !== before.getDate();
  });
  await ctx.close();
}

await browser.close();
log(`\n${passed} passed, ${failed} failed`);
log('Console/page errors:', errors.length ? '\n' + errors.join('\n') : 'none');
process.exitCode = failed > 0 || errors.length > 0 ? 1 : 0;
