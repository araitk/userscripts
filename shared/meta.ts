import type { MonkeyUserScript } from 'vite-plugin-monkey';

/**
 * Metadata written in scripts/<name>/meta.ts.
 * namespace / author / updateURL / downloadURL / homepageURL are filled in at build time.
 * @grant is added automatically from the GM APIs used (write it only to be explicit).
 */
export type ScriptMeta = Omit<
  MonkeyUserScript,
  'namespace' | 'updateURL' | 'downloadURL' | 'homepageURL' | 'name' | 'version' | 'description'
> & {
  name: string;
  /** semver (e.g. 1.0.0) */
  version: string;
  description: string;
  /**
   * Hosts contacted with GM_xmlhttpRequest. Requests to hosts not listed here may be
   * blocked or prompt for confirmation, depending on the extension.
   */
  connect?: string | string[];
};

export const defineScriptMeta = (meta: ScriptMeta): ScriptMeta => meta;

/**
 * UserCSS @var. Environments without a settings UI use the defaults, so the defaults alone must give a finished look.
 */
export type StyleVar =
  | { type: 'color'; name: string; label: string; default: string }
  | { type: 'text'; name: string; label: string; default: string }
  | { type: 'number'; name: string; label: string; default: number }
  | { type: 'checkbox'; name: string; label: string; default: boolean };

/** Shape of styles/<name>/meta.json. */
export type StyleMeta = {
  name: string;
  version: string;
  description: string;
  license?: string;
  vars?: StyleVar[];
};
