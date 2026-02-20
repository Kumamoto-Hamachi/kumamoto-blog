# 作業メモ

## Phase 1: Astro プロジェクト初期化

### やったこと

1. 一時ディレクトリに Astro プロジェクトを作成

   ```bash
   pnpm create astro@latest ./tmp-astro -- --template minimal --no-install --no-git
   ```

2. 既存ファイル（README.md, .gitignore, mise.toml）を上書きせずにコピー

   ```bash
   rsync -a --ignore-existing ./tmp-astro/ .
   rm -r ./tmp-astro
   ```

3. `pnpm install` で依存関係をインストール

4. `package.json` の修正

   - `name` を `tmp-astro` → `kumamoto-blog` に変更
   - `pnpm.onlyBuiltDependencies` を追加（後述）

5. `astro.config.mjs` → `astro.config.ts` にリネーム

   - README の Phase 2 以降で TypeScript 形式を使う想定のため

6. `pnpm build` でビルド成功を確認

---

## onlyBuiltDependencies とは

### 概要

pnpm v10 で導入されたセキュリティ機能。
依存パッケージの `postinstall` などのライフサイクルスクリプトを**デフォルトで実行しない**ようにし、許可するパッケージを明示的にホワイトリスト指定する仕組み。

### 背景（なぜ必要か）

npm パッケージは `postinstall` スクリプトを持つことができ、`pnpm install` 時に自動実行される。
これは便利な反面、悪意あるパッケージが任意のコードを実行できてしまうサプライチェーン攻撃のリスクがある。

pnpm v9 まではすべてのビルドスクリプトがデフォルトで実行されていたが、v10 からはデフォルトでブロックされるようになった。

### 設定方法

`package.json` に以下のように記述する：

```json
{
  "pnpm": {
    "onlyBuiltDependencies": ["esbuild", "sharp"]
  }
}
```

この設定は「`esbuild` と `sharp` のビルドスクリプトだけ実行を許可する」という意味。

### このプロジェクトで許可しているパッケージ

| パッケージ | ビルドスクリプトの内容                                                 |
| ---------- | ---------------------------------------------------------------------- |
| esbuild    | `postinstall` でプラットフォーム固有のネイティブバイナリをダウンロード |
| sharp      | `install` スクリプトでネイティブの画像処理ライブラリをセットアップ     |

どちらもビルドスクリプトが実行されないと正常に動作しないため、許可リストに追加している。

---

## tsconfig.json の設定解説

```json
{
  "extends": "astro/tsconfigs/strict",
  "include": [".astro/types.d.ts", "**/*"],
  "exclude": ["dist"]
}
```

### `"extends": "astro/tsconfigs/strict"`

Astro が提供する TypeScript プリセット設定を継承している。プリセットは 3 段階ある：

| プリセット  | 内容                                               |
| ----------- | -------------------------------------------------- |
| `base`      | 最低限の設定                                       |
| `strict`    | `base` + 厳格な型チェック（`strictNullChecks` 等） |
| `strictest` | `strict` + さらに厳しいルール                      |

`strict` は型安全を保ちつつ書きやすさとのバランスが良い選択。自分で `compilerOptions` を一つずつ書く必要がなく、Astro に最適化された設定がまとめて適用される。

### `"include": [".astro/types.d.ts", "**/*"]`

TypeScript のコンパイル対象を指定している。

- **`.astro/types.d.ts`** — Astro が自動生成する型定義ファイル。`astro:content` や `Astro.props` などの Astro 固有の型がここで定義される。これを含めないとエディタ上で型エラーになる
- **`"**/\*"`\*\* — プロジェクト内の全ファイルを対象にする

### `"exclude": ["dist"]`

ビルド出力ディレクトリ `dist/` を型チェックの対象外にしている。生成済みファイルをチェックしても意味がなく、チェック速度が遅くなるだけなので除外。

---

## astro.config.ts の設定解説

```ts
import { defineConfig } from "astro/config";

export default defineConfig({});
```

### `defineConfig()`

Astro 公式のヘルパー関数。引数に渡すオブジェクトの型補完・バリデーションを提供する。機能的には「渡されたオブジェクトをそのまま返す」だけだが、エディタ上で設定項目の補完が効くようになる。

### 現状は空 `{}`

minimal テンプレートの初期状態なので、すべてデフォルト値が使われている。主なデフォルト値：

<<<<<<< HEAD:study.md
| 設定           | デフォルト | 意味                                                 |
| -------------- | ---------- | ---------------------------------------------------- |
| `output`       | `"static"` | 静的サイト生成（SSG）                                |
| `site`         | なし       | サイト URL（未設定だと `Astro.site` が `undefined`） |
| `integrations` | `[]`       | 追加インテグレーションなし                           |
| `vite`         | `{}`       | Vite の追加設定なし                                  |
=======
| 設定           | デフォルト | 意味                                                |
| -------------- | ---------- | --------------------------------------------------- |
| `output`       | `"static"` | 静的サイト生成（SSG）                               |
| `site`         | なし       | サイトURL（未設定だと `Astro.site` が `undefined`） |
| `integrations` | `[]`       | 追加インテグレーションなし                          |
| `vite`         | `{}`       | Vite の追加設定なし                                 |
>>>>>>> c71f2ad (feat: ESLint + Prettier のセットアップ):memo.md

README の Phase 2 以降で、ここに `site`、`vite.plugins`（Tailwind）、`integrations`（sitemap）が追加されていく予定。

---

## pnpm dev vs pnpm preview の違い

|          | `pnpm dev`                     | `pnpm preview`             |
| -------- | ------------------------------ | -------------------------- |
| **動作** | 開発サーバーを起動             | ビルド済みファイルを配信   |
| **前提** | なし                           | 事前に `pnpm build` が必要 |
| **HMR**  | あり（ファイル変更が即反映）   | なし                       |
| **用途** | 開発中のコーディング作業       | 本番ビルドの最終確認       |
| **速度** | オンデマンド変換で初回やや遅い | ビルド済みなので高速       |

- 普段の開発 → `pnpm dev`
- デプロイ前に本番と同じ状態を確認したい → `pnpm build && pnpm preview`
