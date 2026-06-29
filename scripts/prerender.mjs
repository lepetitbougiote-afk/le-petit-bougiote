import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const root = resolve(process.cwd());
const dist = resolve(root, 'dist');
const template = await readFile(resolve(dist, 'index.html'), 'utf8');
const { render } = await import(pathToFileURL(resolve(root, 'dist-ssr/entry-server.js')).href);

const routes = [
  '/',
  '/menu',
  '/contact',
  '/blog',
  '/blog/restaurant-centre-ville-beziers',
  '/blog/burger-beziers-fait-maison',
  '/blog/vente-a-emporter-beziers',
  '/blog/cafe-dessert-beziers',
  '/blog/ou-manger-burger-beziers',
  '/a-propos',
  '/galerie',
  '/avis',
  '/404',
];

for (const route of routes) {
  const rendered = render(route);
  const page = template
    .replace('<!--app-head-->', rendered.head)
    .replace('<div id="root"></div>', `<div id="root">${rendered.html}</div>`);
  const output = route === '/'
    ? resolve(dist, 'index.html')
    : resolve(dist, `${route.slice(1)}.html`);
  await mkdir(dirname(output), { recursive: true });
  await writeFile(output, page);
}

await rm(resolve(root, 'dist-ssr'), { recursive: true, force: true });
console.log(`Prerendered ${routes.length} routes with static HTML.`);
