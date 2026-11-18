/**
 * Repository-wide settings such as where scripts are published.
 * @updateURL / @downloadURL / @namespace are generated from these.
 */
const owner = 'araitk';
const repo = 'userscripts';

export const site = {
  /** Base URL of the published site. Replaced with localhost during `pnpm dev`. */
  get baseUrl(): string {
    return process.env.SITE_BASE_URL ?? `https://${owner}.github.io/${repo}`;
  },
  /** Used for @namespace and @homepageURL. */
  repoUrl: `https://github.com/${owner}/${repo}`,
  author: owner,
  /** Port `pnpm dev` serves on */
  devPort: 5173,
};
