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
  await scoped().getByRole('button', { name: 'Continue to portion' }).click();
  await page.waitForTimeout(150);
  await scoped().getByRole('button', { name: populated }).click();
  await page.waitForTimeout(250);
}

async function setGoal(page, kcal) {
  await scoped().getByRole('button', { name: 'Set targets' }).click();
  await scoped().getByRole('button', { name: /I know my goal/ }).click();
  await page.waitForTimeout(300);
  await scoped().getByRole('textbox', { name: 'Daily calories' }).fill(String(kcal));
  await scoped().getByRole('radio', { name: 'Custom' }).click();
  await scoped().getByRole('button', { name: 'Save targets' }).click();
  await page.waitForTimeout(250);
}
/** The local day key of today plus `days`, the way the app keys days. */
const dayKeyFrom = (days) => {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};
const editor = () => page.locator('[data-screen="targets-editor"]:not([hidden]), [data-screen="targets-review"]:not([hidden])');

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
  return t.includes('Nothing logged') && t.includes('kcal logged') && t.includes('Set targets') && !t.includes('remaining') && ['Breakfast', 'Lunch', 'Dinner', 'Snacks'].every((m) => t.includes(m)) && (await currentNav()).includes('Home') && lockup === 1;
});
await check(page, 'no target draws no empty bar; the one Set targets action sits on the calorie card, not in the header', async () => {
  const meters = await page.locator('[data-screen="home"] [role="meter"][aria-label="Calories logged against your target"]').count();
  const actions = await scoped().getByRole('button', { name: 'Set targets' }).count();
  const inHeader = await page.locator('[data-screen="home"] header').getByRole('button', { name: /targets/ }).count();
  return meters === 0 && actions === 1 && inHeader === 0;
});
await check(page, 'the day strip is compact: no previous / next week buttons, today marked and later days unavailable, the recommendation above the meals', async () =>
  page.evaluate(() => {
    const home = document.querySelector('[data-screen="home"]');
    const weekButtons = home.querySelectorAll('button[aria-label="Previous week"], button[aria-label="Next week"]').length;
    const today = home.querySelector('[role="radio"][aria-label$=", today"]');
    const future = home.querySelectorAll('[role="radio"]:disabled').length;
    const headings = Array.from(home.querySelectorAll('h2')).map((h) => h.textContent);
    // A Sunday is the week's last tile, so no later day of that week exists to disable.
    const laterDays = new Date().getDay() === 0 ? 0 : 1;
    return weekButtons === 0 && !!today && today.getAttribute('aria-checked') === 'true' && future >= laterDays && headings.indexOf('Recipe to try') < headings.findIndex((h) => /meals/.test(h));
  }),
);
await check(page, 'navigation is fixed, borderless, and the content reserves its height', () => fixedNavigationHolds(page));

// Goal with targets
await scoped().getByRole('button', { name: 'Set targets' }).click();
await page.waitForTimeout(350);
await shot(page, '02-targets-entry');
await check(page, 'Set targets opens the entry sheet: the two routes, the reassurance note, Close and no Cancel footer', async () => {
  const d = await page.locator('dialog[open]').innerText();
  const cancel = await page.locator('dialog[open]').getByRole('button', { name: 'Cancel' }).count();
  return d.includes('Set daily goal') && d.includes('Choose how to set your target.') && d.includes('Help me estimate') && d.includes('I know my goal') && d.includes('You can change your targets anytime from Home.') && cancel === 0;
});
await scoped().getByRole('button', { name: /I know my goal/ }).click();
await page.waitForTimeout(350);
await check(page, 'I know my goal opens the focused manual editor: heading focused, no bottom navigation, Starts Today, one Save targets', async () => {
  const t = await visibleText();
  const nav = await page.locator('[data-screen="targets-editor"]:not([hidden]) nav').count();
  const focused = await page.evaluate(() => document.activeElement?.tagName);
  return t.includes('Set daily targets') && t.includes('Starts') && t.includes('Today') && t.includes('From today until you change it.') && nav === 0 && focused === 'H1' && (await scoped().getByRole('button', { name: 'Save targets' }).count()) === 1;
});
await scoped().getByRole('textbox', { name: 'Daily calories' }).fill('2000');
await check(page, 'a preset suggests grams from the calorie target and says so', async () => {
  const d = await visibleText();
  return d.includes('Suggested macros') && d.includes('100 g') && d.includes('250 g') && d.includes('67 g') && d.includes('Not personalised');
});
await scoped().getByRole('radio', { name: 'Custom' }).click();
await scoped().getByLabel(/^Protein/).fill('120');
await scoped().getByLabel(/^Carbohydrates/).fill('220');
await scoped().getByLabel(/^Fat/).fill('65');
await page.waitForTimeout(100);
await shot(page, '02-targets-custom');
await check(page, 'custom grams state their energy against the target without changing either', async () => (await visibleText()).includes('1,945 kcal, 55 kcal below'));
await scoped().getByRole('button', { name: 'Save targets' }).click();
await page.waitForTimeout(250);
await shot(page, '03-home-goal-empty');
await check(page, 'goal 2,000 with nothing logged: 2,000 remaining, 0 %, targets shown', async () => {
  const t = await visibleText();
  const label = await page.locator('[data-screen="home"] [role="meter"][aria-label="Calories logged against your target"]').getAttribute('aria-valuetext');
  log('   budget valuetext:', label);
  // The macro target renders as "0 / 120 g" (with a hidden "of" for assistive technology).
  const targets = await page.locator('[data-screen="home"] [role="meter"][aria-label="Protein against your target"]').getAttribute('aria-valuetext');
  return t.includes('kcal remaining') && t.includes('Edit targets') && t.includes('Target 2,000') && label === '0 of 2,000 kcal, 0 %' && targets === '0 of 120 g';
});

