import { mkdirSync, rmSync } from 'node:fs';
import { buildScripts } from './build-scripts.ts';
import { buildStyles } from './build-styles.ts';
import { checkMeta } from './check-meta.ts';
import { genIndex } from './gen-index.ts';
import { distDir } from './lib.ts';

/** dist/ を作り直して、スクリプト・スタイル・一覧をすべてビルドする。 */
export async function buildAll() {
  rmSync(distDir, { recursive: true, force: true });
  mkdirSync(distDir, { recursive: true });
  await buildScripts();
  buildStyles();
  await genIndex();
}

if (import.meta.main) {
  await buildAll();
  const errors = checkMeta();
  for (const e of errors) console.error(`✗ ${e}`);
  if (errors.length) process.exit(1);
  console.log('✓ build OK');
}
