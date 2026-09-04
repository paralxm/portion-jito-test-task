/**
 * Storybook-only helpers. Not part of the design-system public entry point.
 */
import { useLayoutEffect, type ReactNode } from 'react';
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
