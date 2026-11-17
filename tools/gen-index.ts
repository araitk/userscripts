import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { site } from '../site.config.ts';
import {
  distDir,
  listEntries,
  loadScriptMeta,
  loadStyleMeta,
  scriptFile,
  styleFile,
} from './lib.ts';

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);

type Row = { name: string; title: string; version: string; description: string; url: string };

function section(heading: string, rows: Row[]) {
  if (rows.length === 0) return '';
  const items = rows
    .map(
      (r) => `<li>
  <div class="head"><strong>${esc(r.title)}</strong> <span class="ver">v${esc(r.version)}</span></div>
  <p>${esc(r.description)}</p>
  <div class="url"><a href="${esc(r.url)}">${esc(r.url)}</a>
  <button type="button" data-copy="${esc(r.url)}">コピー</button></div>
</li>`,
    )
    .join('\n');
  return `<h2>${heading}</h2>\n<ul>\n${items}\n</ul>`;
}

/** dist/index.html にインストール用 URL の一覧を書く。 */
export async function genIndex() {
  const scripts: Row[] = [];
  for (const name of listEntries('scripts')) {
    const m = await loadScriptMeta(name);
    scripts.push({
      name,
      title: m.name,
      version: m.version,
      description: m.description,
      url: `${site.baseUrl}/${scriptFile(name)}`,
    });
  }
  const styles: Row[] = listEntries('styles').map((name) => {
    const m = loadStyleMeta(name);
    return {
      name,
      title: m.name,
      version: m.version,
      description: m.description,
      url: `${site.baseUrl}/${styleFile(name)}`,
    };
  });

  const html = `<!doctype html>
<html lang="ja">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Userscripts</title>
<style>
:root { --bg: #fff; --fg: #1d1d1f; --muted: #6e6e73; --line: #e5e5ea; --accent: #0066cc; }
@media (prefers-color-scheme: dark) { :root { --bg: #111; --fg: #f5f5f7; --muted: #98989d; --line: #2c2c2e; --accent: #4da3ff; } }
body { margin: 0; background: var(--bg); color: var(--fg); font: 16px/1.5 -apple-system, system-ui, sans-serif; }
main { max-width: 720px; margin: 0 auto; padding: 24px 16px 64px; }
h1 { font-size: 1.6rem; margin: 0 0 4px; }
.lead { color: var(--muted); margin: 0 0 24px; }
h2 { font-size: 1.1rem; border-bottom: 1px solid var(--line); padding-bottom: 6px; margin-top: 32px; }
ul { list-style: none; padding: 0; margin: 0; }
li { padding: 14px 0; border-bottom: 1px solid var(--line); }
.ver { color: var(--muted); font-size: .85rem; }
p { margin: 4px 0 8px; color: var(--muted); }
.url { display: flex; flex-wrap: wrap; gap: 8px; align-items: center; font-size: .85rem; }
.url a { color: var(--accent); word-break: break-all; }
button { font: inherit; padding: 4px 10px; border-radius: 6px; border: 1px solid var(--line); background: transparent; color: var(--fg); cursor: pointer; }
</style>
</head>
<body>
<main>
<h1>Userscripts</h1>
<p class="lead">リンクを開くか、URL をコピーして拡張機能に追加してください。<br><a href="${esc(site.repoUrl)}">ソース</a></p>
${section('ユーザースクリプト', scripts)}
${section('ユーザースタイル', styles)}
</main>
<script>
document.addEventListener('click', async (e) => {
  const b = e.target.closest('button[data-copy]');
  if (!b) return;
  await navigator.clipboard.writeText(b.dataset.copy);
  const t = b.textContent; b.textContent = 'コピーしました'; setTimeout(() => (b.textContent = t), 1500);
});
</script>
</body>
</html>
`;
  writeFileSync(join(distDir, 'index.html'), html);
}
