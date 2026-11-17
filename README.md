# userscripts

ユーザースクリプト（`.user.js`）とユーザースタイル（UserCSS 形式の `.user.css`）を管理するリポジトリです。

インストール用の一覧: <https://araitk.github.io/userscripts/>

## 構成

```
scripts/<name>/   index.ts（本体） / meta.ts（メタ情報） / README.md
styles/<name>/    style.css（本体） / meta.json（メタ情報） / README.md
shared/           共通コード（DOM 待機、GM ストレージ、メタ情報の型）
tools/            ビルド・開発・雛形生成のスクリプト
site.config.ts    配布先 URL など
```

- 名前は kebab-case（例: `youtube-hide-shorts`）。`_` で始まるフォルダはビルドされません。
- `@namespace` / `@author` / `@updateURL` / `@downloadURL` / `@homepageURL` はビルド時に自動で入ります。
- `@grant` は使った GM API から自動で付きます。GM API は `import { GM_getValue } from '$'` のように `$` から import してください。

## コマンド

| コマンド | 内容 |
|---|---|
| `pnpm new script <name>` | スクリプトの雛形を作る |
| `pnpm new style <name>` | スタイルの雛形を作る |
| `pnpm dev` | watch ビルド + `http://localhost:5173/` で配信 |
| `pnpm build` | `dist/` にビルドしてメタ情報を検査 |
| `pnpm check` | Biome（lint/format）と型チェック |
| `pnpm format` | Biome で自動整形 |

## 開発の流れ

1. `pnpm new script foo` で雛形を作り、`meta.ts` の `match` などを書く。
2. `pnpm dev` を起動し、`http://localhost:5173/scripts/foo.user.js` を拡張機能にインストールする（初回だけ）。
3. 保存すると自動で再ビルドされる。拡張機能の「更新を確認」をしてからページをリロードして確認する。
4. できたら `version` を上げて main に push する。GitHub Actions が Pages に公開する。
5. 本番の URL（`https://araitk.github.io/userscripts/scripts/foo.user.js`）でインストールし直す。
   以後は `@updateURL` を使って拡張機能が自動で更新する。

> 開発用（localhost）と本番は同じ名前と namespace なので、拡張機能によっては上書きされ、
> されない場合は二重に動きます。本番を入れるときは開発用を削除してください。

## 書き方の方針（拡張機能の差を吸収するため）

- GM API は `GM_*` 形式で `$` から import する。主要な拡張機能はどれも対応している。
- `GM_xmlhttpRequest` を使うなら `meta.ts` の `connect` に通信先を書く。書いていないホストへの通信は、拡張機能によって
  拒否されたり確認が出たりする。書き忘れるとビルドが失敗する。
- ページ側の変数に触るときは `@grant unsafeWindow` を明示する（暗黙には使えない拡張機能がある）。
- UserCSS の `@var` は、設定画面がない環境では既定値が使われる。既定値だけで見た目が完成するようにする。
- スタイルは `@-moz-document` で対象サイトを絞る。無いと全サイトに適用されるので、ビルド時にエラーにしている。
- プリプロセッサは使わず、素の CSS で書く（`@preprocessor default`）。
- GitHub Pages は最大 10 分ほどキャッシュされるため、push 直後は古い版が返ることがある。

## 初回の GitHub 設定

1. リポジトリを public で作成して push する。
2. Settings → Pages → Source を「GitHub Actions」にする。
