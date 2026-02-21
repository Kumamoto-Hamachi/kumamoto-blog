# Astro Content Collections と Zod スキーマ学習メモ

## 1. `getCollection("blog")` の `"blog"` とは

Astro の **Content Collections（コンテンツコレクション）** のコレクション名。

### 全体の流れ

```
src/content.config.ts          src/data/blog/
┌──────────────────┐          ┌──────────────────────────┐
│ collections =    │  読み込み │ hello-world.md           │
│   { blog: ... }  │ ◄──────── │ astro-content-collections│
│                  │          │ (今後増える記事...)       │
└───────┬──────────┘          └──────────────────────────┘
        │
        │ "blog" というキー名で参照
        ▼
src/pages/blog/[id].astro
┌──────────────────────────────┐
│ getCollection("blog")        │
│ → 全記事を取得               │
│ → 各記事のURLを生成          │
│   /blog/hello-world          │
│   /blog/astro-content-collections │
└──────────────────────────────┘
```

### コレクションの定義（`src/content.config.ts`）

```ts
const blog = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/data/blog" }),
  schema: z.object({ ... }),
});

export const collections = { blog };  // ← ここの "blog" がキー名
```

- `defineCollection()` でコレクションを定義
- `loader` で `./src/data/blog/` 配下の `**/*.md` を読み込む
- `schema` で各記事のフロントマターのバリデーションルールを定義
- `export const collections = { blog }` で **`"blog"` というキー名** で登録

### ページでの利用（`src/pages/blog/[id].astro`）

```ts
const posts = await getCollection("blog");
//                                ^^^^^^^ content.config.ts で登録したキー名
```

`getCollection("blog")` = 「blog コレクションの全エントリ（記事）を取得する」

### 型の定義場所

自分で書くのは `content.config.ts` の Zod スキーマだけ。TypeScript の型は Astro が自動生成する。

| 場所                                  | 役割                      | 自分で書く？             |
| ------------------------------------- | ------------------------- | ------------------------ |
| `src/content.config.ts`               | Zodスキーマ定義（型の元） | **自分で書く**           |
| `.astro/content.d.ts`                 | TypeScript型定義          | **自動生成**（触らない） |
| `.astro/collections/blog.schema.json` | JSONスキーマ              | **自動生成**（触らない） |

自動生成された `.astro/content.d.ts` の中では、Zodスキーマから `InferEntrySchema<"blog">` で型が推論される。
コードで `CollectionEntry<"blog">` と書くだけで、自動生成された型が適用される。

---

## 2. `src/content.config.ts` の Zod スキーマ定義解説

### import 部分

```ts
import { defineCollection, z } from "astro:content";
import { glob } from "astro/loaders";
```

- `defineCollection` — コレクションを定義するAstroの関数
- `z` — Zod バリデーションライブラリ（Astroが再エクスポート）
- `glob` — ファイルシステムからMarkdownを読み込むローダー

### loader

```ts
loader: glob({ pattern: "**/*.md", base: "./src/data/blog" }),
```

`./src/data/blog/` 以下の全 `.md` ファイルをコレクションのデータとして読み込む。

### 各フィールドの解説

#### `title: z.string()`

- **必須** の `string` 型
- frontmatter に `title` がないとビルドエラー

#### `description: z.string()`

- **必須** の `string` 型
- `title` と同様、省略不可

#### `pubDate: z.coerce.date()`

- **必須** の `Date` 型
- `coerce`（強制変換）がポイント
  - `z.date()` だと `Date` オブジェクトしか受け付けない
  - `z.coerce.date()` だと文字列を `Date` に自動変換してくれる
  - frontmatter で `pubDate: 2025-01-15` と書くと YAML パーサーは文字列として渡すが、`coerce` のおかげで `new Date("2025-01-15")` 相当の変換が行われる

#### `updatedDate: z.coerce.date().optional()`

- `coerce.date()` は `pubDate` と同じ
- `.optional()` で **省略可能**
- TypeScript型は `Date | undefined`

#### `tags: z.array(z.string()).default([])`

- `z.array(z.string())` — 文字列の配列（例: `["astro", "blog"]`）
- `.default([])` — frontmatter に `tags` がなければ空配列 `[]` を自動セット
- `.optional()` との違い:
  - `.optional()` → 値がなければ `undefined`
  - `.default([])` → 値がなければ `[]`（常に配列が保証される）
- `post.data.tags.length` と安全にアクセスできるのは `.default([])` のおかげ

#### `draft: z.boolean().default(false)`

