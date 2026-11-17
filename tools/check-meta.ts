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

/**
 * ビルド後の dist/ を見て、拡張機能によっては動かない・配布できないメタ情報を検出する。
 * 問題が 1 つでもあればエラーの一覧を返す。
 */
export function checkMeta(): string[] {
  const errors: string[] = [];
  const err = (kind: Kind, name: string, msg: string) => errors.push(`${kind}/${name}: ${msg}`);

  for (const kind of ['scripts', 'styles'] as const) {
    for (const name of listEntries(kind)) {
      if (!NAME_RE.test(name)) err(kind, name, 'フォルダ名は kebab-case にしてください');
      const file = join(distDir, kind === 'scripts' ? scriptFile(name) : styleFile(name));
      if (!existsSync(file)) {
        err(kind, name, `ビルド結果がありません (${file})`);
        continue;
      }
      const source = readFileSync(file, 'utf8');
      const header = parseHeader(source);
      const all = (key: string) => header.filter(([k]) => k === key).map(([, v]) => v);
      const one = (key: string) => all(key)[0];

      if (!one('name')) err(kind, name, '@name がありません');
      const version = one('version');
      if (!version || !SEMVER_RE.test(version))
        err(kind, name, `@version が semver ではありません: ${version}`);
      const expected = `${site.baseUrl}/${kind === 'scripts' ? scriptFile(name) : styleFile(name)}`;
      if (one('updateURL') !== expected)
        err(kind, name, `@updateURL が ${expected} ではありません`);

      if (kind === 'scripts') {
        if (all('match').length === 0 && all('include').length === 0) {
          err(kind, name, '@match か @include が必要です');
        }
        const grants = all('grant');
        const usesXhr = grants.some((g) => /^GM[_.]xml[hH]ttpRequest$/.test(g));
        if (usesXhr && all('connect').length === 0) {
          err(
            kind,
            name,
            'GM_xmlhttpRequest を使っていますが @connect がありません（拡張機能によっては通信が拒否されます）',
          );
        }
      } else {
        const scoped = /@-moz-document\s/.test(source) || all('match').length > 0;
        if (!scoped) err(kind, name, '@-moz-document がなく、全サイトに適用されます');
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
