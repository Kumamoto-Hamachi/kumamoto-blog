# Astro / shadcn/ui / レンダリング方式 学習メモ

## shadcn/ui と Astro の相性

### 良い点

- Astro は `@astrojs/react` インテグレーションで React コンポーネントをサポートしているため、shadcn/ui のコンポーネントは動作する
- shadcn/ui は Tailwind CSS ベースなので、Astro の Tailwind サポートとも親和性が高い
- shadcn/ui はコピー&ペースト方式（npmパッケージではなくソースコードを直接プロジェクトに配置）なので、カスタマイズしやすい

### 注意点

1. **クライアントサイドJS が必要** — shadcn/ui は React (Radix UI) ベースなので、インタラクティブなコンポーネントには `client:load` や `client:visible` ディレクティブが必要。Astro の「デフォルトでゼロJS」という思想とやや相反する
2. **Island Architecture との兼ね合い** — React コンポーネントは Astro Island として動作するため、Island 間の状態共有が面倒になる場合がある
3. **ブログ用途なら過剰かも** — ブログのような静的コンテンツが主体のサイトでは、shadcn/ui のインタラクティブなコンポーネント（Dialog, Dropdown, Tabs など）をそこまで多用しないことが多い

### 代替案

| 選択肢 | 特徴 |
|---|---|
| **Astro 純正の HTML/CSS** | JSゼロ、最軽量 |
| **Starlight** | Astro公式のドキュメント/ブログテーマ |
| **daisyUI** | Tailwind CSSプラグイン、JSフレームワーク不要 |
| **shadcn/ui** | 高品質だがReact依存 |

### まとめ

ブログ用途であれば、shadcn/ui を全面的に採用するよりも、必要な箇所（検索モーダル、テーマ切替など）だけ React Island として使うのが現実的。静的な部分は Astro コンポーネント + Tailwind CSS で書くのがパフォーマンス面でもベスト。

---

## React Island（Astro の Island Architecture）

Astro の **Island Architecture（アイランドアーキテクチャ）** の中で、React で書かれたインタラクティブな部分のこと。

### イメージ

```
┌─────────────────────────────────────────────┐
│  Astro ページ（静的HTML、JSゼロ）            │
│                                             │
│  ┌───────────────┐                          │
│  │ React Island  │  ← JSが必要な部分だけ     │
│  │ (検索バー等)   │    Reactで動く           │
│  └───────────────┘                          │
│                                             │
│  静的テキスト、画像など...                    │
│                                             │
│  ┌──────────┐  ┌──────────┐                 │
│  │ React    │  │ 静的な   │                  │
│  │ Island   │  │ HTML     │                  │
│  │ (いいね) │  │          │                  │
│  └──────────┘  └──────────┘                 │
└─────────────────────────────────────────────┘
```

ページ全体は静的HTMLだけど、**インタラクティブな部品（島=Island）だけ**が独立してJSフレームワーク（React等）で動く、という考え方。

### 具体的なコード例

```astro
---
// src/pages/index.astro
import SearchBar from '../components/SearchBar.tsx';
---

<h1>ブログ</h1>
<p>これは静的HTML。JSは送られない。</p>

<!-- ここだけReactで動く "島" -->
<SearchBar client:load />

<p>ここも静的HTML。</p>
```

- `client:load` — ページ読み込み時にこのコンポーネントだけハイドレーション（JSを有効化）する
- このディレクティブがないと、React コンポーネントでもHTMLだけレンダリングされてJSは送られない

### 主な `client:` ディレクティブ

| ディレクティブ | タイミング |
|---|---|
| `client:load` | ページ読み込み直後 |
| `client:visible` | ビューポートに入った時 |
| `client:idle` | ブラウザがアイドル状態になった時 |
| `client:only="react"` | SSRせずクライアントのみ |

### なぜこの仕組みがあるのか

従来のSPA（Next.js等）はページ全体をReactで管理するため、全ページ分のJSをブラウザに送る必要があった。Astro はデフォルトでJSをゼロにして、**本当に必要な部分だけ**JSを送ることで、ページを高速に保っている。

「React Island」= **静的ページの海に浮かぶ、Reactで動くインタラクティブな小島** というイメージ。

---

## Astro の思想と仕組み

### 1. コンテンツファーストという思想

Astro は **「コンテンツ中心のWebサイト」** のために設計されたフレームワーク。ブログ、ドキュメントサイト、ポートフォリオなど、**読むことが主目的のサイト**に最適化されている。

