import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { NAME_RE, root } from './lib.ts';

/** 使い方: pnpm new script <name> / pnpm new style <name> */
const [kindArg, name] = process.argv.slice(2);
const kind = kindArg === 'script' ? 'scripts' : kindArg === 'style' ? 'styles' : undefined;

if (!kind || !name) {
  console.error('使い方: pnpm new script <name> | pnpm new style <name>');
  process.exit(1);
}
if (!NAME_RE.test(name)) {
  console.error(`名前は kebab-case にしてください: ${name}`);
  process.exit(1);
}
const dir = join(root, kind, name);
if (existsSync(dir)) {
  console.error(`すでにあります: ${kind}/${name}`);
  process.exit(1);
}
mkdirSync(dir, { recursive: true });

const title = name
  .split('-')
  .map((w) => w[0]?.toUpperCase() + w.slice(1))
  .join(' ');

const files: Record<string, string> =
  kind === 'scripts'
    ? {
        'meta.ts': `import { defineScriptMeta } from '../../shared/meta.ts';

export default defineScriptMeta({
  name: '${title}',
  version: '0.1.0',
  description: 'TODO',
  match: ['https://example.com/*'],
  // 'run-at': 'document-end',
  // connect: ['api.example.com'], // GM_xmlhttpRequest を使うときは必須
});
`,
        'index.ts': `// GM API は '$' から import すると型が付き、@grant も自動で入る
// import { GM_addStyle } from '$';

console.log('[${name}] loaded');
`,
        'README.md': `# ${title}\n\nTODO: 何をするスクリプトか\n`,
      }
    : {
        'meta.json': `${JSON.stringify(
          { name: title, version: '0.1.0', description: 'TODO', vars: [] },
          null,
          2,
        )}\n`,
        'style.css': `@-moz-document domain("example.com") {
  body {
  }
}
`,
        'README.md': `# ${title}\n\nTODO: 何をするスタイルか\n`,
      };

for (const [file, body] of Object.entries(files)) writeFileSync(join(dir, file), body);
console.log(`作成しました: ${kind}/${name}/ (${Object.keys(files).join(', ')})`);
