# Prose.astro / slot / タイポグラフィ / Astro.props 学習メモ

## タイポグラフィ（Typography）とは

**文字の見た目・配置・読みやすさに関するデザイン全般**のこと。

### 具体的に扱う要素

```
- フォントの種類（ゴシック体、明朝体、serif、sans-serif）
- 文字サイズ（見出しは大きく、本文は適度に）
- 行間（line-height）
- 文字間（letter-spacing）
- 段落の余白（margin / padding）
- 色・コントラスト
- リストのインデントやマーカー
- 引用ブロックの装飾
- コードブロックの背景色やフォント
```

### `prose` クラスがやっていること

Tailwind の `prose` は、これらを一括で「読みやすい値」に設定してくれる。

```
prose なし（素のHTML）          prose あり
─────────────────────        ─────────────────────
# 見出し                      # 見出し
本文テキスト本文テキスト        本文テキスト本文テキスト
本文テキスト                   本文テキスト

→ 行間が詰まっている           → 適度な行間
→ 見出しと本文の間隔が狭い      → 見出し前後に余白
→ リストにマーカーがない        → リストに●や数字が付く
→ リンクが見分けにくい          → リンクに下線・色
→ コードが本文と同じフォント     → コードに等幅フォント+背景色
```

HTMLを「きれいに読める記事」にするためのスタイル設定がタイポグラフィ。

---

## Prose.astro の説明

```astro
---
// フロントマター（サーバーサイドコード）は空
---

<div class="prose prose-gray max-w-none">
  <slot />
</div>
```

### 役割

**Markdownコンテンツにタイポグラフィのスタイルを適用するラッパーコンポーネント**。

### 各部分の意味

- **`prose`** — Tailwind CSS の `@tailwindcss/typography` プラグインが提供するクラス。これを付けると、中のHTML（`<h1>`, `<p>`, `<ul>`, `<code>`, `<blockquote>` 等）に読みやすいデフォルトスタイルが自動適用される
- **`prose-gray`** — テキストの色味をグレー系に設定
- **`max-w-none`** — `prose` はデフォルトで `max-width: 65ch`（約65文字幅）に制限されるが、それを解除して親要素の幅いっぱいに広げている
- **`<slot />`** — Astro のスロット。このコンポーネントで囲んだ子要素がここに挿入される

### 使われている場所

**`src/pages/blog/[id].astro`（ブログ記事の個別ページ）** の1箇所のみ。

```astro
<!-- 55〜57行目 -->
<Prose>
  <Content />
</Prose>
```

流れ：

```
Markdownファイル（記事）
    ↓ render(post) で変換
<Content />（HTMLになったMarkdown）
    ↓ <slot /> 経由で挿入
<div class="prose prose-gray max-w-none">
  ここに記事のHTMLが入る → タイポグラフィが適用される
</div>
```

Prose.astro は**ブログ記事本文にきれいなスタイルを当てるためだけのラッパー**として、記事詳細ページで使われている。

---

## `<slot />` とは

**親から渡された子要素を挿入する場所を示すプレースホルダー**。

```astro
<!-- Prose.astro（子コンポーネント） -->
<div class="prose prose-gray max-w-none">
  <slot /> ← ここに親から渡された中身が入る
</div>
```

```astro
<!-- 親コンポーネント -->
<Prose>
  <p>この部分が slot に入る</p>
</Prose>
```

```html
<!-- 最終的な出力HTML -->
<div class="prose prose-gray max-w-none">
  <p>この部分が slot に入る</p>
</div>
```

React でいう `{children}` と同じ概念。

```
Astro:   <slot />
React:   {children}
Vue:     <slot />
Svelte:  <slot />
```

---

## `Astro.props` とは

**親コンポーネントから渡された属性（props）を受け取るオブジェクト**。React の `props` と同じ概念。

### 実際のコードで見る

```astro
<!-- 親：blog/[id].astro（渡す側） -->
<BaseLayout title={post.data.title} description={post.data.description}>
  ...
</BaseLayout>
```

```astro
---
interface Props {
  title: string;
  description?: string;
}

const { title, description = "kumamoto blog — 技術メモと学習記録" } =
  Astro.props;
---

<!-- 子：BaseLayout.astro（受け取る側） -->
<title>{title} | kumamoto blog</title>
<meta name="description" content={description} />
```

流れ：

```
親が <BaseLayout title="記事タイトル" description="説明文"> と書く
                    ↓
Astro.props = { title: "記事タイトル", description: "説明文" }
                    ↓
分割代入で const { title, description } = Astro.props; で取り出す
```

### React との比較

```
【Astro】
interface Props { title: string; }
const { title } = Astro.props;

【React】
interface Props { title: string; }
function Component({ title }: Props) { ... }
// または
function Component(props: Props) {
  const { title } = props;
}
```

やっていることは同じで、**書き方が違うだけ**。Astro はフェンス（`---`）内でグローバルな `Astro` オブジェクトから取得する形になっている。
