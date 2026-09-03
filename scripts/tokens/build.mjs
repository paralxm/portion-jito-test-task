#!/usr/bin/env node
/**
 * Portion token pipeline.
 *
 * Reads the canonical DTCG 2025.10 token source, validates it, resolves aliases
 * (including composite members) and emits deterministic consumers:
 *
 *   src/design-system/tokens/generated/tokens.css  — CSS custom properties
 *   src/design-system/tokens/generated/tokens.ts   — typed values and var names
 *
 * `node scripts/tokens/build.mjs`          writes the generated files
 * `node scripts/tokens/build.mjs --check`  fails if the committed output drifted
 *
 * Naming: reference tokens become `--portion-ref-<path>`, semantic tokens
 * become `--portion-<path>`. Semantic aliases are emitted as `var()` references so
 * the alias relationship survives into CSS. Font sizes are emitted in rem
 * (root = 16 CSS px) so the interface scales with the user's text preference.
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..', '..');
const SOURCE = path.join(root, 'src', 'design-system', 'tokens', 'tokens.json');
const OUT_DIR = path.join(root, 'src', 'design-system', 'tokens', 'generated');
const OUT_CSS = path.join(OUT_DIR, 'tokens.css');
const OUT_TS = path.join(OUT_DIR, 'tokens.ts');
const PREFIX = 'portion';
const ROOT_FONT_PX = 16;
const KNOWN_TYPES = new Set([
  'color',
  'dimension',
  'fontFamily',
  'fontWeight',
  'number',
  'duration',
  'cubicBezier',
  'shadow',
  'typography',
]);
// DTCG 2025.10 dimension tokens accept only px or rem — never em. The wordmark's
// em-based tracking is authored as a unitless number instead (see LETTER_SPACING_TYPES).
const DIMENSION_UNITS = new Set(['px', 'rem']);
const ALIAS = /^\{([^}]+)\}$/;
/** Member types of the supported composite tokens (DTCG 2025.10). */
const COMPOSITE_MEMBERS = {
  typography: { fontFamily: 'fontFamily', fontSize: 'dimension', fontWeight: 'fontWeight', lineHeight: 'number', letterSpacing: 'dimension' },
  shadow: { offsetX: 'dimension', offsetY: 'dimension', blur: 'dimension', spread: 'dimension', color: 'color' },
};
/**
 * letterSpacing normally resolves to a dimension (0px). The wordmark is the one
 * exception: its tracking is authored as a schema-valid unitless `number` (-0.03) and
 * formatted as an em value by fmtTypographyMember/fmtScalar — the only way to express
 * -0.03em given that the dimension type does not accept "em" as a unit.
 */
const LETTER_SPACING_TYPES = new Set(['dimension', 'number']);

const check = process.argv.includes('--check');
const errors = [];
const fail = (message) => errors.push(message);

// ---------------------------------------------------------------------------
// 1. Collect tokens with inherited group types
// ---------------------------------------------------------------------------
const source = JSON.parse(readFileSync(SOURCE, 'utf8'));
if (source.$schema !== 'https://www.designtokens.org/schemas/2025.10/format.json') {
  fail(`Unexpected $schema: ${source.$schema}`);
}

/** @type {Map<string, {path: string[], type: string|null, raw: any, description?: string}>} */
const tokens = new Map();

function walk(node, trail, inheritedType) {
  if (node === null || typeof node !== 'object' || Array.isArray(node)) return;
  const groupType = typeof node.$type === 'string' ? node.$type : inheritedType;
  if (Object.prototype.hasOwnProperty.call(node, '$value')) {
    const type = typeof node.$type === 'string' ? node.$type : null;
    if (type && !KNOWN_TYPES.has(type)) fail(`${trail.join('.')}: unknown $type "${type}"`);
    tokens.set(trail.join('.'), {
      path: trail,
      type: type ?? (inheritedType && KNOWN_TYPES.has(inheritedType) ? inheritedType : null),
      raw: node.$value,
      description: node.$description,
    });
    return;
  }
  for (const [key, child] of Object.entries(node)) {
    if (key.startsWith('$')) continue;
    walk(child, [...trail, key], groupType);
  }
}
walk(source, [], null);

// ---------------------------------------------------------------------------
// 2. Resolve aliases recursively, detecting cycles and type conflicts
// ---------------------------------------------------------------------------
const resolved = new Map();