| フレームワーク | 得意な領域 |
|---|---|
| **Astro** | ブログ、ドキュメント、LP等の静的コンテンツ |
| **Next.js / Nuxt** | Webアプリ（ダッシュボード、SNS等） |

### 2. デフォルトでゼロJS とは

従来のReact系フレームワーク（Next.js等）では、ページを表示するだけでもReactのランタイムJS（数十〜数百KB）がブラウザに送られる。

```
【従来のSPA/SSR（Next.js等）】

サーバー → ブラウザに送るもの:
  ├── HTML
  ├── react.js         ← フレームワーク本体
  ├── react-dom.js     ← DOM操作ライブラリ
  ├── page-bundle.js   ← ページのコンポーネント全部
  └── CSS

→ たとえ静的なテキストページでも JS が大量に送られる
```

```
【Astro】

サーバー → ブラウザに送るもの:
  ├── HTML
  └── CSS

→ JS はゼロ。ブラウザはHTMLとCSSだけ受け取る。超速い。
```

Astro は **ビルド時にコンポーネントをHTMLに変換** して、JSを一切ブラウザに送らない。これが「デフォルトでゼロJS」の意味。

### 3. Astro コンポーネントの仕組み

```astro
---
// ここはサーバーサイドで実行される（ビルド時）
// Node.js のコードが書ける
const title = "こんにちは";
const posts = await fetch("https://api.example.com/posts").then(r => r.json());
---

<!-- ここはHTMLテンプレート。ビルド時に純粋なHTMLに変換される -->
<h1>{title}</h1>
<ul>
  {posts.map(post => <li>{post.title}</li>)}
</ul>

<style>
  /* スコープ付きCSS（このコンポーネントだけに適用） */
  h1 { color: blue; }
</style>
```

`---`（フェンス）の中がサーバーサイドコード、外がテンプレート。**ビルド時に全部実行されて、出力は純粋なHTML**になる。

### 4. アイランドアーキテクチャとは

「ページのほとんどは静的HTMLで、インタラクティブな部分だけJSで動かす」というアーキテクチャ。

```
【従来のSPA】
┌─────────────────────────────────┐
│         全部 JavaScript          │
│   React がページ全体を管理する    │
│   ボタンもテキストも全部React     │
└─────────────────────────────────┘
→ JS がページ全体を支配している


【アイランドアーキテクチャ（Astro）】
┌─────────────────────────────────┐
│  静的HTML（海）                  │
│                                 │
│  ┌─────────┐    ただのテキスト   │
│  │JS Island│                    │
│  │(検索バー)│    ただの画像      │
│  └─────────┘                    │
│              ┌────────┐         │
│  ただの      │JS Island│        │
│  テキスト    │(いいねﾎﾞﾀﾝ)│       │
│              └────────┘         │
└─────────────────────────────────┘
→ JS は「島」の部分だけ。海（大部分）は静的HTML
```

この概念自体は Astro の発明ではなく、Katie Sylor-Miller が提唱したものだが、Astro がフレームワークとして初めて本格実装した。

### 5. 複数フレームワークの共存

Astro の面白い特徴として、**1つのプロジェクト内で React, Vue, Svelte 等を混在**できる。

```astro
---
import ReactCounter from './Counter.tsx';   // React
import VueHeader from './Header.vue';       // Vue
import SvelteForm from './Form.svelte';     // Svelte
---

<VueHeader client:load />

<p>ここは静的HTML</p>

<ReactCounter client:visible />

<SvelteForm client:idle />
```

それぞれの Island が独立しているからこそ、異なるフレームワークを混ぜられる。

### 6. ビルドの流れまとめ

```
開発時（.astro, .tsx, .vue 等）
        │
        ▼
   Astro ビルド
        │
        ├──→ 静的HTML + CSS を生成（大部分）
        │
        └──→ client: 指定された Island だけ
              JS バンドルを生成して添付
        │
        ▼
   最終出力（dist/）
   ├── index.html        ← 純粋なHTML
   ├── style.css         ← CSS
   └── Counter.xxxxx.js  ← Island のJSだけ（あれば）
```

### 要するに

Astro の思想は **「送るJSは最小限に、コンテンツは最速で届ける」**。ブログのような読み物サイトでは、ページの99%は静的テキストと画像なので、そこにReactのランタイムを送る必要はない、という割り切り。インタラクティブな部分が必要なときだけ、Island として部分的にJSを読み込む。

