#!/usr/bin/env node
// Contrast matrix for the colour pairs the product actually renders, computed from the
// canonical token source with alpha composited over the real background.
//   node scripts/verify/contrast-matrix.mjs            -> markdown table on stdout
//   node scripts/verify/contrast-matrix.mjs --check    -> exit 1 when a required pair fails
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const source = JSON.parse(readFileSync(path.join(root, 'src/design-system/tokens/tokens.json'), 'utf8'));

function get(pathStr) {
  return pathStr.split('.').reduce((node, key) => node?.[key], source);
}
function resolve(pathStr, seen = []) {
  const token = get(pathStr);
  if (!token || !('$value' in token)) throw new Error(`Unknown token ${pathStr}`);
  const value = token.$value;
  if (typeof value === 'string' && /^\{.+\}$/.test(value)) {
    const target = value.slice(1, -1);
    if (seen.includes(target)) throw new Error(`Cycle at ${target}`);
    return resolve(target, [...seen, target]);
  }
  return value;
}
const rgba = (pathStr) => {
  const v = resolve(pathStr);
  const [r, g, b] = v.components.map((c) => c * 255);
  return { r, g, b, a: v.alpha ?? 1 };
};
const composite = (fg, bg) => ({ r: fg.r * fg.a + bg.r * (1 - fg.a), g: fg.g * fg.a + bg.g * (1 - fg.a), b: fg.b * fg.a + bg.b * (1 - fg.a), a: 1 });
const channel = (c) => {
  const v = c / 255;
  return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
};
const luminance = (c) => 0.2126 * channel(c.r) + 0.7152 * channel(c.g) + 0.0722 * channel(c.b);
const hex = (c) => `#${[c.r, c.g, c.b].map((n) => Math.round(n).toString(16).padStart(2, '0')).join('')}`.toUpperCase();

/** Composited foreground/background pair and its WCAG 2.x ratio. Translucent colours are composited, never treated as opaque. */
function pair(fgPath, bgPath) {
  let bg = rgba(bgPath);
  if (bg.a < 1) bg = composite(bg, rgba('semantic.color.background.canvas'));
  let fg = rgba(fgPath);
  if (fg.a < 1) fg = composite(fg, bg);
  const l1 = luminance(fg);
  const l2 = luminance(bg);
  const [hi, lo] = l1 > l2 ? [l1, l2] : [l2, l1];
  return { fgHex: hex(fg), bgHex: hex(bg), ratio: (hi + 0.05) / (lo + 0.05) };
}

