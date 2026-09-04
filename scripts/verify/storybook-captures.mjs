// Deterministic captures of representative stories from the built Storybook
// (storybook-static/). Story ids are resolved from index.json by title and name, so a
// renamed export fails loudly instead of silently capturing the wrong story. Each story's
// play function must finish without throwing before its capture counts.
// Output: .verification/storybook/ (ignored); the tracked curated set and manifest live in verification/.
import { chromium } from 'playwright';
import { createReadStream, existsSync, mkdirSync, readFileSync, statSync } from 'node:fs';
import { createServer } from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../../', import.meta.url));
const staticDir = path.join(root, 'storybook-static');
const out = path.join(root, '.verification', 'storybook');
mkdirSync(out, { recursive: true });

if (!existsSync(path.join(staticDir, 'index.json'))) {
  console.error('storybook-static/index.json not found. Run "npm run build-storybook" first.');
  process.exit(1);
}

const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.woff2': 'font/woff2', '.woff': 'font/woff', '.svg': 'image/svg+xml', '.png': 'image/png', '.map': 'application/json' };
const server = createServer((req, res) => {
  const urlPath = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
  const file = path.join(staticDir, urlPath === '/' ? 'index.html' : urlPath);
  if (!file.startsWith(staticDir) || !existsSync(file) || statSync(file).isDirectory()) {
    res.writeHead(404);
    res.end();
    return;
  }
  res.writeHead(200, { 'content-type': MIME[path.extname(file)] ?? 'application/octet-stream' });
  createReadStream(file).pipe(res);
});
await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
const port = server.address().port;

const index = JSON.parse(readFileSync(path.join(staticDir, 'index.json'), 'utf8'));
const entries = Object.values(index.entries).filter((e) => e.type === 'story');
function storyId(title, name) {
  const entry = entries.find((e) => e.title === title && e.name === name);
  if (!entry) throw new Error(`Story not found: ${title} / ${name}`);
  return entry.id;
}

/** [file, title, story name, viewport width, root font-size %] */
const CAPTURES = [
  ['01-button-treatments-sizes', 'Primitives/Button', 'Treatments × sizes', 390, 100],
  ['02-button-disabled', 'Primitives/Button', 'Disabled — every treatment, no activation', 390, 100],
  ['03-button-focus-visible', 'Primitives/Button', 'Keyboard focus-visible', 390, 100],
  ['04-segmentedcontrol-default', 'Components/SegmentedControl', 'Default — Food | Recipes', 390, 100],
  ['05-segmentedcontrol-selected-focus', 'Components/SegmentedControl', 'Selected + focus-visible', 390, 100],
  ['06-segmentedcontrol-disabled', 'Components/SegmentedControl', 'Disabled option (enabled-unselected stays actionable)', 390, 100],
  ['07-segmentedcontrol-selected-disabled', 'Components/SegmentedControl', 'Selected + disabled — selection is preserved', 390, 100],
  ['08-segmentedcontrol-long-labels-320-200', 'Components/SegmentedControl', 'Enlarged text — 320 at 200 %, long labels', 320, 200],
  ['09-methodsheet-2x2-390', 'Patterns/MethodSheet', 'Default — 2 × 2 at 390', 390, 100],
  ['10-methodsheet-rows-320', 'Patterns/MethodSheet', 'Narrow — 320: one column of rows', 320, 100],
  ['11-methodsheet-keyboard-focus', 'Patterns/MethodSheet', 'Keyboard: focus enters the sheet, Tab reaches every tile', 390, 100],
  ['12-progressring-all-states', 'Primitives/ProgressRing', 'All states', 390, 100],
  ['13-progressring-centre-content', 'Primitives/ProgressRing', 'Large with centre content', 390, 100],
  ['14-calorie-ring-partial', 'Product compositions/Home (S01)/CalorieProgressRing', 'Partial — 1,350 of 2,200 (850 remaining)', 390, 100],
  ['15-calorie-ring-exceeded', 'Product compositions/Home (S01)/CalorieProgressRing', 'Exceeded — 150 over, full ring, excess stated', 390, 100],
  ['16-calorie-ring-no-goal', 'Product compositions/Home (S01)/CalorieProgressRing', 'No goal — logged amount, remaining unavailable', 390, 100],
  ['17-calorie-ring-incomplete', 'Product compositions/Home (S01)/CalorieProgressRing', 'Incomplete energy — partial total, no ratio', 390, 100],
  ['18-calorie-ring-320-200', 'Product compositions/Home (S01)/CalorieProgressRing', 'Enlarged text — 320 at 200 % stacks the figure under a medium ring', 320, 200],
  ['19-recipecard-with-criteria', 'Patterns/RecipeCard', 'With active criteria — evidence directly under the title', 390, 100],
  ['20-recipecard-no-photo-320', 'Patterns/RecipeCard', 'No photo, long title at 320', 320, 100],
  ['21-recipecard-200', 'Patterns/RecipeCard', 'Enlarged text — 200 % stacks the thumbnail above the text', 390, 200],
  ['22-mediaframe-failed-image', 'Components/MediaFrame', 'Image fails to load → same fallback, not a broken-image icon', 390, 100],
  ['23-nutritionmacros-partial', 'Components/NutritionMacros', 'Partial subtotal and unknown value', 390, 100],
  ['24-home-empty-no-goal', 'Product compositions/Home (S01)', 'S01-1 — no entries, no goal (launch state)', 390, 100],
  ['25-home-populated-goal', 'Product compositions/Home (S01)', 'S01-2 — two entries, goal 2,200 (850 remaining)', 390, 100],
  ['26-home-partial-macros', 'Product compositions/Home (S01)', 'Partial macros — unknown carbohydrates and fat in one entry', 390, 100],
  ['27-goal-editor-invalid', 'Product compositions/Home (S01)/Goal editor', 'Invalid draft stays editable and does not apply', 390, 100],
  ['28-review-existing-remove', 'Product compositions/Food review (S07)', 'Existing entry — Remove asks first', 390, 100],
  ['29-colors-contrast-pairs', 'Foundations/Colors', 'Contrast pairs (recomputed)', 430, 100],
  ['30-radius-roles', 'Foundations/Radius', 'Semantic roles', 430, 100],
  ['31-typography-catalogue', 'Foundations/Typography', 'Catalogue', 390, 100],
];

