import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, userEvent, within } from 'storybook/test';

import { NavigationBar } from '../../../design-system/patterns/NavigationBar/NavigationBar';
import { commitCandidate, updatePortion, type CurrentCalculation } from '../domain/calculation';
import { fixtureC, foodCatalogue } from '../domain/fixtures';
import { CalculateScreen } from './CalculateScreen';

const navigation = <NavigationBar selected="calculate" onSelect={fn()} onAddFood={fn()} />;

function Harness({ initial, onChangeFood }: { initial: CurrentCalculation | null; onChangeFood: () => void }) {
  const [current, setCurrent] = useState(initial);
  return <CalculateScreen current={current} onPortionChange={(portion) => setCurrent((c) => (c ? updatePortion(c, portion) : c))} onChangeFood={onChangeFood} navigation={navigation} />;
}

const meta = {
  title: 'Product compositions/Calculate (S01)',
  component: CalculateScreen,
  args: { current: null, onPortionChange: fn(), onChangeFood: fn(), navigation },
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'S01 — the initial and working destination. Empty on launch; after a reviewed food is confirmed it shows the identity, the editable amount and the result. Valid amounts recalculate locally without a Save step; an invalid draft shows a stale result instead of presenting the old number as current.',
      },
    },
  },
} satisfies Meta<typeof CalculateScreen>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Empty: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole('heading', { level: 1, name: 'Calculate' })).toBeInTheDocument();
    await expect(canvas.getByText('Nothing calculated yet')).toBeInTheDocument();
    // No primary button competes with Add food in the bar.
    await expect(canvas.getAllByRole('button')).toHaveLength(4);
  },
};

export const ResultFixtureC: Story = {
  name: 'Result — fixture C at 300 g',
  render: (args) => <Harness initial={commitCandidate(fixtureC, { quantity: 300, unitId: 'g' }, 1)} onChangeFood={args.onChangeFood} />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText('540')).toBeInTheDocument();
    const amount = canvas.getByLabelText('Amount', { exact: true });
    await userEvent.clear(amount);
    await userEvent.type(amount, '250');
    await expect(canvas.getByText('450')).toBeInTheDocument();
    await expect(canvas.getByText('For 250 g')).toBeInTheDocument();
  },
};

export const InvalidAmountStale: Story = {
  name: 'Invalid amount — stale result',
  render: (args) => <Harness initial={commitCandidate(fixtureC, { quantity: 300, unitId: 'g' }, 1)} onChangeFood={args.onChangeFood} />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const amount = canvas.getByLabelText('Amount', { exact: true });
    await userEvent.clear(amount);
    await userEvent.type(amount, 'abc');
    await userEvent.tab();
    await expect(canvas.queryByText('540')).toBeNull();
    await expect(canvas.getAllByText('Enter a valid amount to see the result').length).toBeGreaterThanOrEqual(1);
    await expect(amount).toHaveAttribute('aria-invalid', 'true');
  },
};

export const UnitChangeKeepsPortion: Story = {
  name: 'Unit change keeps the portion',
  render: (args) => <Harness initial={commitCandidate(fixtureC, { quantity: 300, unitId: 'g' }, 1)} onChangeFood={args.onChangeFood} />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('button', { name: 'Change unit, currently g' }));
    await userEvent.click(canvas.getByRole('radio', { name: /serving/ }));
    await userEvent.click(canvas.getByRole('button', { name: 'Confirm' }));
    await expect(canvas.getByLabelText('Amount', { exact: true })).toHaveValue('1');
    await expect(canvas.getByText('540')).toBeInTheDocument();
    await expect(canvas.getByText('For 1 serving (300 g)')).toBeInTheDocument();
  },
};

export const PartialData: Story = {
  name: 'Partial data (unknown macros)',
  render: (args) => <Harness initial={commitCandidate(foodCatalogue[5], { quantity: 80, unitId: 'g' }, 1)} onChangeFood={args.onChangeFood} />,
  play: async ({ canvasElement }) => {
    const visible = within(canvasElement)
      .getAllByText('Not available')
      .filter((el) => !el.classList.contains('portion-visually-hidden'));
    await expect(visible).toHaveLength(2);
  },
};

export const KnownZero: Story = {
  name: 'Known zero (sparkling water)',
  render: (args) => <Harness initial={commitCandidate(foodCatalogue[6], { quantity: 330, unitId: 'ml' }, 1)} onChangeFood={args.onChangeFood} />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.queryByText('Not available')).toBeNull();
    await expect(canvas.getAllByText('0').length).toBeGreaterThanOrEqual(4);
  },
};

export const ChangeFood: Story = {
  name: 'Change food opens the method chooser',
  render: (args) => <Harness initial={commitCandidate(fixtureC, { quantity: 300, unitId: 'g' }, 1)} onChangeFood={args.onChangeFood} />,
  play: async ({ canvasElement, args }) => {
    await userEvent.click(within(canvasElement).getByRole('button', { name: 'Change food' }));
    await expect(args.onChangeFood).toHaveBeenCalledTimes(1);
  },
};
