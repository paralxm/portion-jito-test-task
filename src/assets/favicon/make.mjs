/**
 * Renders the app icon and favicon from the portion dot mark (DESIGN.md "App icon"):
 * the brand dot (action blue, blue.600) centred on the canvas white, with no second
 * mark, wordmark or gradient. The SVG is the source; the PNG sizes are rasterised from it
 * with Chromium (Playwright) because no image tool is installed.
 *
 *   node src/assets/favicon/make.mjs
 */
import { chromium } from 'playwright';
import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..', '..');
const publicDir = path.join(root, 'public');
mkdirSync(publicDir, { recursive: true });

const DOT = '#2855d9'; // reference.color.blue.600 = semantic brand.mark
const CANVAS = '#ffffff'; // reference.color.neutral.0 = background.canvas

/** The mark: a circle of 0.36 × the box on the canvas; the browser or OS applies its own corner mask. */
const svg = (size, { maskable = false } = {}) => {
  const r = size * (maskable ? 0.28 : 0.36);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}"><rect width="${size}" height="${size}" fill="${CANVAS}"/><circle cx="${size / 2}" cy="${size / 2}" r="${r}" fill="${DOT}"/></svg>`;
};

writeFileSync(path.join(publicDir, 'favicon.svg'), svg(64) + '\n');

const browser = await chromium.launch();
for (const [file, size, options] of [
  ['apple-touch-icon.png', 180, {}],
  ['icon-192.png', 192, {}],
  ['icon-512.png', 512, {}],
  ['icon-maskable-512.png', 512, { maskable: true }],
]) {
  const page = await browser.newPage({ viewport: { width: size, height: size }, deviceScaleFactor: 1 });
  await page.setContent(`<!doctype html><html><body style="margin:0">${svg(size, options)}</body></html>`);
  const png = await page.screenshot({ clip: { x: 0, y: 0, width: size, height: size }, omitBackground: false });
  writeFileSync(path.join(publicDir, file), png);
  await page.close();
  console.log(`${file}: ${size} × ${size}, ${png.length} bytes`);
}
await browser.close();

writeFileSync(
  path.join(publicDir, 'manifest.webmanifest'),
  JSON.stringify(
    {
      name: 'Portion',
      short_name: 'Portion',
      description: 'Calories and nutrition for the portion you intend to eat, and recipes that match your criteria.',
      start_url: '/',
      display: 'standalone',
      background_color: CANVAS,
      theme_color: CANVAS,
      icons: [
        { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
        { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
        { src: '/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
      ],
    },
    null,
    2,
  ) + '\n',
);
console.log('manifest.webmanifest written');
