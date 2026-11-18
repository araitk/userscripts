import { readFileSync, writeFileSync } from 'node:fs';
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

// ---- 小さな HTML テンプレート ----------------------------------------------
// html`...` の ${} に入れた値は自動でエスケープされる。
// html`...` の結果や配列はそのまま埋め込めるので、部品を組み合わせて書ける。

class Html {
  readonly value: string;
  constructor(value: string) {
    this.value = value;
  }
}

const escapeHtml = (s: string) => s.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);

function render(value: unknown): string {
  if (value instanceof Html) return value.value;
  if (Array.isArray(value)) return value.map(render).join('\n');
  if (value == null || value === false) return '';
  return escapeHtml(String(value));
}

function html(strings: TemplateStringsArray, ...values: unknown[]): Html {
  return new Html(strings.reduce((out, s, i) => out + render(values[i - 1]) + s));
}

/** 信頼できる文字列（自前の CSS/JS）をエスケープせずに埋め込む。 */
const raw = (s: string) => new Html(s);

const asset = (file: string) =>
  raw(readFileSync(join(import.meta.dirname, 'index-page', file), 'utf8'));

// ---- ページの部品 ----------------------------------------------------------

type Entry = { title: string; version: string; description: string; url: string };

const card = (e: Entry) => html`<li>
  <a href="${e.url}">${e.title}</a> <small>v${e.version}</small>
  <p>${e.description}</p>
  <button type="button" data-copy="${e.url}">URL をコピー</button>
</li>`;

const section = (heading: string, entries: Entry[]) =>
  entries.length > 0 &&
  html`<h2>${heading}</h2>
<ul>
${entries.map(card)}
</ul>`;

const page = (scripts: Entry[], styles: Entry[]) => html`<!doctype html>
<html lang="ja">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Userscripts</title>
<style>
${asset('style.css')}
</style>
</head>
<body>
<main>
<h1>Userscripts</h1>
<p>リンクを開くとインストールできます。 · <a href="${site.repoUrl}">ソース</a></p>
${section('ユーザースクリプト', scripts)}
${section('ユーザースタイル', styles)}
</main>
<script>
${asset('copy.js')}
</script>
</body>
</html>
`;

// ---- データ集め → 書き出し --------------------------------------------------

/** dist/index.html にインストール用 URL の一覧を書く。 */
export async function genIndex() {
  const scripts: Entry[] = [];
  for (const name of listEntries('scripts')) {
    const meta = await loadScriptMeta(name);
    scripts.push({ ...meta, title: meta.name, url: `${site.baseUrl}/${scriptFile(name)}` });
  }

  const styles: Entry[] = listEntries('styles').map((name) => {
    const meta = loadStyleMeta(name);
    return { ...meta, title: meta.name, url: `${site.baseUrl}/${styleFile(name)}` };
  });

  writeFileSync(join(distDir, 'index.html'), page(scripts, styles).value);
}
