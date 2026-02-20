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

## まとめ

Content Layer API により、より柔軟なコンテンツ管理が可能になりました。
