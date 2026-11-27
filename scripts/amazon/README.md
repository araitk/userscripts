# Amazon

Amazon の商品ページ・検索ページ・再び購入ページにリンクなどを追加します。

## 機能

- 商品ページ
  - 右カラムの購入ボックス（`#buybox`）の直後に、リンク（1 行に 1 つ）と Keepa のグラフを並べる
    - **短縮URL**: `/dp/<ASIN>` の URL。クリックでコピー（Ctrl/⌘+クリックなら開く）
    - **販売元をAmazonに限定**: `?m=<販売元ID>` を付けて、Amazon が売る出品を選ぶ
  - Keepa の価格推移グラフ（`graph.keepa.com/pricehistory.png`、API キー不要）を表示する。クリックで Keepa を開く
  - バリエーションの切り替えで ASIN が変わったら、リンクと Keepa を更新する
- 再び購入ページ（`/gp/buyagain`）
  - 商品をクリックして開く詳細（`#ride-side-sheet-content`）の、購入ボタンの前に Keepa のグラフを表示する
  - バリエーションを切り替えて ASIN が変わったら、グラフを更新する
- 検索ページ
  - 左側の絞り込み欄（`#s-refinements`）の先頭に「販売元をAmazonに限定」リンクを置く（`rh=p_6:<販売元ID>`）。他の絞り込みは残し、1 ページ目に戻る

## 文言の言語

リンクの文言はサイトの言語（`<html lang>`）に合わせます。対応しているのは日本語・英語・ドイツ語・フランス語・イタリア語・スペイン語・ポルトガル語・オランダ語で、それ以外の言語では英語になります。文言は [i18n.ts](i18n.ts) にまとめています。

## 対応ドメイン

Keepa のドメイン番号がある国だけに対応しています。値は [markets.ts](markets.ts) にまとめています。

| ドメイン | Keepa | 販売元ID |
|---|---|---|
| com | 1 | ATVPDKIKX0DER |
| co.uk | 2 | A3P5ROKL5A1OLE |
| de | 3 | A3JWKAKR8XB7XF |
| fr | 4 | A1X6FK5RDHNB96 |
| co.jp | 5 | AN1VRQENFRJN5 |
| ca | 6 | A3DWYIK6Y9EEQB |
| it | 8 | A11IL2PNWYJU7H |
| es | 9 | A1AT7YVPFBWXBL |
| in | 10 | なし（Amazon 限定リンクを出さない） |
| com.mx | 11 | AVDBXBAVVSXLQ |
| com.br | 12 | A1ZZFT5FULY4LN |
| com.au | 13 | ANEGB3WVEVKZB |
| nl | 14 | A17D2BRD4YMT0X |

## 注意

- 商品ページで `#buybox`、検索ページで `#s-refinements`、再び購入ページで詳細の購入フォーム（`input[name="asin"]`）が無いときは何も表示しません。
- Keepa のグラフ画像が読み込めなかったときは表示しません。
- Safari ではトラッキング防止のため、ページを更新したときなどにスクリプトから URL のクエリが読めないことがあります。そのため検索ページの今の条件は、並べ替えのフォームから取ります（フォームが無いページでは URL から取る）。
- `keepaBox.html` の iframe 埋め込みは、Keepa の拡張機能がないとログイン情報がなくてローディングのまま止まるので使っていません。
