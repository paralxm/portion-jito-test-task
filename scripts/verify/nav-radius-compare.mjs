// Renders the real NavigationBar story from the static Storybook build with alternative
// radius pairs (group / active item) injected as CSS custom properties, so the radius
// decision is made from rendered output rather than from numbers. Output goes to the
// ignored .verification/compare/ directory; it is an inspection aid, not a test.
import { chromium } from 'playwright';
import { createReadStream, existsSync, mkdirSync, statSync } from 'node:fs';
import { createServer } from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../../', import.meta.url));
const staticDir = path.join(root, 'storybook-static');
const outDir = path.join(root, '.verification', 'compare');
if (!existsSync(path.join(staticDir, 'iframe.html'))) {
  console.error('storybook-static/ not found. Run "npm run build-storybook" first.');
  process.exit(1);
}
mkdirSync(outDir, { recursive: true });

const types = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.woff2': 'font/woff2', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg' };
const server = createServer((req, res) => {
  const urlPath = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
  let file = path.join(staticDir, urlPath === '/' ? 'index.html' : urlPath);
  if (!existsSync(file) || statSync(file).isDirectory()) {
    res.statusCode = 404;
    res.end();
    return;
  }
  res.setHeader('Content-Type', types[path.extname(file)] ?? 'application/octet-stream');
  createReadStream(file).pipe(res);
});
await new Promise((resolve) => server.listen(0, resolve));
const port = server.address().port;

const VARIANTS = [
  ['g16-i12', 16, 12, 'current tokens: grouped 16, item 12 (concentric)'],
  ['g12-i8', 12, 8, 'card 12, control 8'],
  ['g16-i8', 16, 8, 'grouped 16, control 8'],
  ['g12-i12', 12, 12, 'card 12 for both'],
  ['capsule', 9999, 9999, 'capsule reference — rejected shape'],
];

const browser = await chromium.launch();
const context = await browser.newContext({ viewport: { width: 390, height: 160 }, deviceScaleFactor: 2 });
const page = await context.newPage();
await page.goto(`http://localhost:${port}/iframe.html?id=patterns-navigationbar--search-selected&viewMode=story`, { waitUntil: 'networkidle' });
await page.locator('nav').waitFor();
await page.evaluate(() => document.fonts.ready);
for (const [name, group, item, note] of VARIANTS) {
  await page.evaluate(([g, i]) => {
    document.documentElement.style.setProperty('--portion-radius-navigation-group', `${g}px`);
    document.documentElement.style.setProperty('--portion-radius-navigation-item', `${i}px`);
  }, [group, item]);
  await page.waitForTimeout(80);
  const file = path.join(outDir, `nav-radius-${name}.png`);
  await page.locator('nav').screenshot({ path: file });
  console.log(`${name}: ${note} → ${path.relative(root, file)}`);
}
await browser.close();
server.close();
