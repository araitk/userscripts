import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import type { StyleMeta, StyleVar } from '../shared/meta.ts';
import { site } from '../site.config.ts';
import { distDir, formatHeader, listEntries, loadStyleMeta, root, styleFile } from './lib.ts';

/** A style as read from styles/<name>/ (meta, css) and the .user.css it was built into (output). */
export type BuiltStyle = { name: string; meta: StyleMeta; css: string; output: string };

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

/** :root rule with the @var defaults, which is what applies where there is no settings UI. */
export function varsRule(vars: StyleVar[]): string {
  if (!vars.length) return '';
  const value = (v: StyleVar) =>
    v.type === 'checkbox' ? (v.default ? '1' : '0') : String(v.default);
  return `:root {\n${vars.map((v) => `  --${v.name}: ${value(v)};`).join('\n')}\n}\n`;
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
  const lines = [formatHeader(rows.filter(([, v]) => v)), ...(meta.vars ?? []).map(formatVar)];
  return `/* ==UserStyle==\n${lines.join('\n')}\n==/UserStyle== */\n\n${css.trim()}\n`;
}

/** Builds styles/<name>/ into dist/styles/<name>.user.css. */
export function buildStyle(name: string): BuiltStyle {
  mkdirSync(join(distDir, 'styles'), { recursive: true });
  const meta = loadStyleMeta(name);
  const css = readFileSync(join(root, 'styles', name, 'style.css'), 'utf8');
  const output = renderUserCss(name, meta, css);
  writeFileSync(join(distDir, styleFile(name)), output);
  console.log(`  style   ${name}.user.css  v${meta.version}`);
  return { name, meta, css, output };
}

export function buildStyles(names = listEntries('styles')): BuiltStyle[] {
  return names.map(buildStyle);
}