- `boolean` 型
- `.default(false)` — 省略時は `false`（公開状態）
- `draft: true` にした記事をフィルタで除外する用途を想定

### まとめ表

| フィールド    | Zod定義                           | 必須？                 | TS型                | frontmatterでの例         |
| ------------- | --------------------------------- | ---------------------- | ------------------- | ------------------------- |
| `title`       | `z.string()`                      | 必須                   | `string`            | `title: "初めての記事"`   |
| `description` | `z.string()`                      | 必須                   | `string`            | `description: "紹介文"`   |
| `pubDate`     | `z.coerce.date()`                 | 必須                   | `Date`              | `pubDate: 2025-01-15`     |
| `updatedDate` | `z.coerce.date().optional()`      | 任意                   | `Date \| undefined` | `updatedDate: 2025-02-01` |
| `tags`        | `z.array(z.string()).default([])` | 任意(default: `[]`)    | `string[]`          | `tags: ["astro", "blog"]` |
| `draft`       | `z.boolean().default(false)`      | 任意(default: `false`) | `boolean`           | `draft: true`             |

---

## 3. なぜ Zod を使うのか（TypeScript の型定義だけではダメな理由）

### TypeScript の型は「実行時に消える」

```ts
// TypeScriptの型定義
interface BlogPost {
  title: string;
  pubDate: Date;
}
```

コンパイル後の JavaScript では型情報が **完全に消える**。
実行時に「このデータは本当に title が string か？」をチェックする手段がない。

### Markdown の frontmatter は「外部データ」

frontmatter はユーザーが手書きするもので、`.ts` ファイルではないため **TypeScript の型チェックが一切効かない**。

```md
---
title: 123            ← 数値を書いてしまった
pubDate: "こんにちは"  ← 日付じゃない
tags: "astro"         ← 配列じゃなく文字列
---
```

TypeScript の型定義だけでは何のエラーも出ず、ビルドが通り実行時にクラッシュする。

### Zod はランタイムバリデーション

Zod はコンパイル後も JavaScript として残り、**実行時にデータを検証** する。

```
TypeScript型:  コンパイル時チェック → 実行時に消える
Zod:          コンパイル時チェック → 実行時にもチェックする
```

Zod がある場合、不正な frontmatter は `astro build` 時に即エラーになる:

```
blog → hello-world.md frontmatter does not match schema.
title: Expected string, received number
```

### チェック可能範囲の比較

| データの出所               | TypeScript型         | Zod                |
| -------------------------- | -------------------- | ------------------ |
| `.ts` ファイル内のコード   | チェックできる       | チェックできる     |
| `.md` の frontmatter       | **チェックできない** | **チェックできる** |
| API からのレスポンス       | **チェックできない** | **チェックできる** |
| ユーザー入力（フォーム等） | **チェックできない** | **チェックできる** |

TypeScript の型が効くのは `.ts` ファイル内のコードだけ。外から入ってくるデータには無力。

### なぜ「Zod から型を生成」する方向なのか

逆方向（TS型 → バリデーション）は不可能なので、「Zodスキーマ → TS型を推論」という方向になる。

```
❌ interface → バリデーションコード（自動生成できない）
✅ Zodスキーマ → TypeScript型（z.infer<> で自動推論できる）
```

Zod を使わず両方やろうとすると **二重管理** になる:

```ts
// 型定義（コンパイル時用）
interface BlogPost {
  title: string;
  pubDate: Date;
}

// バリデーション（実行時用）← 手動で同じ内容を書く必要がある
function validate(data: unknown): BlogPost {
  if (typeof data.title !== "string") throw new Error("...");
  if (!(data.pubDate instanceof Date)) throw new Error("...");
  // ... フィールドが増えるたびにここも更新が必要
}
```

Zod なら **1箇所で済む**:

```ts
const schema = z.object({
  title: z.string(),
  pubDate: z.coerce.date(),
});
// 型もバリデーションもこの1つから得られる
```

### まとめ

|                                  | TypeScript型             | Zod                         |
| -------------------------------- | ------------------------ | --------------------------- |
| 役割                             | コンパイル時の型チェック | 実行時のデータ検証 + 型推論 |
| `.ts` コードに対して             | 効く                     | 効く                        |
| 外部データ（Markdown等）に対して | **効かない**             | **効く**                    |
| 実行時に残るか                   | 消える                   | 残る                        |

Astro の Content Collections で Zod を使う理由は、**Markdown という「TypeScript の外の世界」から来るデータを安全に扱うため**。
