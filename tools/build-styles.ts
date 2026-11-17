import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import type { StyleMeta, StyleVar } from '../shared/meta.ts';
import { site } from '../site.config.ts';
import { distDir, listEntries, loadStyleMeta, root, styleFile } from './lib.ts';

function formatVar(v: StyleVar): string {
  const label = JSON.stringify(v.label);
  switch (v.type) {
    case 'color':
      return `@var color ${v.name} ${label} ${v.default}`;
    case 'text':
      return `@var text ${v.name} ${label} ${JSON.stringify(v.default)}`;
    case 'number':
      return `@var number ${v.name} ${label} ${v.default}`;
    case 'checkbox':
      return `@var checkbox ${v.name} ${label} ${v.default ? 1 : 0}`;
  }
}

export function renderUserCss(name: string, meta: StyleMeta, css: string): string {
  const url = `${site.baseUrl}/${styleFile(name)}`;
  const rows: [string, string][] = [
    ['name', meta.name],
    ['namespace', site.repoUrl],
    ['version', meta.version],
    ['description', meta.description],
    ['author', site.author],
    ['homepageURL', `${site.repoUrl}/tree/main/styles/${name}`],
    ['updateURL', url],
    ['license', meta.license ?? ''],
    ['preprocessor', 'default'],
  ];
  const width = Math.max(...rows.map(([k]) => k.length)) + 2;
  const lines = rows.filter(([, v]) => v).map(([k, v]) => `@${k.padEnd(width)}${v}`);
  for (const v of meta.vars ?? []) lines.push(formatVar(v));
  return `/* ==UserStyle==\n${lines.join('\n')}\n==/UserStyle== */\n\n${css.trim()}\n`;
}

/** styles/<name>/ を dist/styles/<name>.user.css にする。 */
export function buildStyles(names = listEntries('styles')) {
  mkdirSync(join(distDir, 'styles'), { recursive: true });
  for (const name of names) {
    const meta = loadStyleMeta(name);
    const css = readFileSync(join(root, 'styles', name, 'style.css'), 'utf8');
    writeFileSync(join(distDir, styleFile(name)), renderUserCss(name, meta, css));
    console.log(`  style   ${name}.user.css  v${meta.version}`);
  }
  return names;
}
