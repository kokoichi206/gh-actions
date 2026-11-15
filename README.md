# gh-actions

GitHub Actions の共有部品集 (actions / reusable workflows)。
消費側リポジトリの言語・ツールチェーンを問わず `uses:` 1 行で利用できる。

## 提供している部品

### lint-workflows (action)

GitHub Actions workflow の運用・スタイル検査。
zizmor (security 専門) が扱わない規約を検査し、違反を PR の inline annotation (`::error`) として報告する。

各ルールの詳細 (Why・NG/OK 例) はルールディレクトリの README を参照。

| rule | 内容 |
| --- | --- |
| [require-job-timeout](lint-workflows/src/rules/require-job-timeout/README.md) | 全 job に `timeout-minutes` を明示する (`uses:` job は仕様上設定不可のため対象外) |
| [max-job-timeout](lint-workflows/src/rules/max-job-timeout/README.md) | `timeout-minutes` の値が上限以下であること (上限は input `max-timeout-minutes`) |
| [workflow-name-matches-filename](lint-workflows/src/rules/workflow-name-matches-filename/README.md) | トップレベル `name:` がファイル名 (拡張子なし) と一致すること |
| [require-step-name](lint-workflows/src/rules/require-step-name/README.md) | 全 step が空でない `name:` を持つこと |
| [require-blank-line-between-steps](lint-workflows/src/rules/require-blank-line-between-steps/README.md) | 連続する step の間に空行を 1 行以上入れること |
| [schedule-requires-workflow-dispatch](lint-workflows/src/rules/schedule-requires-workflow-dispatch/README.md) | `schedule:` トリガーには `workflow_dispatch:` を併記すること |
| [pull-request-requires-concurrency](lint-workflows/src/rules/pull-request-requires-concurrency/README.md) | `pull_request` トリガーの workflow は `concurrency` + `cancel-in-progress: true` を持つこと |

既知の制約: 式 (`${{ ... }}`) が入った `timeout-minutes` / `cancel-in-progress` は
静的評価できないため、動的制御とみなし違反にしない (max-job-timeout /
pull-request-requires-concurrency のすり抜け経路になる点は許容)。

使い方 (必要な権限は `contents: read` のみ。write 権限・secrets は不要):

```yaml
steps:
  - name: Checkout
    uses: actions/checkout@<SHA> # vX.Y.Z
    with:
      persist-credentials: false

  - name: Lint workflows
    uses: kokoichi206/gh-actions/lint-workflows@main
    with:
      max-timeout-minutes: 60 # 省略可
```

ローカル実行 (リポジトリルートで):

```bash
node <path-to-this-repo>/lint-workflows/dist/index.cjs
```

### workflow-ci (reusable workflow)

zizmor + lint-workflows を束ねた workflow hygiene 検査。
呼び出し例は [.github/workflows/workflow-ci.yml](.github/workflows/workflow-ci.yml) のヘッダコメントを参照。

zizmor 本体は、GitHub Actions の `actions.lock` と `$/` 参照に対応した 1.32.0 を使う。
zizmor-action と本体バージョンを更新するときは、この reusable workflow とリポジトリ自身の CI を揃える。

```yaml
jobs:
  workflow-ci:
    permissions:
      contents: read
      actions: read
    uses: kokoichi206/gh-actions/.github/workflows/workflow-ci.yml@main
```

## 消費側リポジトリで必要な設定

zizmor を使っているリポジトリでは、`@main` 参照が `unpinned-uses` audit に
弾かれないよう `.github/zizmor.yml` に policy を追加する:

```yaml
rules:
  unpinned-uses:
    config:
      policies:
        # サブパス付き参照 (kokoichi206/gh-actions/lint-workflows@main) は
        # exact パターンにマッチしないため、repo 単位 + サブパスの両方を書く。
        kokoichi206/gh-actions: ref-pin
        kokoichi206/gh-actions/*: ref-pin
        "*": hash-pin
```

## 開発

```bash
cd lint-workflows
pnpm install
pnpm run typecheck
pnpm run test
pnpm run build   # dist/index.cjs を再生成してコミットする
```

- `dist/` はコミットする (JS action は実行時 install をしないため)。src を変更したら必ず `pnpm run build` を実行して dist も含めてコミットする。CI が `git diff --exit-code -- dist` で検証する。
- バージョニングは `@main` 一本。破壊的変更 (ルール追加・厳格化) は全消費リポジトリの CI を即座に落としうるので、消費側の修正を先に済ませてから main に入れる。

### ルールの構成とテスト

1 ルール 1 ディレクトリ (`src/rules/<rule>/`) に実装 (`rule.ts`)・テスト (`rule.test.ts`)・
`README.md`・golden fixture (`testdata/`) をまとめる。

テストは Go の testdata 方式: `testdata/<case>.yml` を入力に、そのルール単体の検出結果を
`<case>.expected.json` と比較する。オプションは `<case>.options.json` で上書きできる。

```bash
pnpm run test          # 実行
pnpm run test -- -u    # ルール変更時に expected.json を更新 (差分は必ずレビューする)
```

ルールを追加するときは、ディレクトリ一式を作って `src/lint.ts` に登録する。
