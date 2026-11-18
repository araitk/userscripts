import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import type { ScriptMeta, StyleMeta } from '../shared/meta.ts';

export const root = resolve(import.meta.dirname, '..');
export const distDir = join(root, 'dist');
export const NAME_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
export const SEMVER_RE = /^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/;

export type Kind = 'scripts' | 'styles';

/** Returns the folder names (kebab-case) directly under scripts/ or styles/. */
export function listEntries(kind: Kind): string[] {
  const dir = join(root, kind);
  if (!existsSync(dir)) return [];
  return readdirSync(dir, { withFileTypes: true })
    .filter((d) => d.isDirectory() && !d.name.startsWith('.') && !d.name.startsWith('_'))
    .map((d) => d.name)
    .sort();
}

export async function loadScriptMeta(name: string): Promise<ScriptMeta> {
  const file = join(root, 'scripts', name, 'meta.ts');
  // Bypass the module cache so changes are picked up while watching
  const mod = await import(`${pathToFileURL(file).href}?t=${Date.now()}`);
  return mod.default as ScriptMeta;
}

export function loadStyleMeta(name: string): StyleMeta {
  const file = join(root, 'styles', name, 'meta.json');
  return JSON.parse(readFileSync(file, 'utf8')) as StyleMeta;
}

export const scriptFile = (name: string) => `scripts/${name}.user.js`;
export const styleFile = (name: string) => `styles/${name}.user.css`;

/** Parses a `// ==UserScript==` or `/* ==UserStyle==` block into [key, value][]. */
export function parseHeader(source: string): [string, string][] {
  const block = source.match(/==User(?:Script|Style)==([\s\S]*?)==\/User(?:Script|Style)==/);
  if (!block?.[1]) return [];
  const out: [string, string][] = [];
  for (const line of block[1].split('\n')) {
    const m = line.match(/^\s*(?:\/\/)?\s*@([\w:-]+)\s*(.*?)\s*$/);
    if (m?.[1]) out.push([m[1], m[2] ?? '']);
  }
  return out;
}
