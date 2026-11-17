import { createReadStream, existsSync, mkdirSync, rmSync, statSync, watch } from 'node:fs';
import { createServer } from 'node:http';
import { networkInterfaces } from 'node:os';
import { extname, join, normalize, sep } from 'node:path';
import { site } from '../site.config.ts';
import { buildScript } from './build-scripts.ts';
import { buildStyles } from './build-styles.ts';
import { genIndex } from './gen-index.ts';
import { distDir, listEntries, root } from './lib.ts';

/**
 * 開発用: 全部を watch ビルドしつつ dist/ を localhost で配信する。
 * @updateURL も localhost を向くので、拡張機能の「更新を確認」で最新版を取り込める。
 */
const port = Number(process.env.PORT ?? site.devPort);
process.env.SITE_BASE_URL = `http://localhost:${port}`;

rmSync(distDir, { recursive: true, force: true });
mkdirSync(distDir, { recursive: true });

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

// meta.ts の変更や新しいフォルダは vite の watch に入らないので、ここで拾って作り直す
let timer: NodeJS.Timeout | undefined;
const pending = new Set<string>();
watch(join(root, 'scripts'), { recursive: true }, (_event, file) => {
  if (!file) return;
  const [name, rest] = file.split(sep);
  if (!name) return;
  if (rest === 'meta.ts' || !watchers.has(name)) pending.add(name);
  clearTimeout(timer);
  timer = setTimeout(async () => {
    for (const n of pending) {
      if (
        existsSync(join(root, 'scripts', n, 'index.ts')) &&
        existsSync(join(root, 'scripts', n, 'meta.ts'))
      ) {
        await startScript(n);
      }
    }
    pending.clear();
    await genIndex().catch((e) => console.error(e));
  }, 200);
});

// ---- styles ----
const rebuildStyles = () => {
  try {
    buildStyles();
  } catch (e) {
    console.error('✗ styles:', e instanceof Error ? e.message : e);
  }
};
rebuildStyles();
let styleTimer: NodeJS.Timeout | undefined;
watch(join(root, 'styles'), { recursive: true }, () => {
  clearTimeout(styleTimer);
  styleTimer = setTimeout(async () => {
    rebuildStyles();
    await genIndex().catch((e) => console.error(e));
  }, 100);
});

await genIndex();

// ---- server ----
const types: Record<string, string> = {
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
};
createServer((req, res) => {
  const path = decodeURIComponent(new URL(req.url ?? '/', 'http://x').pathname);
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
  res.writeHead(200, {
    'content-type': types[extname(file)] ?? 'application/octet-stream',
    'cache-control': 'no-store',
  });
  createReadStream(file).pipe(res);
}).listen(port, () => {
  const lan = Object.values(networkInterfaces())
    .flat()
    .find((i) => i?.family === 'IPv4' && !i.internal)?.address;
  console.log(`\n  dev server: http://localhost:${port}/`);
  if (lan)
    console.log(`  (同じネットワークの別端末からは http://${lan}:${port}/ で一覧が見えます)`);
  console.log('  変更は拡張機能の「更新を確認」で取り込めます\n');
});
