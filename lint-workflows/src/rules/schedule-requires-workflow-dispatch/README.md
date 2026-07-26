# schedule-requires-workflow-dispatch

`schedule:` トリガーを持つ workflow には `workflow_dispatch:` の併記を必須とする。

cron 専用 workflow は手動実行できず、動作確認が「次の cron を待つ」になるため。

```yaml
# NG
on:
  schedule:
    - cron: "0 2 * * 0"

# OK
on:
  schedule:
    - cron: "0 2 * * 0"
  workflow_dispatch:
```