function resolve(id, stack = []) {
  if (resolved.has(id)) return resolved.get(id);
  const token = tokens.get(id);
  if (!token) {
    fail(`Dangling reference: {${id}} (referenced from ${stack[stack.length - 1] ?? 'root'})`);
    return { type: null, value: null, aliasOf: null };
  }
  if (stack.includes(id)) {
    fail(`Alias cycle: ${[...stack, id].join(' -> ')}`);
    return { type: null, value: null, aliasOf: null };
  }
  const next = [...stack, id];
  let result;
  if (typeof token.raw === 'string' && ALIAS.test(token.raw)) {
    const target = token.raw.match(ALIAS)[1];
    const targetResolved = resolve(target, next);
    if (token.type && targetResolved.type && token.type !== targetResolved.type) {
      fail(`${id}: declared $type "${token.type}" but alias target ${target} is "${targetResolved.type}"`);
    }
    result = { type: token.type ?? targetResolved.type, value: targetResolved.value, aliasOf: target };
  } else if (
    token.raw !== null &&
    typeof token.raw === 'object' &&
    !Array.isArray(token.raw) &&
    (token.type === 'shadow' || token.type === 'typography')
  ) {
    // Composite tokens: each member may itself be an alias or a literal value. A literal
    // member takes the type the composite defines for it and is validated as that type.
    const value = {};
    for (const [member, memberRaw] of Object.entries(token.raw)) {
      if (typeof memberRaw === 'string' && ALIAS.test(memberRaw)) {
        const target = memberRaw.match(ALIAS)[1];
        const r = resolve(target, next);
        value[member] = { value: r.value, type: r.type, aliasOf: target };
      } else {
        value[member] = { value: memberRaw, type: COMPOSITE_MEMBERS[token.type]?.[member] ?? null, aliasOf: null };
      }
    }
    result = { type: token.type, value, aliasOf: null };
  } else {
    result = { type: token.type, value: token.raw, aliasOf: null };
  }
  if (!result.type) fail(`${id}: type could not be determined (no $type and no typed alias target)`);
  resolved.set(id, result);
  return result;
}
for (const id of tokens.keys()) resolve(id);

// ---------------------------------------------------------------------------
// 3. Validate resolved values by type
// ---------------------------------------------------------------------------
function isDimension(v) {
  return v && typeof v === 'object' && typeof v.value === 'number' && DIMENSION_UNITS.has(v.unit);
}
/** Validates the literal (non-alias) members of a composite by their member type. */
function validateLiteralMembers(id, type, value) {
  for (const [member, memberType] of Object.entries(COMPOSITE_MEMBERS[type] ?? {})) {
    const m = value[member];
    if (m && m.aliasOf === null) validate(`${id}.${member}`, { type: memberType, value: m.value });
  }
}
function validate(id, { type, value }) {
  const at = (msg) => fail(`${id}: ${msg}`);
  switch (type) {
    case 'color': {
      if (!value || value.colorSpace !== 'srgb') return at('color must declare colorSpace "srgb"');
      if (!Array.isArray(value.components) || value.components.length !== 3) return at('color needs three components');
      if (value.components.some((c) => typeof c !== 'number' || c < 0 || c > 1)) return at('color components must be 0..1');
      if (value.alpha !== undefined && (typeof value.alpha !== 'number' || value.alpha < 0 || value.alpha > 1))
        return at('alpha must be 0..1');
      return;
    }
    case 'dimension':
      if (!isDimension(value)) return at(`dimension must be {value, unit in ${[...DIMENSION_UNITS].join('|')}}`);
      return;
    case 'duration':
      if (!value || typeof value.value !== 'number' || value.unit !== 'ms') return at('duration must be {value, unit:"ms"}');
      return;
    case 'number':
      if (typeof value !== 'number' || !Number.isFinite(value)) return at('number must be finite');
      return;
    case 'fontWeight':
      if (typeof value !== 'number' || value < 1 || value > 1000) return at('fontWeight must be 1..1000');
      return;
    case 'fontFamily':
      if (!Array.isArray(value) || value.some((f) => typeof f !== 'string')) return at('fontFamily must be an array of strings');
      return;
    case 'cubicBezier':
      if (!Array.isArray(value) || value.length !== 4 || value.some((n) => typeof n !== 'number')) return at('cubicBezier needs four numbers');
      return;
    case 'shadow': {
      for (const m of ['offsetX', 'offsetY', 'blur', 'spread']) {
        if (!isDimension(value[m]?.value)) at(`shadow.${m} must be a dimension`);
      }
      if (value.color?.type !== 'color') at('shadow.color must resolve to a color');
      validateLiteralMembers(id, type, value);
      return;
    }
    case 'typography': {
      for (const [m, t] of Object.entries(COMPOSITE_MEMBERS.typography)) {
        const allowed = m === 'letterSpacing' ? LETTER_SPACING_TYPES : new Set([t]);
        if (!value[m]) at(`typography.${m} missing`);
        else if (!allowed.has(value[m].type)) at(`typography.${m} must resolve to ${[...allowed].join(' or ')}, got ${value[m].type}`);
      }
      validateLiteralMembers(id, type, value);
      return;
    }
    default:
      return;
  }
}
for (const [id, r] of resolved) validate(id, r);

