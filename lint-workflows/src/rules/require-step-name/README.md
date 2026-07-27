# require-step-name

全 step に空でない `name:` を必須とする。

失敗時のログ・annotation で step を特定できるようにするため。

```yaml
# NG
      - run: pnpm install

# OK
      - name: Install dependencies
        run: pnpm install
```