---

## レンダリング方式の比較

### 各方式の意味

```
ユーザーがページを要求したとき、HTMLはどこで・いつ作られるか？

CSR  → ブラウザ上で JS が HTML を生成（リクエスト時・クライアント側）
SSR  → サーバーがリクエストごとに HTML を生成（リクエスト時・サーバー側）
SSG  → ビルド時に HTML を事前生成（デプロイ前・サーバー側）
ISR  → SSG + 一定時間後に再生成（SSGの発展形）
PPR  → 静的シェル + 動的部分をストリーミング（SSG+SSRのハイブリッド）
```

### Astro はどれ？

**デフォルトは SSG**。ただし SSR も選べる。

```
Astro の対応状況:

CSR  … △  Island 部分のみ（ページ全体のCSRはしない）
SSG  … ◎  デフォルトのモード
SSR  … ○  アダプター追加で対応（Node, Vercel, Cloudflare等）
ISR  … △  ホスティング側の機能に依存（Vercel等）
PPR  … ×  非対応（ただし Island が思想的に近い）
```

```js
// astro.config.mjs

// SSG モード（デフォルト）
export default defineConfig({
  output: 'static'   // ビルド時に全ページHTML生成
})

// SSR モード
export default defineConfig({
  output: 'server',           // リクエスト毎にHTML生成
  adapter: node({ mode: 'standalone' })
})

// ハイブリッドモード（ページごとに選べる）
export default defineConfig({
  output: 'hybrid'   // デフォルトSSG、一部だけSSR
})
```

ハイブリッドモードでは、**ページ単位でSSGかSSRかを選べる**：

```astro
---
// このページだけSSR（リクエスト毎に生成）
export const prerender = false;

const user = await getUser(Astro.cookies.get('session'));
---
<h1>{user.name}さんのダッシュボード</h1>
```

### React はどれ？

**React 単体はレンダリング方式を持たない。ただのUIライブラリ。**

```
React 単体（react + react-dom）
  → ブラウザで ReactDOM.render() するだけ → CSR

React + フレームワーク で方式が決まる:
┌──────────────┬──────────────────────────┐
│ フレームワーク │ 対応するレンダリング方式    │
├──────────────┼──────────────────────────┤
│ なし(素React) │ CSR のみ                  │
│ Next.js      │ CSR, SSR, SSG, ISR, PPR  │
│ Remix        │ SSR（メイン）              │
│ Gatsby       │ SSG（メイン）              │
│ Astro        │ SSG / SSR（Island として） │
└──────────────┴──────────────────────────┘
```

React は「UIをどう書くか」を担当する部品であって、「HTMLをいつ・どこで作るか」はフレームワーク側が決める。

### PPR と Island の比較

PPR（Next.js 14+）と Astro の Island Architecture は思想が似ているが、アプローチが違う：

```
【PPR（Next.js）】
1. 静的なシェル（ヘッダー、レイアウト等）を即座に送る
2. 動的な部分を Suspense 境界でストリーミング
3. 全体が React で管理される

  ┌────────────────────────┐
  │ 静的シェル（即座に表示） │
  │  ┌──────────────────┐  │
  │  │ Loading...       │  │  ← Suspense で遅延
  │  │ → 動的コンテンツ   │  │  ← ストリーミングで到着
  │  └──────────────────┘  │
  └────────────────────────┘
  → 全部 React。JS ランタイムは送られる。


【Island Architecture（Astro）】
1. 完成した静的HTMLを送る
2. Island だけ後からハイドレーション
3. 静的部分には JS が一切ない

  ┌────────────────────────┐
  │ 静的HTML（完成済み）     │
  │  ┌──────────────────┐  │
  │  │ React Island     │  │  ← ここだけ JS を読み込む
  │  └──────────────────┘  │
  │ 静的HTML               │
  └────────────────────────┘
  → 静的部分は JS ゼロ。Island のみ JS。
```

### まとめ

| | Astro | React（素） | Next.js |
|---|---|---|---|
| デフォルト | **SSG** | **CSR** | **SSR**（App Router） |
| 思想 | 極力JSを送らない | 全部JSで描画 | 柔軟に選べる |
| 向いている用途 | コンテンツサイト | — (単体では使わない) | Webアプリ全般 |

Astro は「**SSGベースで、必要な部分だけクライアントJSを足す**」というのが基本的な立ち位置。
