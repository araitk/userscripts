import { defineScriptMeta } from '../../shared/meta.ts';

export default defineScriptMeta({
  name: 'Example Badge',
  version: '0.1.0',
  description: 'example.com の右下にバッジを出すサンプル。表示回数を GM_setValue で数える。',
  match: ['https://example.com/*'],
  'run-at': 'document-end',
  noframes: true,
});
