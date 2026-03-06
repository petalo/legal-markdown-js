import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

/**
 * Load the pre-built library by injecting a <script type="module"> element.
 * The URL is resolved from Vite's BASE_URL so it works in GitHub Pages subpaths.
 *
 * Files in /public are served as-is by Vite - the browser resolves all
 * relative chunk imports natively, bypassing Vite's import-analysis plugin
 * which blocks ES module imports of /public files from application code.
 */
function loadLibrary(): Promise<void> {
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.type = 'module';
    script.src = `${import.meta.env.BASE_URL}legal-markdown-loader.js`;
    script.addEventListener('load', () => resolve());
    script.addEventListener('error', reject);
    document.head.appendChild(script);
  });
}

async function bootstrap() {
  await loadLibrary();
  ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
}

bootstrap();
