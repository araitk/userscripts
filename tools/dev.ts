import {
  createReadStream,
  existsSync,
  mkdirSync,
  readFileSync,
  rmSync,
  statSync,
  watch,
} from 'node:fs';
import { createServer } from 'node:http';
import { networkInterfaces } from 'node:os';
import { extname, join, normalize, sep } from 'node:path';
import { site } from '../site.config.ts';
import { buildScript } from './build-scripts.ts';
import { buildStyle } from './build-styles.ts';
import { devLoader } from './dev-loader.ts';
import { createStyleChannel } from './dev-style.ts';
import { genIndex } from './gen-index.ts';
import {
  devFile,
  distDir,
  type Kind,
  listEntries,
  NAME_RE,
  noStore,
  root,
  scriptFile,
} from './lib.ts';

/**
 * Development: watch-builds everything and serves dist/ on localhost.
 *
 * dev/scripts/<name>.user.js serves the dev script. With it installed, every page load picks up
 * the latest build, so saving and reloading the page is enough.
 * dev/styles/<name>.user.js serves the style dev script, which swaps the style in place on every save.
 */
const port = Number(process.env.PORT ?? site.devPort);
const origin = `http://localhost:${port}`;
process.env.SITE_BASE_URL = origin;

rmSync(distDir, { recursive: true, force: true });
mkdirSync(distDir, { recursive: true });

/**
 * Watches scripts/ or styles/ and calls flush with the changed entries, each with the changed
 * paths inside it ('' for the folder itself). Changes are debounced so a save is handled once.
 */
function watchEntries(kind: Kind, flush: (changed: Map<string, Set<string>>) => Promise<void>) {
  let timer: NodeJS.Timeout | undefined;
  const pending = new Map<string, Set<string>>();
  watch(join(root, kind), { recursive: true }, (_event, file) => {
    const [name, ...rest] = file?.split(sep) ?? [];
    if (!name) return;
    const files = pending.get(name) ?? new Set();
    files.add(rest.join('/'));
    pending.set(name, files);
    clearTimeout(timer);
    timer = setTimeout(() => {
      const changed = new Map(pending);
      pending.clear();
      flush(changed).catch((e) => console.error(e));
    }, 100);
  });
}

/** The index page shows names and versions, so it only changes with metadata or folders. */
const regenIndex = () => genIndex().catch((e) => console.error(e));

// ---- scripts ----
const watchers = new Map<string, { close(): unknown } | undefined>();
async function startScript(name: string) {
  await watchers.get(name)?.close();
  try {
    watchers.set(name, await buildScript(name, { watch: true }));
  } catch (e) {
    console.error(`✗ scripts/${name}:`, e instanceof Error ? e.message : e);
  }
}
for (const name of listEntries('scripts')) await startScript(name);

// vite's watcher doesn't see meta.ts changes, new folders or removed ones, so handle them here
watchEntries('scripts', async (changed) => {
  const names = listEntries('scripts');
  let index = false;
  for (const [name, files] of changed) {
    if (!names.includes(name)) {
      if (!watchers.has(name)) continue;
      await watchers.get(name)?.close();
      watchers.delete(name);
      index = true;
    } else if (
      (files.has('meta.ts') || !watchers.has(name)) &&
      existsSync(join(root, 'scripts', name, 'index.ts')) &&
      existsSync(join(root, 'scripts', name, 'meta.ts'))
    ) {
      await startScript(name);
      index = true;
    }
  }
  if (index) await regenIndex();
});

// ---- styles ----
const styleChannel = createStyleChannel(origin);
function rebuildStyle(name: string) {
  try {
    styleChannel.publish(buildStyle(name));
  } catch (e) {
    console.error(`✗ styles/${name}:`, e instanceof Error ? e.message : e);
  }
}
for (const name of listEntries('styles')) rebuildStyle(name);

watchEntries('styles', async (changed) => {
  const names = listEntries('styles');
  let index = false;
  for (const [name, files] of changed) {
    if (!names.includes(name)) {
      index ||= styleChannel.has(name);
      styleChannel.remove(name);
      continue;
    }
    index ||= files.has('meta.json') || !styleChannel.has(name);
    rebuildStyle(name);
  }
  if (index) await regenIndex();
});

await genIndex();

// ---- server ----
const types: Record<string, string> = {
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
};
createServer((req, res) => {
  const url = new URL(req.url ?? '/', 'http://x');
  let path: string;
  try {
    path = decodeURIComponent(url.pathname);
  } catch {
    res.writeHead(400).end('bad request');
    return;
  }

  // dev/<kind>/<name>.user.js, plus dev/styles/<name>.json for the style long-poll
  const dev = path.match(/^\/dev\/(scripts|styles)\/([^/]+)\.(user\.js|json)$/);
  if (dev) {
    const [, kind, name = '', ext = ''] = dev;
    const built = join(distDir, scriptFile(name));
    if (!NAME_RE.test(name)) {
      res.writeHead(404).end('not found');
    } else if (kind === 'styles') {
      styleChannel.handle(name, ext, url.searchParams, res);
    } else if (ext !== 'user.js' || !existsSync(built)) {
      res.writeHead(404).end('not found');
    } else {
      res.writeHead(200, noStore(types['.js'] ?? ''));
      res.end(devLoader(readFileSync(built, 'utf8'), name, origin));
    }
    return;
  }

  let file = normalize(join(distDir, path));
  if (!file.startsWith(distDir)) {
    res.writeHead(403).end();
    return;
  }
  if (existsSync(file) && statSync(file).isDirectory()) file = join(file, 'index.html');
  if (!existsSync(file)) {
    res.writeHead(404).end('not found');
    return;
  }
  res.writeHead(200, noStore(types[extname(file)] ?? 'application/octet-stream'));
  createReadStream(file).pipe(res);
}).listen(port, () => {
  const lan = Object.values(networkInterfaces())
    .flat()
    .find((i) => i?.family === 'IPv4' && !i.internal)?.address;
  console.log(`\n  dev server: ${origin}/`);
  if (lan)
    console.log(`  (other devices on the same network can see the list at http://${lan}:${port}/)`);
  console.log(
    `  install the dev script ${origin}/${devFile('scripts', '<name>')} and just reload the page`,
  );
  console.log(
    `  for styles, install ${origin}/${devFile('styles', '<name>')}; saving updates the page\n`,
  );
});
