# RSS フィードの仕組みと実装

## RSS とは

RSS（Really Simple Syndication）は、Web サイトの更新情報を XML 形式で配信する仕組み。
ユーザーは RSS リーダー（Feedly など）にサイトの RSS URL を登録すると、新しい記事が公開されたときに自動で通知を受け取れる。

ブラウザで直接読むものではなく、**機械（RSSリーダーやクローラー）が読み取るためのフォーマット**。

## RSS フィードの XML 構造

ビルド後に生成される `dist/rss.xml` の構造:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>kumamoto blog</title>
    <description>技術メモと学習記録</description>
    <link>https://kumamoto-blog.pages.dev/</link>
    <item>
      <title>記事タイトル</title>
      <link>https://kumamoto-blog.pages.dev/blog/hello-world/</link>
      <guid isPermaLink="true">https://kumamoto-blog.pages.dev/blog/hello-world/</guid>
      <description>記事の説明文</description>
      <pubDate>Thu, 19 Feb 2026 00:00:00 GMT</pubDate>
    </item>
    <!-- 記事ごとに <item> が繰り返される -->
  </channel>
</rss>
```

- `<channel>` — サイト全体の情報（タイトル、説明、URL）
- `<item>` — 各記事の情報（タイトル、リンク、説明、公開日）
- `<guid>` — 記事の一意な識別子。RSS リーダーが「既読かどうか」を判定するのに使う

## Astro での実装（API ルート）

### API ルートとは

通常の `.astro` ファイルは HTML を返すが、`.ts` ファイルを `src/pages/` に置くと **API ルート**になる。
`rss.xml.ts` は HTML ではなく XML を返すエンドポイント。

Astro の API ルートでは、HTTP メソッド名の関数（`GET`, `POST` など）を export する:

```typescript
// src/pages/rss.xml.ts
export async function GET(context: APIContext) {
  // ここで Response を返す
}
```

- Astro がビルド時にこの `GET` 関数を呼び出し、返り値を `dist/rss.xml` として出力する
- `context: APIContext` は Astro が注入するオブジェクトで、`context.site` などサイト情報にアクセスできる

### コードの詳細解説

```typescript
import rss from "@astrojs/rss";
import { getCollection } from "astro:content";
import type { APIContext } from "astro";
```

- `rss` — `@astrojs/rss` パッケージが提供するヘルパー関数。オブジェクトを渡すと RSS 準拠の XML `Response` を生成してくれる
- `getCollection` — Content Layer API からコレクションを取得する関数
- `type APIContext` — `import type` は**型だけ**をインポートする TypeScript 構文。ビルド後の JS には含まれない

```typescript
export async function GET(context: APIContext) {
```

- `export` — Astro がこの関数を外から呼び出せるようにする
- `async` — 内部で `await` を使うため非同期関数にする
- `context.site` — `astro.config.ts` の `site` 設定値が `URL` オブジェクトとして入っている

```typescript
const posts = (await getCollection("blog", ({ data }) => !data.draft)).sort(
  (a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf(),
);
```

この1行で3つのことをしている:

1. **`getCollection("blog", フィルター)`** — blog コレクションから下書き以外の記事を取得
2. **`(await ...)`** — Promise の解決を待ち、括弧で囲んで結果の配列を得る
3. **`.sort((a, b) => ...)`** — 公開日の降順（新しい順）にソート

フィルター `({ data }) => !data.draft` は引数の分割代入。エントリオブジェクト `{ id, data }` から `data` だけを取り出し、`draft` が `false`（= 公開記事）なら `true` を返す。

`.valueOf()` は `Date` をミリ秒のタイムスタンプ（`number`）に変換する。TypeScript では `Date - Date` の演算が型エラーになるため、明示的に `number` にしている。

```typescript
return rss({
  title: "kumamoto blog",
  description: "技術メモと学習記録",
  site: context.site!,
  items: posts.map((post) => ({
    title: post.data.title,
    description: post.data.description,
    pubDate: post.data.pubDate,
    link: `/blog/${post.id}`,
  })),
});
```

- `context.site!` — 末尾の `!` は TypeScript の**非 null アサーション演算子**。`context.site` は `URL | undefined` 型だが、`astro.config.ts` に `site` を設定済みなので `undefined` にはならないと開発者が保証している
- `posts.map(...)` — 各記事を RSS の `<item>` 要素に対応するオブジェクトに変換
- `link` — 相対パス `/blog/${post.id}` を指定すると、`@astrojs/rss` が `site` と結合して絶対 URL を生成する

## HTML での RSS リンク

`BaseLayout.astro` の `<head>` 内に以下のタグがある:

```html
<link
  rel="alternate"
  type="application/rss+xml"
  title="kumamoto blog"
  href="/rss.xml"
/>
```

- `rel="alternate"` — このページの別形式（RSS）を示す
- ブラウザや RSS リーダーがこのタグを検出し、ユーザーに RSS 購読を提案する

## sitemap との違い

| 項目     | RSS                                | Sitemap                   |
| -------- | ---------------------------------- | ------------------------- |
| 対象     | RSS リーダーのユーザー             | 検索エンジンのクローラー  |
| 内容     | 記事の一覧（タイトル・説明・日付） | サイト全ページの URL 一覧 |
| 更新頻度 | 記事追加時                         | ページ追加・変更時        |
| 形式     | RSS 2.0 XML                        | Sitemap XML               |
| ファイル | `/rss.xml`                         | `/sitemap-index.xml`      |