if (errors.length) {
  console.error(`tokens.json failed validation with ${errors.length} error(s):`);
  for (const e of errors) console.error(`  - ${e}`);
  process.exit(1);
}

// ---------------------------------------------------------------------------
// 4. Formatting
// ---------------------------------------------------------------------------
const trim = (n) => String(Number(n.toFixed(6)));
function varName(pathArr) {
  const [family, ...rest] = pathArr;
  const tail = rest.join('-');
  return family === 'reference' ? `--${PREFIX}-ref-${tail}` : `--${PREFIX}-${tail}`;
}
function fmtColor(v) {
  const [r, g, b] = v.components.map((c) => Math.round(c * 255));
  if (v.alpha !== undefined && v.alpha < 1) return `rgb(${r} ${g} ${b} / ${trim(v.alpha)})`;
  return (v.hex ?? `#${[r, g, b].map((n) => n.toString(16).padStart(2, '0')).join('')}`).toLowerCase();
}
function fmtDimension(v, pathArr) {
  const isFontSize = pathArr.includes('font') && pathArr.includes('size');
  if (isFontSize && v.unit === 'px') return `${trim(v.value / ROOT_FONT_PX)}rem`;
  return `${trim(v.value)}${v.unit}`;
}
function fmtFamily(list) {
  return list.map((f) => (/^[A-Za-z-]+$/.test(f) ? f : `'${f}'`)).join(', ');
}
function fmtScalar(type, value, pathArr) {
  switch (type) {
    case 'color': return fmtColor(value);
    case 'dimension': return fmtDimension(value, pathArr);
    case 'duration': return `${trim(value.value)}ms`;
    // A number token under letter-spacing is the wordmark's authored tracking ratio;
    // every other number token (line-height, layer index, …) stays a plain unitless value.
    case 'number': return pathArr.includes('letter-spacing') ? `${trim(value)}em` : trim(value);
    case 'fontWeight': return String(value);
    case 'fontFamily': return fmtFamily(value);
    case 'cubicBezier': return `cubic-bezier(${value.map(trim).join(', ')})`;
    case 'shadow': {
      const d = (m) => fmtDimension(value[m].value, []);
      return `${d('offsetX')} ${d('offsetY')} ${d('blur')} ${d('spread')} ${fmtColor(value.color.value)}`;
    }
    default: return String(value);
  }
}
const TYPO_MEMBERS = { fontFamily: 'font-family', fontSize: 'font-size', fontWeight: 'font-weight', lineHeight: 'line-height', letterSpacing: 'letter-spacing' };
/**
 * Formats one resolved typography composite member. `letterSpacing` is the only member
 * that can resolve to `number` (the wordmark's tracking ratio); it becomes `-0.03em`.
 * Every other member — and letterSpacing when it resolves to `dimension`, e.g. 0px —
 * keeps its ordinary formatting.
 */
function fmtTypographyMember(member, type, value) {
  if (member === 'letterSpacing' && type === 'number') return `${trim(value)}em`;
  return fmtScalar(type, value, member === 'fontSize' ? ['font', 'size'] : []);
}

// ---------------------------------------------------------------------------
// 5. Emit CSS
// ---------------------------------------------------------------------------
const cssLines = [];
const tsVars = {};
const tsValues = {};

