# `tags/[tag].astro` TypeScript コード解説

対象ファイル: `src/pages/tags/[tag].astro` のフロントマター（`---` で囲まれた部分）。

---

## 全体像

```
import（モジュール読み込み）
    ↓
getStaticPaths()（ビルド時に全ページのパスを生成）
    ↓
interface Props（型定義）
    ↓
Astro.props（実行時にページごとのデータを受け取る）
```

---

## 1. import 文

```typescript
import { getCollection } from "astro:content";
import BaseLayout from "../../layouts/BaseLayout.astro";
```

- **`getCollection`** — Astro の Content Layer API が提供する関数。`src/content.config.ts` で定義したコレクション（ここでは `"blog"`）から記事データを一括取得する
- **`BaseLayout`** — 共通レイアウトコンポーネント。`../../` はディレクトリ2階層上（`src/pages/tags/` → `src/`）を指す

---

## 2. `getStaticPaths()` 関数

```typescript
export async function getStaticPaths() {
  const posts = await getCollection("blog", ({ data }) => !data.draft);

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
```

### なぜ必要なのか

ファイル名が `[tag].astro` と角括弧で囲まれている = **動的ルート**。
ビルド時に「どんな `tag` の値がありえるか」を Astro に教える必要がある。
それが `getStaticPaths()` の役割。

```
[tag].astro + getStaticPaths() の返り値
    ↓ ビルド時に展開
/tags/astro/index.html
/tags/ブログ/index.html
/tags/チュートリアル/index.html
```

### `export` が必要な理由

Astro がこの関数を外部から呼び出すので `export` が必須。`export` がないとビルドエラーになる。

### `async` が必要な理由

`getCollection()` は非同期関数（Promise を返す）なので、`await` で結果を待つ必要がある。`await` を使うには関数自体を `async` にしなければならない。

### 各部分の解説

#### 記事の取得

```typescript
const posts = await getCollection("blog", ({ data }) => !data.draft);
```

- 第1引数 `"blog"` — コレクション名（`src/content.config.ts` で定義済み）
- 第2引数 `({ data }) => !data.draft` — フィルター関数。`data.draft` が `true`（下書き）の記事を除外する

```
全記事 → フィルター → 公開記事のみ
  [記事A(公開), 記事B(下書き), 記事C(公開)]
      ↓
  [記事A(公開), 記事C(公開)]
```

#### タグの収集

```typescript
const tags = new Set<string>();
for (const post of posts) {
  for (const tag of post.data.tags) {
    tags.add(tag);
  }
}
```

- **`Set<string>`** — 重複を自動排除する集合。同じタグ名を何度 `add` しても1つしか残らない
- 二重ループで全記事の全タグを走査してSetに追加

```
記事A: tags = ["astro", "ブログ"]
記事C: tags = ["astro", "チュートリアル"]
    ↓ Set に追加
Set { "astro", "ブログ", "チュートリアル" }
```

`Set` を使わず配列で書くと重複チェックが必要になるが、`Set` なら勝手に重複が消える。

#### パスとpropsの生成（返り値）

```typescript
return [...tags].map((tag) => ({
  params: { tag },
  props: {
    tag,
    posts: posts
      .filter((post) => post.data.tags.includes(tag))
      .sort((a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf()),
  },
}));
```

**`[...tags]`** — スプレッド構文で `Set` を配列に変換。`Set` には `.map()` メソッドがないので配列にする必要がある。

**`.map()` の返り値の形**:

```typescript
{
  params: { tag },  // URLのパラメータ → /tags/{tag} になる
  props: {          // ページコンポーネントに渡すデータ
    tag,
    posts: [...]
  },
}
```

- **`params`** — Astro が要求する形式。`{ tag: "astro" }` なら `/tags/astro` が生成される。キー名はファイル名の `[tag]` と一致する必要がある
- **`props`** — そのページに渡すデータ。後述の `Astro.props` で受け取る

**`.filter()` と `.sort()` のチェーン**:

