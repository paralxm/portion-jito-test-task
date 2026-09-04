import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect } from 'storybook/test';

import { Button } from '../primitives/Button/Button';
import { Container } from '../primitives/layout/Container';
import { Grid, GridItem } from '../primitives/layout/Grid';
import { Stack } from '../primitives/layout/Stack';
import { Surface } from '../primitives/Surface/Surface';
import { Text } from '../primitives/Text/Text';
import { AppHeader } from '../patterns/AppHeader/AppHeader';
import { NavigationBar } from '../patterns/NavigationBar/NavigationBar';
import { IPhone16PortraitReviewFrame, iPhone16PortraitSafeAreas, withIPhone16PortraitSafeAreas, withRootFontSize } from '../storybook/decorators';
import { resolveVar } from '../storybook/contrast';
import { RootScreenLayout } from '../templates/RootScreenLayout/RootScreenLayout';

const meta = {
  title: 'Foundations/Spacing and layout',
  parameters: {
    docs: {
      description: {
        component: `
The approved \`reference.space\` scale is exactly 0/4/8/12/16/24/32 px — **spacing between
elements**, and nothing else. Every semantic spacing role this system defines (page
inset, card padding, card gap, form group, section, and every smaller
label/helper/paragraph role) resolves to one of these seven steps — checked below
against the live tokens, not just declared. **The parent layout owns spacing between its
children** (\`Stack\`/\`Inline\` \`gap\`, typed to this same seven-value union, or a
template's own \`gap\`/padding); a reusable component owns only its own internal padding
and internal gaps, never an external margin reaching for a sibling it doesn't control.

A handful of components have their own fixed dimension in this numeric neighbourhood —
\`Chip\`'s minimum height (40 px), \`ModalSheet\`'s drag handle width (40 px), and
\`FoodResultRow\`/\`AppHeader\`'s minimum row height (56 px), \`Button\`'s and \`SegmentedControl\`'s small drawn height (40 px) — but these are
plain pixel literals written directly in the component's own CSS, not \`reference.space\`
tokens. A fixed dimension is a different concept from spacing between siblings, so it is
never exposed through \`gap\` or any spacing token.

Product and component styles consume semantic roles or the \`Stack\`/\`Inline\` primitives,
never a raw \`reference.space\` value, outside of token definitions and this catalogue.
\`full = 9999px\` is a radius token, not a spacing step. Safe-area insets are added on top
of page spacing by the owning header, navigation, footer, sheet, or Container boundary.

### Four-column mobile alignment grid

The primary review canvas is **393 x 852 CSS px**. Its content boundary has a 16 px page
inset inside each runtime side safe area, then a real CSS grid with four fluid tracks and
12 px gutters. With the iPhone 16 portrait fixture's 0 px side insets, the baseline is
\`(393 - 2 x 16 - 3 x 12) / 4 = 81.25 px\` per track. CSS distributes fractional tracks;
components never hardcode 81.25.

This is an alignment guide, not a demand to make a normal mobile screen look four-column.
Cards, long forms, search results and recipe lists use one full four-track span. A paired
field may use two tracks only while its label, value and 48 px target fit; the real GridItem
returns it to a full-width row below its content boundary. Nutrition summaries retain their
own semantic track count.

### Safe-area ownership

Production reads \`env(safe-area-inset-*, 0px)\` through \`--portion-safe-area-*\`; it has
no 59/34 fallback. The named **iPhone 16 portrait** Storybook fixture scopes 59 px top,
34 px bottom and 0 px side insets only to the review story. Storybook viewport sizing alone
does not emulate iOS safe areas. iOS owns the real Status Bar, Dynamic Island and Home
Indicator: Portion reserves runtime insets but does not draw them.
        `,
      },
    },
  },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

const STEPS = [0, 4, 8, 12, 16, 24, 32] as const;
/** The subset every semantic "spacing between elements" role is verified to stay within. */
const APPROVED_LAYOUT_STEPS = ['0px', '4px', '8px', '12px', '16px', '24px', '32px'] as const;

const ROLES = [
  'page-inset',
  'section',
  'related',
  'card-padding',
  'card-gap',
  'form-group',
  'heading-to-description',
  'section-title-to-content',
  'title-to-secondary',
  'label-to-control',
  'control-to-helper',
  'paragraph',
  'instruction-item',
  'icon-to-label',
  'nav-icon-to-label',
] as const;

/** Components with their own fixed pixel dimension near this scale — plain literals, not tokens. */
const FIXED_DIMENSION_USES = [
  { step: 40, owner: 'Chip', use: 'minimum height' },
  { step: 40, owner: 'ModalSheet', use: 'drag handle width' },
  { step: 40, owner: 'Button (small) / SegmentedControl segment', use: 'drawn height; hit area extends to 48' },
  { step: 56, owner: 'FoodResultRow', use: 'minimum row height' },
  { step: 56, owner: 'AppHeader', use: 'minimum height (plus safe-area-top)' },
] as const;

export const Scale: Story = {
  render: () => (
    <Stack gap={8}>
      {STEPS.map((step) => (
        <div key={step} style={{ display: 'grid', gridTemplateColumns: '64px minmax(0, 1fr)', alignItems: 'center', gap: 12 }}>
          <Text variant="supporting" numeric>
            {step} px
          </Text>
          <div
            style={{
              blockSize: 16,
              inlineSize: `var(--portion-ref-space-${step})`,
              background: 'var(--portion-color-action-primary)',
              borderRadius: 2,
              minInlineSize: step === 0 ? 1 : undefined,
            }}
          />
        </div>
      ))}
    </Stack>
  ),
  play: async () => {
    for (const step of STEPS) {
      await expect(resolveVar(`--portion-ref-space-${step}`)).toBe(`${step}px`);
    }
  },
};

export const SemanticRoles: Story = {
  name: 'Semantic roles (spacing between elements)',
  render: () => (
    <table style={{ borderCollapse: 'collapse' }}>
      <tbody>
        {ROLES.map((role) => (
          <tr key={role}>
            <td style={{ padding: '4px 12px 4px 0' }}>
              <Text variant="supporting">spacing.{role}</Text>
            </td>
            <td style={{ padding: '4px 12px 4px 0' }}>
              <Text variant="supporting" numeric>
                {resolveVar(`--portion-spacing-${role}`)}
              </Text>
            </td>
            <td>
              <div style={{ blockSize: 12, inlineSize: `var(--portion-spacing-${role})`, background: 'var(--portion-color-nutrition-protein-accent)', borderRadius: 2 }} />
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  ),
  play: async () => {
    // Establishes the contract as an executable check, not just prose: every semantic
    // "spacing between elements" role must stay within the approved 0/4/8/12/16/24/32
    // subset. This fails if a future role is ever added at 36+.
    for (const role of ROLES) {
      const value = resolveVar(`--portion-spacing-${role}`);
      await expect(APPROVED_LAYOUT_STEPS).toContain(value);
    }
  },
};

export const FixedDimensionsAboveTheLayoutScale: Story = {
  name: 'Fixed dimensions above 32 — plain literals, not spacing tokens',
  render: () => (
    <table style={{ borderCollapse: 'collapse' }}>
      <tbody>
        {FIXED_DIMENSION_USES.map(({ step, owner, use }, i) => (
          <tr key={i}>
            <td style={{ padding: '4px 12px 4px 0' }}>
              <Text variant="supporting" numeric>
                {step} px
              </Text>
            </td>
            <td style={{ padding: '4px 12px 4px 0' }}>
              <Text variant="supporting">{owner}</Text>
            </td>
            <td>
              <Text variant="supporting" color="secondary">
                {use}
              </Text>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  ),
};

export const FourColumnGuide: Story = {
  name: 'Four-column grid - 393 px baseline',
  parameters: { layout: 'fullscreen' },
  globals: { viewport: { value: 'iPhone16Portrait', isRotated: false } },
  decorators: [withIPhone16PortraitSafeAreas],
  render: () => (
    <Container>
      <Grid data-testid="four-column-grid">
        {Array.from({ length: 4 }, (_, index) => (
          <GridItem key={index} span={1}>
            <Surface tone="sunken" border="none" radius="control" padding={12}>
              <Text variant="label" numeric>
                {index + 1}
              </Text>
            </Surface>
          </GridItem>
        ))}
        <GridItem>
          <Surface tone="surface" border="decorative" radius="card" padding={16}>
            <Text variant="body">Normal mobile content spans all four alignment tracks.</Text>
          </Surface>
        </GridItem>
      </Grid>
    </Container>
  ),
  play: async ({ canvasElement }) => {
    const grid = canvasElement.querySelector<HTMLElement>('[data-testid="four-column-grid"]');
    await expect(grid).not.toBeNull();
    if (!grid) return;
    const tracks = getComputedStyle(grid).gridTemplateColumns.split(' ').map(parseFloat);
    const expectedTrack = (grid.getBoundingClientRect().width - 3 * 12) / 4;
    await expect(grid.getBoundingClientRect().width).toBeCloseTo(361, 1);
    await expect(tracks).toHaveLength(4);
    for (const track of tracks) await expect(track).toBeCloseTo(expectedTrack, 1);
    await expect(parseFloat(getComputedStyle(grid).gap)).toBe(12);
  },
};

export const TwoTrackPairsReflow: Story = {
  name: 'Grid - paired fields stack at narrow and 200% text',
  parameters: { layout: 'fullscreen' },
  globals: { viewport: { value: 'mobile320', isRotated: false } },
  decorators: [withRootFontSize(200)],
  render: () => (
    <Container>
      <Grid data-testid="paired-grid">
        <GridItem span={2} collapseAtNarrow>
          <Button block variant="secondary">Use grams as the portion unit</Button>
        </GridItem>
        <GridItem span={2} collapseAtNarrow>
          <Button block variant="secondary">Use millilitres as the portion unit</Button>
        </GridItem>
      </Grid>
    </Container>
  ),
  play: async ({ canvasElement }) => {
    const items = Array.from(canvasElement.querySelectorAll<HTMLElement>('[data-collapse-at-narrow]'));
    await expect(items).toHaveLength(2);
    for (const item of items) await expect(getComputedStyle(item).gridColumnStart).toBe('span 4');
    await expect(document.documentElement.scrollWidth).toBeLessThanOrEqual(window.innerWidth + 1);
  },
};

export const IPhone16PortraitSafeAreaReference: Story = {
  name: 'iPhone 16 portrait - 59/34 safe-area reference',
  parameters: { layout: 'fullscreen' },
  globals: { viewport: { value: 'iPhone16Portrait', isRotated: false } },
  render: () => (
    <IPhone16PortraitReviewFrame>
      <RootScreenLayout
        header={<AppHeader title="Safe-area reference" showWordmark />}
        navigation={<NavigationBar selected="home" onSelect={() => undefined} onLogFood={() => undefined} />}
      >
        <Surface tone="surface" border="decorative" radius="card" padding={16}>
          <Stack gap={8}>
            <Text as="h2" variant="section-title">Usable content region</Text>
            <Text as="p" variant="body" wrap>
              The labelled bands are review-only fixture regions. They are neither spacing tokens nor production system chrome.
            </Text>
          </Stack>
        </Surface>
      </RootScreenLayout>
    </IPhone16PortraitReviewFrame>
  ),
  play: async ({ canvasElement }) => {
    const fixture = canvasElement.querySelector<HTMLElement>('[data-device-fixture="iphone-16-portrait"]');
    await expect(fixture).not.toBeNull();
    if (!fixture) return;
    const computed = getComputedStyle(fixture);
    await expect(computed.getPropertyValue('--portion-safe-area-top').trim()).toBe(`${iPhone16PortraitSafeAreas.top}px`);
    await expect(computed.getPropertyValue('--portion-safe-area-bottom').trim()).toBe(`${iPhone16PortraitSafeAreas.bottom}px`);
  },
};
