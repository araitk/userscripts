import { defineScriptMeta } from '../../shared/meta.ts';
import { MARKETS } from './markets.ts';

export default defineScriptMeta({
  name: 'Amazon',
  version: '0.1.0',
  description:
    '商品ページに Keepa のグラフと短縮 URL を、商品ページと検索ページに販売元を Amazon に限定するリンクを追加する。',
  match: Object.keys(MARKETS).map((tld) => `https://www.amazon.${tld}/*`),
  'run-at': 'document-end',
  noframes: true,
});
