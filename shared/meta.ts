import type { MonkeyUserScript } from 'vite-plugin-monkey';

/**
 * scripts/<name>/meta.ts で書くメタ情報。
 * namespace / author / updateURL / downloadURL / homepageURL はビルド時に自動で入る。
 * @grant は使った GM API から自動で付く（明示したい場合だけ書く）。
 */
export type ScriptMeta = Omit<
  MonkeyUserScript,
  'namespace' | 'updateURL' | 'downloadURL' | 'homepageURL' | 'name' | 'version' | 'description'
> & {
  name: string;
  /** semver（例: 1.0.0） */
  version: string;
  description: string;
  /**
   * GM_xmlhttpRequest で通信するホスト。ここに無いホストへの通信は、拡張機能によって
   * 拒否されたり確認が出たりする。
   */
  connect?: string | string[];
};

export const defineScriptMeta = (meta: ScriptMeta): ScriptMeta => meta;

/**
 * UserCSS の @var。設定画面がない環境では既定値が使われるので、既定値だけで見た目が完成するようにしておく。
 */
export type StyleVar =
  | { type: 'color'; name: string; label: string; default: string }
  | { type: 'text'; name: string; label: string; default: string }
  | { type: 'number'; name: string; label: string; default: number }
  | { type: 'checkbox'; name: string; label: string; default: boolean };

/** styles/<name>/meta.json の形。 */
export type StyleMeta = {
  name: string;
  version: string;
  description: string;
  license?: string;
  vars?: StyleVar[];
};
