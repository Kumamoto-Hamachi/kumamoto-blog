# kumamoto blog

Astro v5 + Tailwind CSS v4 + Cloudflare Pages で構築する技術ブログ。

## 技術スタック

| 技術                                              | バージョン | 用途                        |
| ------------------------------------------------- | ---------- | --------------------------- |
| [Astro](https://astro.build/)                     | v5         | 静的サイトジェネレーター    |
| [Tailwind CSS](https://tailwindcss.com/)          | v4         | ユーティリティファーストCSS |
| [Cloudflare Pages](https://pages.cloudflare.com/) | -          | ホスティング・デプロイ      |
| [pnpm](https://pnpm.io/)                          | v10        | パッケージマネージャー      |
| [mise](https://mise.jdx.dev/)                     | -          | ランタイムバージョン管理    |

## プロジェクト構造（完成形）

```
kumamoto-blog/
├── public/
│   ├── favicon.svg
│   └── robots.txt
├── src/
│   ├── components/
│   │   ├── Header.astro
│   │   ├── Footer.astro
│   │   └── Prose.astro
│   ├── data/
│   │   └── blog/           # Markdown記事ファイル
│   ├── layouts/
│   │   └── BaseLayout.astro
│   ├── pages/
│   │   ├── index.astro
│   │   ├── about.astro
│   │   ├── 404.astro
│   │   ├── blog/
│   │   │   └── [id].astro
│   │   ├── tags/
│   │   │   ├── index.astro
│   │   │   └── [tag].astro
│   │   └── rss.xml.ts
│   ├── styles/
│   │   └── global.css
│   └── content.config.ts
├── astro.config.ts
├── tsconfig.json
├── vitest.config.ts
├── mise.toml              # Node.js / pnpm バージョン固定
├── package.json
└── README.md
```

---

## 実装計画

以下の9つのPhaseに分けて段階的に構築する。各Phaseは独立してコミット可能な単位になっている。

---

## Phase 1: プロジェクト初期化とGitセットアップ

### 1-1. Git初期化

```bash
cd ~/Documents/kumamoto-blog
git init
git branch -M main
```

### 1-2. ランタイムバージョン固定 (mise)

`mise.toml` を作成し、Node.js と pnpm のバージョンをリポジトリ単位で固定する。

```toml
# mise.toml
[tools]
node = "24.13.1"
pnpm = "10.30.0"
```

```bash
# ツールをインストール（初回のみ）
mise install
```

> **なぜバージョン固定するか**: Cloudflare Pagesのビルド環境とローカル環境のNode.jsバージョンを揃えるため。
> ビルド結果の差異やランタイムエラーを防止できる。
>
> **`mise.toml`（ドットなし）を使う理由**: Gitで追跡してチームや別環境と共有するため。
> `.mise.toml`（ドット付き）は個人用の設定で、通常 `.gitignore` に含める。

### 1-3. Astroプロジェクト作成

既存の `README.md` があるため、一時ディレクトリに作成してから移動する。

```bash
# 一時ディレクトリにAstroプロジェクトを作成
pnpm create astro@latest ./tmp-astro -- --template minimal --no-install --no-git

# ファイルを移動（既存READMEは上書きしない）
cp -rn ./tmp-astro/* ./tmp-astro/.* . 2>/dev/null || true
# もしくはrsyncを用いる
rsync -a --ignore-existing ./tmp-astro/ .
# 用が済んだら一時ファイルは除去
rm -rf ./tmp-astro
```

> **`--template minimal`**: 最小構成テンプレート。不要なサンプルコードが含まれない。
> **`--no-install`**: 依存関係のインストールをスキップ（後で手動実行）。
> **`--no-git`**: Git初期化をスキップ（すでに初期化済み）。

### 1-4. 依存関係インストール

```bash
pnpm install
```

### 1-5. 動作確認

```bash
pnpm dev
```

ブラウザで `http://localhost:4321` を開き、Astroのデフォルトページが表示されることを確認する。`Ctrl+C` で停止。

### 1-6. .gitignore 確認

Astroテンプレートが `.gitignore` を生成している。以下の内容が含まれていることを確認する。

```
node_modules/
dist/
.astro/
```

### 1-7. GitHubリポジトリ作成・接続

```bash
gh repo create kumamoto-blog --public --source=. --remote=origin
git add -A
git commit -m "feat: Astroプロジェクト初期化 (minimal テンプレート)"
git push -u origin main
```

### 検証ポイント

- [ ] `mise install` でNode.jsとpnpmがインストールされる
- [ ] `node -v` と `pnpm -v` が `mise.toml` の値と一致する
- [ ] `pnpm dev` でローカルサーバーが起動する
- [ ] `http://localhost:4321` にアクセスできる
- [ ] GitHubにリポジトリが作成されている

---

## Phase 2: Tailwind CSS v4 の導入

### 2-1. パッケージインストール

```bash
pnpm add -D tailwindcss @tailwindcss/vite @tailwindcss/typography
```

> **重要**: `@astrojs/tailwind` は **非推奨**。Tailwind v4 では `@tailwindcss/vite` を使用する。
> `tailwind.config.js` や `postcss.config.js` も **不要**。

### 2-2. Astro設定にViteプラグインを追加

`astro.config.ts` を以下のように編集する。

```javascript
// astro.config.ts
import { defineConfig } from "astro/config";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  vite: {
    plugins: [tailwindcss()],
  },
});
```

### 2-3. グローバルCSSファイル作成

```bash
mkdir -p src/styles
```

`src/styles/global.css` を作成する。

```css
/* src/styles/global.css */
@import "tailwindcss";
@plugin "@tailwindcss/typography";
```

> **Tailwind v4 の変更点**:
>
> - `@tailwind base; @tailwind components; @tailwind utilities;` → `@import "tailwindcss"` に一本化
> - プラグインは `tailwind.config.js` ではなく CSS内の `@plugin` ディレクティブで読み込む
> - コンテンツパスの設定は不要（自動検出される）

### 2-4. 動作確認

`src/pages/index.astro` を一時的に編集してTailwindが動作するか確認する。

```astro
---
// src/pages/index.astro
import "../styles/global.css";
---

<html lang="ja">
  <body>
    <h1 class="text-3xl font-bold text-blue-600">kumamoto blog</h1>
    <p class="mt-4 text-gray-600">Tailwind CSS v4 が動作しています！</p>
  </body>
</html>
```

```bash
pnpm dev
```

ブラウザで青い太字の見出しとグレーの本文が表示されることを確認する。

### 検証ポイント

- [ ] Tailwindのユーティリティクラスが適用されている
- [ ] `tailwind.config.js` や `postcss.config.js` が **存在しない** ことを確認
- [ ] ビルドエラーがないことを確認 (`pnpm build`)

> **補足: ESLint / Prettier / VSCode 設定について**
>
> ESLint・Prettier・VSCode の開発環境設定は、コードを書き始める前（Phase 2 の直後）に整備するのが望ましい。
> 後から導入すると既存ファイルに大量のフォーマット差分が発生し、git の差分が読みづらくなる。
> 具体的なセットアップ手順は Phase 9 に記載しているが、実施タイミングはここを推奨する。

---

## Phase 3: レイアウトとコンポーネント構築

### 3-1. BaseLayout.astro — 共通レイアウト

`src/layouts/BaseLayout.astro` を作成する。全ページで共有するHTML構造、メタタグ、OGP設定を含む。

```astro
---
// src/layouts/BaseLayout.astro
import "../styles/global.css";
import Header from "../components/Header.astro";
import Footer from "../components/Footer.astro";

interface Props {
  title: string;
  description?: string;
}

const { title, description = "kumamoto blog — 技術メモと学習記録" } =
  Astro.props;
const canonicalURL = new URL(Astro.url.pathname, Astro.site);
---

<!doctype html>
<html lang="ja">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="description" content={description} />
    <link rel="canonical" href={canonicalURL} />
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
    <link rel="sitemap" href="/sitemap-index.xml" />
    <link
      rel="alternate"
      type="application/rss+xml"
      title="kumamoto blog"
      href="/rss.xml"
    />

    <!-- OGP -->
    <meta property="og:type" content="website" />
    <meta property="og:title" content={title} />
    <meta property="og:description" content={description} />
    <meta property="og:url" content={canonicalURL} />
    <meta property="og:site_name" content="kumamoto blog" />
    <meta name="twitter:card" content="summary" />

    <title>{title} | kumamoto blog</title>
  </head>
  <body class="min-h-screen flex flex-col bg-white text-gray-900">
    <Header />
    <main class="flex-1 mx-auto w-full max-w-3xl px-4 py-8">
      <slot />
    </main>
    <Footer />
  </body>
</html>
```

> **`Astro.site`** を使うには `astro.config.ts` に `site` を設定する必要がある（Phase 7 で設定）。
> それまでは `canonicalURL` が正しく動作しないが、開発には影響しない。

### 3-2. Header.astro — ナビゲーション

`src/components/Header.astro` を作成する。

```astro
---
// src/components/Header.astro
const currentPath = Astro.url.pathname;

const navItems = [
  { href: "/", label: "ホーム" },
  { href: "/about", label: "About" },
  { href: "/tags", label: "タグ" },
];
---

<header class="border-b border-gray-200">
  <nav class="mx-auto max-w-3xl px-4 py-4 flex items-center justify-between">
    <a href="/" class="text-xl font-bold text-gray-900 hover:text-blue-600">
      kumamoto blog
    </a>
    <ul class="flex gap-6">
      {
        navItems.map(({ href, label }) => (
          <li>
            <a
              href={href}
              class:list={[
                "text-sm hover:text-blue-600 transition-colors",
                currentPath === href
                  ? "text-blue-600 font-semibold"
                  : "text-gray-600",
              ]}
            >
              {label}
            </a>
          </li>
        ))
      }
    </ul>
  </nav>
</header>
```

> **`class:list`**: Astroの条件付きクラス適用構文。現在のパスに応じてアクティブなリンクをハイライトする。

### 3-3. Footer.astro — フッター

`src/components/Footer.astro` を作成する。

```astro
---
// src/components/Footer.astro
const currentYear = new Date().getFullYear();
---

<footer class="border-t border-gray-200 mt-auto">
  <div class="mx-auto max-w-3xl px-4 py-6 text-center text-sm text-gray-500">
    <p>&copy; {currentYear} kumamoto blog. All rights reserved.</p>
    <p class="mt-1">
      <a href="/rss.xml" class="hover:text-blue-600 transition-colors"> RSS </a>
    </p>
  </div>
</footer>
```

### 3-4. Prose.astro — Markdown表示用ラッパー

`src/components/Prose.astro` を作成する。`@tailwindcss/typography` の `prose` クラスを適用するラッパーコンポーネント。

```astro
---
// src/components/Prose.astro
---

<div class="prose prose-gray max-w-none">
  <slot />
</div>
```

> **`prose` クラス**: `@tailwindcss/typography` が提供するクラス。Markdown由来のHTMLに適切なタイポグラフィスタイルを適用する。
> **`max-w-none`**: デフォルトの `prose` の最大幅制限を解除して、親要素の幅に従うようにする。

### 3-5. index.astro を更新

Phase 2 で一時的に編集した `src/pages/index.astro` をレイアウトを使うように更新する。

```astro
---
// src/pages/index.astro
import BaseLayout from "../layouts/BaseLayout.astro";
---

<BaseLayout title="ホーム">
  <h1 class="text-3xl font-bold mb-4">kumamoto blog</h1>
  <p class="text-gray-600">技術メモと学習記録</p>
</BaseLayout>
```

### 検証ポイント

- [ ] ヘッダーとフッターが表示される
- [ ] ナビゲーションリンクが正しく動作する
- [ ] 現在のページのリンクがハイライトされる

---

## Phase 4: コンテンツコレクションとブログ記事

### 4-1. コンテンツコレクション設定

`src/content.config.ts` を作成する。

```typescript
// src/content.config.ts
import { defineCollection, z } from "astro:content";
import { glob } from "astro/loaders";

const blog = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/data/blog" }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    pubDate: z.coerce.date(),
    updatedDate: z.coerce.date().optional(),
    tags: z.array(z.string()).default([]),
    draft: z.boolean().default(false),
  }),
});

export const collections = { blog };
```

> **Astro v5 での重要な変更点**:
>
> - 設定ファイルの場所が `src/content/config.ts` → **`src/content.config.ts`** に変更
> - `type: "content"` の代わりに `loader: glob(...)` を使用
> - `slug` フィールドは廃止、代わりに **`id`** を使用
> - 記事データの格納場所は `src/content/blog/` ではなく `src/data/blog/` など任意の場所を指定可能
> - `z.coerce.date()`: フロントマターの日付文字列を自動的に `Date` オブジェクトに変換

### 4-2. サンプル記事を作成

```bash
mkdir -p src/data/blog
```

`src/data/blog/hello-world.md` を作成する。

```markdown
---
title: "はじめての記事"
description: "kumamoto blogの最初の記事です。Astro v5 + Tailwind CSS v4 で技術ブログを構築していきます。"
pubDate: 2026-02-19
tags: ["astro", "ブログ"]
---

## はじめに

kumamoto blogへようこそ！このブログは **Astro v5** と **Tailwind CSS v4** で構築されています。

## 技術スタック

- **Astro v5**: 高速な静的サイトジェネレーター
- **Tailwind CSS v4**: ユーティリティファーストCSS
- **Cloudflare Pages**: エッジでのホスティング

## まとめ

これから技術的な学びをこのブログに記録していきます。
```

`src/data/blog/astro-content-collections.md` を作成する。

````markdown
---
title: "Astro v5 のコンテンツコレクション入門"
description: "Astro v5 で導入された Content Layer API の使い方を解説します。"
pubDate: 2026-02-20
tags: ["astro", "チュートリアル"]
---

## Content Layer API とは

Astro v5 では、コンテンツ管理の仕組みが大きく変わりました。

### 主な変更点

1. **設定ファイルの場所**: `src/content/config.ts` → `src/content.config.ts`
2. **ローダー**: `glob()` ローダーでファイルを検出
3. **ID**: `slug` の代わりに `id` を使用

## glob ローダーの使い方

```typescript
import { glob } from "astro/loaders";

const blog = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/data/blog" }),
  schema: z.object({
    title: z.string(),
    // ...
  }),
});
```
````

## まとめ

Content Layer API により、より柔軟なコンテンツ管理が可能になりました。

````

### 4-3. 記事一覧ページ (トップページ)

`src/pages/index.astro` を更新する。

```astro
---
// src/pages/index.astro
import { getCollection } from "astro:content";
import BaseLayout from "../layouts/BaseLayout.astro";

const posts = (await getCollection("blog"))
  .filter((post) => !post.data.draft)
  .sort((a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf());
---

<BaseLayout title="ホーム">
  <h1 class="text-3xl font-bold mb-8">記事一覧</h1>
  <ul class="space-y-6">
    {
      posts.map((post) => (
        <li>
          <a
            href={`/blog/${post.id}`}
            class="block group"
          >
            <h2 class="text-xl font-semibold group-hover:text-blue-600 transition-colors">
              {post.data.title}
            </h2>
            <p class="text-gray-500 text-sm mt-1">
              <time datetime={post.data.pubDate.toISOString()}>
                {post.data.pubDate.toLocaleDateString("ja-JP")}
              </time>
            </p>
            <p class="text-gray-600 mt-2">{post.data.description}</p>
            {post.data.tags.length > 0 && (
              <div class="flex gap-2 mt-2">
                {post.data.tags.map((tag) => (
                  <span class="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </a>
        </li>
      ))
    }
  </ul>
</BaseLayout>
````

> **コレクションのソート**: Astro v5 では `getCollection()` の返り値の順序が**非決定的**。
> 必ず `.sort()` で明示的にソートすること。

### 4-4. 記事個別ページ (動的ルーティング)

```bash
mkdir -p src/pages/blog
```

`src/pages/blog/[id].astro` を作成する。

```astro
---
// src/pages/blog/[id].astro
import { getCollection, render } from "astro:content";
import type { CollectionEntry } from "astro:content";
import BaseLayout from "../../layouts/BaseLayout.astro";
import Prose from "../../components/Prose.astro";

export async function getStaticPaths() {
  const posts = await getCollection("blog");
  return posts.map((post) => ({
    params: { id: post.id },
    props: { post },
  }));
}

interface Props {
  post: CollectionEntry<"blog">;
}

const { post } = Astro.props;
const { Content } = await render(post);
---

<BaseLayout title={post.data.title} description={post.data.description}>
  <article>
    <header class="mb-8">
      <h1 class="text-3xl font-bold">{post.data.title}</h1>
      <div class="flex items-center gap-4 mt-2 text-sm text-gray-500">
        <time datetime={post.data.pubDate.toISOString()}>
          {post.data.pubDate.toLocaleDateString("ja-JP")}
        </time>
        {
          post.data.updatedDate && (
            <span>
              (更新: {post.data.updatedDate.toLocaleDateString("ja-JP")})
            </span>
          )
        }
      </div>
      {
        post.data.tags.length > 0 && (
          <div class="flex gap-2 mt-3">
            {post.data.tags.map((tag) => (
              <a
                href={`/tags/${tag}`}
                class="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded hover:bg-blue-200 transition-colors"
              >
                {tag}
              </a>
            ))}
          </div>
        )
      }
    </header>
    <Prose>
      <Content />
    </Prose>
  </article>
</BaseLayout>
```

> **`render()` 関数**: Astro v5 では `entry.render()` メソッドではなく、`astro:content` からインポートしたスタンドアロン関数 `render(entry)` を使用する。
> **`[id].astro`**: Astro v5 では `slug` が廃止され `id` に変更。ファイル名から拡張子を除いた部分が `id` になる（例: `hello-world.md` → `id: "hello-world"`）。

### 検証ポイント

- [ ] トップページに記事一覧が公開日の降順で表示される
- [ ] 記事タイトルをクリックすると個別ページに遷移する
- [ ] 個別ページでMarkdownが正しくレンダリングされる（`prose` クラスによるスタイリング）
- [ ] タグがリンクとして表示される
- [ ] `pnpm build` がエラーなく完了する

---

## Phase 5: 追加ページ (About, Tags)

### 5-1. Aboutページ

`src/pages/about.astro` を作成する。

```astro
---
// src/pages/about.astro
import BaseLayout from "../layouts/BaseLayout.astro";
---

<BaseLayout title="About" description="kumamoto blogについて">
  <h1 class="text-3xl font-bold mb-8">About</h1>
  <div class="space-y-4 text-gray-700">
    <p>
      kumamoto
      blogは、プログラミングや技術に関する学習記録を綴る個人ブログです。
    </p>
    <h2 class="text-xl font-semibold mt-6">技術スタック</h2>
    <ul class="list-disc list-inside space-y-1">
      <li>Astro v5 — 静的サイトジェネレーター</li>
      <li>Tailwind CSS v4 — スタイリング</li>
      <li>Cloudflare Pages — ホスティング</li>
    </ul>
    <h2 class="text-xl font-semibold mt-6">お問い合わせ</h2>
    <p>
      GitHubリポジトリの
      <a
        href="https://github.com/kumamoto/kumamoto-blog"
        class="text-blue-600 hover:underline"
      >
        Issues
      </a>
      からお気軽にどうぞ。
    </p>
  </div>
</BaseLayout>
```

### 5-2. タグ一覧ページ

```bash
mkdir -p src/pages/tags
```

`src/pages/tags/index.astro` を作成する。

```astro
---
// src/pages/tags/index.astro
import { getCollection } from "astro:content";
import BaseLayout from "../../layouts/BaseLayout.astro";

const posts = await getCollection("blog", ({ data }) => !data.draft);

// タグごとの記事数を集計
const tagCounts = new Map<string, number>();
for (const post of posts) {
  for (const tag of post.data.tags) {
    tagCounts.set(tag, (tagCounts.get(tag) ?? 0) + 1);
  }
}

// タグ名でソート
const sortedTags = [...tagCounts.entries()].sort((a, b) =>
  a[0].localeCompare(b[0], "ja"),
);
---

<BaseLayout title="タグ一覧" description="記事のタグ一覧">
  <h1 class="text-3xl font-bold mb-8">タグ一覧</h1>
  <div class="flex flex-wrap gap-3">
    {
      sortedTags.map(([tag, count]) => (
        <a
          href={`/tags/${tag}`}
          class="inline-flex items-center gap-1 bg-gray-100 hover:bg-blue-100 text-gray-700 hover:text-blue-700 px-3 py-2 rounded-lg transition-colors"
        >
          <span>{tag}</span>
          <span class="text-xs text-gray-400">({count})</span>
        </a>
      ))
    }
  </div>
</BaseLayout>
```

### 5-3. タグ別記事一覧ページ

`src/pages/tags/[tag].astro` を作成する。

```astro
---
// src/pages/tags/[tag].astro
import { getCollection } from "astro:content";
import BaseLayout from "../../layouts/BaseLayout.astro";

export async function getStaticPaths() {
  const posts = await getCollection("blog", ({ data }) => !data.draft);

  // 全タグを収集
  const tags = new Set<string>();
  for (const post of posts) {
    for (const tag of post.data.tags) {
      tags.add(tag);
    }
  }

  return [...tags].map((tag) => ({
    params: { tag },
    props: {
      tag,
      posts: posts
        .filter((post) => post.data.tags.includes(tag))
        .sort((a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf()),
    },
  }));
}

interface Props {
  tag: string;
  posts: Awaited<ReturnType<typeof getCollection<"blog">>>;
}

const { tag, posts } = Astro.props;
---

<BaseLayout title={`タグ: ${tag}`} description={`「${tag}」タグの記事一覧`}>
  <h1 class="text-3xl font-bold mb-2">
    タグ: <span class="text-blue-600">{tag}</span>
  </h1>
  <p class="text-gray-500 mb-8">{posts.length}件の記事</p>
  <ul class="space-y-6">
    {
      posts.map((post) => (
        <li>
          <a href={`/blog/${post.id}`} class="block group">
            <h2 class="text-xl font-semibold group-hover:text-blue-600 transition-colors">
              {post.data.title}
            </h2>
            <p class="text-gray-500 text-sm mt-1">
              <time datetime={post.data.pubDate.toISOString()}>
                {post.data.pubDate.toLocaleDateString("ja-JP")}
              </time>
            </p>
            <p class="text-gray-600 mt-2">{post.data.description}</p>
          </a>
        </li>
      ))
    }
  </ul>
  <div class="mt-8">
    <a href="/tags" class="text-blue-600 hover:underline">← すべてのタグ</a>
  </div>
</BaseLayout>
```

### 検証ポイント

- [ ] `/about` ページが正しく表示される
- [ ] `/tags` にタグ一覧と記事数が表示される
- [ ] タグをクリックすると該当する記事一覧が表示される
- [ ] ヘッダーのナビゲーションから各ページに遷移できる

---

## Phase 6: テスト環境構築 (TDD)

### 6-1. Vitest 導入

```bash
pnpm add -D vitest
```

### 6-2. vitest.config.ts 作成

`vitest.config.ts` を作成する。

```typescript
// vitest.config.ts
import { getViteConfig } from "astro/config";

export default getViteConfig({
  test: {
    include: ["tests/**/*.test.ts"],
  },
});
```

> **`getViteConfig`**: Astro のVite設定を継承してVitestを動かすためのヘルパー。
> これにより `astro:content` などのAstro固有のインポートがテスト内で解決される。

### 6-3. コンテンツスキーマのバリデーションテスト

```bash
mkdir -p tests
```

`tests/content-schema.test.ts` を作成する。

```typescript
// tests/content-schema.test.ts
import { describe, it, expect } from "vitest";
import { z } from "astro/zod";

// スキーマをテスト用に再定義（content.config.ts と同じ定義）
const blogSchema = z.object({
  title: z.string(),
  description: z.string(),
  pubDate: z.coerce.date(),
  updatedDate: z.coerce.date().optional(),
  tags: z.array(z.string()).default([]),
  draft: z.boolean().default(false),
});

describe("ブログ記事スキーマ", () => {
  it("有効なフロントマターを受け入れる", () => {
    const validData = {
      title: "テスト記事",
      description: "テスト用の説明",
      pubDate: "2026-01-01",
      tags: ["test"],
    };
    const result = blogSchema.safeParse(validData);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.title).toBe("テスト記事");
      expect(result.data.pubDate).toBeInstanceOf(Date);
      expect(result.data.draft).toBe(false); // デフォルト値
    }
  });

  it("タイトルがない場合はエラーになる", () => {
    const invalidData = {
      description: "テスト",
      pubDate: "2026-01-01",
    };
    const result = blogSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
  });

  it("公開日がない場合はエラーになる", () => {
    const invalidData = {
      title: "テスト",
      description: "テスト",
    };
    const result = blogSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
  });

  it("tags のデフォルト値は空配列", () => {
    const data = {
      title: "テスト",
      description: "テスト",
      pubDate: "2026-01-01",
    };
    const result = blogSchema.safeParse(data);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.tags).toEqual([]);
    }
  });
});
```

### 6-4. Container API によるコンポーネントテスト

`tests/components.test.ts` を作成する。

```typescript
// tests/components.test.ts
import { describe, it, expect } from "vitest";
import { experimental_AstroContainer as AstroContainer } from "astro/container";
import Footer from "../src/components/Footer.astro";

describe("Footer コンポーネント", () => {
  it("著作権表示に現在の年が含まれる", async () => {
    const container = await AstroContainer.create();
    const result = await container.renderToString(Footer);
    const currentYear = new Date().getFullYear().toString();
    expect(result).toContain(currentYear);
    expect(result).toContain("kumamoto blog");
  });

  it("RSSリンクが含まれる", async () => {
    const container = await AstroContainer.create();
    const result = await container.renderToString(Footer);
    expect(result).toContain("/rss.xml");
  });
});
```

> **Container API**: Astro コンポーネントを単体テストするための実験的API。
> コンポーネントをDOMなしでレンダリングし、出力HTMLを文字列として検証できる。

### 6-5. テスト実行用スクリプト追加

`package.json` の `scripts` に追加する。

```json
{
  "scripts": {
    "test": "vitest run",
    "test:watch": "vitest"
  }
}
```

### 6-6. テスト実行

```bash
pnpm test
```

### 検証ポイント

- [ ] `pnpm test` で全テストがパスする
- [ ] スキーマバリデーションテストが正しく動作する
- [ ] Container API でコンポーネントのレンダリング結果を検証できる

---

## Phase 7: SEO とフィード機能

### 7-1. サイトURL設定

`astro.config.ts` を更新する。

```javascript
// astro.config.ts
import { defineConfig } from "astro/config";
import tailwindcss from "@tailwindcss/vite";
import sitemap from "@astrojs/sitemap";

export default defineConfig({
  site: "https://kumamoto-blog.pages.dev",
  integrations: [sitemap()],
  vite: {
    plugins: [tailwindcss()],
  },
});
```

> **`site`**: Cloudflare Pages のデフォルトURLを設定。独自ドメインを使う場合は後から変更する。

### 7-2. @astrojs/sitemap と @astrojs/rss インストール

```bash
pnpm add @astrojs/sitemap @astrojs/rss
```

### 7-3. RSSフィード

`src/pages/rss.xml.ts` を作成する。

```typescript
// src/pages/rss.xml.ts
import rss from "@astrojs/rss";
import { getCollection } from "astro:content";
import type { APIContext } from "astro";

export async function GET(context: APIContext) {
  const posts = (await getCollection("blog", ({ data }) => !data.draft)).sort(
    (a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf(),
  );

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
}
```

### 7-4. robots.txt

`public/robots.txt` を作成する。

```
User-agent: *
Allow: /

Sitemap: https://kumamoto-blog.pages.dev/sitemap-index.xml
```

### 7-5. favicon.svg

`public/favicon.svg` を作成する。

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <text y="0.9em" font-size="80">🐻</text>
</svg>
```

### 7-6. 404ページ

`src/pages/404.astro` を作成する。

```astro
---
// src/pages/404.astro
import BaseLayout from "../layouts/BaseLayout.astro";
---

<BaseLayout title="ページが見つかりません">
  <div class="text-center py-20">
    <h1 class="text-6xl font-bold text-gray-300 mb-4">404</h1>
    <p class="text-xl text-gray-600 mb-8">ページが見つかりませんでした</p>
    <a href="/" class="text-blue-600 hover:underline"> ← ホームに戻る </a>
  </div>
</BaseLayout>
```

### 検証ポイント

- [ ] `pnpm build` 後、`dist/sitemap-index.xml` が生成される
- [ ] `/rss.xml` にアクセスしてRSSフィードが正しく出力される
- [ ] ファビコンがブラウザのタブに表示される
- [ ] 存在しないURLにアクセスすると404ページが表示される

---

## Phase 8: Cloudflare Pages デプロイ

### 8-1. Cloudflare ダッシュボードでの設定

1. [Cloudflare Dashboard](https://dash.cloudflare.com/) にログイン
2. **Workers & Pages** → **Create** → **Pages** → **Connect to Git**
3. GitHubリポジトリ `kumamoto-blog` を選択
4. ビルド設定:

| 項目                   | 値               |
| ---------------------- | ---------------- |
| Framework preset       | Astro            |
| Build command          | `pnpm run build` |
| Build output directory | `dist`           |

5. **環境変数** に以下を追加:

| 変数名         | 値        |
| -------------- | --------- |
| `NODE_VERSION` | `24.13.1` |

> `mise.toml` で固定しているバージョンと合わせる。

6. **Save and Deploy** をクリック

### 8-2. デプロイ確認

デプロイが完了すると `https://kumamoto-blog.pages.dev` でサイトにアクセスできる。

> 以後、`main` ブランチへのpushで自動デプロイが実行される。
> プルリクエストにはプレビューURLが自動生成される。

### 8-3. wrangler.jsonc（オプション：ローカルプレビュー用）

ローカルでCloudflare環境をプレビューしたい場合は `wrangler.jsonc` を作成する。

```jsonc
// wrangler.jsonc
{
  "name": "kumamoto-blog",
  "pages_build_output_dir": "./dist",
}
```

```bash
# wrangler のインストールとプレビュー
pnpm add -D wrangler
pnpm build && npx wrangler pages dev dist
```

### 検証ポイント

- [ ] Cloudflare Pagesのダッシュボードでデプロイが成功している
- [ ] `https://kumamoto-blog.pages.dev` にアクセスしてサイトが表示される
- [ ] 記事ページ、タグページ、RSSフィードがすべて動作する

---

## Phase 9: 開発ワークフロー整備

### 9-1. npm スクリプト一覧

`package.json` の `scripts` を確認・整理する。

```json
{
  "scripts": {
    "dev": "astro dev",
    "build": "astro build",
    "preview": "astro preview",
    "astro": "astro",
    "check": "astro check",
    "test": "vitest run",
    "test:watch": "vitest"
  }
}
```

| コマンド          | 用途                                       |
| ----------------- | ------------------------------------------ |
| `pnpm dev`        | 開発サーバー起動 (`http://localhost:4321`) |
| `pnpm build`      | 本番ビルド (`dist/` に出力)                |
| `pnpm preview`    | ビルド結果をローカルでプレビュー           |
| `pnpm check`      | TypeScript型チェック + Astro診断           |
| `pnpm test`       | テスト実行（1回）                          |
| `pnpm test:watch` | テスト実行（ウォッチモード）               |

### 9-2. astro check 導入

```bash
pnpm add -D @astrojs/check typescript
```

```bash
# 型チェック実行
pnpm check
```

> **`astro check`**: `.astro` ファイルの型エラーを検出する。CIに組み込むと有用。

### 9-3. 新規記事作成ワークフロー

新しい記事を追加する手順:

1. `src/data/blog/` にMarkdownファイルを作成する

```markdown
---
title: "記事タイトル"
description: "記事の説明文（SEOに使われる）"
pubDate: 2026-02-19
tags: ["タグ1", "タグ2"]
---

本文をここに書く。
```

2. ローカルで確認する

```bash
pnpm dev
```

3. コミット＆プッシュ（自動デプロイ）

```bash
git add src/data/blog/新しい記事.md
git commit -m "feat: 新しい記事を追加"
git push
```

### 検証ポイント

- [ ] `pnpm check` がエラーなく完了する
- [ ] 各スクリプトが正しく動作する
- [ ] 新規記事を追加してローカルで確認できる

---

## 技術的な注意事項まとめ

### Tailwind CSS v4 (v3 からの変更)

| 項目           | v3                                    | v4                               |
| -------------- | ------------------------------------- | -------------------------------- |
| インポート     | `@tailwind base/components/utilities` | `@import "tailwindcss"`          |
| 設定ファイル   | `tailwind.config.js` (必須)           | 不要 (CSS `@theme` で代替)       |
| コンテンツパス | `content: [...]` の手動設定           | 自動検出                         |
| PostCSS        | `postcss.config.js` 必要              | `@tailwindcss/vite` 使用時は不要 |
| プラグイン     | `plugins: [require('...')]` in JS     | `@plugin "..."` in CSS           |
| Astro連携      | `@astrojs/tailwind`                   | `@tailwindcss/vite`              |

### Astro v5 Content Layer (v4 からの変更)

| 項目             | v4                      | v5                                 |
| ---------------- | ----------------------- | ---------------------------------- |
| 設定ファイル     | `src/content/config.ts` | `src/content.config.ts`            |
| コレクション定義 | `type: "content"`       | `loader: glob(...)`                |
| 記事の識別子     | `slug`                  | `id`                               |
| レンダリング     | `entry.render()`        | `render(entry)` (インポートが必要) |
| データの場所     | `src/content/` 固定     | 任意のディレクトリを指定可能       |
| コレクション順序 | 決定的                  | 非決定的（明示的ソート必須）       |