function setDeep(obj, pathArr, value) {
  let cur = obj;
  for (const key of pathArr.slice(0, -1)) cur = cur[key] ??= {};
  cur[pathArr[pathArr.length - 1]] = value;
}

for (const [id, token] of tokens) {
  const r = resolved.get(id);
  const name = varName(token.path);
  const desc = token.description ? ` /* ${token.description.replace(/\*\//g, '* /')} */` : '';

  if (r.type === 'typography') {
    const targetId = r.aliasOf;
    const members = {};
    for (const [member, cssProp] of Object.entries(TYPO_MEMBERS)) {
      const memberVar = `${name}-${cssProp}`;
      let cssValue;
      if (targetId) {
        cssValue = `var(${varName(tokens.get(targetId).path)}-${cssProp})`;
      } else {
        const m = r.value[member];
        // A literal member is formatted by its member type; font sizes become rem like
        // their reference tokens, and a literal letterSpacing number becomes an em value.
        cssValue = m.aliasOf ? `var(${varName(tokens.get(m.aliasOf).path)})` : fmtTypographyMember(member, m.type, m.value);
      }
      cssLines.push(`  ${memberVar}: ${cssValue};`);
      const memberValue = targetId ? resolved.get(targetId).value[member] : r.value[member];
      members[member] = fmtTypographyMember(member, memberValue.type, memberValue.value);
      tsVars[`${id}.${member}`] = memberVar;
    }
    if (desc) cssLines[cssLines.length - 5] += desc;
    setDeep(tsValues, token.path, members);
    continue;
  }

  const cssValue = r.aliasOf ? `var(${varName(tokens.get(r.aliasOf).path)})` : fmtScalar(r.type, r.value, token.path);
  cssLines.push(`  ${name}: ${cssValue};${desc}`);
  tsVars[id] = name;
  setDeep(tsValues, token.path, r.type === 'number' || r.type === 'fontWeight' ? r.value : fmtScalar(r.type, r.value, token.path));
}

const banner = `/* GENERATED FILE — do not edit.
   Source: src/design-system/tokens/tokens.json
   Regenerate: npm run tokens:build   Verify: npm run tokens:check */`;

const css = `${banner}
:root {
${cssLines.join('\n')}
}
`;

const ts = `${banner.replace(/\/\*|\*\//g, (m) => (m === '/*' ? '/**' : ' */'))}
/* eslint-disable */

/** CSS custom property names keyed by DTCG token path. */
export const tokenVars = ${JSON.stringify(tsVars, null, 2)} as const;

export type TokenPath = keyof typeof tokenVars;

/** Returns a \`var(--…)\` expression for a token path. */
export const cssVar = (path: TokenPath): string => \`var(\${tokenVars[path]})\`;

/** Resolved token values (font sizes in rem, other dimensions in their authored unit). */
export const tokens = ${JSON.stringify(tsValues, null, 2)} as const;
`;

// ---------------------------------------------------------------------------
// 6. Write or check
// ---------------------------------------------------------------------------
function read(file) {
  return existsSync(file) ? readFileSync(file, 'utf8') : null;
}
// Compare content only, not line endings: a Windows checkout with core.autocrlf=true
// reads committed LF files back as CRLF, which would otherwise look like drift on
// every fresh clone even when nothing actually changed.
const normalizeNewlines = (s) => (s === null ? null : s.replace(/\r\n/g, '\n'));
if (check) {
  const drift = [];
  if (normalizeNewlines(read(OUT_CSS)) !== normalizeNewlines(css)) drift.push(path.relative(root, OUT_CSS));
  if (normalizeNewlines(read(OUT_TS)) !== normalizeNewlines(ts)) drift.push(path.relative(root, OUT_TS));
  if (drift.length) {
    console.error(`Generated token output is out of date: ${drift.join(', ')}. Run "npm run tokens:build".`);
    process.exit(1);
  }
  console.log(`tokens: ${tokens.size} tokens validated; generated output is current.`);
} else {
  mkdirSync(OUT_DIR, { recursive: true });
  writeFileSync(OUT_CSS, css, 'utf8');
  writeFileSync(OUT_TS, ts, 'utf8');
  console.log(`tokens: ${tokens.size} tokens validated; wrote ${path.relative(root, OUT_CSS)} and ${path.relative(root, OUT_TS)}.`);
}
