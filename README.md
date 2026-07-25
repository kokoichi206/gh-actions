# gh-actions

GitHub Actions の共有部品集 (actions / reusable workflows)。
消費側リポジトリの言語・ツールチェーンを問わず `uses:` 1 行で利用できる。

## 提供している部品

### lint-workflows (action)

GitHub Actions workflow の運用・スタイル検査。
zizmor (security 専門) が扱わない規約を検査し、違反を PR の inline annotation (`::error`) として報告する。

| rule | 内容 |
| --- | --- |
| require-job-timeout | 全 job に `timeout-minutes` を明示する (`uses:` job は仕様上設定不可のため対象外)。ハングした job の runner 課金垂れ流し防止 |
| max-job-timeout | `timeout-minutes` の値が上限以下であること (上限は input `max-timeout-minutes`、デフォルトは `src/main.ts`) |
| workflow-name-matches-filename | トップレベル `name:` がファイル名 (拡張子なし) と一致すること。Actions UI の表示名からファイルを一意に辿れるようにする |
| require-step-name | 全 step が空でない `name:` を持つこと。失敗時のログで step を特定できるようにする |
| require-blank-line-between-steps | 連続する step の間に空行を 1 行以上入れること (可読性の規約) |
| schedule-requires-workflow-dispatch | `schedule:` トリガーには `workflow_dispatch:` を併記すること。cron を待たずに手動で動作確認できるようにする |
| pull-request-requires-concurrency | `pull_request` トリガーの workflow は `concurrency` + `cancel-in-progress: true` を持つこと。PR への連続 push で旧 run が回り続けるのを防ぐ。push 起点のデプロイ系 (cancel でなく queue が正しい) は対象外 |

使い方:

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
