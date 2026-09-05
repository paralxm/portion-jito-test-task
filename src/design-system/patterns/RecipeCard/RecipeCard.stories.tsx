import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, userEvent, within } from 'storybook/test';

import { Stack } from '../../primitives/layout/Stack';
import { withRootFontSize, expectNoHorizontalOverflow } from '../../storybook/decorators';
import { lentilSoupPhoto } from '../../../assets/images';
import { RecipeCard } from './RecipeCard';

/** A registered local photograph (ledger §5); evidence of appearance only. */
const placeholder = lentilSoupPhoto;

const meta = {
  title: 'Patterns/RecipeCard',
  component: RecipeCard,
  args: {
    title: 'Lentil soup',
    imageUrl: placeholder,
    calories: 450,
    protein: 24,
    servingBasis: 'per serving (300 g)',
    preparationMinutes: 25,
    dietary: [],
    onOpen: fn(),
  },
  parameters: {
    docs: {
      description: {
        component: `
**Purpose.** A scannable recipe card in the order a person judges a recipe: identity → why it qualifies (only with active criteria) → calories · protein on the stated basis → time and declared dietary types → a supporting 4:3 thumbnail. The thumbnail sits beside the text, not above it, so a list of five recipes fits in about two screens.

**Anatomy.** \`article\` → thumbnail column (\`MediaFrame\`, compact fallback) + text column: \`h3\` with the single \`button\` control, \`MatchCriteria\` summary, values line, basis, meta (time + \`Badge\` tags). The button's hit area stretches over the whole card; nothing else inside is interactive.

**States.** rest, hover (surface fill, pointer only), pressed (sunken fill), focus-visible (3 px ring on the card), no photo / failed photo (same loaded fallback), unknown calories or protein ("not available" in words, never a dash or a zero), no active criteria (no match claim at all).

**Responsive.** Under 17 rem of card width the thumbnail moves above the text — 200 % text on every supported viewport; every viewport at 100 % keeps the side-by-side layout.

**Token usage.** \`radius-card\` (card), \`radius-control\` (thumbnail), \`border-decorative\`, \`background-canvas/surface/sunken\`, \`spacing-title-to-secondary\`, \`compact-title\`, \`metric-inline\`, \`supporting\`, \`caption\` (tags).
        `,
      },
    },
  },
} satisfies Meta<typeof RecipeCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const WithPhoto: Story = {
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    const title = canvas.getByRole('button', { name: 'Lentil soup' });
    await expect(getComputedStyle(title, '::after').position).toBe('absolute');
    const layout = title.closest('article')?.firstElementChild as HTMLElement;
    await expect(getComputedStyle(layout).gridTemplateColumns.split(' ')).toHaveLength(2);
    await userEvent.click(title);
    await expect(args.onOpen).toHaveBeenCalledTimes(1);
    await expect(canvas.queryByText(/Matches/)).toBeNull();
  },
};

export const NoPhotoLongTitle: Story = {
  name: 'No photo, long title at 320',
  args: { imageUrl: undefined, title: 'Wholegrain pasta with roasted vegetables and tahini dressing', calories: 610, protein: 19, servingBasis: 'per serving (400 g)', preparationMinutes: 35, dietary: ['Vegetarian'] },
  globals: { viewport: { value: 'mobile320', isRotated: false } },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    // Compact fallback: the words are for assistive technology; the glyph is visible.
    await expect(canvas.getByText('No photo')).toHaveClass('portion-visually-hidden');
    const title = canvas.getByRole('button', { name: /Wholegrain pasta/ });
    await expect(title.getBoundingClientRect().height).toBeGreaterThan(24);
    await expectNoHorizontalOverflow();
  },
};

export const WithCriteria: Story = {
  name: 'With active criteria — evidence directly under the title',
  args: {
    dietary: ['Vegan', 'Gluten-free', 'Dairy-free'],
    criteria: [
      { id: 'calories', text: '450 kcal per serving — at most 500 kcal', met: true },
      { id: 'protein', text: '24 g protein per serving — at least 20 g', met: true },
    ],
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const evidence = canvas.getByText('Matches all 2 filters');
    await expect(evidence).toBeInTheDocument();
    const title = canvas.getByRole('button', { name: 'Lentil soup' });
    await expect(evidence.getBoundingClientRect().top).toBeGreaterThanOrEqual(title.getBoundingClientRect().bottom);
    await expect(evidence.getBoundingClientRect().top).toBeLessThan(canvas.getByText(/450/).getBoundingClientRect().top);
  },
};

export const MissingProtein: Story = {
  name: 'Unknown protein, partial match',
  args: {
    title: 'Quick tofu stir-fry',
    imageUrl: undefined,
    protein: null,
    calories: 395,
    preparationMinutes: 15,
    dietary: ['Vegan'],
    criteria: [
      { id: 'calories', text: '395 kcal per serving — at most 500 kcal', met: true },
      { id: 'protein', text: 'Protein per serving not available — needs at least 20 g', met: false },
    ],
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText('Protein not available')).toBeVisible();
    await expect(canvas.getByText('Matches 1 of 2 filters')).toBeInTheDocument();
  },
};

export const FocusVisible: Story = {
  name: 'Keyboard focus-visible on the whole card',
  play: async ({ canvasElement }) => {
    await userEvent.tab();
    const title = within(canvasElement).getByRole('button', { name: 'Lentil soup' });
    await expect(document.activeElement).toBe(title);
    const card = title.closest('article') as HTMLElement;
    await expect(getComputedStyle(card).outlineStyle).toBe('solid');
    await expect(parseFloat(getComputedStyle(card).outlineWidth)).toBe(3);
  },
};

export const EnlargedText: Story = {
  name: 'Enlarged text — 200 % stacks the thumbnail above the text',
  decorators: [withRootFontSize(200)],
  play: async ({ canvasElement }) => {
    const title = within(canvasElement).getByRole('button', { name: 'Lentil soup' });
    await expect(title).toBeVisible();
    const layout = title.closest('article')?.firstElementChild as HTMLElement;
    await expect(getComputedStyle(layout).gridTemplateColumns.split(' ')).toHaveLength(1);
    await expectNoHorizontalOverflow();
  },
};

export const List: Story = {
  name: 'In a list',
  render: (args) => (
    <Stack as="ul" gap={12} style={{ listStyle: 'none', margin: 0, padding: 0 }}>
      <li>
        <RecipeCard {...args} />
      </li>
      <li>
        <RecipeCard {...args} title="Roasted vegetable and chickpea traybake" imageUrl={undefined} calories={420} protein={14} preparationMinutes={40} dietary={['Vegan', 'Gluten-free']} />
      </li>
    </Stack>
  ),
};
