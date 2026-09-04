/**
 * Storybook-only helpers. Not part of the design-system public entry point.
 */
import { useLayoutEffect, type CSSProperties, type ReactNode } from 'react';
import type { Decorator } from '@storybook/react-vite';

/**
 * Applies a root font-size percentage for the life of the story, the way a browser or
 * OS text-size preference would. Every rem-based token scales with it. A layout effect
 * applies it synchronously with the commit, so a play function that runs right after
 * render already measures the enlarged layout.
 */
export function RootFontSize({ percent, children }: { percent: number; children: ReactNode }) {
  useLayoutEffect(() => {
    const root = document.documentElement;
    const previous = root.style.fontSize;
    root.style.fontSize = `${percent}%`;
    return () => {
      root.style.fontSize = previous;
    };
  }, [percent]);
  return <>{children}</>;
}

export const withRootFontSize =
  (percent: number): Decorator =>
  (Story) => (
    <RootFontSize percent={percent}>
      <Story />
    </RootFontSize>
  );

/** WCAG 1.4.12 text-spacing overrides: the layout must survive them without loss. */
export const withTextSpacing: Decorator = (Story) => (
  <div style={{ lineHeight: 1.5, letterSpacing: '0.12em', wordSpacing: '0.16em' }}>
    <style>{`p { margin-block-end: 2em !important; }`}</style>
    <Story />
  </div>
);

/** Removes the default story padding so full-screen layouts fill the viewport. */
export const fullscreen = { parameters: { layout: 'fullscreen' } } as const;

/** Storybook-only device fixture values; production always reads env(..., 0px). */
export const iPhone16PortraitSafeAreas = { top: 59, right: 0, bottom: 34, left: 0 } as const;

export interface SafeAreaInsets {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

/**
 * Overrides the runtime safe-area abstraction only for a deterministic Storybook
 * fixture. It intentionally lives outside tokens and the public design-system entry.
 */
export function SafeAreaFixture({ insets, children }: { insets: SafeAreaInsets; children: ReactNode }) {
  const style = {
    '--portion-safe-area-top': `${insets.top}px`,
    '--portion-safe-area-right': `${insets.right}px`,
    '--portion-safe-area-bottom': `${insets.bottom}px`,
    '--portion-safe-area-left': `${insets.left}px`,
  } as CSSProperties;
  return <div style={style}>{children}</div>;
}

export const withIPhone16PortraitSafeAreas: Decorator = (Story) => (
  <SafeAreaFixture insets={iPhone16PortraitSafeAreas}>
    <Story />
  </SafeAreaFixture>
);

/**
 * Review-only device fixture. The neutral bands label reserved regions without drawing
 * a Status Bar, Dynamic Island, Home Indicator, or any approximation of Apple chrome.
 */
export function IPhone16PortraitReviewFrame({ children }: { children: ReactNode }) {
  const labelStyle = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'var(--portion-color-background-sunken)',
    color: 'var(--portion-color-text-secondary)',
    fontFamily: 'var(--portion-typography-caption-font-family)',
    fontSize: 'var(--portion-typography-caption-font-size)',
    fontWeight: 'var(--portion-typography-caption-font-weight)',
    lineHeight: 'var(--portion-typography-caption-line-height)',
    pointerEvents: 'none',
    position: 'absolute',
    insetInline: 0,
    zIndex: 10,
    opacity: 0.92,
  } as CSSProperties;
  return (
    <SafeAreaFixture insets={iPhone16PortraitSafeAreas}>
      <div style={{ position: 'relative', minBlockSize: '100dvh', overflow: 'hidden' }} data-device-fixture="iphone-16-portrait">
        {children}
        <div aria-hidden="true" style={{ ...labelStyle, insetBlockStart: 0, blockSize: `${iPhone16PortraitSafeAreas.top}px` }}>
          Reference safe area - 59 px
        </div>
        <div aria-hidden="true" style={{ ...labelStyle, insetBlockEnd: 0, blockSize: `${iPhone16PortraitSafeAreas.bottom}px` }}>
          Reference safe area - 34 px
        </div>
      </div>
    </SafeAreaFixture>
  );
}

/**
 * Asserts nothing inside `root` (default: the whole document) is wider than the
 * viewport — the one check every 320 CSS px and enlarged-text story needs. Reports the
 * offending element instead of just failing, so a regression names its own cause.
 */
export async function expectNoHorizontalOverflow(root: HTMLElement = document.documentElement) {
  const limit = window.innerWidth + 1;
  const offenders = Array.from(root.querySelectorAll<HTMLElement>('*'))
    .filter((el) => el.getBoundingClientRect().width > 0 && el.getBoundingClientRect().right > limit)
    .map((el) => `${el.tagName.toLowerCase()}.${String(el.className).split(' ')[0]} → right edge ${Math.round(el.getBoundingClientRect().right)} (viewport ${window.innerWidth})`);
  if (offenders.length > 0) throw new Error(`Horizontal overflow:\n${offenders.join('\n')}`);
}
