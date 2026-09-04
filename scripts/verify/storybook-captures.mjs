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

/** [file, title, story name, viewport width, root font-size %, viewport height = 844] */
const CAPTURES = [
  ['01-button-treatments-sizes', 'Primitives/Button', 'Treatments × sizes', 390, 100],
  ['02-button-disabled', 'Primitives/Button', 'Disabled — every treatment, no activation', 390, 100],
  ['03-button-focus-visible', 'Primitives/Button', 'Keyboard focus-visible', 390, 100],
  ['04-segmentedcontrol-default', 'Components/SegmentedControl', 'Food selected (radio pattern)', 390, 100],
  ['05-segmentedcontrol-selected-focus', 'Components/SegmentedControl', 'Selected + focus-visible', 390, 100],
  ['06-segmentedcontrol-disabled', 'Components/SegmentedControl', 'Disabled option (enabled-unselected stays actionable)', 390, 100],
  ['07-segmentedcontrol-selected-disabled', 'Components/SegmentedControl', 'Selected + disabled — both meanings preserved', 390, 100],
  ['08-segmentedcontrol-long-labels-320-200', 'Components/SegmentedControl', 'Enlarged text — 320 at 200 %, long labels', 320, 200],
  ['09-methodsheet-2x2-390', 'Patterns/MethodSheet', 'Default — 2 × 2 at 390', 390, 100],
  ['10-methodsheet-2x2-320', 'Patterns/MethodSheet', 'Narrow — 320 keeps the 2 × 2 grid', 320, 100],
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
  ['32-navigationbar-home-390', 'Patterns/NavigationBar', 'Home selected', 390, 100],
  ['33-navigationbar-recipes-320', 'Patterns/NavigationBar', 'Recipes selected', 320, 100],
  ['34-navigationbar-320-200', 'Patterns/NavigationBar', 'Enlarged text — 320 at 200 %', 320, 200],
  ['35-navigationbar-keyboard-focus', 'Patterns/NavigationBar', 'Keyboard — focus order and focus-visible ring', 390, 100],
  ['36-segmentedcontrol-tabs', 'Components/SegmentedControl', 'Tabs pattern with a real tabpanel (as Search uses it)', 390, 100],
  ['37-methodsheet-rows-390-200', 'Patterns/MethodSheet', 'Enlarged text — 390 at 200 %: one column of rows', 390, 200],
  ['38-grid-393-baseline', 'Foundations/Spacing and layout', 'Four-column grid - 393 px baseline', 393, 100],
  ['39-iphone16-safe-reference', 'Foundations/Spacing and layout', 'iPhone 16 portrait - 59/34 safe-area reference', 393, 100],
  ['40-root-safe-areas', 'Templates/RootScreenLayout', 'iPhone 16 portrait - header and navigation own 59/34 once', 393, 100],
  ['41-focused-safe-footer', 'Templates/FocusedFlowLayout', 'iPhone 16 portrait - focused header/footer own 59/34 once', 393, 100],
  ['42-sheet-safe-footer', 'Patterns/ModalSheet', 'iPhone 16 portrait - sheet footer owns bottom safe area once', 393, 100],
  // ---- The 41 mapped low-fi states (docs/design/hifi-decisions.md §1), 393 × 852 -----
  ['states/S01-1-175-10', "Product states/Lane A — Core navigation", "S01-1 · 175:10 — Home / Today — No food logged", 393, 100, 852],
  ['states/S01-2-175-38', "Product states/Lane A — Core navigation", "S01-2 · 175:38 — Home / Today — Food logged", 393, 100, 852],
  ['states/S02-1-175-93', "Product states/Lane A — Core navigation", "S02-1 · 175:93 — Search / Food scope · results", 393, 100, 852],
  ['states/S03-1-175-158', "Product states/Lane A — Core navigation", "S03-1 · 175:158 — Recipes / Browse", 393, 100, 852],
  ['states/O01-176-20', "Product states/Lane B — Home through search and review", "O01 · 176:20 — Log food / Choose a method (overlay)", 393, 100, 852],
  ['states/S02-2-176-43', "Product states/Lane B — Home through search and review", "S02-2 · 176:43 — Search / Food · loading", 393, 100, 852],
  ['states/S02-3-176-77', "Product states/Lane B — Home through search and review", "S02-3 · 176:77 — Search / Food · no matches", 393, 100, 852],
  ['states/S02-4-176-118', "Product states/Lane B — Home through search and review", "S02-4 · 176:118 — Search / Food · request failure", 393, 100, 852],
  ['states/S07-1-176-157', "Product states/Lane B — Home through search and review", "S07-1 · 176:157 — Food review / From search", 393, 100, 852],
  ['states/S07-2-176-201', "Product states/Lane B — Home through search and review", "S07-2 · 176:201 — Food review / Invalid portion", 393, 100, 852],
  ['states/S07-3-176-247', "Product states/Lane B — Home through search and review", "S07-3 · 176:247 — Food review / Edit logged entry (repurposed)", 393, 100, 852],
  ['states/S04-1-178-5', "Product states/Lane C1 — Barcode acquisition", "S04-1 · 178:5 — Barcode / Scanning", 393, 100, 852],
  ['states/S04-2-178-20', "Product states/Lane C1 — Barcode acquisition", "S04-2 · 178:20 — Barcode / Code read · lookup pending", 393, 100, 852],
  ['states/S04-3-178-31', "Product states/Lane C1 — Barcode acquisition", "S04-3 · 178:31 — Barcode / Code not readable", 393, 100, 852],
  ['states/S04-4-178-47', "Product states/Lane C1 — Barcode acquisition", "S04-4 · 178:47 — Barcode / Product not found", 393, 100, 852],
  ['states/S04-5-178-65', "Product states/Lane C1 — Barcode acquisition", "S04-5 · 178:65 — Barcode / Lookup service failure", 393, 100, 852],
  ['states/P01-178-81', "Product states/Lane C1 — Barcode acquisition", "P01 · 178:81 — Conceptual system permission request (app side)", 393, 100, 852],
  ['states/S04-6-178-94', "Product states/Lane C1 — Barcode acquisition", "S04-6 · 178:94 — Barcode / Camera access denied", 393, 100, 852],
  ['states/S07-4-178-109', "Product states/Lane C1 — Barcode acquisition", "S07-4 · 178:109 — Food review / From barcode", 393, 100, 852],
  ['states/S05-1-179-5', "Product states/Lane C2 — Photo acquisition", "S05-1 · 179:5 — Photo / Capture", 393, 100, 852],
  ['states/S05-2-179-12', "Product states/Lane C2 — Photo acquisition", "S05-2 · 179:12 — Photo / Preview", 393, 100, 852],
  ['states/S05-3-179-21', "Product states/Lane C2 — Photo acquisition", "S05-3 · 179:21 — Photo / Analysing", 393, 100, 852],
  ['states/S05-4-179-31', "Product states/Lane C2 — Photo acquisition", "S05-4 · 179:31 — Photo / Suggested matches", 393, 100, 852],
  ['states/S05-5-179-57', "Product states/Lane C2 — Photo acquisition", "S05-5 · 179:57 — Photo / No usable match", 393, 100, 852],
  ['states/S05-6-179-70', "Product states/Lane C2 — Photo acquisition", "S05-6 · 179:70 — Photo / Analysis failure", 393, 100, 852],
  ['states/S07-5-179-81', "Product states/Lane C2 — Photo acquisition", "S07-5 · 179:81 — Food review / From photo · estimate", 393, 100, 852],
  ['states/S06-1-180-5', "Product states/Lane D — Manual entry and correction", "S06-1 · 180:5 — Manual entry / Empty", 393, 100, 852],
  ['states/S06-2-180-43', "Product states/Lane D — Manual entry and correction", "S06-2 · 180:43 — Manual entry / Filled · keyboard inset", 393, 100, 552],
  ['states/S06-3-180-71', "Product states/Lane D — Manual entry and correction", "S06-3 · 180:71 — Manual entry / Field error", 393, 100, 852],
  ['states/O03-180-111', "Product states/Lane D — Manual entry and correction", "O03 · 180:111 — Discard unsaved entry", 393, 100, 852],
  ['states/O04-180-134', "Product states/Lane D — Manual entry and correction", "O04 · 180:134 — Supported unit chooser", 393, 100, 852],
  ['states/S07-6-180-162', "Product states/Lane D — Manual entry and correction", "S07-6 · 180:162 — Food review / From manual entry", 393, 100, 852],
  ['states/S03-2-181-5', "Product states/Lane E — Recipe browse, criteria, details and return", "S03-2 · 181:5 — Recipes / Filtered results", 393, 100, 852],
  ['states/O02-181-72', "Product states/Lane E — Recipe browse, criteria, details and return", "O02 · 181:72 — Recipe filters / Applied values", 393, 100, 852],
  ['states/O02-2-181-117', "Product states/Lane E — Recipe browse, criteria, details and return", "O02-2 · 181:117 — Recipe filters / Invalid range", 393, 100, 852],
  ['states/S02-5-181-133', "Product states/Lane E — Recipe browse, criteria, details and return", "S02-5 · 181:133 — Search / Recipes scope · results", 393, 100, 852],
  ['states/S08-2-181-289', "Product states/Lane E — Recipe browse, criteria, details and return", "S08-2 · 181:289 — Recipe details / Loading", 393, 100, 852],
  ['states/S08-1-181-237', "Product states/Lane E — Recipe browse, criteria, details and return", "S08-1 · 181:237 — Recipe details / Loaded", 393, 100, 852],
  ['states/S08-3-181-317', "Product states/Lane E — Recipe browse, criteria, details and return", "S08-3 · 181:317 — Recipe details / Unavailable", 393, 100, 852],
  ['states/S08-4-181-350', "Product states/Lane E — Recipe browse, criteria, details and return", "S08-4 · 181:350 — Recipe details / No photo · long title · partial nutrition", 393, 100, 852],
  ['states/S02-6-181-193', "Product states/Lane E — Recipe browse, criteria, details and return", "S02-6 · 181:193 — Search / Recipes · no matches", 393, 100, 852],
  // ---- Representative and risk-bearing variants: 320 / 430, 200 % text, safe-area fixture -----
  ['states/V-S01-2-320', "Product states/Lane A — Core navigation", "S01-2 at 320 (narrow witness, replaces the superseded 185:2 frame)", 320, 100, 800],
  ['states/V-S01-2-430', "Product states/Lane A — Core navigation", "S01-2 at 430", 430, 100, 932],
  ['states/V-S01-2-320-200', "Product states/Lane A — Core navigation", "S01-2 at 320 and 200 % text", 320, 200, 800],
  ['states/V-S01-2-safe-areas', "Product states/Lane A — Core navigation", "S01-2 with the iPhone 16 safe-area fixture (59 / 34)", 393, 100, 852],
  ['states/V-O01-320', "Product states/Lane B — Home through search and review", "O01 at 320 keeps the 2 × 2 grid", 320, 100, 800],
  ['states/V-S07-1-320', "Product states/Lane B — Home through search and review", "S07-1 at 320", 320, 100, 800],
  ['states/V-S07-1-200', "Product states/Lane B — Home through search and review", "S07-1 at 200 % text — footer still reachable", 393, 200, 852],
  ['states/V-S07-1-safe-areas', "Product states/Lane B — Home through search and review", "S07-1 with the iPhone 16 safe-area fixture — footer owns the bottom inset", 393, 100, 852],
  ['states/V-S04-1-320', "Product states/Lane C1 — Barcode acquisition", "S04-1 at 320", 320, 100, 800],
  ['states/V-S04-4-200', "Product states/Lane C1 — Barcode acquisition", "S04-4 at 200 % text — every recovery action still reachable", 393, 200, 852],
  ['states/V-S05-4-320', "Product states/Lane C2 — Photo acquisition", "S05-4 at 320", 320, 100, 800],
  ['states/V-S05-4-200', "Product states/Lane C2 — Photo acquisition", "S05-4 at 200 % text", 393, 200, 852],
  ['states/V-S06-1-320', "Product states/Lane D — Manual entry and correction", "S06-1 at 320", 320, 100, 800],
  ['states/V-S06-3-200', "Product states/Lane D — Manual entry and correction", "S06-3 at 200 % text", 393, 200, 852],
  ['states/V-S03-2-320', "Product states/Lane E — Recipe browse, criteria, details and return", "S03-2 at 320", 320, 100, 800],
  ['states/V-S08-1-430', "Product states/Lane E — Recipe browse, criteria, details and return", "S08-1 at 430", 430, 100, 932],
  ['states/V-S03-2-320-200', "Product states/Lane E — Recipe browse, criteria, details and return", "S03-2 at 320 and 200 % text", 320, 200, 800],
  ['states/V-O02-safe-areas', "Product states/Lane E — Recipe browse, criteria, details and return", "O02 with the iPhone 16 safe-area fixture — sheet footer owns the bottom inset", 393, 100, 852],
];

const browser = await chromium.launch();
let failures = 0;
for (const [file, title, name, width, fontPercent, height = 844] of CAPTURES) {
  const id = storyId(title, name);
  const ctx = await browser.newContext({ viewport: { width, height }, deviceScaleFactor: 2, hasTouch: true, isMobile: true });
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
  mkdirSync(path.dirname(path.join(out, `${file}.png`)), { recursive: true });
  // A fixed backdrop or a sticky bar cannot reach past the viewport, so a full-page capture
  // of an open dialog (or of the keyboard-inset fixture) would show what no user sees:
  // those captures are the viewport. Everything else is captured full-page.
  const modal = await page.evaluate(() => Boolean(document.querySelector('dialog[open]')));
  await page.screenshot({ path: path.join(out, `${file}.png`), fullPage: !modal && height !== 552 });
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