```typescript
posts
  .filter((post) => post.data.tags.includes(tag))  // このタグを持つ記事だけ残す
  .sort((a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf())  // 日付降順
```

- `.filter()` — そのタグを含む記事だけに絞り込む
- `.sort()` — `b - a` で**降順**（新しい記事が先）。`.valueOf()` は Date を数値（ミリ秒）に変換してくれるので引き算で比較できる

```
tag = "astro" の場合:

全公開記事: [記事A(astro,ブログ), 記事C(astro,チュートリアル)]
    ↓ filter（"astro" を含むもの）
[記事A, 記事C]
    ↓ sort（日付降順）
[記事C(2/20), 記事A(2/19)]
```

---

## 3. `interface Props`

```typescript
interface Props {
  tag: string;
  posts: Awaited<ReturnType<typeof getCollection<"blog">>>;
}
```

`Astro.props` で受け取るデータの型を定義している。

### `tag: string`

タグ名の文字列。シンプル。

### `posts` の型が複雑な理由

```
Awaited<ReturnType<typeof getCollection<"blog">>>
```

これを内側から読み解く:

```
typeof getCollection<"blog">
→ getCollection("blog") の関数の型を取得

ReturnType<...>
→ その関数の返り値の型を取得
→ Promise<CollectionEntry<"blog">[]> になる

Awaited<...>
→ Promise を剥がして中身の型を取得
→ CollectionEntry<"blog">[] になる
```

つまり最終的には **`CollectionEntry<"blog">[]`**（ブログ記事の配列）と同じ意味。

```
手動で書くなら:
  posts: CollectionEntry<"blog">[]

自動で導出するなら（こちらを採用）:
  posts: Awaited<ReturnType<typeof getCollection<"blog">>>
```

自動導出の利点: スキーマを変更しても型定義を手動で直す必要がない。

### TypeScript ユーティリティ型のまとめ

| ユーティリティ型 | やること | 例 |
|---|---|---|
| `typeof` | 値から型を取得 | `typeof myFunc` → 関数の型 |
| `ReturnType<T>` | 関数型の返り値型を取得 | `ReturnType<typeof fn>` → 返り値の型 |
| `Awaited<T>` | `Promise<X>` から `X` を取り出す | `Awaited<Promise<string>>` → `string` |

---

## 4. `Astro.props` でのデータ受け取り

```typescript
const { tag, posts } = Astro.props;
```

`getStaticPaths()` の返り値で `props` に設定したデータがここに届く。分割代入で取り出している。

```
getStaticPaths() で設定:
  props: { tag: "astro", posts: [...] }
      ↓ Astro が内部で受け渡し
Astro.props = { tag: "astro", posts: [...] }
      ↓ 分割代入
const { tag, posts } = Astro.props;
// tag = "astro"
// posts = [記事C, 記事A]
```

---

## 全体の流れまとめ

```
1. ビルド開始
      ↓
2. Astro が getStaticPaths() を呼ぶ
      ↓
3. getCollection("blog") で全記事取得 → ドラフト除外
      ↓
4. 全タグを Set で収集 → ["astro", "ブログ", "チュートリアル"]
      ↓
5. タグごとに { params, props } を返す
   ┌─ { params: {tag:"astro"},     props: {tag:"astro",     posts:[...]} }
   ├─ { params: {tag:"ブログ"},     props: {tag:"ブログ",     posts:[...]} }
   └─ { params: {tag:"チュートリアル"}, props: {tag:"チュートリアル", posts:[...]} }
      ↓
6. Astro がタグごとに HTML を生成
   ┌─ /tags/astro/index.html         ← Astro.props = {tag:"astro", posts:[...]}
   ├─ /tags/ブログ/index.html         ← Astro.props = {tag:"ブログ", posts:[...]}
   └─ /tags/チュートリアル/index.html   ← Astro.props = {tag:"チュートリアル", posts:[...]}
      ↓
7. テンプレート部分で tag と posts を使って HTML を描画
```
