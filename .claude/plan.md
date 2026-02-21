# ESLint + Prettier セットアップ計画

## 方針
- ESLint: **recommended** レベル（Astro / TypeScript の推奨ルール）
- Prettier: ESLint と一緒にセットアップ（競合回避含む）
- ESLint Flat Config 形式（`eslint.config.js`）を使用（プロジェクトが ESM のため）

## 1. インストールするパッケージ

**ESLint 関連（devDependencies）:**
- `eslint` — 本体
- `eslint-plugin-astro` — `.astro` ファイルのパース・lint
- `@typescript-eslint/parser` — TypeScript パーサー
- `@typescript-eslint/eslint-plugin` — TypeScript 推奨ルール

**Prettier 関連（devDependencies）:**
- `prettier` — 本体
- `prettier-plugin-astro` — `.astro` ファイルのフォーマット
- `eslint-config-prettier` — ESLint のフォーマット系ルールを無効化（Prettier との競合回避）

## 2. 作成・変更するファイル

### `eslint.config.js`（新規）
- `eslint-plugin-astro` の recommended 設定を使用
- `@typescript-eslint` の recommended 設定を使用
- `eslint-config-prettier` で Prettier との競合を回避
- `dist/`, `node_modules/`, `.astro/` を対象外に

### `.prettierrc`（新規）
- 最小限の設定（セミコロン、シングルクオート等）

### `.prettierignore`（新規）
- `dist/`, `node_modules/`, `pnpm-lock.yaml` を除外

### `package.json`（変更）
- `"lint": "eslint ."` スクリプト追加
- `"lint:fix": "eslint . --fix"` スクリプト追加
- `"format": "prettier --write ."` スクリプト追加
- `"format:check": "prettier --check ."` スクリプト追加

### `.vscode/settings.json`（新規）
- 保存時に ESLint の自動修正を実行
- デフォルトフォーマッタを Prettier に設定
- `.astro` ファイル用にフォーマッタを設定

### `.vscode/extensions.json`（変更）
- `dbaeumer.vscode-eslint` を推奨拡張に追加
