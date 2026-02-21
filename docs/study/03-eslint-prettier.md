# ESLint・Prettier 設定ファイルの解説

---

# ESLint 設定ファイル（eslint.config.js）の解説

## 全体構成: Flat Config 形式

```js
export default [ ... ];
```

ESLint v9+ で推奨される **Flat Config**（`eslint.config.js`）形式。
従来の `.eslintrc.*` と違い、配列で設定オブジェクトを並べる構成になっている。

## セクション別解説

### 1. インポート（1〜4行目）

| モジュール                         | 役割                                                              |
| ---------------------------------- | ----------------------------------------------------------------- |
| `eslint-plugin-astro`              | `.astro` ファイル用の ESLint プラグイン                           |
| `@typescript-eslint/eslint-plugin` | TypeScript 用のルールセット                                       |
| `@typescript-eslint/parser`        | TypeScript を ESLint が解析するためのパーサー                     |
| `eslint-config-prettier`           | Prettier と競合する ESLint のフォーマット系ルールを無効化する設定 |

### 2. グローバル ignores（8行目）

```js
{
  ignores: ["dist/", ".astro/", "node_modules/"];
}
```

ビルド出力（`dist/`）、Astro の生成ファイル（`.astro/`）、依存パッケージ（`node_modules/`）をリント対象から除外。

### 3. Astro 推奨ルール（11行目）

```js
...eslintPluginAstro.configs.recommended,
```

`eslint-plugin-astro` が提供する推奨ルールセットをスプレッドで展開。
`.astro` ファイルのパーサー設定や Astro 固有のルールが含まれる。

### 4. TypeScript ルール（14〜25行目）

```js
{
  files: ["**/*.ts"],
  plugins: { "@typescript-eslint": tseslint },
  languageOptions: { parser: tsParser },
  rules: { ...tseslint.configs.recommended.rules },
}
```

- **対象**: `**/*.ts` ファイルのみ
- **parser**: `@typescript-eslint/parser` で TypeScript 構文を解析
- **rules**: `@typescript-eslint` の推奨ルール（`no-unused-vars`、`no-explicit-any` など）を適用

### 5. Prettier 競合回避（28行目）

```js
eslintConfigPrettier,
```

**配列の最後に置くことが必須**。
ESLint のフォーマット系ルール（`indent`、`quotes`、`semi` など）を無効化し、Prettier との競合を防ぐ。
ESLint は「コード品質」、Prettier は「フォーマット」という役割分担を実現している。

## `@typescript-eslint/parser` と `@typescript-eslint/eslint-plugin` の違い

この2つは役割が全く異なる。

### `@typescript-eslint/parser` — パーサー（構文解析器）

ESLint は本来 JavaScript しか理解できない。TypeScript 固有の構文（型注釈、`interface`、`enum` など）を食わせるとパースエラーになる。

このパーサーが **TypeScript のコードを ESLint が理解できる AST（抽象構文木）に変換** する。

```ts
// ESLint 単体だと ": string" の部分でパースエラー
function greet(name: string): void { ... }
//                 ^^^^^^^^ これを理解させるのが parser の役割
```

### `@typescript-eslint/eslint-plugin` — ルールセット（検査ルール集）

パーサーが生成した AST に対して **実際にチェックを行うルール群** を提供する。

例:

- `@typescript-eslint/no-unused-vars` — 未使用の変数を検出
- `@typescript-eslint/no-explicit-any` — `any` 型の使用を警告
- `@typescript-eslint/no-floating-promises` — await し忘れた Promise を検出

### 関係図

```
TypeScript コード
       │
       ▼
  @typescript-eslint/parser    ← コードを解析して AST に変換
       │
       ▼
      AST
       │
       ▼
  @typescript-eslint/eslint-plugin  ← AST にルールを適用してエラーを報告
       │
       ▼
  lint 結果（エラー・警告）
```

- **parser がないと** → TypeScript コードをパースできず、そもそも動かない
- **plugin がないと** → パースはできるが、TypeScript 固有のルールによるチェックが行われない

両方セットで使う必要がある。

## ESLint まとめ

この設定ファイル1つで以下を実現している:

