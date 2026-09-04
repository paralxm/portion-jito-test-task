/**
 * Storybook-only colour helpers: resolve a token's CSS variable at runtime and compute
 * WCAG contrast with alpha composited over the actual background.
 */

export type RGBA = { r: number; g: number; b: number; a: number };

export function resolveVar(name: string, element: Element = document.documentElement): string {
  return getComputedStyle(element).getPropertyValue(name).trim();
}

export function parseColor(input: string): RGBA | null {
  const text = input.trim();
  // A production build minifies #ffffff to #fff, so short hex forms must parse too.
  const shortHex = /^#([0-9a-f])([0-9a-f])([0-9a-f])([0-9a-f])?$/i.exec(text);
  if (shortHex) {
    const [, r, g, b, a] = shortHex;
    return { r: parseInt(r + r, 16), g: parseInt(g + g, 16), b: parseInt(b + b, 16), a: a ? parseInt(a + a, 16) / 255 : 1 };
  }
  const hex = /^#([0-9a-f]{6})([0-9a-f]{2})?$/i.exec(text);
  if (hex) {
    const n = parseInt(hex[1], 16);
    return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255, a: hex[2] ? parseInt(hex[2], 16) / 255 : 1 };
  }
  const rgb = /^rgba?\(\s*([\d.]+)[ ,]+([\d.]+)[ ,]+([\d.]+)(?:\s*[/,]\s*([\d.]+%?))?\s*\)$/i.exec(text);
  if (rgb) {
    const alpha = rgb[4] === undefined ? 1 : rgb[4].endsWith('%') ? parseFloat(rgb[4]) / 100 : parseFloat(rgb[4]);
    return { r: +rgb[1], g: +rgb[2], b: +rgb[3], a: alpha };
  }
  return null;
}

/** Composites a translucent colour over an opaque background. */
export function composite(fg: RGBA, bg: RGBA): RGBA {
  const a = fg.a;
  return { r: fg.r * a + bg.r * (1 - a), g: fg.g * a + bg.g * (1 - a), b: fg.b * a + bg.b * (1 - a), a: 1 };
}

function channel(c: number): number {
  const v = c / 255;
  return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
}

export function luminance(c: RGBA): number {
  return 0.2126 * channel(c.r) + 0.7152 * channel(c.g) + 0.0722 * channel(c.b);
}

/** WCAG 2.x contrast ratio between a foreground and an opaque background. */
export function contrast(foreground: RGBA, background: RGBA): number {
  const fg = foreground.a < 1 ? composite(foreground, background) : foreground;
  const l1 = luminance(fg);
  const l2 = luminance(background);
  const [hi, lo] = l1 > l2 ? [l1, l2] : [l2, l1];
  return (hi + 0.05) / (lo + 0.05);
}

export function contrastBetweenVars(fgVar: string, bgVar: string): number | null {
  const fg = parseColor(resolveVar(fgVar));
  const bg = parseColor(resolveVar(bgVar));
  if (!fg || !bg) return null;
  return contrast(fg, bg);
}

export const formatRatio = (ratio: number | null): string => (ratio === null ? 'n/a' : `${(Math.round(ratio * 100) / 100).toFixed(2)}:1`);
