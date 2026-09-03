import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, within } from 'storybook/test';

import { Text } from '../primitives/Text/Text';
import { resolveVar } from '../storybook/contrast';
import { tokenVars, tokens, type TokenPath } from './generated/tokens';

const meta = {
  title: 'Foundations/Tokens',
  parameters: {
    docs: {
      description: {
        component:
          'Every token in `src/design-system/tokens/tokens.json` (DTCG 2025.10) with the CSS custom property the generator emits and the value the browser resolves. `npm run tokens:build` regenerates `tokens.css` and `tokens.ts`; `npm run tokens:check` fails when the generated files drift from the source.',
      },
    },
  },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

function authored(path: TokenPath): string {
  const value = path.split('.').reduce<unknown>((node, key) => (node && typeof node === 'object' ? (node as Record<string, unknown>)[key] : undefined), tokens);
  return typeof value === 'object' ? JSON.stringify(value) : String(value);
}

const paths = Object.keys(tokenVars) as TokenPath[];

export const AllTokens: Story = {
  name: 'All tokens',
  render: () => (
    <div style={{ overflowX: 'auto' }} role="region" aria-label="Token table" tabIndex={0}>
      <table style={{ borderCollapse: 'collapse', inlineSize: '100%' }}>
        <thead>
          <tr>
            {['Path', 'CSS variable', 'Resolved in browser', 'Authored'].map((h) => (
              <th key={h} style={{ textAlign: 'start', padding: '4px 8px', borderBlockEnd: '1px solid var(--portion-color-border-control)' }}>
                <Text variant="label">{h}</Text>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {paths.map((path) => (
            <tr key={path} data-token={path}>
              <td style={{ padding: '4px 8px' }}>
                <Text variant="supporting">{path}</Text>
              </td>
              <td style={{ padding: '4px 8px' }}>
                <Text variant="caption" color="secondary">
                  {tokenVars[path]}
                </Text>
              </td>
              <td style={{ padding: '4px 8px' }} data-resolved>
                <Text variant="caption" numeric>
                  {resolveVar(tokenVars[path])}
                </Text>
              </td>
              <td style={{ padding: '4px 8px' }}>
                <Text variant="caption" color="secondary">
                  {authored(path)}
                </Text>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  ),
  play: async ({ canvasElement }) => {
    // 220 DTCG tokens; typography composites emit five custom properties each, so the
    // variable count is higher than the token count.
    const rows = within(canvasElement).getAllByRole('row').slice(1);
    await expect(rows.length).toBe(paths.length);
    await expect(paths.length).toBeGreaterThanOrEqual(220);
    for (const path of paths) {
      await expect(resolveVar(tokenVars[path])).not.toBe('');
    }
  },
};
