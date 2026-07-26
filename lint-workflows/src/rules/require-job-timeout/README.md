# require-job-timeout

全 job に `timeout-minutes` の明示を必須とする。

デフォルトの job timeout は非常に長く、ハングした job (特に LLM 実行系) が
runner 課金を垂れ流すため。

対象外: reusable workflow を呼ぶ job (`uses:`)。仕様上 timeout-minutes を
設定できないため、呼び出し先 workflow の job 側で設定する。

```yaml
# NG
jobs:
  build:
    runs-on: ubuntu-latest

# OK
jobs:
  build:
    runs-on: ubuntu-latest
    timeout-minutes: 10
```
