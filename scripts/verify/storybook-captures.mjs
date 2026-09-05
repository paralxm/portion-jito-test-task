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
  ['09-methodsheet-structure-390', 'Patterns/MethodSheet', 'Default — row, card pair, separator, quiet row at 390', 390, 100],
  ['10-methodsheet-card-pair-320', 'Patterns/MethodSheet', 'Narrow — 320 keeps the card pair', 320, 100],
  ['11-methodsheet-keyboard-focus', 'Patterns/MethodSheet', 'Keyboard: focus enters the sheet, Tab reaches every method in order', 390, 100],
  // ---- Redesign 2026-09-05: brand, header, budget bar, meals, water, Add-to-meal, camera stage, toast -----
  ['12-portionlogo-tones', 'Primitives/PortionLogo', 'Tones — default, monochrome, inverse', 390, 100],
  ['13-portionlogo-clear-space', 'Primitives/PortionLogo', 'Minimum size and clear space', 390, 100],
  ['14-progressbar-all-states', 'Primitives/ProgressBar', 'All states', 390, 100],
  ['15-progressbar-tones', 'Primitives/ProgressBar', 'Tones — water and the three macros (compact)', 390, 100],
  ['16-appheader-root', 'Patterns/AppHeader', 'Root — logo, date, Set goal (Home)', 390, 100],
  ['17-appheader-section', 'Patterns/AppHeader', 'Section — screen title (Search, Recipes)', 390, 100],
  ['18-appheader-root-320-200', 'Patterns/AppHeader', 'Root at 320 and 200 % text — context wraps under the lockup', 320, 200],
  ['19-nutrition-full-targets', 'Product compositions/Home (S01)/Daily nutrition', 'Full targets — 1,600 remaining, 400 consumed · 20 %, macro cards with tracks', 390, 100],
  ['20-nutrition-no-targets', 'Product compositions/Home (S01)/Daily nutrition', 'No targets — logged amount, Set targets, no bar; macro cards complete without tracks', 390, 100],
  ['21-nutrition-over', 'Product compositions/Home (S01)/Daily nutrition', 'Over target — 150 over, fill stops at the marker, words carry it', 390, 100],
  ['22-nutrition-incomplete', 'Product compositions/Home (S01)/Daily nutrition', 'Partial total — an entry without calorie data, unknown macro', 390, 100],
  ['23-nutrition-320-200', 'Product compositions/Home (S01)/Daily nutrition', 'Enlarged text — 320 at 200 % (macro cards stack)', 320, 200],
  ['23b-nutrition-calorie-only', 'Product compositions/Home (S01)/Daily nutrition', 'Calorie-only target — 2,000 remaining, 0 %; macro cards show grams alone', 390, 100],
  ['23c-nutrition-partial-targets', 'Product compositions/Home (S01)/Daily nutrition', 'Partial configuration — only a protein target', 390, 100],
  ['23d-nutrition-320', 'Product compositions/Home (S01)/Daily nutrition', 'Narrow — 320: three cards stay side by side', 320, 100],
  ['24-mealgroup-populated', 'Product compositions/Home (S01)/MealGroup', 'Two meals populated, two empty', 390, 100],
  ['25-mealgroup-long-highlight', 'Product compositions/Home (S01)/MealGroup', 'Long entry name, a just-added highlight, a partial subtotal', 390, 100],
  ['26-mealgroup-unassigned', 'Product compositions/Home (S01)/MealGroup', 'Unassigned guard — a record without a meal', 390, 100],
  ['27-watertracker-partial', 'Product compositions/Home (S01)/WaterTracker', 'Partial — 1.25 / 2 L', 390, 100],
  ['28-watertracker-exceeded', 'Product compositions/Home (S01)/WaterTracker', 'Over the reference — 2.5 / 2 L, excess stated', 390, 100],
  ['29-watertracker-quick-add-undo', 'Product compositions/Home (S01)/WaterTracker', 'Quick add — repeated taps accumulate, the figure animates, Undo restores', 390, 100],
  ['30-watersheet-preset', 'Product compositions/Home (S01)/WaterSheet', 'Preset selected → Add water adds it', 390, 100],
  ['31-watersheet-custom-invalid', 'Product compositions/Home (S01)/WaterSheet', 'Custom amount invalid — decimal and out of range are refused', 390, 100],
  ['32-watersheet-edit-total', 'Product compositions/Home (S01)/WaterSheet', 'Edit today’s total — invalid stays editable', 390, 100],
  ['34-addtomeal-from-recipe', 'Product compositions/Add to meal (O05)', 'From a recipe — servings, thumbnail, preview recalculates', 390, 100],
  ['35-addtomeal-invalid', 'Product compositions/Add to meal (O05)', 'Invalid amount disables the commit and keeps guidance beside the field', 390, 100],
  ['36-camerastage-tones', 'Components/CameraStage', 'All tones side by side', 390, 100],
  ['37-camerastage-image', 'Components/CameraStage', 'Captured frame — the chip keeps its own dark ground over the photo', 390, 100],
  ['38-toast-undo', 'Patterns/Toast', 'Confirmation with Undo', 390, 100],
  ['39-targets-entry', 'Product compositions/Home (S01)/Targets sheet', 'Entry — Set daily goal, two routes', 390, 100],
  ['39b-targets-manual-preset', 'Product compositions/Home (S01)/Targets sheet', 'I know my goal — a preset suggests grams that follow the calories', 390, 100],
  ['39c-targets-manual-custom', 'Product compositions/Home (S01)/Targets sheet', 'Custom grams — kept across calorie changes, any unset, mismatch stated', 390, 100],
  ['39d-targets-estimate-review', 'Product compositions/Home (S01)/Targets sheet', 'Help me estimate — three steps, the reviewed estimate, save', 390, 100],
  ['39e-targets-estimate-gain', 'Product compositions/Home (S01)/Targets sheet', 'Gain weight — maintenance shown, no surplus invented', 390, 100],
  ['39f-targets-edit-estimated', 'Product compositions/Home (S01)/Targets sheet', 'Edit targets — saved estimate explained, recalculation explicit, removal offered', 390, 100],
  ['39g-targets-about-320-200', 'Product compositions/Home (S01)/Targets sheet', 'Enlarged text — 320 at 200 %, the About you step', 320, 200],
  ['39h-daystrip-earlier-day', 'Product compositions/Home (S01)/Day strip', 'An earlier day selected — Today returns; the strip reaches further back', 390, 100],
  ['39i-daystrip-320-200', 'Product compositions/Home (S01)/Day strip', 'Enlarged text — 320 at 200 %', 320, 200],
  ['40-review-existing-unassigned', 'Product compositions/Food review (S07)', 'Existing entry without a meal — Update entry waits for a choice', 390, 100],
  ['41-recipecard-with-criteria', 'Patterns/RecipeCard', 'With active criteria — evidence directly under the title', 390, 100],
  ['42-recipecard-no-photo-320', 'Patterns/RecipeCard', 'No photo, long title at 320', 320, 100],
  ['43-mediaframe-failed-image', 'Components/MediaFrame', 'Image fails to load → same fallback, not a broken-image icon', 390, 100],
  ['44-nutritionmacros-partial', 'Components/NutritionMacros', 'Partial subtotal and unknown value', 390, 100],
  ['45-colors-contrast-pairs', 'Foundations/Colors', 'Contrast pairs (recomputed)', 430, 100],
  ['46-radius-roles', 'Foundations/Radius', 'Semantic roles', 430, 100],
  ['47-typography-catalogue', 'Foundations/Typography', 'Catalogue', 390, 100],
  ['48-navigationbar-home-390', 'Patterns/NavigationBar', 'Home selected', 390, 100],
  ['49-navigationbar-recipes-320', 'Patterns/NavigationBar', 'Recipes selected', 320, 100],
  ['50-navigationbar-320-200', 'Patterns/NavigationBar', 'Enlarged text — 320 at 200 %', 320, 200],
  ['51-navigationbar-keyboard-focus', 'Patterns/NavigationBar', 'Keyboard — focus order and focus-visible ring', 390, 100],
  ['52-segmentedcontrol-tabs', 'Components/SegmentedControl', 'Tabs pattern with a real tabpanel (as Search uses it)', 390, 100],
  ['53-methodsheet-stacked-390-200', 'Patterns/MethodSheet', 'Enlarged text — 390 at 200 %: the card pair stacks, order kept', 390, 200],
  ['54-grid-393-baseline', 'Foundations/Spacing and layout', 'Four-column grid - 393 px baseline', 393, 100],
  ['55-iphone16-safe-reference', 'Foundations/Spacing and layout', 'iPhone 16 portrait - 59/34 safe-area reference', 393, 100],
  ['56-root-safe-areas', 'Templates/RootScreenLayout', 'iPhone 16 portrait - header and navigation own 59/34 once', 393, 100],
  ['57-root-fixed-navigation-short', 'Templates/RootScreenLayout', 'Long content — the bar stays fixed and the content reserves its height', 390, 100, 560],
  ['58-focused-safe-footer', 'Templates/FocusedFlowLayout', 'iPhone 16 portrait - focused header/footer own 59/34 once', 393, 100],
  ['59-sheet-safe-footer', 'Patterns/ModalSheet', 'iPhone 16 portrait - sheet footer owns bottom safe area once', 393, 100],
  ['60-search-barcode-shortcut', 'Product compositions/Search (S02)', 'Food scope — the barcode action opens the scanner in one tap', 390, 100],
  ['61-filter-action-states', 'Product compositions/Recipe filters toolbar', 'Filter action — none applied and 2 active', 390, 100],
  ['62-barcode-camera-denied', 'Product compositions/Barcode (S04)', 'Camera denied', 390, 100],
  ['63-photo-permission-pending', 'Product compositions/Photo (S05)', 'Waiting for the system camera prompt (P01, app side)', 390, 100],
  ['64-recipe-details-add', 'Product compositions/Recipe details (S08)', 'Add beside the title hands the recipe to the Add-to-meal sheet', 390, 100],
  // ---- Stage B (ledger §11): the populated Food tab -----
  ['65-viewtoggle', 'Components/ViewToggle', 'List selected (default)', 390, 100],
  ['66-foodcard', 'Patterns/FoodCard', 'With a photograph — the whole card opens the item', 390, 100],
  ['67-foodcard-no-photo', 'Patterns/FoodCard', 'No photo — the fallback is loaded content', 390, 100],
  ['68-foodresultrow-thumbnail-320-200', 'Components/FoodResultRow', 'Thumbnail at 320 and 200 % — the figure wraps under the identity', 320, 200],
  ['69-food-filters-sheet', 'Product compositions/Search (S02)/FoodFiltersSheet', 'Nothing applied — All is checked', 390, 100],
  ['70-search-unified-results', 'Product compositions/Search (S02)', 'Unified results — “oat” across recents and catalogue, recent first', 390, 100],
  ['71-search-no-match-filter', 'Product compositions/Search (S02)', 'No matches with a filter — change filters is offered', 390, 100],
  ['72-icons-sizes-weights', 'Foundations/Icons', 'Sizes and weights', 390, 100],
  ['73-foodresultrow-thumbnail-long-name-390', 'Components/FoodResultRow', 'Thumbnail with a long name at 390 — the name wraps between words, the basis gives way', 390, 100],
  // ---- R1–R6 revision (ledger §12) -----
  ['74-methodsheet-r6', 'Patterns/MethodSheet', 'Default — row, card pair, separator, quiet row at 390', 390, 100],
  ['75-methodoption-card-pair', 'Components/MethodOption', 'Card — the camera pair', 390, 100],
  ['76-photofield-empty', 'Components/PhotoField', 'Empty', 390, 100],
  ['77-manual-portion-photo-past-day', 'Product compositions/Manual entry (S06)/Step 2 — Portion and meal', 'With the user photo, a serving basis and a past target day', 390, 100],
  ['78-review-barcode-r5', 'Product compositions/Food review (S07)', 'S07-4 — from barcode: product image, code, Change product, Edit label values', 390, 100],
  ['79-review-photo-r5', 'Product compositions/Food review (S07)', 'S07-5 — from photo: the sample frame, Change match, Retake, Edit nutrition values', 390, 100],
  ['80-recipes-discovery', 'Product compositions/Recipes (S03)', 'Discovery — featured recipe, quick preferences, two collections, browse all', 390, 100],
  ['80b-recipes-quick-preferences', 'Product compositions/Recipes (S03)', 'Quick preferences — dietary AND, one time bound, count and Reset', 390, 100],
  ['80c-recipes-no-match', 'Product compositions/Recipes (S03)', 'No matches — one empty state with Reset', 390, 100],
  ['80d-search-recipes-list', 'Product compositions/Search (S02)', 'Recipes scope — the shared toolbar, the catalogue as rows, the filter action in the toolbar', 390, 100],
  ['80e-search-recipes-grid', 'Product compositions/Search (S02)', 'Recipes scope — grid of tiles: the same recipes, order and count as the list', 390, 100],
  ['80f-search-scanner-icon', 'Product compositions/Search (S02)', 'Food scope — the scanner is an icon-only sibling named Scan barcode; the field keeps the room', 390, 100],
  ['81-recipefilters-multi-dietary', 'Product compositions/Recipe filters (O02)', 'Dietary constraints combine — two toggles, AND, All clears them', 390, 100],
  // ---- The 51 mapped states (docs/design/hifi-decisions.md §1 and §10.3), 393 × 852 -----
  ['states/S01-1-175-10', "Product states/Lane A — Core navigation", "S01-1 · 175:10 — Home / Today — No food logged", 393, 100, 852],
  ['states/S01-2-175-38', "Product states/Lane A — Core navigation", "S01-2 · 175:38 — Home / Today — Food logged", 393, 100, 852],
  ['states/S02-1-175-93', "Product states/Lane A — Core navigation", "S02-1 · 175:93 — Search / Food scope · results", 393, 100, 852],
  ['states/S03-1-175-158', "Product states/Lane A — Core navigation", "S03-1 · 175:158 — Recipes / Browse", 393, 100, 852],
  ['states/S01-5-selected-day', "Product states/Lane A — Core navigation", "S01-5 — Home / A selected earlier day", 393, 100, 852],
  ['states/S01-6-streak', "Product states/Lane A — Core navigation", "S01-6 — Home / Streak of three days", 393, 100, 852],
  ['states/S01-4-water-quick-add', "Product states/Lane A — Core navigation", "S01-4 — Home / Water quick-add confirmation (Undo available)", 393, 100, 852],
  ['states/O09-targets-entry', "Product states/Lane A — Core navigation", "O09 — Set daily goal (entry sheet over Home)", 393, 100, 852],
  ['states/O09-2-estimate-review', "Product states/Lane A — Core navigation", "O09-2 — Estimated daily target (review before saving)", 393, 100, 852],
  ['states/O06-water-sheet', "Product states/Lane A — Core navigation", "O06 — Water sheet / Add (preset selected)", 393, 100, 852],
  ['states/O06-2-water-edit-total', "Product states/Lane A — Core navigation", "O06-2 — Water sheet / Edit today’s total", 393, 100, 852],
  ['states/O01-176-20', "Product states/Lane B — Home through search and review", "O01 · 176:20 — Log food / Choose a method (overlay)", 393, 100, 852],
  ['states/S02-2-176-43', "Product states/Lane B — Home through search and review", "S02-2 · 176:43 — Search / Food · loading", 393, 100, 852],
  ['states/S02-3-176-77', "Product states/Lane B — Home through search and review", "S02-3 · 176:77 — Search / Food · no matches", 393, 100, 852],
  ['states/S02-4-176-118', "Product states/Lane B — Home through search and review", "S02-4 · 176:118 — Search / Food · request failure", 393, 100, 852],
  ['states/S07-1-176-157', "Product states/Lane B — Home through search and review", "S07-1 · 176:157 — Food review / From search", 393, 100, 852],
  ['states/S07-2-176-201', "Product states/Lane B — Home through search and review", "S07-2 · 176:201 — Food review / Invalid portion", 393, 100, 852],
  ['states/S07-3-176-247', "Product states/Lane B — Home through search and review", "S07-3 · 176:247 — Food review / Edit logged entry (repurposed)", 393, 100, 852],
  ['states/O08-discard-changes', "Product states/Lane B — Home through search and review", "O08 — Discard changes? (shared exit confirmation)", 393, 100, 852],
  ['states/S02-7-food-catalogue', "Product states/Lane B — Home through search and review", "S02-7 — Search / Food · first use: the catalogue at once", 393, 100, 852],
  ['states/S02-8-recently-added', "Product states/Lane B — Home through search and review", "S02-8 — Search / Food · Recently added above Explore foods", 393, 100, 852],
  ['states/S02-9-grid-view', "Product states/Lane B — Home through search and review", "S02-9 — Search / Food · grid view", 393, 100, 852],
  ['states/O07-food-filters', "Product states/Lane B — Home through search and review", "O07 — Food filters (overlay)", 393, 100, 852],
  ['states/S02-10-drinks-only', "Product states/Lane B — Home through search and review", "S02-10 — Search / Food · Drinks only applied", 393, 100, 852],
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
  ['states/S06-1-180-5', "Product states/Lane D — Manual entry and correction", "S06-1 · 180:5 — Manual entry / Step 1 · Empty", 393, 100, 852],
  ['states/S06-2-180-43', "Product states/Lane D — Manual entry and correction", "S06-2 · 180:43 — Manual entry / Filled · keyboard inset", 393, 100, 552],
  ['states/S06-3-180-71', "Product states/Lane D — Manual entry and correction", "S06-3 · 180:71 — Manual entry / Field error", 393, 100, 852],
  ['states/O03-180-111', "Product states/Lane D — Manual entry and correction", "O03 · 180:111 — Discard changes? on a dirty first step", 393, 100, 852],
  ['states/O04-180-134', "Product states/Lane D — Manual entry and correction", "O04 · 180:134 — Supported unit chooser", 393, 100, 852],
  ['states/S06-4-correction-draft', "Product states/Lane D — Manual entry and correction", "S06-4 — Manual entry / Correction draft from a barcode match", 393, 100, 852],
  ['states/S06-5-portion-and-meal', "Product states/Lane D — Manual entry and correction", "S06-5 — Manual entry / Step 2 · Portion and meal", 393, 100, 852],
  ['states/S03-2-181-5', "Product states/Lane E — Recipe browse, criteria, details and return", "S03-2 · 181:5 — Recipes / Filtered results", 393, 100, 852],
  ['states/O02-181-72', "Product states/Lane E — Recipe browse, criteria, details and return", "O02 · 181:72 — Recipe filters / Applied values", 393, 100, 852],
  ['states/O02-2-181-117', "Product states/Lane E — Recipe browse, criteria, details and return", "O02-2 · 181:117 — Recipe filters / Invalid range", 393, 100, 852],
  ['states/S02-5-181-133', "Product states/Lane E — Recipe browse, criteria, details and return", "S02-5 · 181:133 — Search / Recipes scope · results", 393, 100, 852],
  ['states/S02-11-recipes-catalogue', "Product states/Lane E — Recipe browse, criteria, details and return", "S02-11 — Search / Recipes scope · the catalogue without a query", 393, 100, 852],
  ['states/S08-2-181-289', "Product states/Lane E — Recipe browse, criteria, details and return", "S08-2 · 181:289 — Recipe details / Loading", 393, 100, 852],
  ['states/S08-1-181-237', "Product states/Lane E — Recipe browse, criteria, details and return", "S08-1 · 181:237 — Recipe details / Loaded", 393, 100, 852],
  ['states/S08-3-181-317', "Product states/Lane E — Recipe browse, criteria, details and return", "S08-3 · 181:317 — Recipe details / Unavailable", 393, 100, 852],
  ['states/S08-4-181-350', "Product states/Lane E — Recipe browse, criteria, details and return", "S08-4 · 181:350 — Recipe details / No photo · long title · partial nutrition", 393, 100, 852],
  ['states/S02-6-181-193', "Product states/Lane E — Recipe browse, criteria, details and return", "S02-6 · 181:193 — Search / Recipes · no matches", 393, 100, 852],
  ['states/O05-2-add-to-meal-recipe', "Product states/Lane E — Recipe browse, criteria, details and return", "O05-2 — Add to meal / From recipe details", 393, 100, 852],
  // ---- Representative and risk-bearing variants: 320 / 430, 200 % text, safe-area fixture, reduced motion -----
  ['states/V-S01-2-320', "Product states/Lane A — Core navigation", "S01-2 at 320 (narrow witness, replaces the superseded 185:2 frame)", 320, 100, 800],
  ['states/V-S01-2-430', "Product states/Lane A — Core navigation", "S01-2 at 430", 430, 100, 932],
  ['states/V-S01-2-320-200', "Product states/Lane A — Core navigation", "S01-2 at 320 and 200 % text", 320, 200, 800],
  ['states/V-S01-2-safe-areas', "Product states/Lane A — Core navigation", "S01-2 with the iPhone 16 safe-area fixture (59 / 34)", 393, 100, 852],
  ['states/V-S01-reduced-motion', "Product states/Lane A — Core navigation", "Home budget and water under reduced motion — values update instantly", 393, 100, 852],
  ['states/V-O01-320', "Product states/Lane B — Home through search and review", "O01 at 320 keeps the card pair", 320, 100, 800],
  ['states/V-O01-200', "Product states/Lane B — Home through search and review", "O01 at 200 % text — the card pair stacks, order kept", 393, 200, 852],
  ['states/V-S06-5-200', "Product states/Lane D — Manual entry and correction", "S06-5 at 200 % text", 393, 200, 852],
  ['states/V-S07-1-320', "Product states/Lane B — Home through search and review", "S07-1 at 320", 320, 100, 800],
  ['states/V-S02-9-320', "Product states/Lane B — Home through search and review", "S02-9 at 320 — one column", 320, 100, 800],
  ['states/V-S02-8-200', "Product states/Lane B — Home through search and review", "S02-8 at 200 % text", 393, 200, 852],
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
  // Lazy thumbnails below the fold load only once scrolled into view: walk the page, wait for every image, return to the top.
  await page.evaluate(async () => {
    const step = window.innerHeight;
    for (let y = 0; y < document.documentElement.scrollHeight; y += step) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 40));
    }
    window.scrollTo(0, 0);
    await Promise.all(Array.from(document.images).map((img) => (img.complete ? Promise.resolve() : new Promise((r) => { img.onload = r; img.onerror = r; }))));
  });
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
  await page.screenshot({ path: path.join(out, `${file}.png`), fullPage: !modal && height !== 552 && height !== 560 });
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
