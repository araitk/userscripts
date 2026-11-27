import { defineScriptMeta } from '../../shared/meta.ts';
import { MARKETS } from './markets.ts';

export default defineScriptMeta({
  name: 'Amazon',
  version: '0.2.0',
  description:
    '商品ページなどで Keepa の価格推移グラフを表示し、短縮URLのコピーや、販売元を Amazon に絞り込むリンクを追加する。',
  match: Object.keys(MARKETS).map((tld) => `https://www.amazon.${tld}/*`),
  'run-at': 'document-end',
  noframes: true,
});
