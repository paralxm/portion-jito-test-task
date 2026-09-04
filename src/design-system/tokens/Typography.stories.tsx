import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, within } from 'storybook/test';

import { AmountField } from '../components/AmountField/AmountField';
import { NutritionSummary } from '../patterns/NutritionSummary/NutritionSummary';
import { Button } from '../primitives/Button/Button';
import { Stack } from '../primitives/layout/Stack';
import { Text, type TextVariant } from '../primitives/Text/Text';
import { withRootFontSize, withTextSpacing } from '../storybook/decorators';

const meta = {
  title: 'Foundations/Typography',
  parameters: {
    docs: {
      description: {
        component:
          'Inter Variable (wght + opsz) registered by @fontsource-variable/inter; the font-family token names that registered family with system-ui and sans-serif as fallbacks. Twelve base styles plus five aliases, in rem with unitless line heights so the browser text preference scales everything. Tabular figures apply only to numeric consumers; essential text is never all-caps, negatively tracked or truncated.',
      },
    },
  },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

interface StyleSpec {
  variant: TextVariant;
  spec: string;
  use: string;
}

const STYLES: StyleSpec[] = [
  { variant: 'main-result', spec: '40/48 · 600', use: 'The single calorie result' },
  { variant: 'screen-heading', spec: '28/36 · 600', use: 'Root screen titles' },
  { variant: 'detail-heading', spec: '24/32 · 600', use: 'Food or recipe title on a detail screen' },
  { variant: 'section-title', spec: '20/28 · 600', use: 'Section and sheet titles' },
  { variant: 'compact-title', spec: '18/24 · 600', use: 'Focused bar titles, card titles, empty-state titles' },
  { variant: 'action-md', spec: '16/24 · 600', use: 'Medium (default) button labels, unit selector' },
  { variant: 'body', spec: '16/24 · 400', use: 'Paragraphs, inputs, list items' },
  { variant: 'label', spec: '14/20 · 500', use: 'Field labels, chips, nutrient category labels' },
  { variant: 'supporting', spec: '14/20 · 400', use: 'Helper, error, basis and secondary lines' },
  { variant: 'action-sm', spec: '14/20 · 600', use: 'Small button labels (Filters, Reset all, Show all nutrition), selected segment' },
  { variant: 'caption', spec: '12/16 · 500', use: 'Navigation labels (unselected), dietary tags' },
  { variant: 'caption-strong', spec: '12/16 · 600', use: 'Navigation labels (selected), count badge' },
  { variant: 'item-title', spec: '→ action-md', use: 'Result row titles' },
  { variant: 'method-title', spec: '→ action-md', use: 'Entry-method tile titles' },
  { variant: 'metric-inline', spec: '→ action-md', use: 'Inline values in rows and cards' },
  { variant: 'metric-secondary', spec: '→ section-title', use: 'Secondary macro values (20/28)' },
  { variant: 'wordmark', spec: '24/32 · 600 · −0.03em', use: 'The lowercase wordmark only' },
];

function metrics(element: Element): string {
  const s = getComputedStyle(element);
  return `${parseFloat(s.fontSize)}px / ${parseFloat(s.lineHeight)}px · ${s.fontWeight} · ${s.letterSpacing}`;
}

export const Catalogue: Story = {
  render: () => (
    <Stack gap={16}>
      {STYLES.map((style) => (
        <div key={style.variant} data-style={style.variant}>
          <Text as="p" variant="caption" color="secondary">
            {style.variant} · {style.spec} · {style.use}
          </Text>
          <Text as="p" variant={style.variant} wrap>
            {style.variant === 'wordmark' ? 'portion' : 'Lentil soup, 450 kcal per serving'}
          </Text>
          <Text as="p" variant="caption" color="secondary" numeric data-metrics>
            {' '}
          </Text>
        </div>
      ))}
    </Stack>
  ),
  play: async ({ canvasElement }) => {
    // Fill in the browser-measured metrics and check the base scale.
    const expected: Record<string, [number, number, number]> = {
      'main-result': [40, 48, 600],
      'screen-heading': [28, 36, 600],
      'detail-heading': [24, 32, 600],
      'section-title': [20, 28, 600],
      'compact-title': [18, 24, 600],
      'action-md': [16, 24, 600],
      body: [16, 24, 400],
      label: [14, 20, 500],
      supporting: [14, 20, 400],
      'action-sm': [14, 20, 600],
      'metric-secondary': [20, 28, 600],
      caption: [12, 16, 500],
      'caption-strong': [12, 16, 600],
      wordmark: [24, 32, 600],
    };
    for (const style of STYLES) {
      const block = canvasElement.querySelector<HTMLElement>(`[data-style="${style.variant}"]`)!;
      const sample = block.children[1] as HTMLElement;
      const out = block.querySelector<HTMLElement>('[data-metrics]')!;
      out.textContent = `measured: ${metrics(sample)}`;
      const s = getComputedStyle(sample);
      await expect(s.fontFamily.startsWith('"Inter Variable"')).toBe(true);
      const want = expected[style.variant];
      if (want) {
        await expect(Math.round(parseFloat(s.fontSize))).toBe(want[0]);
        await expect(Math.round(parseFloat(s.lineHeight))).toBe(want[1]);
        await expect(Number(s.fontWeight)).toBe(want[2]);
      }
    }
    const wordmark = within(canvasElement).getByText('portion');
    await expect(parseFloat(getComputedStyle(wordmark).letterSpacing)).toBeLessThan(0);
  },
};

function Specimen() {
  return (
    <Stack gap={24}>
      <Text as="p" variant="wordmark">
        portion
      </Text>
      <Text as="h1" variant="screen-heading" wrap>
        Home
      </Text>
      <Text as="h2" variant="detail-heading" wrap>
        Wholegrain pasta with roasted vegetables and tahini dressing
      </Text>
      <Text as="p" variant="body" wrap>
        Type the nutrition you know for a set amount. You choose the portion to calculate on the next screen. Leave a value blank if you do not know it; it will show as not available, not as zero.
      </Text>
      <Text as="p" variant="supporting" color="secondary" wrap>
        Supercalifragilisticexpialidocious-and-otherwise-unbreakable-ingredient-identifier-that-must-not-overflow
      </Text>
      <AmountField label="Amount to calculate" value="300" onChange={() => {}} unit="g" onRequestUnitChange={() => {}} helper="The result updates as you type a valid amount." />
      <NutritionSummary energy={540} protein={18} carbohydrates={63} fat={24} basis="For 300 g" />
      <Button variant="primary" block>
        Add to today
      </Button>
    </Stack>
  );
}

const noOverflow = async ({ canvasElement }: { canvasElement: HTMLElement }) => {
  // Name the offending elements so a failure says what overflowed, not just that something did.
  const limit = canvasElement.getBoundingClientRect().right + 1;
  const offenders = Array.from(canvasElement.querySelectorAll<HTMLElement>('*'))
    .filter((el) => el.getBoundingClientRect().right > limit && el.getBoundingClientRect().width > 0)
    .map((el) => `${el.tagName.toLowerCase()}.${String(el.className).split(' ')[0]} → ${Math.round(el.getBoundingClientRect().right)}`);
  await expect(offenders).toEqual([]);
  await expect(document.documentElement.scrollWidth).toBeLessThanOrEqual(window.innerWidth + 1);
};

export const Stress320: Story = { name: 'Stress — 320 px', render: () => <Specimen />, globals: { viewport: { value: 'mobile320', isRotated: false } }, play: noOverflow };
export const Stress390: Story = { name: 'Stress — 390 px', render: () => <Specimen />, globals: { viewport: { value: 'mobile390', isRotated: false } }, play: noOverflow };
export const Stress393: Story = { name: 'Stress — 393 px', render: () => <Specimen />, globals: { viewport: { value: 'mobile393', isRotated: false } }, play: noOverflow };
export const Stress430: Story = { name: 'Stress — 430 px', render: () => <Specimen />, globals: { viewport: { value: 'mobile430', isRotated: false } }, play: noOverflow };
export const Stress320Enlarged: Story = {
  name: 'Stress — 320 px at 200 % text',
  render: () => <Specimen />,
  globals: { viewport: { value: 'mobile320', isRotated: false } },
  decorators: [withRootFontSize(200)],
  play: noOverflow,
};
export const Stress390Enlarged150: Story = {
  name: 'Stress — 390 px at 150 % text',
  render: () => <Specimen />,
  globals: { viewport: { value: 'mobile390', isRotated: false } },
  decorators: [withRootFontSize(150)],
  play: noOverflow,
};
export const TextSpacing: Story = {
  name: 'Stress — WCAG text-spacing overrides',
  render: () => <Specimen />,
  globals: { viewport: { value: 'mobile320', isRotated: false } },
  decorators: [withTextSpacing],
  play: noOverflow,
};

export const FontLoading: Story = {
  name: 'Font loading and fallback',
  render: () => (
    <Stack gap={24}>
      <Text as="p" variant="supporting" color="secondary" data-font-status>
        Checking font status…
      </Text>
      <div>
        <Text as="p" variant="caption" color="secondary">
          Registered family (Inter Variable)
        </Text>
        <Text as="p" variant="detail-heading" numeric>
          Lentil soup 1234567890 kcal
        </Text>
      </div>
      <div style={{ fontFamily: 'system-ui, sans-serif' }}>
        <Text as="p" variant="caption" color="secondary">
          Fallback stack (system-ui, sans-serif) — what renders if the font file fails
        </Text>
        <p className="portion-type-detail-heading portion-numeric" style={{ fontFamily: 'system-ui, sans-serif', margin: 0 }}>
          Lentil soup 1234567890 kcal
        </p>
      </div>
    </Stack>
  ),
  play: async ({ canvasElement }) => {
    await document.fonts.ready;
    const loaded = document.fonts.check('600 24px "Inter Variable"');
    const status = canvasElement.querySelector<HTMLElement>('[data-font-status]')!;
    status.textContent = `document.fonts.check('600 24px "Inter Variable"') → ${loaded}; faces registered: ${Array.from(document.fonts).filter((f) => f.family.replace(/"/g, '') === 'Inter Variable').length}`;
    await expect(loaded).toBe(true);
    const sample = within(canvasElement).getAllByText('Lentil soup 1234567890 kcal')[0];
    await expect(getComputedStyle(sample).fontFamily.startsWith('"Inter Variable"')).toBe(true);
  },
};
