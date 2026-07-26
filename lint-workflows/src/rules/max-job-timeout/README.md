# max-job-timeout

`timeout-minutes` の値が上限以下であることを必須とする。
上限は action input `max-timeout-minutes` で変更できる (デフォルトは `src/main.ts`)。

キーの存在 (require-job-timeout) だけでは課金の上限にならないため、値にも上限を課す。

対象外: 値が式 (`${{ ... }}`) の場合。静的評価できないため動的制御とみなし許容する。

```yaml
# NG (上限 60 のとき)
    timeout-minutes: 90

# OK
    timeout-minutes: 30
```
