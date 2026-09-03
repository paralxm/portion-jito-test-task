import type { Meta, StoryObj } from '@storybook/react-vite';

import { Stack } from '../layout/Stack';
import { Text } from '../Text/Text';
import { Surface } from './Surface';

const meta = {
  title: 'Primitives/Surface',
  component: Surface,
  args: { children: 'A bounded region', tone: 'canvas', border: 'decorative', radius: 'card', padding: 16 },
  parameters: {
    docs: {
      description: {
        component:
          'A bounded region built from background, border and space. Ordinary surfaces never carry elevation — the sheet shadow is reserved for overlays. The decorative border is 1.23:1 on canvas and must not be the only boundary of a control; essential boundaries use the control border.',
      },
    },
  },
} satisfies Meta<typeof Surface>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const TonesAndBorders: Story = {
  render: () => (
    <Stack gap={12}>
      <Surface tone="canvas" border="decorative">
        <Text variant="body">canvas · decorative border (grouping)</Text>
      </Surface>
      <Surface tone="surface" border="none">
        <Text variant="body">surface · no border (result block)</Text>
      </Surface>
      <Surface tone="sunken" border="none" radius="structure">
        <Text variant="body">sunken · media and viewfinder regions</Text>
      </Surface>
      <Surface tone="canvas" border="control" radius="control" padding={12}>
        <Text variant="body">canvas · control border (essential boundary)</Text>
      </Surface>
    </Stack>
  ),
};
