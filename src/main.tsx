import React from 'react';
import ReactDOM from 'react-dom/client';

// Shared style entry: Inter registration, generated tokens, reset and cross-cutting rules.
// Storybook imports exactly the same file from .storybook/preview.ts.
import './design-system/styles/global.css';

import App from './app/App';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
