import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { site } from '../site.config.ts';
import {
  distDir,
  type Kind,
  listEntries,
  NAME_RE,
  parseHeader,
  SEMVER_RE,
  scriptFile,
  styleFile,
} from './lib.ts';
import { parseSections } from './usercss.ts';

/**
 * Inspects the built dist/ for metadata that some extensions can't run or distribute.
 * Returns the list of errors, if any.
 */
export function checkMeta(): string[] {
  const errors: string[] = [];
  const err = (kind: Kind, name: string, msg: string) => errors.push(`${kind}/${name}: ${msg}`);

  for (const kind of ['scripts', 'styles'] as const) {
    for (const name of listEntries(kind)) {
      if (!NAME_RE.test(name)) err(kind, name, 'folder name must be kebab-case');
      const file = join(distDir, kind === 'scripts' ? scriptFile(name) : styleFile(name));
      if (!existsSync(file)) {
        err(kind, name, `build output not found (${file})`);
        continue;
      }
      const source = readFileSync(file, 'utf8');
      const header = parseHeader(source);
      const all = (key: string) => header.filter(([k]) => k === key).map(([, v]) => v);
      const one = (key: string) => all(key)[0];

      if (!one('name')) err(kind, name, '@name is missing');
      const version = one('version');
      if (!version || !SEMVER_RE.test(version))
        err(kind, name, `@version is not semver: ${version}`);
      const expected = `${site.baseUrl}/${kind === 'scripts' ? scriptFile(name) : styleFile(name)}`;
      if (one('updateURL') !== expected) err(kind, name, `@updateURL is not ${expected}`);

      if (kind === 'scripts') {
        if (all('match').length === 0 && all('include').length === 0) {
          err(kind, name, '@match or @include is required');
        }
        const grants = all('grant');
        const usesXhr = grants.some((g) => /^GM[_.]xml[hH]ttpRequest$/.test(g));
        if (usesXhr && all('connect').length === 0) {
          err(
            kind,
            name,
            'uses GM_xmlhttpRequest without @connect (some extensions will block the requests)',
          );
        }
      } else {
        const sections = parseSections(source);
        if (!sections.some((s) => s.conditions)) {
          err(kind, name, 'no @-moz-document, so it applies to every site');
        } else if (sections.some((s) => !s.conditions)) {
          err(kind, name, 'has rules outside @-moz-document, so they apply to every site');
        }
      }
    }
  }
  return errors;
}

if (import.meta.main) {
  const errors = checkMeta();
  for (const e of errors) console.error(`✗ ${e}`);
  if (errors.length) process.exit(1);
  console.log('✓ meta OK');
}
