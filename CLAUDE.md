# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## プロジェクト概要

Astro v5 + Tailwind CSS v4 + Cloudflare Pages で構築された日本語技術ブログ。パッケージマネージャーは pnpm（v10）、ランタイム管理は mise。

## コマンド

| コマンド            | 用途                                     |
| ------------------- | ---------------------------------------- |
| `pnpm dev`          | 開発サーバー起動 (http://localhost:4321) |
| `pnpm build`        | 本番ビルド (`dist/` に出力)              |
| `pnpm test`         | テスト実行（Vitest、1回実行）            |
| `pnpm test:watch`   | テスト実行（ウォッチモード）             |
| `pnpm lint`         | ESLint 実行                              |
| `pnpm lint:fix`     | ESLint 自動修正                          |
| `pnpm format`       | Prettier フォーマット                    |
| `pnpm format:check` | Prettier フォーマットチェック            |

単一テストファイルの実行: `pnpm vitest run tests/content.test.ts`

## アーキテクチャ

### コンテンツ管理 (Content Layer API)

- 記事は `src/data/blog/` に Markdown ファイルとして配置
- スキーマ定義は `src/content.config.ts`（Astro v5 では `src/content/config.ts` ではない）
- `glob()` ローダーで記事を読み込み、`id`（ファイル名から拡張子除去）で識別（v5 では `slug` は廃止）
- `getCollection()` の返り値は**非決定的**なので、表示時は必ず `.sort()` でソートする
- レンダリングは `render(entry)` を使用（v5 では `entry.render()` ではない）

### 記事フロントマター

```yaml
title: "記事タイトル" # 必須
description: "説明文" # 必須
pubDate: 2026-02-19 # 必須（z.coerce.date()で変換）
updatedDate: 2026-02-20 # オプション
tags: ["astro", "ブログ"] # デフォルト: []
draft: false # デフォルト: false（trueなら非公開）
```

### ページ構成

- `src/pages/index.astro` — 記事一覧（公開日降順）
- `src/pages/blog/[id].astro` — 記事詳細（動的ルート）
- `src/pages/tags/index.astro` — タグ一覧（記事数付き）
- `src/pages/tags/[tag].astro` — タグ別記事一覧（動的ルート）
- `src/pages/about.astro` — About ページ

### レイアウト・コンポーネント

- `src/layouts/BaseLayout.astro` — 全ページ共通レイアウト（OGP、canonical URL、RSS/Sitemap リンク含む）
- `src/components/Header.astro` — ナビゲーション（現在パスのアクティブ表示）
- `src/components/Footer.astro` — フッター（著作権、RSS リンク）
- `src/components/Prose.astro` — Markdown 表示用ラッパー（`@tailwindcss/typography` の `prose` クラス適用）

### スタイリング

Tailwind CSS v4 を使用。v3 との主な違い:

- `@import "tailwindcss"` で読み込み（`@tailwind` ディレクティブは廃止）
- プラグインは CSS の `@plugin` ディレクティブで読み込み（`src/styles/global.css`）
- `@tailwindcss/vite` を Vite プラグインとして使用（`@astrojs/tailwind` は非推奨）
- `tailwind.config.js` と `postcss.config.js` は不要

### テスト

- Vitest を使用、テストファイルは `tests/` ディレクトリ
- `astro/config` の `getViteConfig` で Astro の Vite 設定を継承（`vitest.config.ts`）
- Container API（`experimental_AstroContainer`）でコンポーネントの単体テスト
- スキーマバリデーションテストは `astro/zod` からインポートした Zod を使用

## コーディング規約

- Prettier 設定: ダブルクォート、セミコロンあり、末尾カンマあり、インデント2スペース
- `.astro` ファイルは `prettier-plugin-astro` でフォーマット
- ESLint: `eslint-plugin-astro` + `@typescript-eslint` + `eslint-config-prettier`
- TypeScript strict モード（`astro/tsconfigs/strict` を継承）
