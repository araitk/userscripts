import { defineScriptMeta } from '../../shared/meta.ts';

export default defineScriptMeta({
  name: 'えきねっと',
  version: '0.1.0',
  description: '列車検索の乗車駅・降車駅・日時・人数を、前回検索した値で自動入力する。',
  match: [
    'https://www.eki-net.com/Personal/Top/Index*',
    'https://www.eki-net.com/Personal/reserve/wb/RouteSearchConditionInput/Index*',
  ],
  'run-at': 'document-end',
  noframes: true,
});
