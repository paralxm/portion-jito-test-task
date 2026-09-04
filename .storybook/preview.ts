import type { Preview } from '@storybook/react-vite';

// The same shared style entry the application imports (font registration, generated
// tokens, reset, focus ring, reduced-motion handling). Storybook must never carry a
// separate copy of these rules.
import '../src/design-system/styles/global.css';

const viewports = {
  iPhone16Portrait: { name: 'iPhone 16 portrait (393 x 852)', styles: { width: '393px', height: '852px' }, type: 'mobile' },
  widerPreview: { name: 'Centered preview (768 x 900)', styles: { width: '768px', height: '900px' }, type: 'desktop' },
  landscape: { name: 'Landscape (852 x 393)', styles: { width: '852px', height: '393px' }, type: 'mobile' },
  mobile320: { name: 'Narrow — 320', styles: { width: '320px', height: '568px' }, type: 'mobile' },
  mobile390: { name: 'Reference — 390', styles: { width: '390px', height: '844px' }, type: 'mobile' },
  mobile393: { name: 'Check — 393', styles: { width: '393px', height: '852px' }, type: 'mobile' },
  mobile430: { name: 'Wide — 430', styles: { width: '430px', height: '932px' }, type: 'mobile' },
  shortHeight: { name: 'Short height — 390 × 560', styles: { width: '390px', height: '560px' }, type: 'mobile' },
} as const;

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    // Accessibility violations fail the Storybook test run for every story unless a story
    // narrows this deliberately and documents why. 'todo' only reports.
    a11y: {
      test: 'error',
    },
    viewport: {
      options: viewports,
    },
    backgrounds: {
      options: {
        canvas: { name: 'Canvas', value: '#ffffff' },
        surface: { name: 'Surface', value: '#f7f8fa' },
      },
    },
    layout: 'padded',
    options: {
      storySort: {
        order: [
          'Start Here',
          'Foundations',
          ['Tokens', 'Colors', 'Typography', 'Icons', 'Spacing and layout', 'Radius', 'Borders, focus and layers', 'Motion', 'Accessibility and platform'],
          'Primitives',
          'Components',
          'Patterns',
          'Templates',
          'Product compositions',
        ],
      },
    },
  },
  initialGlobals: {
    viewport: { value: 'mobile390', isRotated: false },
    backgrounds: { value: 'canvas' },
  },
  tags: ['autodocs'],
};

export default preview;