const C = 'semantic.color.';
/** [context, foreground, background, threshold (0 = exempt or decorative), note] */
const PAIRS = [
  ['Primary text on canvas', 'text.primary', 'background.canvas', 4.5, 'body, headings'],
  ['Primary text on surface', 'text.primary', 'background.surface', 4.5, 'Home daily group, method tiles, hover rows'],
  ['Primary text on sunken', 'text.primary', 'background.sunken', 4.5, 'segmented track hover, pressed rows'],
  ['Secondary text on canvas', 'text.secondary', 'background.canvas', 4.5, 'supporting, helper, basis, placeholder'],
  ['Secondary text on surface', 'text.secondary', 'background.surface', 4.5, 'Home group captions, tile descriptions'],
  ['Secondary text on sunken', 'text.secondary', 'background.sunken', 4.5, 'unselected segment, no-photo fallback, tag badges'],
  ['Text on action (primary button)', 'text.on-action', 'action.primary', 4.5, 'primary button label, Add food glyph'],
  ['Text on action hover', 'text.on-action', 'action.hover', 4.5, 'primary button hover'],
  ['Text on action pressed', 'text.on-action', 'action.pressed', 4.5, 'primary button pressed'],
  ['Action text on canvas', 'action.primary', 'background.canvas', 4.5, 'text button, links'],
  ['Action glyph on surface', 'action.primary', 'background.surface', 4.5, 'method tile glyph'],
  ['Secondary button label', 'action.primary', 'action.secondary-surface', 4.5, 'tinted secondary button'],
  ['Secondary button hover label', 'action.hover', 'action.secondary-surface', 4.5, ''],
  ['Secondary button pressed label', 'action.pressed', 'action.secondary-surface', 4.5, ''],
  ['Text button hover', 'action.primary', 'action.secondary-surface', 4.5, 'text button hover fill'],
  ['Selected chip, applied chip, count badge', 'action.pressed', 'action.selected-surface', 4.5, ''],
  ['Selected chip boundary', 'action.primary', 'background.canvas', 3, 'non-text boundary'],
  ['Destructive button label', 'feedback.error.foreground', 'feedback.error.surface', 4.5, 'tinted destructive button'],
  ['Error message text', 'feedback.error.foreground', 'feedback.error.surface', 4.5, 'InlineMessage error'],
  ['Warning message text', 'feedback.warning.foreground', 'feedback.warning.surface', 4.5, ''],
  ['Success message text', 'feedback.success.foreground', 'feedback.success.surface', 4.5, ''],
  ['Info message text', 'feedback.info.foreground', 'feedback.info.surface', 4.5, ''],
  ['Error text on canvas', 'feedback.error.foreground', 'background.canvas', 4.5, 'field error message'],
  ['Invalid field boundary', 'feedback.error.foreground', 'background.canvas', 3, 'non-text boundary'],
  ['Control boundary on canvas', 'border.control', 'background.canvas', 3, 'inputs, search field, chips'],
  ['Control boundary on surface', 'border.control', 'background.surface', 3, 'tile hover boundary'],
  ['Selected segment boundary on the sunken track', 'border.control', 'background.sunken', 3, 'SegmentedControl selected'],
  ['Focus ring on canvas', 'focus.ring', 'background.canvas', 3, ''],
  ['Focus ring on surface', 'focus.ring', 'background.surface', 3, 'Home group, tiles'],
  ['Focus ring on sunken', 'focus.ring', 'background.sunken', 3, 'segmented track'],
  ['Focus ring against the primary button fill', 'focus.ring', 'action.primary', 0, 'the ring sits outside the button with a 2 px canvas gap; the gap carries the contrast'],
  ['Navigation indicator and selected icon on canvas', 'action.primary', 'background.canvas', 3, 'NavigationBar selected'],
  ['Unselected navigation label on canvas', 'text.secondary', 'background.canvas', 4.5, 'caption 12/16'],
  ['Progress indicator on track', 'progress.indicator', 'progress.track', 3, 'ProgressRing arc against its track'],
  ['Progress indicator on surface', 'progress.indicator', 'background.surface', 3, 'ring on the Home group'],
  ['Progress track on surface', 'progress.track', 'background.surface', 0, 'non-essential guide'],
  ['Ring centre figure on surface', 'text.primary', 'background.surface', 4.5, 'CalorieProgressRing number'],
  ['Ring caption on surface', 'text.secondary', 'background.surface', 4.5, 'kcal remaining'],
  ['Nutrition marker: energy on canvas', 'nutrition.energy.accent', 'background.canvas', 3, 'labelled category marker'],
  ['Nutrition marker: protein on canvas', 'nutrition.protein.accent', 'background.canvas', 3, ''],
  ['Nutrition marker: carbohydrates on canvas', 'nutrition.carbohydrates.accent', 'background.canvas', 3, ''],
  ['Nutrition marker: fat on canvas', 'nutrition.fat.accent', 'background.canvas', 3, ''],
  ['Nutrition marker: fibre on canvas', 'nutrition.fibre.accent', 'background.canvas', 3, ''],
  ['Nutrition marker: vitamins on canvas', 'nutrition.vitamins.accent', 'background.canvas', 3, ''],
  ['Nutrition marker: minerals on canvas', 'nutrition.minerals.accent', 'background.canvas', 3, ''],
  ['Nutrition marker: protein on surface', 'nutrition.protein.accent', 'background.surface', 3, 'Home macros'],
  ['Nutrition marker: carbohydrates on surface', 'nutrition.carbohydrates.accent', 'background.surface', 3, 'Home macros'],
  ['Nutrition marker: fat on surface', 'nutrition.fat.accent', 'background.surface', 3, 'Home macros'],
  ['Disabled text on the disabled surface', 'state.disabled.text', 'state.disabled.surface', 0, 'inactive component, exempt under WCAG 1.4.3; must stay legible'],
  ['Disabled text on canvas', 'state.disabled.text', 'background.canvas', 0, 'disabled chip or segment, exempt'],
  ['Disabled text on sunken', 'state.disabled.text', 'background.sunken', 0, 'disabled segment on the track, exempt'],
  ['Scrim over canvas (composited)', 'overlay.scrim', 'background.canvas', 0, 'sheet backdrop; composited value shown'],
  ['Primary text under the scrim', 'text.primary', 'overlay.scrim', 0, 'inert content behind a sheet is not required to be readable'],
  ['Decorative border on canvas', 'border.decorative', 'background.canvas', 0, 'never an essential boundary'],
];

const rows = PAIRS.map(([context, fg, bg, threshold, note]) => {
  const { fgHex, bgHex, ratio } = pair(C + fg, C + bg);
  return { context, fg, bg, fgHex, bgHex, ratio, threshold, ok: threshold === 0 || ratio >= threshold, note };
});

if (process.argv.includes('--check')) {
  const fails = rows.filter((r) => !r.ok);
  for (const r of fails) console.error(`FAIL ${r.context}: ${r.ratio.toFixed(2)}:1 < ${r.threshold}:1`);
  console.log(`${rows.length} pairs, ${fails.length} failing required thresholds.`);
  process.exit(fails.length ? 1 : 0);
}

console.log('| Context | Foreground | Background | Composited values | Ratio | Threshold | Result |');
console.log('| --- | --- | --- | --- | --- | --- | --- |');
for (const r of rows) {
  const req = r.threshold === 0 ? 'none' : `${r.threshold}:1`;
  const result = r.threshold === 0 ? `exempt / decorative: ${r.note}` : `${r.ok ? 'met' : '**NOT met**'}${r.note ? ` (${r.note})` : ''}`;
  console.log(`| ${r.context} | \`${r.fg}\` | \`${r.bg}\` | ${r.fgHex} on ${r.bgHex} | ${r.ratio.toFixed(2)}:1 | ${req} | ${result} |`);
}
