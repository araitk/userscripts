/**
 * 配布先などリポジトリ全体の設定。
 * @updateURL / @downloadURL / @namespace はここから自動生成される。
 */
const owner = 'araitk';
const repo = 'userscripts';

export const site = {
  /** 公開先のベース URL。`pnpm dev` 中は localhost に差し替わる。 */
  get baseUrl(): string {
    return process.env.SITE_BASE_URL ?? `https://${owner}.github.io/${repo}`;
  },
  /** @namespace と @homepageURL に使う。 */
  repoUrl: `https://github.com/${owner}/${repo}`,
  author: owner,
  /** `pnpm dev` の配信ポート */
  devPort: 5173,
};