1. **Astro** のリント対応
2. **TypeScript** の型安全なリント
3. **Prettier** との共存（フォーマットルールの競合回避）
4. 不要なディレクトリの除外

---

# Prettier 設定ファイルの解説

## ESLint と Prettier の役割分担

元々 ESLint はフォーマット系ルールも持っていたが、ESLint チームが2023年にフォーマット系ルールの非推奨化を発表した。

| ツール   | 役割                                   |
| -------- | -------------------------------------- |
| ESLint   | コード品質（バグ検出、アンチパターン） |
| Prettier | フォーマット（見た目の統一）           |

Prettier が優れている点:

- **対応言語が広い**: JS/TS だけでなく HTML, CSS, JSON, Markdown, YAML なども対応
- **opinionated**: 設定が少なく一貫性が出やすい
- **高速**: AST 全体を一括整形する

両方でフォーマットすると競合するため、`eslint-config-prettier` で ESLint のフォーマット系ルールを無効化して棲み分けている。

## 1. `.prettierrc`（フォーマットルール）

```json
{
  "semi": true,
  "singleQuote": false,
  "tabWidth": 2,
  "trailingComma": "all",
  "plugins": ["prettier-plugin-astro"],
  "overrides": [
    {
      "files": "*.astro",
      "options": {
        "parser": "astro"
      }
    }
  ]
}
```

### 各オプション

| オプション      | 値      | 意味                                                             |
| --------------- | ------- | ---------------------------------------------------------------- |
| `semi`          | `true`  | 文末にセミコロンを**付ける**                                     |
| `singleQuote`   | `false` | ダブルクォート `"` を使う（`'` ではなく `"`）                    |
| `tabWidth`      | `2`     | インデント幅をスペース2つにする                                  |
| `trailingComma` | `"all"` | 末尾カンマを可能な限り付ける（配列・オブジェクト・関数引数など） |

`trailingComma: "all"` は git diff がきれいになる利点がある:

```diff
  // 末尾カンマありなら、要素追加時に変更行が1行だけ
  const colors = [
    "red",
    "blue",
+   "green",
  ];
```

### plugins / overrides

- **plugins**: `prettier-plugin-astro` を読み込み、`.astro` ファイルのフォーマットに対応
- **overrides**: `.astro` ファイルに対して専用パーサーを指定。これがないと Prettier が `.astro` の構文を正しく解析できない

ESLint と同様、Prettier も本来は `.astro` を理解できないため、プラグイン+パーサー指定が必要になる。

## 2. `.prettierignore`（除外設定）

```
dist/
.astro/
node_modules/
pnpm-lock.yaml
```

| パス             | 除外理由                                                                                 |
| ---------------- | ---------------------------------------------------------------------------------------- |
| `dist/`          | ビルド出力。フォーマットする意味がない                                                   |
| `.astro/`        | Astro が自動生成するファイル群                                                           |
| `node_modules/`  | 外部パッケージ                                                                           |
| `pnpm-lock.yaml` | パッケージマネージャーが自動生成するロックファイル。フォーマットすると diff が膨大になる |

`eslint.config.js` の `ignores` と対象がほぼ同じだが、加えて `pnpm-lock.yaml` も除外している。ロックファイルはツールが管理するものなので、人間やフォーマッターが触るべきではない。

## Prettier まとめ

- `.prettierrc` でフォーマットルールと Astro 対応を定義
- `.prettierignore` で自動生成ファイルやロックファイルを除外
- ESLint とは `eslint-config-prettier` で棲み分けている

● 良い質問です。このプロジェクトでは Prettier
がフォーマットを担当し、eslint-config-prettier で ESLint
のフォーマット系ルールを無効化しています。

ただし lint:fix には用途があります:

- ESLint の自動修正可能なルール（例: no-unused-imports の自動削除、prefer-const
  への自動変換など）は --fix でしか修正されません
- これらはコードのロジックや品質に関するルールで、Prettier の守備範囲外です

つまり役割分担は:

- Prettier → フォーマット（インデント、クォート、セミコロン等）
- lint:fix → コード品質ルールの自動修正（未使用 import の除去等）

現時点の設定（recommended ルールのみ）だと --fix で自動修正されるケースは少ないですが
、今後ルールを追加すれば活きてきます。残しておいて問題ないかと思います。
