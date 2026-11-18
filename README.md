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
- `@grant` は使った GM API から自動で付きます。

## コマンド

| コマンド | 内容 |
|---|---|
| `pnpm new script <name>` | スクリプトの雛形を作る |
| `pnpm new style <name>` | スタイルの雛形を作る |
| `pnpm dev` | 開発用サーバーを起動して一覧と開発用スクリプトを配信 |
| `pnpm build` | `dist/` にビルドしてメタ情報を検査 |
| `pnpm check` | Biome（lint/format）と型チェック |
| `pnpm format` | Biome で自動整形 |

## 開発の流れ

1. `pnpm new script foo` で雛形を作り、`meta.ts` の `match` などを書く。
2. `pnpm dev` を起動し、`http://localhost:5173/dev/foo.user.js`（開発用スクリプト）を拡張機能にインストールする（初回だけ）。
3. 保存してビルドが終わったら（1〜2 秒）、ページを再読み込みすれば反映される。
4. できたら `version` を上げて main に push する。GitHub Actions が Pages に公開する。
   Pages は最大 10 分ほどキャッシュされるため、push 直後は古い版が返ることがある。
5. 本番の URL（`https://araitk.github.io/userscripts/scripts/foo.user.js`）でインストールする。

### 開発用スクリプト

- 名前が `dev:foo` のスクリプトで、本体は含まない。ページを開くたびに、watch ビルドした
  `http://localhost:5173/scripts/foo.user.js` を `GM_xmlhttpRequest` で取ってきて、拡張機能の中で実行する。
- `meta.ts` の `match` や `grant` を変えたときは、入れ直す。
- 本番と名前が違うので両方入れられるが、二重に動かないよう片方だけ有効にする。開発しないときは無効にする
  （サーバーが止まっていると、ページを開くたびにエラーになる）。
- 次の場合は、ビルドした `http://localhost:5173/scripts/foo.user.js` を直接インストールして確認する。
  - `document-start` でページより先に動く必要がある処理（本体は取ってきてから実行するので、`@run-at` より少し遅れて動く）
  - 拡張機能や環境が `new Function` を禁止している場合（取ってきたコードは `new Function` で実行する）

## 書き方の方針（拡張機能の差を吸収するため）

- GM API は `GM_*` 形式で `$` から import する（例: `import { GM_getValue } from '$'`）。主要な拡張機能はどれも対応している。
- `GM_xmlhttpRequest` を使うなら `meta.ts` の `connect` に通信先を書く。書いていないホストへの通信は、拡張機能によって
  拒否されたり確認が出たりする。書き忘れるとビルドが失敗する。
- ページ側の変数に触るときは `@grant unsafeWindow` を明示する（暗黙には使えない拡張機能がある）。
- UserCSS の `@var` は、設定画面がない環境では既定値が使われる。既定値だけで見た目が完成するようにする。
- スタイルは `@-moz-document`（またはヘッダーの `@match`）で対象サイトを絞る。無いと全サイトに適用されるので、ビルド時にエラーにしている。
- プリプロセッサは使わず、素の CSS で書く（`@preprocessor default`）。