const browser = await chromium.launch();
let failures = 0;
for (const [file, title, name, width, fontPercent] of CAPTURES) {
  const id = storyId(title, name);
  const ctx = await browser.newContext({ viewport: { width, height: 844 }, deviceScaleFactor: 2, hasTouch: true, isMobile: true });
  const page = await ctx.newPage();
  const pageErrors = [];
  page.on('pageerror', (e) => pageErrors.push(e.message));
  // Observe the preview channel from the first script: the capture waits for the story's
  // render (including its play function) to finish, and a play exception fails the capture.
  await page.addInitScript(() => {
    globalThis.__portionStory = { finished: false, errors: [] };
    let channel;
    Object.defineProperty(globalThis, '__STORYBOOK_ADDONS_CHANNEL__', {
      configurable: true,
      get: () => channel,
      set(next) {
        channel = next;
        next.on('storyRenderPhaseChanged', ({ newPhase }) => {
          if (newPhase === 'finished' || newPhase === 'errored' || newPhase === 'aborted') globalThis.__portionStory.finished = true;
        });
        for (const event of ['playFunctionThrewException', 'unhandledErrorsWhilePlaying', 'storyThrewException', 'storyErrored', 'storyMissing']) {
          next.on(event, (...args) => globalThis.__portionStory.errors.push(`${event}: ${JSON.stringify(args).slice(0, 300)}`));
        }
      },
    });
  });
  await page.goto(`http://127.0.0.1:${port}/iframe.html?id=${id}&viewMode=story`);
  const finished = await page
    .waitForFunction(() => globalThis.__portionStory?.finished === true, { timeout: 30000 })
    .then(() => true)
    .catch(() => false);
  if (fontPercent !== 100) {
    await page.addStyleTag({ content: `html { font-size: ${fontPercent}% !important; }` });
  }
  // Settle transitions and container-query relayout.
  await page.waitForTimeout(400);
  // A capture that is not about focus should not carry the play function's last focus ring.
  if (!/focus/i.test(name)) await page.evaluate(() => (document.activeElement instanceof HTMLElement ? document.activeElement.blur() : undefined));
  await page.waitForTimeout(100);
  await page.screenshot({ path: path.join(out, `${file}.png`), fullPage: true });
  const storyErrors = await page.evaluate(() => globalThis.__portionStory?.errors ?? []);
  const problems = [...(finished ? [] : ['render did not finish within 30 s']), ...pageErrors.map((m) => `pageerror: ${m}`), ...storyErrors];
  if (problems.length) failures++;
  console.log(`${file}.png  ←  ${id} @ ${width}px ${fontPercent}%  ${problems.length ? 'FAIL ' + problems.join(' | ') : 'ok'}`);
  await ctx.close();
}
await browser.close();
server.close();
console.log(`\n${CAPTURES.length} captures, ${failures} with problems`);
process.exitCode = failures ? 1 : 0;
