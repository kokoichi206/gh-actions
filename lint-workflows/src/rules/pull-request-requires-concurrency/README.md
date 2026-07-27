# pull-request-requires-concurrency

`pull_request` トリガーを持つ workflow に、トップレベル `concurrency` +
`cancel-in-progress: true` を必須とする。

PR へ push するたびに旧 run が回り続けると runner 課金が無駄になるため。
push 起点のデプロイ系 workflow は cancel でなく queue が正しいため対象外
(pull_request トリガーを持つ workflow だけが対象)。

対象外: `cancel-in-progress` が式 (`${{ ... }}`) の場合。静的評価できないため
動的制御とみなし許容する。

```yaml
# OK
on:
  pull_request:

concurrency:
  group: ci-${{ github.ref }}
  cancel-in-progress: true
```
