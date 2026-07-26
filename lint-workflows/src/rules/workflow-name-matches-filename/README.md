# workflow-name-matches-filename

トップレベル `name:` がファイル名 (拡張子なし) と一致することを必須とする。

Actions UI・`gh run list` の表示名から対象ファイルを一意に辿れるようにするため。

```yaml
# NG (ファイル名が deploy.yml のとき)
name: Deploy to Production

# OK
name: deploy
```
