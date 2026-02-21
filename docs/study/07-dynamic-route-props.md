# 動的ルートにおける getStaticPaths と Astro.props

## getStaticPaths の役割

`[id].astro` のような動的ルートでは、`getStaticPaths()` を export する必要がある。
この関数は**Astro フレームワークがビルド時に自動で呼び出す**ライフサイクル関数で、リポジトリ内に明示的な呼び出しコードはない。

Astro は以下の流れで処理する:

1. `src/pages/` 内の `[...]` を含むファイルを検出
2. そのファイルから `getStaticPaths` を import して呼び出す
3. 返り値の配列をループして、各 `params` に対応する HTML ページを生成
4. その際に `props` を `Astro.props` にセットする

```ts
export async function getStaticPaths() {
  const posts = await getCollection("blog");
  return posts.map((post) => ({
    params: { id: post.id }, // URLパラメータ
    props: { post }, // ページに渡すデータ
  }));
}
```

## Astro.props の仕組み

`Astro.props` には `getStaticPaths()` の返り値で指定した `props` がセットされる。
親コンポーネントから渡されるわけではなく、**Astro フレームワークが仲介して注入する**。

```ts
const { post } = Astro.props;
```

`params` の `id` だけ受け取ってページ内で改めて `getCollection()` から検索することも可能だが、`props` で渡す方がデータ取得が1回で済むため効率的。

## JavaScript の分割代入（Destructuring assignment）

`const { post } = Astro.props;` の `{}` は分割代入の構文。オブジェクトから特定のプロパティを直接変数として取り出せる。

```js
// 分割代入なし（2行必要）
const props = Astro.props;
const post = props.post;

// 分割代入あり（上と同じ意味）
const { post } = Astro.props;

// 複数のプロパティも取り出せる
const { post, anotherProp } = Astro.props;
```

`{}` なしだとオブジェクト全体が代入される:

```js
const post = Astro.props;
// post は { post: ... } というオブジェクト全体になってしまう
```