// A meal row starts the task with its meal preselected.
await scoped().getByRole('button', { name: 'Add lunch' }).click();
await page.waitForTimeout(350);
await shot(page, '04-method-sheet');
await check(page, 'method sheet is a modal dialog with focus inside, laid out 2 × 2', async () =>
  page.evaluate(() => {
    const d = document.querySelector('dialog[open]');
    const options = d ? Array.from(d.querySelectorAll('button:not([aria-label="Close"])')) : [];
    const pair = options[1] ? getComputedStyle(options[1].parentElement).gridTemplateColumns.split(' ').length : 0;
    const order = options.map((o) => o.textContent).join('|');
    return !!d && d.contains(document.activeElement) && pair === 2 && /Search food.*Scan barcode.*Take a photo.*Enter manually/.test(order) && options[0].dataset.presentation === 'row' && options[3].dataset.tone === 'quiet';
  }),
);
await scoped().getByRole('button', { name: /Search food/ }).click();
await page.waitForTimeout(200);
await check(page, 'Search food opens the Search root (section header) with the scanner as a labelled sibling of the field', async () => {
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
await check(page, 'review carries the meal preselected from the Home row, the steps and presets, and one final Add to lunch (no second sheet)', async () => {
  const t = await page.locator('main:visible').innerText();
  const checked = await scoped().getByRole('radio', { name: 'Lunch' }).getAttribute('aria-checked');
  return t.includes('Preselected from the meal') && checked === 'true' && (await scoped().getByRole('button', { name: 'Increase by 25 g' }).count()) === 1 && (await scoped().getByRole('button', { name: '1 serving (300 g)' }).count()) === 1 && (await scoped().getByRole('button', { name: 'Add to today' }).count()) === 0;
});
await shot(page, '09-review-commit');
await scoped().getByRole('button', { name: 'Add to lunch' }).click();
await page.waitForTimeout(300);
await shot(page, '10-home-populated');
await check(page, 'Add to lunch returns Home (S01-2): 540 kcal logged under Lunch, 27 %, one confirmation', async () => {
  const t = await visibleText();
  const section = await page.locator('[data-screen="home"] section[aria-labelledby^="meal-"]', { has: page.getByRole('button', { name: /Vegetable rice bowl/ }) }).getAttribute('aria-labelledby');
  const label = await page.locator('[data-screen="home"] [role="meter"][aria-label="Calories logged against your target"]').getAttribute('aria-valuetext');
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
await check(page, 'the water reference is labelled adjustable, never personal', async () => (await visibleText()).includes('Adjustable reference'));
await scoped().getByRole('button', { name: /^Edit water/ }).click();
await page.waitForTimeout(350);
await scoped().getByRole('button', { name: /Change the reference/ }).click();
await scoped().getByRole('textbox', { name: 'Daily reference' }).fill('2500');
await scoped().getByRole('button', { name: 'Save reference' }).click();
await page.waitForTimeout(300);
await check(page, 'the reference changes for the tracker (1 L of 2.5 L) without touching the total', async () => (await scoped().getByRole('button', { name: 'Edit water, 1 litre of 2.5 litres' }).count()) === 1);
await scoped().getByRole('button', { name: /^Edit water/ }).click();
await page.waitForTimeout(350);
await scoped().getByRole('button', { name: /Change the reference/ }).click();
await scoped().getByRole('textbox', { name: 'Daily reference' }).fill('2000');
await scoped().getByRole('button', { name: 'Save reference' }).click();
await page.waitForTimeout(300);

// Task origin (ledger D-4): the bar's Log food from Home → Search food switches to the
// Search root; Cancel from the review returns to Home, the surface that opened Log food.
await scoped().getByRole('button', { name: 'Log food' }).first().click();
await scoped().getByRole('button', { name: /Search food/ }).click();
await page.waitForTimeout(300);
await scoped().getByRole('searchbox').fill('rice');
await page.waitForTimeout(900);
await scoped().getByRole('button', { name: /Vegetable rice bowl/ }).click();
await page.waitForTimeout(300);
await shot(page, '18-review-from-home-origin');
await scoped().getByRole('button', { name: 'Cancel' }).click();
await page.waitForTimeout(300);
await check(page, 'Cancel on an untouched review returns to Home, the invoking surface, without logging or a confirmation', async () => {
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
await check(page, 'the sample read looks the product up and opens review as a barcode match with the code, Change product and Edit label values', async () => {
  const t = await page.locator('main:visible').innerText();
  return t.includes('Barcode match') && t.includes('Barcode 5012345678900') && (await scoped().getByRole('button', { name: 'Change product' }).count()) === 1 && (await scoped().getByRole('button', { name: 'Edit label values' }).count()) === 1 && !/verified/i.test(t);
});
await scoped().getByRole('button', { name: 'Edit label values' }).click();
await page.waitForTimeout(200);
await shot(page, '21b-barcode-correction-draft');
await check(page, 'Edit label values opens the manual first step prefilled from the record, with its provenance stated', async () => {
  const t = await page.locator('main:visible').innerText();
  return (await scoped().getByLabel('Food or dish name').inputValue()) === 'Oat drink, unsweetened' && (await scoped().getByLabel('Calories').inputValue()) === '43' && t.includes('original record is unchanged');
});
await scoped().getByRole('button', { name: 'Back' }).click();
await page.waitForTimeout(200);
await check(page, 'Back from an untouched correction draft returns to the review at once', async () => (await page.locator('main:visible').innerText()).includes('Barcode match'));
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
await check(page, 'manual step 1 shows its step label, the optional photo field and Cancel', async () => {
  const t = await page.locator('main:visible, header:visible').allInnerTexts();
  const all = t.join(' ');
  return all.includes('Step 1 of 2') && (await scoped().getByRole('button', { name: 'Add a photo' }).count()) === 1 && (await scoped().getByRole('button', { name: 'Cancel' }).count()) === 1;
});
await scoped().getByRole('button', { name: 'Continue to portion' }).click();
await page.waitForTimeout(150);
await shot(page, '24-manual-errors');
await check(page, 'manual entry focuses first invalid field', async () => page.evaluate(() => document.activeElement?.id?.includes('manual-name') ?? false));
await scoped().getByLabel('Food or dish name').fill('Lentil soup');
await scoped().getByLabel('Calories').fill('150');
await scoped().getByLabel(/^Protein/).fill('8');
await scoped().getByRole('button', { name: 'Continue to portion' }).click();
await page.waitForTimeout(150);
await shot(page, '25-manual-portion');
await check(page, 'step 2 shows the identity summary, Edit food details, the steps, presets and the live result for 100 g (150 kcal)', async () => {
  const t = await page.locator('main:visible').innerText();
  return t.includes('Step 2 of 2') === false && t.includes('Lentil soup') && t.includes('150') && (await scoped().getByRole('button', { name: 'Edit food details' }).count()) === 1 && (await scoped().getByRole('button', { name: 'Increase by 25 g' }).count()) === 1 && (await scoped().getByRole('button', { name: '200 g' }).count()) === 1;
});
await scoped().getByLabel('Amount to calculate').fill('250');
await page.waitForTimeout(100);
await check(page, '250 g recalculates to 375 kcal', async () => (await page.locator('main:visible').innerText()).includes('375'));
await scoped().getByRole('button', { name: 'Back' }).click();
await page.waitForTimeout(150);
await check(page, 'back from step 2 restores the manual draft without a confirmation', async () => (await scoped().getByLabel('Food or dish name').inputValue()) === 'Lentil soup' && (await page.locator('dialog[open]').count()) === 0);
await scoped().getByRole('button', { name: 'Continue to portion' }).click();
await page.waitForTimeout(150);
await check(page, 'continuing again keeps the actual portion at 250 g (the audited reset is fixed)', async () => (await scoped().getByLabel('Amount to calculate').inputValue()) === '250');
await scoped().getByRole('button', { name: 'Cancel' }).click();
await page.waitForTimeout(300);
await shot(page, '26-discard-changes-dialog');
await check(page, 'Cancel on the task asks with the shared Discard changes? copy and focuses Keep editing', async () =>
  page.evaluate(() => {
    const d = document.querySelector('dialog[open][role="alertdialog"]');
    return !!d && d.textContent.includes('Discard changes?') && d.textContent.includes('Nothing already logged will be changed') && document.activeElement?.textContent === 'Keep editing';
  }),
);
await scoped().getByRole('button', { name: 'Keep editing' }).click();
await page.waitForTimeout(150);
await check(page, 'keep editing preserves the portion draft', async () => (await scoped().getByLabel('Amount to calculate').inputValue()) === '250');
await page.goBack();
await page.waitForTimeout(300);
await check(page, 'browser Back on a dirty task uses the same guard: the confirmation opens and the step stays', async () =>
  page.evaluate(() => !!document.querySelector('dialog[open][role="alertdialog"]') && !!document.querySelector('[data-screen="manual-portion"]:not([hidden])')),
);
await scoped().getByRole('button', { name: 'Keep editing' }).click();
await page.waitForTimeout(150);
await scoped().getByRole('button', { name: 'Cancel' }).click();
await scoped().getByRole('button', { name: 'Discard changes' }).click();
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
await check(page, 'photo review shows the sample frame as such, the suggestion source and its three correction actions; no barcode metadata', async () => {
  const t = await page.locator('main:visible').innerText();
  return t.includes('Photo suggestion') && t.includes('Sample photo') && !t.includes('Barcode') && (await scoped().getByRole('button', { name: 'Change match' }).count()) === 1 && (await scoped().getByRole('button', { name: 'Retake photo' }).count()) === 1 && (await scoped().getByRole('button', { name: 'Edit nutrition values' }).count()) === 1;
});
await scoped().getByRole('button', { name: 'Retake photo' }).click();
await page.waitForTimeout(200);
await check(page, 'Retake photo returns to capture', async () => (await page.locator('main:visible').innerText()).includes('Frame the food'));
await scoped().getByRole('button', { name: 'Back' }).click();
await page.waitForTimeout(200);
await check(page, 'Back from capture closes the task to Home without logging', async () => {
  const t = await visibleText();
  return (await page.locator('[data-screen="home"]:visible').count()) === 1 && t.includes('540 kcal logged');
});

// --- Journey 2: recipes -------------------------------------------------------
await scoped().getByRole('button', { name: 'Recipes', exact: true }).click();
await page.waitForTimeout(700);
await shot(page, '32-recipes-discovery');
await check(page, 'discovery has no search field: a featured recipe, quick preferences with the count, the two collections, every card photographed, Browse all', async () => {
  const noPhoto = await page.locator('[data-screen="recipes"]:visible main').getByText('No photo').count();
  const searchboxes = await scoped().getByRole('searchbox').count();
  const filters = await scoped().getByRole('button', { name: /^Filters/ }).count();
  const featured = await scoped().getByRole('article', { name: /^Featured recipe/ }).count();
  const t = await page.locator('main:visible').innerText();
  return noPhoto === 0 && searchboxes === 0 && filters === 0 && featured === 1 && t.includes('10 recipes') && t.includes('None active') && !t.includes('Featured\n') && t.includes('Ready in under 30 minutes') && t.includes('30 g protein or more') && t.includes('Browse all 10 recipes') && (await scoped().getByRole('button', { name: 'Vegan' }).getAttribute('aria-pressed')) === 'false';
});
await scoped().getByRole('button', { name: 'Vegan' }).click();
await page.waitForTimeout(150);
await scoped().getByRole('button', { name: 'Gluten-free' }).click();
await page.waitForTimeout(150);
await check(page, 'dietary preferences combine with AND and apply at once (Vegan + Gluten-free → 2 recipes, 2 active)', async () => {
  const t = await page.locator('main:visible').innerText();
  return t.includes('2 recipes match your preferences') && t.includes('2 active');
});
await scoped().getByRole('button', { name: 'Under 30 min', exact: true }).click();
await page.waitForTimeout(150);
await scoped().getByRole('button', { name: 'Under 15 min', exact: true }).click();
await page.waitForTimeout(150);
await check(page, 'time preferences are mutually exclusive (Under 15 replaces Under 30) and count once (3 active)', async () => {
  const t = await page.locator('main:visible').innerText();
  return (await scoped().getByRole('button', { name: 'Under 15 min', exact: true }).getAttribute('aria-pressed')) === 'true' && (await scoped().getByRole('button', { name: 'Under 30 min', exact: true }).getAttribute('aria-pressed')) === 'false' && t.includes('3 active');
});
await shot(page, '33-recipes-no-match');
await check(page, 'preferences that remove every match show one empty state with Reset, not repeated empty headings', async () => {
  const headings = await page.locator('[data-screen="recipes"]:visible main h2').allInnerTexts();
  return headings.filter((h) => /Ready in under|protein or more/.test(h)).length === 0 && (await scoped().getByRole('button', { name: 'Reset preferences' }).count()) === 1;
});
await scoped().getByRole('button', { name: 'Reset preferences' }).click();
await page.waitForTimeout(150);
await check(page, 'Reset clears every preference', async () => (await page.locator('main:visible').innerText()).includes('10 recipes'));
await check(page, 'navigation stays fixed on Recipes', () => fixedNavigationHolds(page));
await check(page, 'the collection rails scroll inside themselves; the page never scrolls sideways', async () =>
  page.evaluate(() => {
    const rails = Array.from(document.querySelectorAll('[data-screen="recipes"]:not([hidden]) ul'));
    return document.documentElement.scrollWidth <= window.innerWidth + 1 && rails.some((r) => r.scrollWidth > r.clientWidth + 1);
  }),
);

// The numeric filters and the list / grid live in Search's Recipes scope.
await scoped().getByRole('button', { name: 'Search', exact: true }).click();
await page.waitForTimeout(150);
await scoped().getByRole('tab', { name: 'Recipes' }).click();
await page.waitForTimeout(300);
await check(page, 'the Recipes scope reuses the Food toolbar: List / Grid at the start, the filter action at the end, no scanner, no in-field action', async () => {
  const list = await scoped().getByRole('radio', { name: 'List' }).count();
  const filters = await scoped().getByRole('button', { name: 'Recipe filters' }).count();
  const scanner = await scoped().getByRole('button', { name: 'Scan barcode' }).count();
  return list === 1 && filters === 1 && scanner === 0 && (await page.locator('main:visible').innerText()).includes('All recipes');
});
await scoped().getByRole('button', { name: 'Recipe filters' }).click();
await page.waitForTimeout(350);
await shot(page, '34-recipe-filters-sheet');
await page.locator('dialog[open]').getByRole('button', { name: 'Vegan' }).click();
await scoped().getByLabel('Maximum').fill('100');
await scoped().getByLabel('Minimum').fill('300');
await scoped().getByRole('button', { name: 'Apply filters' }).click();
await page.waitForTimeout(150);
await shot(page, '34b-recipe-filters-invalid-range');
await check(page, 'min > max is refused', async () => (await page.locator('dialog[open]').innerText()).includes('at least the minimum'));
await scoped().getByLabel('Maximum').fill('500');
await scoped().getByLabel('Protein per serving, at least').fill('10');
await scoped().getByRole('button', { name: 'Apply filters' }).click();
await page.waitForTimeout(300);
await shot(page, '35-search-recipes-filtered');
await check(page, 'filtered results show evidence per card, the chips and the count on the filter action; the count agrees with the items', async () => {
  const t = await page.locator('main:visible').innerText();
  const items = await page.locator('[data-screen="search"]:not([hidden]) ul[data-view] > li').count();
  return t.includes('Matches all 3 filters') && (await scoped().getByRole('button', { name: 'Recipe filters, 3 active' }).count()) === 1 && (await scoped().getByRole('button', { name: 'Remove filter: Vegan' }).count()) === 1 && t.includes(`${items} recipes match`);
});
await scoped().getByRole('button', { name: 'Remove filter: Vegan' }).click();
await page.waitForTimeout(150);
await shot(page, '36-search-recipes-chip-removed');
await check(page, 'removing a chip commits at once', async () => (await scoped().getByRole('button', { name: 'Recipe filters, 2 active' }).count()) === 1);
await scoped().getByRole('radio', { name: 'Grid' }).click();
await page.waitForTimeout(200);
await shot(page, '36b-search-recipes-grid');
await check(page, 'switching to the grid keeps the same recipes, order and count', async () =>
  page.evaluate(() => {
    const list = document.querySelector('[data-screen="search"]:not([hidden]) ul[data-view]');
    const titles = Array.from(list.querySelectorAll('li h3')).map((h) => h.textContent);
    window.__gridTitles = titles;
    return list.dataset.view === 'grid' && titles.length > 0;
  }),
);
await scoped().getByRole('radio', { name: 'List' }).click();
await page.waitForTimeout(200);
await check(page, 'back to the list: identical set and order', async () =>
  page.evaluate(() => {
    const list = document.querySelector('[data-screen="search"]:not([hidden]) ul[data-view]');
    const titles = Array.from(list.querySelectorAll('li h3')).map((h) => h.textContent);
    return list.dataset.view === 'list' && JSON.stringify(titles) === JSON.stringify(window.__gridTitles);
  }),
);
await scoped().getByRole('button', { name: /^Recipe filters/ }).click();
await scoped().getByLabel('Preparation time, at most').fill('5');
await scoped().getByRole('button', { name: 'Apply filters' }).click();
await page.waitForTimeout(300);
await shot(page, '37-search-recipes-no-match');
await scoped().getByRole('button', { name: 'Change filters' }).click();
await scoped().getByRole('button', { name: 'Reset all' }).click();
await scoped().getByRole('button', { name: 'Apply filters' }).click();
await page.waitForTimeout(300);
await check(page, 'reset + apply clears the filters', async () => (await page.locator('main:visible').innerText()).includes('10 recipes'));

// Details from discovery, with the scroll position kept on return.
await scoped().getByRole('button', { name: 'Recipes', exact: true }).click();
await page.waitForTimeout(300);
await scoped().getByRole('button', { name: 'Under 30 min', exact: true }).click();
await page.waitForTimeout(200);
await check(page, 'a quick preference narrows the featured recipe and the collections with evidence on every card', async () => {
  const t = await page.locator('main:visible').innerText();
  return t.includes('Matches all 1 filter') && t.includes('1 active');
});
await page.evaluate(() => window.scrollTo(0, 200));
await page.waitForTimeout(100);
const beforeY = await page.evaluate(() => window.scrollY);
await page.locator('[data-screen="recipes"]:not([hidden]) article').first().getByRole('button', { name: 'Lentil soup' }).click();
await page.waitForTimeout(150);
await shot(page, '38-recipe-loading');
await check(page, 'details keeps Recipes selected while loading', async () => (await currentNav()).includes('Recipes'));
await page.waitForTimeout(700);
await shot(page, '39-recipe-loaded');
await check(page, 'details: hero, time chip, Add beside the title, counts, fixed bar, no sticky footer — unchanged by the redesign', async () => {
  const t = (await page.locator('main:visible').innerText()).replace(/ /g, ' ');
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

// Home's recommendation reflects the active discovery preference; All recipes returns to discovery with its state and scroll.
await shot(page, '43-home-recommendation-with-preferences');
await check(page, 'Home shows the recipe that matches the active discovery preference with its evidence, above the meals', async () => {
  const t = await visibleText();
  return t.includes('Matches your preferences') && t.includes('Matches all 1 filter');
});
await scoped().getByRole('button', { name: 'All recipes' }).click();
await page.waitForTimeout(200);
await check(page, 'All recipes opens the Recipes root with its preference and scroll kept', async () => {
  const afterY = await page.evaluate(() => window.scrollY);
  log('   scroll before/after:', beforeY, afterY);
  return (await page.locator('main:visible').innerText()).includes('1 active') && Math.abs(beforeY - afterY) < 5;
});

// Discovery → Search: Browse all carries the preferences; View all adds the collection's rule.
await scoped().getByRole('button', { name: /^View all \d+ in 30 g protein or more/ }).click();
await page.waitForTimeout(150);
await check(page, 'View all opens Search / Recipes with the preference and the collection rule as visible chips', async () => {
  const t = await page.locator('main:visible').innerText();
  return (await scoped().getByRole('tab', { name: 'Recipes' }).getAttribute('aria-selected')) === 'true' && (await scoped().getByRole('button', { name: 'Remove filter: Under 30 min' }).count()) === 1 && (await scoped().getByRole('button', { name: 'Remove filter: 30 g protein or more' }).count()) === 1 && t.includes('Matching recipes');
});
await scoped().getByRole('button', { name: 'Recipes', exact: true }).click();
await page.waitForTimeout(200);
await scoped().getByRole('button', { name: /^Browse all/ }).click();
await page.waitForTimeout(150);
await shot(page, '44-search-recipes-scope-snapshot');
await check(page, 'Browse all opens Search / Recipes with the preference only, the filter action counting it and the catalogue narrowed (no query)', async () => {
  const t = await page.locator('main:visible').innerText();
  const items = await page.locator('[data-screen="search"]:not([hidden]) ul[data-view] > li').count();
  return (await scoped().getByRole('button', { name: 'Remove filter: Under 30 min' }).count()) === 1 && (await scoped().getByRole('button', { name: 'Remove filter: 30 g protein or more' }).count()) === 0 && (await scoped().getByRole('button', { name: 'Recipe filters, 1 active' }).count()) === 1 && t.includes(`${items} recipes match your filters`);
});
await scoped().getByRole('searchbox').fill('lentil');
await page.waitForTimeout(1000);
await shot(page, '45-search-recipes-results');
await scoped().getByRole('tab', { name: 'Food' }).click();
await page.waitForTimeout(1000);
await shot(page, '46-search-food-scope-keeps-query');
await check(page, 'food scope keeps the query, shows the icon-only scanner and is unfiltered by recipe criteria', async () => {
  const t = await page.locator('main:visible').innerText();
  const scan = scoped().getByRole('button', { name: 'Scan barcode' });
  return (await scoped().getByRole('searchbox').inputValue()) === 'lentil' && !t.includes('Under 30 min') && (await scan.count()) === 1 && (await scan.innerText()).trim() === '' && (await scoped().getByRole('radio', { name: 'List' }).count()) === 1;
});
await scoped().getByRole('searchbox').fill('offline');
await page.waitForTimeout(1000);
await shot(page, '47-search-failure');
await scoped().getByRole('searchbox').fill('zzzz');
await page.waitForTimeout(1000);
await shot(page, '48-search-no-match');
await scoped().getByRole('button', { name: 'Recipes', exact: true }).click();
await page.waitForTimeout(150);
await check(page, 'discovery preferences untouched by search edits', async () => (await page.locator('main:visible').innerText()).includes('1 active'));

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
  return t.includes('900 kcal logged') && !t.includes('Vegetable rice bowl') && t.includes('Edit targets');
});

// Help me estimate: three focused steps, the reviewed estimate, an explicit save
await scoped().getByRole('button', { name: 'Edit targets' }).click();
await page.waitForTimeout(350);
await check(page, 'Edit targets opens the focused editor with the saved values (2,000 kcal, custom 120 / 220 / 65 g) and Estimate instead', async () =>
  (await scoped().getByRole('textbox', { name: 'Daily calories' }).inputValue()) === '2000' && (await editor().getByRole('textbox', { name: /^Protein/ }).inputValue()) === '120' && (await visibleText()).includes('Entered by you'));
await scoped().getByRole('button', { name: 'Estimate instead' }).click();
await page.waitForTimeout(250);
await shot(page, '50b-estimate-about');
await check(page, 'About you: step 1/3 in the bar, Back and Help, the heading below, no navigation, the keyboard not summoned', async () => {
  const t = await visibleText();
  const nav = await page.locator('[data-screen="targets-about"]:not([hidden]) nav').count();
  const focused = await page.evaluate(() => document.activeElement?.tagName);
  return t.includes('About you') && t.includes('1/3') && nav === 0 && focused !== 'INPUT' && (await scoped().getByRole('button', { name: 'Help' }).count()) === 1 && (await scoped().getByRole('button', { name: 'Back' }).count()) === 1;
});
await scoped().getByRole('button', { name: 'Continue' }).click();
await check(page, 'the About you step refuses blank fields without leaving and focuses the first', async () => {
  const t = await visibleText();
  const focused = await page.evaluate(() => document.activeElement?.getAttribute('aria-label') ?? document.activeElement?.id);
  return t.includes('About you') && t.includes('Enter your age') && (await scoped().getByRole('textbox', { name: 'Age' }).evaluate((el) => el === document.activeElement));
});
const step = () => page.locator('[data-screen^="targets-"]:not([hidden])');
await step().getByRole('textbox', { name: 'Age' }).fill('34');
await step().getByText('Female', { exact: true }).click();
await step().getByRole('textbox', { name: 'Height' }).fill('168');
await step().getByRole('textbox', { name: 'Weight' }).fill('62');
await check(page, 'Female / Male are equal-width tiles; switching Weight to lb converts the typed value (62 kg → 136.7 lb) and back', async () => {
  const widths = await step().getByRole('radio', { name: /^(Female|Male)$/ }).evaluateAll((els) => els.map((el) => el.closest('label').getBoundingClientRect().width));
  await step().getByRole('radio', { name: 'lb' }).click();
  const lb = await step().getByRole('textbox', { name: 'Weight' }).inputValue();
  await step().getByRole('radio', { name: 'kg' }).click();
  const kg = await step().getByRole('textbox', { name: 'Weight' }).inputValue();
  return widths.length === 2 && Math.abs(widths[0] - widths[1]) < 1 && lb === '136.7' && kg === '62';
});
await scoped().getByRole('button', { name: 'Help' }).click();
await page.waitForTimeout(150);
await shot(page, '50e-estimate-help');
await check(page, 'Help is a short dialog with a Calculation details disclosure; Escape closes it, focus returns to Help and the draft is intact', async () => {
  const d = await page.locator('dialog[open]').innerText();
  const disclosed = d.includes('Calculation details') && !d.includes('Dietary Reference Intakes');
  await page.keyboard.press('Escape');
  await page.waitForTimeout(100);
  const focused = await page.evaluate(() => document.activeElement?.getAttribute('aria-label'));
  return d.includes('Why these details?') && disclosed && focused === 'Help' && (await step().getByRole('textbox', { name: 'Age' }).inputValue()) === '34';
});
await scoped().getByRole('button', { name: 'Continue' }).click();
await page.waitForTimeout(200);
await check(page, 'Your activity: 2/3, four selection cards, nothing auto-advances', async () => {
  const t = await visibleText();
  await step().getByText('Lightly active', { exact: true }).click();
  await page.waitForTimeout(100);
  return t.includes('Your activity') && t.includes('2/3') && t.includes('Think about a typical week.') && (await step().getByRole('radio').count()) === 4 && (await visibleText()).includes('Your activity');
});
await shot(page, '50c-estimate-lifestyle');
await scoped().getByRole('button', { name: 'Continue' }).click();
await page.waitForTimeout(200);
await step().getByText('Lose weight', { exact: true }).click();
await check(page, 'Your goal: 3/3, Lose / Maintain / Gain, the primary action is Review estimate', async () => {
  const t = await visibleText();
  return t.includes('Your goal') && t.includes('3/3') && (await scoped().getByRole('button', { name: 'Review estimate' }).count()) === 1;
});
await scoped().getByRole('button', { name: 'Review estimate' }).click();
await page.waitForTimeout(250);
await shot(page, '50d-estimate-review');
await check(page, 'the review is a full screen: Estimated, the centred 1,699 with kcal/day, Adjust, the goal · activity summary, no step count, Save targets', async () => {
  const t = await visibleText();
  const centred = await page.evaluate(() => {
    const screen = document.querySelector('[data-screen="targets-review"]:not([hidden])');
    const figure = Array.from(screen.querySelectorAll('span')).find((el) => el.textContent === '1,699');
    const r = figure.getBoundingClientRect();
    const c = screen.getBoundingClientRect();
    return Math.abs((r.left + r.right) / 2 - (c.left + c.right) / 2) < 2;
  });
  return t.includes('Your daily target') && t.includes('Estimated') && t.includes('1,699') && t.includes('kcal/day') && t.includes('An estimate you can adjust.') && t.includes('Lose weight · Lightly active') && !/\d\/3/.test(t) && centred && (await scoped().getByRole('button', { name: 'Save targets' }).count()) === 1;
});
await scoped().getByRole('button', { name: 'Adjust' }).click();
await page.waitForTimeout(100);
await step().getByRole('textbox', { name: 'Daily calories' }).fill('1650');
await scoped().getByRole('button', { name: 'Done' }).click();
await page.waitForTimeout(100);
await check(page, 'Adjust edits the same number in place and labels it adjusted; the custom grams from the saved target stay explicit', async () => {
  const t = await visibleText();
  return t.includes('1,650') && !t.includes('1,699') && t.includes('Adjusted from the estimate') && (await editor().getByRole('textbox', { name: /^Protein/ }).inputValue()) === '120';
});
await scoped().getByRole('button', { name: 'Back' }).click();
await page.waitForTimeout(200);
await check(page, 'Back keeps the goal answer', async () => (await step().getByRole('radio', { name: /Lose weight/ }).isChecked()) === true);
await scoped().getByRole('button', { name: 'Review estimate' }).click();
await page.waitForTimeout(200);
await scoped().getByRole('button', { name: 'Edit details' }).click();
await page.waitForTimeout(200);
await check(page, 'Edit details returns to About you with the values kept', async () => (await visibleText()).includes('About you') && (await step().getByRole('textbox', { name: 'Age' }).inputValue()) === '34');
await scoped().getByRole('button', { name: 'Continue' }).click();
await scoped().getByRole('button', { name: 'Continue' }).click();
await scoped().getByRole('button', { name: 'Review estimate' }).click();
await page.waitForTimeout(250);
await scoped().getByRole('button', { name: 'Save targets' }).click();
await page.waitForTimeout(300);
await check(page, 'saving the estimate applies it once, returns to Home and confirms: 1,699 − 900 = 799 remaining, entries untouched', async () => {
  const t = await visibleText();
  const body = await page.locator('body').innerText();
  return t.includes('799') && t.includes('kcal remaining') && t.includes('900') && t.includes('consumed') && t.includes('1,699 kcal') && body.includes('Targets saved.') && (await page.locator('[data-screen="home"]:not([hidden])').count()) === 1;
});
await scoped().getByRole('button', { name: 'Edit targets' }).click();
await page.waitForTimeout(350);
await check(page, 'an estimated target shows a compact source row and an explicit Recalculate', async () => {
  const d = await visibleText();
  return d.includes('Estimated · Lose weight · Lightly active') && (await scoped().getByRole('button', { name: 'Recalculate' }).count()) === 1;
});
await scoped().getByRole('button', { name: 'Cancel changes' }).click();
await page.waitForTimeout(200);
await check(page, 'Cancel changes on an untouched editor leaves at once and keeps the saved targets', async () => { const t = await visibleText(); return t.includes('799') && t.includes('1,699 kcal') && (await page.locator('dialog[open]').count()) === 0; });

// Recalculate, the exit guard, scheduling, a refused write and the cancelled schedule (ledger §14)
await scoped().getByRole('button', { name: 'Edit targets' }).click();
await page.waitForTimeout(300);
await scoped().getByRole('button', { name: 'Recalculate' }).click();
await page.waitForTimeout(250);
await check(page, 'Recalculate prefills About you (34, female, 168 cm, 62 kg) at 1/3', async () => {
  const t = await visibleText();
  return t.includes('About you') && t.includes('1/3') && (await step().getByRole('textbox', { name: 'Age' }).inputValue()) === '34' && (await step().getByRole('radio', { name: 'Female' }).isChecked()) && (await step().getByRole('textbox', { name: 'Height' }).inputValue()) === '168';
});
await step().getByRole('textbox', { name: 'Age' }).fill('35');
await page.goBack();
await page.waitForTimeout(250);
await check(page, 'browser Back with an edited draft opens Discard changes?; Keep editing stays on the step', async () => {
  const d = await page.locator('dialog[open]').innerText();
  await page.locator('dialog[open]').getByRole('button', { name: 'Keep editing' }).click();
  await page.waitForTimeout(150);
  return d.includes('Discard changes?') && d.includes('Saved targets, food and water stay') && (await visibleText()).includes('About you') && (await step().getByRole('textbox', { name: 'Age' }).inputValue()) === '35';
});
await scoped().getByRole('button', { name: 'Back' }).click();
await page.waitForTimeout(250);
await check(page, 'Back from the first step after Recalculate returns to the editor', async () => (await visibleText()).includes('Edit targets'));
await scoped().getByRole('button', { name: 'Cancel changes' }).click();
await page.waitForTimeout(200);
await check(page, 'Cancel changes with edits confirms; Discard changes returns to Home with the saved targets', async () => {
  const opened = (await page.locator('dialog[open]').innerText()).includes('Discard changes?');
  await page.locator('dialog[open]').getByRole('button', { name: 'Discard changes' }).click();
  await page.waitForTimeout(250);
  return opened && (await visibleText()).includes('1,699 kcal');
});
await scoped().getByRole('button', { name: 'Edit targets' }).click();
await page.waitForTimeout(300);
await scoped().getByRole('button', { name: 'Change', exact: true }).click();
await editor().getByLabel('Start date').fill(dayKeyFrom(1));
await editor().getByRole('textbox', { name: 'Daily calories' }).fill('1750');
await page.waitForTimeout(100);
await shot(page, '50f-targets-scheduled-date');
await check(page, 'a future start says the current targets stay until then', async () => (await visibleText()).includes('Your current targets stay until then.'));
await page.evaluate(() => {
  window.__setItem = Storage.prototype.setItem;
  Storage.prototype.setItem = function () { throw new Error('QuotaExceededError'); };
});
await scoped().getByRole('button', { name: 'Save targets' }).click();
await page.waitForTimeout(250);
await shot(page, '50g-targets-save-failed');
await check(page, 'a refused write keeps the draft on screen and offers Try again; nothing is applied', async () => {
  const t = await visibleText();
  return t.includes('Not saved') && (await editor().getByRole('textbox', { name: 'Daily calories' }).inputValue()) === '1750' && (await scoped().getByRole('button', { name: 'Try again' }).count()) === 1 && (await page.locator('[data-screen="home"]:not([hidden])').count()) === 0;
});
await page.evaluate(() => { Storage.prototype.setItem = window.__setItem; });
await scoped().getByRole('button', { name: 'Try again' }).click();
await page.waitForTimeout(300);
await shot(page, '50h-home-scheduled');
await check(page, 'the retry saves once: Home keeps 1,699 in force and states the one scheduled change', async () => {
  const t = await visibleText();
  return t.includes('1,699 kcal') && t.includes('Scheduled: 1,750 kcal from tomorrow.') && (await page.locator('body').innerText()).includes('Targets saved. They start');
});
await check(page, 'the stored history holds one record for tomorrow after today’s', async () =>
  page.evaluate(() => {
    const record = JSON.parse(localStorage.getItem('portion.record'));
    const d = new Date();
    const localToday = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    const later = record.goals.filter((p) => p.from > localToday);
    return later.length === 1 && later[0].goal.kcal === 1750;
  }),
);
await scoped().getByRole('button', { name: 'Edit targets' }).click();
await page.waitForTimeout(300);
await check(page, 'the editor states the scheduled change and that today’s targets last until it', async () => {
  const t = await visibleText();
  return t.includes('Scheduled: 1,750 kcal from') && t.includes('when your scheduled change starts');
});
await scoped().getByRole('button', { name: 'Cancel scheduled change' }).click();
await page.waitForTimeout(250);
await check(page, 'Cancel scheduled change keeps the current targets and drops the schedule', async () => {
  const t = await visibleText();
  await scoped().getByRole('button', { name: 'Cancel changes' }).click();
  await page.waitForTimeout(250);
  return !t.includes('Scheduled:') && (await visibleText()).includes('1,699 kcal') && !(await visibleText()).includes('Scheduled:');
});

// Targets apply from today until changed: they survive a reload, and an edit made while viewing a past day starts today.
await page.reload();
await page.waitForTimeout(400);
await check(page, 'after a reload the saved targets are still in force (1,699 kcal, estimated)', async () => {
  const t = await visibleText();
  await scoped().getByRole('button', { name: 'Edit targets' }).click();
  await page.waitForTimeout(300);
  const d = await visibleText();
  await scoped().getByRole('button', { name: 'Cancel changes' }).click();
  await page.waitForTimeout(200);
  return t.includes('1,699 kcal') && d.includes('Recalculate') && d.includes('From today until you change it.');
});
await scoped().getByRole('radio', { name: /, today$/ }).evaluate((el) => el.previousElementSibling?.click());
await page.waitForTimeout(300);
await check(page, 'a past day shows no target of its own (none was in force then)', async () => {
  const t = await visibleText();
  return t.includes('Yesterday') && t.includes('No target was set for this day') && (await scoped().getByRole('button', { name: 'Set targets' }).count()) === 1;
});
await scoped().getByRole('button', { name: 'Set targets' }).click();
await page.waitForTimeout(300);
await check(page, 'Set targets on a past day while today has targets opens today’s editor (the save replaces today’s period)', async () => {
  const t = await visibleText();
  return t.includes('Edit targets') && (await scoped().getByRole('textbox', { name: 'Daily calories' }).inputValue()) === '1699' && t.includes('From today until you change it.');
});
await scoped().getByRole('textbox', { name: 'Daily calories' }).fill('1800');
await scoped().getByRole('button', { name: 'Save targets' }).click();
await page.waitForTimeout(300);
await check(page, 'saving while viewing a past day restores that day, changes nothing for it and says the target starts today', async () => (await visibleText()).includes('No target was set for this day') && (await page.locator('body').innerText()).includes('Targets saved from today. Nothing changes yesterday.'));
await scoped().getByRole('button', { name: 'Today', exact: true }).click();
await page.waitForTimeout(300);
await check(page, 'the new target is in force from today (1,800 kcal), replacing today’s earlier save', async () => {
  const t = await visibleText();
  return t.includes('1,800 kcal') && !t.includes('1,699 kcal');
});
await scoped().getByRole('button', { name: 'Edit targets' }).click();
await page.waitForTimeout(300);
await scoped().getByRole('button', { name: 'Change', exact: true }).click();
await editor().getByLabel('Start date').fill(dayKeyFrom(1));
await scoped().getByRole('button', { name: 'Save targets' }).click();
await page.waitForTimeout(300);
await scoped().getByRole('button', { name: 'Edit targets' }).click();
await page.waitForTimeout(300);
await scoped().getByRole('button', { name: 'Remove targets' }).click();
await page.waitForTimeout(200);
await shot(page, '50i-targets-remove-confirm');
await check(page, 'Remove targets confirms first and names the scheduled change it also cancels; Keep targets changes nothing', async () => {
  const d = await page.locator('dialog[open]').innerText();
  await page.locator('dialog[open]').getByRole('button', { name: 'Keep targets' }).click();
  await page.waitForTimeout(150);
  return d.includes('Remove daily targets') && d.includes('Food, water and past targets will stay.') && d.includes('also cancels the change scheduled for') && (await visibleText()).includes('Edit targets');
});
await scoped().getByRole('button', { name: 'Remove targets' }).click();
await page.waitForTimeout(200);
await page.locator('dialog[open]').getByRole('button', { name: 'Remove targets' }).click();
await page.waitForTimeout(300);
await check(page, 'removing targets applies from today, cancels the scheduled change and keeps the entries and water', async () => {
  const t = await visibleText();
  return t.includes('900') && t.includes('kcal logged') && !t.includes('Scheduled:') && (await page.locator('body').innerText()).includes('The scheduled change is cancelled.') && (await scoped().getByRole('button', { name: 'Set targets' }).count()) === 1 && (await scoped().getByRole('button', { name: 'Edit water, 1 litre of 2 litres' }).count()) === 1;
});
await check(page, 'the stored history keeps every period (the estimate, today’s replacement and the removal) rather than rewriting the past', async () =>
  page.evaluate(() => {
    const record = JSON.parse(localStorage.getItem('portion.record'));
    const today = record.goals[record.goals.length - 1];
    return Array.isArray(record.goals) && record.goals.length >= 1 && today.goal === null && record.goals.every((p) => /^\d{4}-\d{2}-\d{2}$/.test(p.from));
  }),
);
await setGoal(page, 2000);
await page.waitForTimeout(300);
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
    await check(page, 'method sheet keeps the card pair side by side at 320 with no option overflow', async () =>
      page.evaluate(() => {
        const options = Array.from(document.querySelectorAll('dialog[open] button:not([aria-label="Close"])'));
        if (options.length !== 4) return false;
        const pair = getComputedStyle(options[1].parentElement).gridTemplateColumns.split(' ').length;
        return pair === 2 && options.every((t) => t.scrollWidth <= t.clientWidth + 1);
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
await check(page, 'method sheet stacks the camera pair at 390 + 200%, keeping the order', async () =>
  page.evaluate(() => {
    const options = Array.from(document.querySelectorAll('dialog[open] button:not([aria-label="Close"])'));
    const tops = options.map((o) => o.getBoundingClientRect().top);
    return options.length === 4 && getComputedStyle(options[1].parentElement).gridTemplateColumns.split(' ').length === 1 && tops.every((t, i) => i === 0 || t > tops[i - 1]);
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
await page.waitForTimeout(100);
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
  await local().getByRole('button', { name: 'Set targets' }).click();
  await local().getByRole('button', { name: /I know my goal/ }).click();
  await clockPage.waitForTimeout(300);
  await local().getByRole('textbox', { name: 'Daily calories' }).fill('2100');
  await local().getByRole('button', { name: 'Save targets' }).click();
  await clockPage.waitForTimeout(300);
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
  await check(clockPage, 'targets saved before midnight stay in force on the new day until changed', async () => shownBefore.includes('2,100 kcal') && shownAfter.includes('2,100 kcal') && shownAfter.includes('Edit targets'));
  await ctx.close();
}

await browser.close();
log(`\n${passed} passed, ${failed} failed`);
log('Console/page errors:', errors.length ? '\n' + errors.join('\n') : 'none');
process.exitCode = failed > 0 || errors.length > 0 ? 1 : 0;
