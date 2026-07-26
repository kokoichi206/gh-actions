# require-blank-line-between-steps

連続する step の間に空行を 1 行以上入れることを必須とする (可読性の規約)。

- コメント行は空行の代わりにならない
- block scalar (`run: |`) 内部の空行は区切りとして扱わない
- 判定は「前の step の最終コンテンツ行と次の step の開始行の間に空行があるか」

```yaml
# NG
      - name: One
        run: echo one
      - name: Two
        run: echo two

# OK
      - name: One
        run: echo one

      - name: Two
        run: echo two
```
