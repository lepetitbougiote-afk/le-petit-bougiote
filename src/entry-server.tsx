import { renderToString } from 'react-dom/server';
import { HelmetProvider } from 'react-helmet-async';
import App from './App';

export function render(location: string) {
  const helmetContext: Record<string, any> = {};
  const html = renderToString(
    <HelmetProvider context={helmetContext}>
      <App location={location} />
    </HelmetProvider>,
  );
  const helmet = helmetContext.helmet;
  const head = [
    helmet?.title?.toString(),
    helmet?.priority?.toString(),
    helmet?.meta?.toString(),
    helmet?.link?.toString(),
    helmet?.script?.toString(),
  ].filter(Boolean).join('\n');

  return { html, head };
}
