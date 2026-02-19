# 作業メモ

## Phase 1: Astroプロジェクト初期化

### やったこと

1. 一時ディレクトリにAstroプロジェクトを作成

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

| パッケージ | ビルドスクリプトの内容 |
|-----------|---------------------|
| esbuild   | `postinstall` でプラットフォーム固有のネイティブバイナリをダウンロード |
| sharp     | `install` スクリプトでネイティブの画像処理ライブラリをセットアップ |

どちらもビルドスクリプトが実行されないと正常に動作しないため、許可リストに追加している。
